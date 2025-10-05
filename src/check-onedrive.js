// check-onedrive.js
const path = require("path");
const os = require("os");

const cwd = process.cwd().toLowerCase();
const home = os.homedir().toLowerCase();

const possibleOneDrivePaths = [
  path.join(home, "onedrive"), // common macOS override
  path.join(home, "library", "cloudstorage", "onedrive-"), // default macOS
  "\\onedrive\\", // Windows
  "/onedrive/" // Linux or WSL
];

const isInOneDrive = possibleOneDrivePaths.some(p => cwd.includes(p));

if (isInOneDrive) {
  console.warn(`
⚠️  Warning: You are running npm install inside a OneDrive-synced folder.
This can cause problems (file locks, missing dependencies, slow sync).

Recommended:
  1. Move your project outside OneDrive (e.g. ~/dev/my-app)
  2. Then run npm install again.
  3. Delete the directories using: rm -rf node_modules package-lock.json
`);
  process.exitCode = 1; // use process.exit(1) to block install entirely
}
