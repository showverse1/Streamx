const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate() {
  const svgPath = path.join(__dirname, '../public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Android mipmap densities: [folder, size, foregroundSize]
  const densities = [
    ['mipmap-mdpi', 48, 108],
    ['mipmap-hdpi', 72, 162],
    ['mipmap-xhdpi', 96, 216],
    ['mipmap-xxhdpi', 144, 324],
    ['mipmap-xxxhdpi', 192, 432]
  ];

  for (const [folder, size, fgSize] of densities) {
    const dir = path.join(__dirname, '../android/app/src/main/res', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Full launcher icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // Round launcher icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // Foreground icon for adaptive icons (logo centered with padding)
    const logoSize = Math.round(fgSize * 0.65);
    const logo = await sharp(svgBuffer).resize(logoSize, logoSize).png().toBuffer();
    await sharp({
      create: {
        width: fgSize,
        height: fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: logo, gravity: 'centre' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }

  // Web & PWA icons
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(__dirname, '../public/pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(__dirname, '../public/pwa-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(__dirname, '../public/apple-touch-icon.png'));

  console.log('Successfully generated all Android and PWA app icons!');
}

generate().catch(console.error);
