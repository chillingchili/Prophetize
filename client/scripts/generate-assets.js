const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');
const APP_ICONS_DIR = path.join(__dirname, '..', 'assets', 'app-icons');

async function generateAssets() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('sharp not installed. Install with: npm install --save-dev sharp');
    return;
  }

  const pCoin = path.join(APP_ICONS_DIR, 'p-coin.png');

  // App icon: p-coin on white background, 1024x1024
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: await sharp(pCoin).resize(768, 768).toBuffer(), gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('Generated icon.png');

  // Splash icon: p-coin on white background, 1024x1024
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: await sharp(pCoin).resize(512, 512).toBuffer(), gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('Generated splash-icon.png');

  // Adaptive icon foreground: p-coin on transparent, 480x480
  await sharp(pCoin)
    .resize(360, 360)
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon-foreground.png'));
  console.log('Generated adaptive-icon-foreground.png');

  // Adaptive icon background: solid white, 480x480
  await sharp({
    create: { width: 480, height: 480, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon-background.png'));
  console.log('Generated adaptive-icon-background.png');

  console.log('All assets generated from p-coin.png!');
}

generateAssets().catch(console.error);
