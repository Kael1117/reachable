# 2026-03-19-reachable-prd.md
# reachable — Dependency Vulnerability Reachability Analyzer

---

## Section 1 — Project Overview

**Name:** reachable  
**Type:** CLI Developer Tool  
**Language/Runtime:** TypeScript / Node.js 22  
**License:** MIT  

`reachable` is a static-analysis CLI that answers the question every developer has after running `npm audit`: *"Is this vulnerable code path actually reachable from my application?"* It parses your source files using tree-sitter, builds a cross-file call graph, fetches vulnerability data from the OSV/GitHub Advisory Database, and traces whether the vulnerable function in a flagged dependency is ever called in your execution path. The result is a prioritized, actionable list of real risks — not the 147-alert wall of noise that `npm audit` produces.

---

## Section 2 — Problem Statement

- `npm audit`, `yarn audit`, and `pnpm audit` report vulnerabilities at the package level with zero awareness of whether the vulnerable function is actually imported or called.
- Security teams routinely see 50–200 alerts per project, the vast majority of which are in transitive dependencies whose vulnerable code paths are never executed.
- Snyk and Socket do offer reachability analysis but only in their paid, closed-source, cloud-gated tiers — there is no open-source, local-first alternative.
- Alert fatigue causes engineers to dismiss or ignore entire `npm audit` outputs, creating genuine security debt.
- CI pipelines either fail on all vulnerabilities (causing alert exhaustion) or none (creating false security).
- Teams have no way to distinguish a Critical CVE in a function that parses untrusted XML (called on every request) from a Critical CVE in a utility function used only in a test helper.

---

## Section 3 — Solution

1. Parse all JS/TS source files in the project using `tree-sitter` (Node.js bindings) to extract function definitions and import/require/export relationships.
2. Build a directed call graph from entry points (defined by the user or auto-detected from `package.json#main`, `bin`, or framework conventions).
3. Fetch vulnerability data from the OSV REST API (`https://api.osv.dev/v1/query`) and the GitHub Advisory Database for all installed packages.
4. For each advisory, identify the specific exported symbol(s) that are affected (parsed from advisory `affected[].ecosystem_specific.imports` or advisory details text).
5. Traverse the call graph from entry points and determine if any path reaches a call to the vulnerable exported symbol.
6. Output a tiered report: **Reachable** (fix immediately), **Unreachable** (low priority), **Unknown** (could not determine — treat as reachable).

---

## Section 4 — Target Users

**Primary:** Backend Node.js/TypeScript developers at companies using `npm audit` or Dependabot in CI. They want to stop their pipelines failing on unreachable vulnerabilities without ignoring real risks.

**Secondary:** Security engineers running periodic audits on large monorepos where `npm audit` produces hundreds of alerts and manual triage is impractical.

**Tertiary:** Open source maintainers who want to communicate to users which reported CVEs in their dependencies are actually exploitable.

---

## Section 5 — Tech Stack

| Component | Library | Version | Purpose |
|---|---|---|---|
| Language | TypeScript | 5.7.x | Type-safe source |
| Runtime | Node.js | 22.x LTS | Execution environment |
| AST Parsing | tree-sitter | 0.21.x (npm) | Parse JS/TS into CST |
| JS Grammar | tree-sitter-javascript | 0.25.0 | JS/JSX grammar |
| TS Grammar | tree-sitter-typescript | 0.23.2 | TS/TSX grammar |
| Vulnerability DB | osv.dev REST API | v1 | Fetch CVE/GHSA data |
| CLI Framework | commander | 12.x | Subcommands and flags |
| Config | cosmiconfig | 9.x | Load `.reachablerc`, `reachable.config.js` |
| Output Formatting | chalk | 5.x | Terminal color output |
| Table Rendering | cli-table3 | 0.6.x | Columnar output |
| Progress | ora | 8.x | Spinner during graph build |
| HTTP | undici | 6.x | OSV API requests (Node built-in fetch wrapper) |
| Testing | vitest | 2.x | Unit and integration tests |
| Release | semantic-release | 24.x | Automated versioning |
| Build | tsup | 8.x | Bundle CLI to CJS/ESM |
| Lint | eslint + @typescript-eslint | 8.x | Code quality |

