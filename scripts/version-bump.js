import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const packagePath = path.resolve(rootDir, 'package.json');
const manifestPath = path.resolve(rootDir, 'public/manifest.json');

const releaseType = process.argv[2] || 'patch';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const packageJson = readJson(packagePath);
const manifestJson = readJson(manifestPath);

const currentVersion = packageJson.version;
const parts = currentVersion.split('.');
let major = parseInt(parts[0], 10);
let minor = parseInt(parts[1], 10);
let patch = parseInt(parts[2], 10);

if (releaseType === 'major') {
  major++;
  minor = 0;
  patch = 0;
} else if (releaseType === 'minor') {
  minor++;
  patch = 0;
} else {
  patch++;
}

const newVersion = `${major}.${minor}.${patch}`;

packageJson.version = newVersion;
manifestJson.version = newVersion;

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n');

// Update package-lock.json by running npm install
console.log('Updating package-lock.json...');
execSync('npm install --package-lock-only', { cwd: rootDir, stdio: 'inherit' });

console.log(`\nVersion bumped from ${currentVersion} to ${newVersion}`);
