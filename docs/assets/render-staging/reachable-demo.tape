Output out/reachable-demo.mp4

Set FontSize 15
Set Width 1000
Set Height 560
Set Theme "Dracula"
Set Padding 20
Set Shell bash

Type "# reachable: cut npm audit noise" Sleep 300ms Enter
Sleep 800ms

Type "cd demo/cli-fixture" Sleep 300ms Enter
Sleep 500ms

Type "npm audit --audit-level=high" Sleep 300ms Enter
Sleep 2.2s

Type "clear" Sleep 250ms Enter
Sleep 400ms

Type "node ../../dist/cli/index.js scan --format table --dry-run" Sleep 300ms Enter
Sleep 2.5s

Type "node ../../dist/cli/index.js trace lodash" Sleep 300ms Enter
Sleep 2s