**Why tree-sitter over Babel/tsc?** tree-sitter is error-tolerant — it produces a useful partial CST even when files have syntax errors. Babel and TypeScript compiler both fail hard on parse errors, making them unreliable for analysis of real-world codebases that may contain JSX, decorators, or non-standard syntax. tree-sitter's Node.js bindings are also significantly faster for read-only parsing.

**Why commander over yargs?** commander has a smaller footprint, simpler API for subcommands, and is the current recommendation for new CLIs in the Node.js ecosystem. yargs' API is more complex and its tree-shaking is poor.

**Why osv.dev over NVD directly?** The OSV API aggregates GitHub Advisory Database, NVD, and ecosystem-specific databases (npm advisories) into a single queryable endpoint with structured `affected.ranges` and `affected.ecosystem_specific` data. NVD's API is rate-limited to 5 requests/30s without an API key.

---

## Section 6 — Core Features (v1)

**1. Call Graph Construction**
- Auto-detect entry points from `package.json` (`main`, `bin`, `exports` fields)
- Support manual entry point override via `--entry` flag
- Resolve imports: `require()`, static `import`, dynamic `import()`, `export * from`
- Handle aliased imports (`@/`, `~/`, tsconfig `paths`)
- Detect and handle circular dependencies without infinite loops

**2. Vulnerability Fetching**
- Read installed packages from `node_modules/.package-lock.json` or `package-lock.json`
- Batch query OSV API (`POST /v1/querybatch`) with all package name/version pairs
- Cache responses in `.reachable-cache/` with 24h TTL
- Parse `affected.ecosystem_specific.imports` for named vulnerable symbols
- Fall back to advisory `details` text extraction when structured symbol data is absent

**3. Reachability Analysis**
- BFS traversal of call graph from all entry points
- Match call sites to vulnerable exported symbols
- Classify each advisory as: `REACHABLE`, `UNREACHABLE`, or `UNKNOWN`
- `UNKNOWN` for advisories where specific vulnerable symbol cannot be identified

**4. Output Formats**
- Default: colored terminal table grouped by severity (Critical → Low)
- `--format json`: machine-readable JSON for CI integration
- `--format sarif`: SARIF v2.1.0 for GitHub Code Scanning upload
- `--format markdown`: GitHub PR comment–friendly output
- `--quiet`: exit code only (0 = no reachable, 1 = reachable found)

**5. Safety Features**
- `--dry-run`: analyze without making network requests (use cached data only)
- `--no-cache`: force fresh OSV data
- Never writes to or modifies `node_modules` or `package.json`
- All analysis is read-only

**6. CI/CD Integration**
- Exit code 0: no reachable vulnerabilities
- Exit code 1: reachable vulnerability of severity ≥ threshold
- `--fail-on` flag: `critical` | `high` | `moderate` | `low` | `all`
- GitHub Actions summary output via `$GITHUB_STEP_SUMMARY`

**7. Configuration**
- `.reachablerc.json` or `reachable.config.js` for project-level settings
- Ignore specific GHSA IDs with `ignore: ["GHSA-xxxx-xxxx-xxxx"]`
- Mark specific packages as dev-only (excluded from reachability analysis)

---

## Section 7 — Interface Spec

### CLI Commands

```bash
# Analyze current project
reachable scan

# Specify entry point explicitly
reachable scan --entry src/index.ts

# Output JSON for CI
reachable scan --format json --fail-on high

# Use SARIF for GitHub Code Scanning
reachable scan --format sarif > results.sarif

# Show only reachable vulns, suppress unreachable
reachable scan --reachable-only

# Inspect call path to a specific package
reachable trace lodash

# Show call graph for a specific file
reachable graph src/auth/middleware.ts
```

### Flags Table

