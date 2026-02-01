import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.resolve(__dirname, '../package.json');
const manifestPath = path.resolve(__dirname, '../public/manifest.json');

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

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
