import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, '../src/assets/icons/inv-logo.png');
const iconsDir = join(__dirname, '../public/icons');

const sizes = [16, 48, 128];

async function generateIcons() {
    console.log(`Processing ${inputPath}...`);

    for (const size of sizes) {
        const outputPath = join(iconsDir, `icon${size}.png`);
        await sharp(inputPath)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(outputPath);
        console.log(`Created ${outputPath}`);
    }
}

generateIcons().catch(console.error);
