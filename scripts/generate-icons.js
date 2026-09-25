import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// StreamX High-Contrast Electric Neon Cyberpunk SVG (Matches in-app StreamX branding)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep jet black gradient background -->
    <radialGradient id="neonBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#070b16" />
      <stop offset="55%" stop-color="#020408" />
      <stop offset="100%" stop-color="#000000" />
    </radialGradient>

    <!-- Electric Neon Cyan to Magenta / Fuchsia Gradient -->
    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f3ff" />
      <stop offset="35%" stop-color="#0ea5e9" />
      <stop offset="70%" stop-color="#d946ef" />
      <stop offset="100%" stop-color="#ff007f" />
    </linearGradient>

    <linearGradient id="neonAccent" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#00ffcc" />
      <stop offset="50%" stop-color="#00f3ff" />
      <stop offset="100%" stop-color="#c026d3" />
    </linearGradient>

    <linearGradient id="glowBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f3ff" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <!-- Subtle multi-stage glow -->
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Solid Pitch Black Background -->
  <rect width="512" height="512" rx="110" fill="url(#neonBg)" />

  <!-- Outer Neon Border with Double Glow -->
  <rect width="488" height="488" x="12" y="12" rx="98" fill="none" stroke="url(#glowBorder)" stroke-width="6" stroke-opacity="0.9" />
  <rect width="470" height="470" x="21" y="21" rx="89" fill="none" stroke="#00f3ff" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="14 14" />

  <!-- Inner Ambient Neon Light Halo -->
  <circle cx="256" cy="256" r="160" fill="#00f3ff" opacity="0.09" />
  <circle cx="256" cy="256" r="110" fill="#d946ef" opacity="0.11" />

  <!-- Dynamic Electric "X" Arms (StreamX Signature) -->
  <g filter="url(#neonGlow)">
    <!-- Arm 1: Top-Left to Bottom-Right -->
    <path d="M 120 120 L 195 120 L 392 392 L 317 392 Z" fill="url(#neonGrad)" />
    <!-- Arm 2: Top-Right to Bottom-Left -->
    <path d="M 392 120 L 317 120 L 120 392 L 195 392 Z" fill="url(#neonAccent)" opacity="0.95" />
  </g>

  <!-- Glowing Cinema Play Core in Center of X -->
  <polygon points="228,198 326,256 228,314" fill="#000000" stroke="#00f3ff" stroke-width="7" stroke-linejoin="round" />
  <polygon points="234,208 314,256 234,304" fill="#ffffff" />
  <polygon points="238,218 296,256 238,294" fill="url(#neonGrad)" />
  <polygon points="242,228 280,256 242,284" fill="#ffffff" />

  <!-- Decorative Corner Cyber Pips -->
  <circle cx="70" cy="70" r="5" fill="#00f3ff" />
  <circle cx="442" cy="70" r="5" fill="#ff007f" />
  <circle cx="70" cy="442" r="5" fill="#ff007f" />
  <circle cx="442" cy="442" r="5" fill="#00f3ff" />
</svg>`;

async function generateAllIcons() {
  const svgBuffer = Buffer.from(svgContent);

  // 1. Write public/icon.svg
  fs.writeFileSync('public/icon.svg', svgContent);
  console.log('Generated public/icon.svg');

  // 2. Generate PWA web icons
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/pwa-192x192.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/pwa-512x512.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/pwa-maskable-512x512.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  console.log('Generated public PWA PNGs');

  // 3. Generate Android Mipmap APK launcher icons
  const mipmapDirs = [
    { dir: 'android/app/src/main/res/mipmap-mdpi', size: 48 },
    { dir: 'android/app/src/main/res/mipmap-hdpi', size: 72 },
    { dir: 'android/app/src/main/res/mipmap-xhdpi', size: 96 },
    { dir: 'android/app/src/main/res/mipmap-xxhdpi', size: 144 },
    { dir: 'android/app/src/main/res/mipmap-xxxhdpi', size: 192 }
  ];

  for (const { dir, size } of mipmapDirs) {
    if (fs.existsSync(dir)) {
      // standard icon
      await sharp(svgBuffer).resize(size, size).png().toFile(path.join(dir, 'ic_launcher.png'));
      // round icon
      await sharp(svgBuffer).resize(size, size).png().toFile(path.join(dir, 'ic_launcher_round.png'));
      // foreground icon
      await sharp(svgBuffer).resize(size, size).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
      console.log(`Generated APK icons for ${dir} (${size}x${size})`);
    }
  }

  console.log('All PWA and APK icons successfully updated to neon StreamX brand!');
}

generateAllIcons().catch(console.error);