| Flag | Type | Default | Description |
|---|---|---|---|
| `--entry` | `string[]` | auto | Entry point file(s) |
| `--format` | `string` | `table` | Output format: `table`, `json`, `sarif`, `markdown` |
| `--fail-on` | `string` | `high` | Minimum severity to fail CI |
| `--reachable-only` | `bool` | `false` | Hide unreachable advisories |
| `--no-cache` | `bool` | `false` | Skip local advisory cache |
| `--dry-run` | `bool` | `false` | Use cached data only, no network |
| `--quiet` | `bool` | `false` | Exit code only, no output |
| `--cwd` | `string` | `process.cwd()` | Project root directory |
| `--ignore` | `string[]` | `[]` | GHSA IDs to suppress |
| `--depth` | `number` | `20` | Max call graph traversal depth |
| `--verbose` | `bool` | `false` | Show graph traversal details |

### Config File Example

```json
{
  "$schema": "https://reachable.dev/schema/v1.json",
  "entry": ["src/index.ts", "src/worker.ts"],
  "failOn": "high",
  "ignore": [
    "GHSA-c3m8-x3cq-r4f2"
  ],
  "devPackages": ["jest", "eslint", "prettier"],
  "cache": {
    "ttlHours": 24,
    "dir": ".reachable-cache"
  }
}
```

---

## Section 8 — Data Flow Diagram

```
  ┌─────────────────────────────────────────────────────┐
  │                   reachable scan                    │
  └──────────────────────┬──────────────────────────────┘
                         │
           ┌─────────────▼─────────────┐
           │   Read package-lock.json  │
           │   Extract name@version    │
           └─────────────┬─────────────┘
                         │
           ┌─────────────▼─────────────┐
           │   OSV Batch Query API     │──► Cache Hit? ──► Skip
           │   POST /v1/querybatch     │
           └─────────────┬─────────────┘
                         │ advisories[]
           ┌─────────────▼─────────────┐
           │   Parse Vulnerable        │
           │   Symbols per Advisory    │
           └──────┬──────────┬─────────┘
                  │          │ symbol unknown
                  │          ▼
                  │    ┌─────────────┐
                  │    │  UNKNOWN    │
                  │    └─────────────┘
                  │ symbol known
     ┌────────────▼────────────────────────┐
     │   tree-sitter AST Parse             │
     │   All JS/TS files in project        │
     └────────────┬────────────────────────┘
                  │
     ┌────────────▼────────────────────────┐
     │   Build Directed Call Graph         │
     │   Entry Points → Import Edges       │
     └────────────┬────────────────────────┘
                  │
     ┌────────────▼────────────────────────┐
     │   BFS Traversal from Entry Points   │
     │   Match call sites to vuln symbols  │
     └──────┬──────────────┬───────────────┘
            │              │
     ┌──────▼──────┐  ┌────▼──────────┐
     │  REACHABLE  │  │  UNREACHABLE  │
     └──────┬──────┘  └───────────────┘
            │
     ┌──────▼──────────────────────────────┐
     │   Render Output (table/json/sarif)  │
     │   Exit with appropriate code        │
     └─────────────────────────────────────┘
```

---

## Section 9 — Architecture / Package Structure

