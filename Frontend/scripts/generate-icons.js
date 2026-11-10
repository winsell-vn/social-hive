#!/usr/bin/env node

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Define icon sizes to generate
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'mstile-150x150.png', size: 150 },
];

// Source logo path - look for logo.webp in workspace root
const workspaceRoot = path.join(__dirname, '../../');
const sourceLogoPath = path.join(workspaceRoot, 'logo.webp');
const publicDir = path.join(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Check if source logo exists
if (!fs.existsSync(sourceLogoPath)) {
  console.error(`Error: Source logo not found at ${sourceLogoPath}`);
  process.exit(1);
}

console.log(`Generating icons from: ${sourceLogoPath}`);
console.log(`Output directory: ${publicDir}\n`);

// Generate all sizes
Promise.all(
  sizes.map(({ name, size }) => {
    const outputPath = path.join(publicDir, name);
    console.log(`Generating ${name} (${size}x${size})...`);

    return sharp(sourceLogoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      })
      .png()
      .toFile(outputPath)
      .then(() => {
        console.log(`✓ Created ${name}`);
      })
      .catch((err) => {
        console.error(`✗ Failed to create ${name}:`, err.message);
        throw err;
      });
  })
)
  .then(() => {
    console.log('\n✓ All icons generated successfully!');

    // Generate favicon.ico from 32x32 PNG
    const favicon32Path = path.join(publicDir, 'favicon-32x32.png');
    const faviconIcoPath = path.join(publicDir, 'favicon.ico');

    console.log('\nGenerating favicon.ico...');
    return sharp(favicon32Path)
      .resize(32, 32)
      .toFile(faviconIcoPath)
      .then(() => {
        console.log('✓ Created favicon.ico');
      });
  })
  .then(() => {
    console.log('\n✓ Icon generation complete!');
    console.log('\nGenerated files:');
    sizes.forEach(({ name }) => {
      console.log(`  - ${name}`);
    });
    console.log('  - favicon.ico');
  })
  .catch((err) => {
    console.error('\n✗ Icon generation failed:', err);
    process.exit(1);
  });
