// Run: node scripts/generate-assets.js
// Requires: npm install sharp
// Converts SVG source files to PNG assets for app store submission

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');

async function generateAssets() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('sharp not installed. Install it with: npm install --save-dev sharp');
    console.log('Then re-run this script.');
    console.log('');
    console.log('For now, create PNGs manually:');
    console.log('1. Open SVG files in a browser or editor');
    console.log('2. Export as PNG at the required sizes');
    console.log('3. Place them in:', ASSETS_DIR);
    return;
  }

  // App icon: 1024x1024
  await sharp(path.join(ASSETS_DIR, 'icon.svg'))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('Generated icon.png');

  // Splash icon: 1024x1024 (centered logo on teal)
  await sharp(path.join(ASSETS_DIR, 'splash-icon.svg'))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('Generated splash-icon.png');

  // Adaptive icon foreground: 480x480
  await sharp(path.join(ASSETS_DIR, 'adaptive-icon-foreground.svg'))
    .resize(480, 480)
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon-foreground.png'));
  console.log('Generated adaptive-icon-foreground.png');

  // Adaptive icon background: 480x480 solid teal
  // We create this programmatically as a solid teal square
  const { createCanvas } = require('canvas') || {};
  if (createCanvas) {
    const canvas = createCanvas(480, 480);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0891B2';
    ctx.fillRect(0, 0, 480, 480);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(ASSETS_DIR, 'adaptive-icon-background.png'), buffer);
    console.log('Generated adaptive-icon-background.png');
  } else {
    // Fallback: create a simple 480x480 teal PNG using sharp
    await sharp({
      create: {
        width: 480,
        height: 480,
        channels: 4,
        background: { r: 8, g: 145, b: 178, alpha: 1 },
      },
    })
      .png()
      .toFile(path.join(ASSETS_DIR, 'adaptive-icon-background.png'));
    console.log('Generated adaptive-icon-background.png');
  }

  console.log('All assets generated!');
}

generateAssets().catch(console.error);