```
reachable/
├── src/
│   ├── cli/
│   │   ├── index.ts          # Commander root command setup
│   │   ├── scan.ts           # `reachable scan` subcommand
│   │   ├── trace.ts          # `reachable trace <package>` subcommand
│   │   └── graph.ts          # `reachable graph <file>` subcommand
│   ├── parser/
│   │   ├── index.ts          # Dispatch to language-specific parsers
│   │   ├── javascript.ts     # tree-sitter JS/JSX parser + import extractor
│   │   ├── typescript.ts     # tree-sitter TS/TSX parser + import extractor
│   │   └── resolver.ts       # Module path resolver (aliases, node_modules)
│   ├── graph/
│   │   ├── builder.ts        # Constructs CallGraph from parsed ASTs
│   │   ├── traversal.ts      # BFS/DFS from entry points
│   │   └── types.ts          # CallGraph, CallNode, CallEdge interfaces
│   ├── vuln/
│   │   ├── osv.ts            # OSV REST API client (POST /v1/querybatch)
│   │   ├── cache.ts          # File-based advisory cache (.reachable-cache/)
│   │   ├── symbols.ts        # Extract vulnerable symbols from advisory data
│   │   └── types.ts          # Advisory, VulnSymbol, ReachabilityResult types
│   ├── output/
│   │   ├── table.ts          # cli-table3 terminal output
│   │   ├── json.ts           # JSON formatter
│   │   ├── sarif.ts          # SARIF v2.1.0 formatter
│   │   └── markdown.ts       # GitHub PR comment formatter
│   ├── config/
│   │   ├── loader.ts         # cosmiconfig loader for .reachablerc
│   │   └── types.ts          # Config schema (validated with zod)
│   └── utils/
│       ├── logger.ts         # pino logger with --verbose flag
│       └── packagelock.ts    # Parse package-lock.json v2/v3
├── test/
│   ├── fixtures/             # Sample projects for integration tests
│   ├── parser/
│   ├── graph/
│   ├── vuln/
│   └── output/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

**Key TypeScript Interfaces:**

```typescript
interface CallNode {
  id: string;          // "src/auth/middleware.ts::verifyToken"
  file: string;
  name: string;
  line: number;
  isEntryPoint: boolean;
}

interface CallEdge {
  from: string;        // CallNode.id
  to: string;          // CallNode.id
  importedFrom: string; // e.g., "jsonwebtoken"
}

interface VulnSymbol {
  package: string;     // "lodash"
  ghsaId: string;      // "GHSA-xxxx-xxxx-xxxx"
  cvssScore: number;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  exportedSymbol: string | null;  // null = unknown
  affectedVersionRange: string;
}

interface ReachabilityResult {
  advisory: VulnSymbol;
  status: "REACHABLE" | "UNREACHABLE" | "UNKNOWN";
  callPath: string[] | null;  // Trace of CallNode.ids
}
```

---

## Section 10 — Error Handling

- **Advisory fetch failure:** Log warning, mark all advisories for that package as `UNKNOWN`, continue. Do not abort scan.
- **Parse failure on source file:** Log file path + error, skip file, continue. Report skipped files in output.
- **Circular import detected:** Terminate BFS branch at depth limit. Log as warning.
- **`package-lock.json` not found:** Error `E001` — exit 2 with message below.
- **No entry point detected:** Error `E002` — exit 2 with message below.
- **OSV API rate limit (HTTP 429):** Retry with exponential backoff (max 3 retries, 2s/4s/8s).

| Code | Meaning | Action |
|---|---|---|
| `E001` | `package-lock.json` not found | Exit 2: `"Run npm install first, or specify --cwd"` |
| `E002` | No entry point detected | Exit 2: `"Specify an entry point with --entry src/index.ts"` |
| `E003` | OSV API unreachable | Exit 2 unless `--dry-run`, use cache if available |
| `E004` | tree-sitter grammar missing | Exit 2: `"Install tree-sitter-typescript: npm i -D tree-sitter-typescript"` |
| `E005` | Traversal depth exceeded | Warning only, mark deep symbols as `UNKNOWN` |

---

## Section 11 — Edge Cases

1. **Wildcard re-exports** (`export * from "lodash"`) — must be resolved to the full exported set of the module.
2. **Dynamic requires** (`require(someVar)`) — cannot statically trace. Mark all packages used in same file's `require()` calls as `UNKNOWN`.
3. **Aliased imports** (`import _ from "lodash-es"` when advisory targets `lodash`) — maintain alias-to-canonical mapping.
4. **Monorepos with workspaces** — each workspace has its own `node_modules`, must walk workspace roots separately.
5. **package-lock.json v3 lockfile format** (npm 7+) — uses `packages` key, not the v2 `dependencies` key. Both must be handled.
6. **Advisory with no specific symbol** (most NVD-sourced advisories) — classified as `UNKNOWN`, not `UNREACHABLE`.
7. **Transitive dependency vulnerability** — must determine if ANY function in the call chain uses the vulnerable package.
8. **Test files in call graph** — exclude `*.test.ts`, `*.spec.ts`, `__tests__/` unless `--include-tests` flag is set.
9. **ESM vs CJS dual packages** — some packages ship both. Resolution must match what Node.js would actually load.
10. **Optional chaining call sites** (`lib.vuln?.()`) — must be detected as a potential call.

---

## Section 12 — Testing Strategy

**Unit Tests:**
- Test each parser extracts import statements correctly from JS/TS/JSX/TSX fixtures
- Test `resolver.ts` correctly resolves `@/` aliases, `node_modules` paths, relative paths
- Test BFS traversal finds correct paths in synthetic call graphs
- Test OSV cache reads/writes/expiry logic in isolation (mock filesystem)
- Test SARIF output conforms to SARIF v2.1.0 schema

**Integration Tests:**
- Spin up a test fixture project with known-vulnerable packages and assert `REACHABLE` output
- Spin up a fixture where vulnerable package is imported but the vulnerable function is never called — assert `UNREACHABLE`
- Test against real OSV API (network-gated, runs nightly only)
- Test monorepo fixture with workspaces

**Mocking Strategy:**
- OSV API: `nock` or `msw` to intercept `undici` requests with fixture advisories
- Filesystem: use real temp directories, not mocked fs

---

## Section 13 — Distribution

```bash
# Build
tsup src/cli/index.ts --format cjs --dts --out-dir dist

# Install globally
npm install -g reachable

# npx (zero install)
npx reachable scan

# Install as devDependency
npm install --save-dev reachable
```

**Binary release targets:** Linux x64/arm64, macOS x64/arm64, Windows x64 via `pkg` or `@vercel/ncc`.

**CI/CD:** GitHub Actions — publish to npm on tag push via `semantic-release`. Homebrew tap submitted post-1.0.

---

## Section 14 — Differentiators vs Competing Tools

1. **vs `npm audit`:** npm audit has zero call graph awareness — it flags all installed packages with known CVEs regardless of usage. reachable reports only CVEs in code paths that are actually executed.
2. **vs Snyk (paid reachability):** Snyk's reachability is a cloud-only, paid feature. reachable is local-first, open source, and requires no account or API key.
3. **vs Socket.dev:** Socket focuses on supply chain attacks (malware, typosquatting) rather than CVE reachability. Different problem space.
4. **vs Dependabot:** Dependabot opens PRs for any package with an advisory. It does not perform reachability analysis at all.

---

## Section 15 — Future Scope (v2+)

- [ ] Python support (tree-sitter-python grammar)
- [ ] Go support (tree-sitter-go grammar)
- [ ] VS Code extension with inline annotations
- [ ] GitHub Action published to GitHub Marketplace
- [ ] Incremental analysis (only re-analyze changed files)
- [ ] Support for advisory `ecosystem_specific.functions` field when OSV schema adds it
- [ ] Automatic PR comment bot
- [ ] SBOM (CycloneDX) output format

---

## Section 16 — Success Metrics

- [ ] Processes a 500-file TypeScript project in under 10 seconds on M2 MacBook
- [ ] Correctly classifies 90%+ of REACHABLE/UNREACHABLE in benchmark suite
- [ ] Less than 5% false-negative rate (UNREACHABLE classified as REACHABLE)
- [ ] Works with Node.js 18, 20, and 22
- [ ] Works on Linux x64, macOS arm64, Windows x64
- [ ] 80%+ unit test coverage
- [ ] Zero mandatory API keys or cloud accounts required

---

## Section 17 — Additional Deliverables

**Documentation Files:**
- [ ] README.md with badges, install instructions, usage examples
- [ ] CONTRIBUTING.md
- [ ] CODE_OF_CONDUCT.md (Contributor Covenant)
- [ ] SECURITY.md
- [ ] .github/ISSUE_TEMPLATE/bug_report.md
- [ ] .github/ISSUE_TEMPLATE/feature_request.md
- [ ] .github/PULL_REQUEST_TEMPLATE.md
- [ ] CHANGELOG.md (auto-generated by semantic-release)

**Dev Environment:**
- [ ] .devcontainer/devcontainer.json with Node 22 image
- [ ] .env.example
- [ ] .editorconfig

**Logging:**
- [ ] pino logger with `LOG_LEVEL` env var
- [ ] `--verbose` flag sets level to `debug`
- [ ] Structured JSON log output in CI (when `CI=true`)

**Environment Variables:**
- [ ] `REACHABLE_OSV_API_KEY` — optional OSV API key (for higher rate limits)
- [ ] `REACHABLE_CACHE_DIR` — override default cache directory
- [ ] `LOG_LEVEL` — `error` | `warn` | `info` | `debug` (default: `warn`)
- [ ] `NO_COLOR` — disable chalk color output

---

## Section 18 — Expanded Testing Strategy

**Unit Tests (target: 85%+ coverage):**
- [ ] `parser/javascript.ts` — extracts `require()` calls from CJS files
- [ ] `parser/javascript.ts` — extracts `import` statements from ESM files
- [ ] `parser/typescript.ts` — extracts typed imports with `import type`
- [ ] `parser/resolver.ts` — resolves relative paths to absolute
- [ ] `parser/resolver.ts` — resolves tsconfig path aliases
- [ ] `graph/builder.ts` — builds correct edges from a 3-file fixture
- [ ] `graph/traversal.ts` — BFS finds path in a 5-node graph
- [ ] `graph/traversal.ts` — BFS terminates correctly on cycle
- [ ] `vuln/cache.ts` — writes advisory to disk and reads back
- [ ] `vuln/cache.ts` — returns null for expired cache entry
- [ ] `vuln/symbols.ts` — extracts symbol from structured OSV data
- [ ] `vuln/symbols.ts` — returns null when no structured symbol available
- [ ] `output/sarif.ts` — output validates against SARIF v2.1.0 JSON schema
- [ ] `config/loader.ts` — loads `.reachablerc.json` from project root
- [ ] `config/loader.ts` — applies default values for missing fields

**Integration Tests:**
- [ ] Fixture: `express-with-vulnerable-dep` — asserts 1 REACHABLE result
- [ ] Fixture: `lodash-imported-but-safe-fn-only` — asserts 0 REACHABLE results
- [ ] Fixture: `monorepo-workspace` — asserts each workspace analyzed independently
- [ ] Fixture: `cjs-and-esm-mixed` — asserts no false positives from format confusion
- [ ] `--format json` output parses as valid JSON
- [ ] `--format sarif` output passes SARIF schema validation

**E2E Tests:**
- [ ] Full `reachable scan` on a real fixture project, assert exit code 1
- [ ] Full `reachable scan --fail-on critical` when only HIGH present, assert exit code 0
- [ ] Full `reachable trace lodash` outputs call path to terminal

**Test Infrastructure:**
- [ ] `test/fixtures/` directory with 5 minimal test projects
- [ ] `nock` configured to mock OSV API responses from JSON fixtures
- [ ] GitHub Actions matrix: Node 18, 20, 22

---

## Section 19 — CI/CD Pipeline

**CI Triggers:**
- [ ] `.github/workflows/ci.yml` — triggers on push to `main` and all PRs
- [ ] Job: lint (`eslint src/`)
- [ ] Job: type-check (`tsc --noEmit`)
- [ ] Job: unit tests (`vitest run`)
- [ ] Job: integration tests (`vitest run --config vitest.integration.config.ts`)
- [ ] Job: build (`tsup`)
- [ ] Job: coverage report (`vitest run --coverage`, report to Codecov)

**Release Pipeline:**
- [ ] `.github/workflows/release.yml` — triggers on push of `v*` tags
- [ ] Job: `semantic-release` — determines version from commit messages, updates CHANGELOG, publishes to npm

**Makefile Targets:**
- [ ] `make lint`
- [ ] `make test`
- [ ] `make test-integration`
- [ ] `make build`
- [ ] `make release-dry`

**Security Scanning:**
- [ ] `npm audit --audit-level=high` in CI
- [ ] CodeQL analysis on every PR
