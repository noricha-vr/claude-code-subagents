#!/usr/bin/env node

// Simple PWA icon generator script
// Creates basic square colored icons for PWA manifest

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Simple SVG template for the icon
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#gradient)"/>
  
  <!-- Music note icon -->
  <g fill="white" transform="translate(${size*0.3}, ${size*0.25}) scale(${size*0.003})">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </g>
  
  <!-- MP3 text -->
  <text x="${size/2}" y="${size*0.75}" font-family="Arial, sans-serif" 
        font-size="${size*0.12}" font-weight="bold" fill="white" 
        text-anchor="middle" dominant-baseline="middle">MP3</text>
</svg>`;

// Ensure public/icons directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');

// Generate SVG icons for each size
ICON_SIZES.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Generated ${filename}`);
});

// Create a simple favicon.ico placeholder
const faviconSVG = createSVGIcon(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSVG);
console.log('✓ Generated favicon.svg');

// For now, we'll use SVG files. In production, you'd want to use a proper
// image conversion tool to create PNG files from these SVGs.

console.log('\n📝 Note: These are SVG placeholders. For production, convert to PNG format.');
console.log('   You can use tools like Inkscape, ImageMagick, or online converters.');
console.log('   Command example: convert icon-192x192.svg icon-192x192.png');

// Create simple screenshot placeholders
const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Placeholder for wide screenshot (desktop)
const wideScreenshot = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="#f8fafc"/>
  <rect x="40" y="40" width="1200" height="640" rx="12" fill="white" stroke="#e2e8f0" stroke-width="2"/>
  
  <!-- Header -->
  <rect x="60" y="60" width="1160" height="80" fill="#1e40af" rx="8"/>
  <text x="640" y="110" font-family="Arial, sans-serif" font-size="24" fill="white" 
        text-anchor="middle" font-weight="bold">Video to MP3 Converter</text>
  
  <!-- Upload area -->
  <rect x="340" y="200" width="600" height="300" rx="12" fill="#f1f5f9" stroke="#cbd5e1" 
        stroke-width="2" stroke-dasharray="10,5"/>
  <text x="640" y="340" font-family="Arial, sans-serif" font-size="18" fill="#64748b" 
        text-anchor="middle">Drop video files here or click to select</text>
  
  <!-- Progress bar -->
  <rect x="340" y="540" width="600" height="20" rx="10" fill="#e2e8f0"/>
  <rect x="340" y="540" width="240" height="20" rx="10" fill="#1e40af"/>
  
  <!-- Buttons -->
  <rect x="340" y="590" width="120" height="40" rx="6" fill="#1e40af"/>
  <text x="400" y="615" font-family="Arial, sans-serif" font-size="14" fill="white" 
        text-anchor="middle">Convert</text>
  
  <rect x="480" y="590" width="120" height="40" rx="6" fill="#10b981"/>
  <text x="540" y="615" font-family="Arial, sans-serif" font-size="14" fill="white" 
        text-anchor="middle">Download</text>
</svg>`;

fs.writeFileSync(path.join(screenshotsDir, 'wide.svg'), wideScreenshot);

// Placeholder for narrow screenshot (mobile)
const narrowScreenshot = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="540" height="720" viewBox="0 0 540 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="540" height="720" fill="#f8fafc"/>
  <rect x="20" y="20" width="500" height="680" rx="12" fill="white" stroke="#e2e8f0" stroke-width="2"/>
  
  <!-- Header -->
  <rect x="40" y="40" width="460" height="60" fill="#1e40af" rx="8"/>
  <text x="270" y="80" font-family="Arial, sans-serif" font-size="18" fill="white" 
        text-anchor="middle" font-weight="bold">Video2MP3</text>
  
  <!-- Upload area -->
  <rect x="60" y="140" width="420" height="200" rx="12" fill="#f1f5f9" stroke="#cbd5e1" 
        stroke-width="2" stroke-dasharray="8,4"/>
  <text x="270" y="240" font-family="Arial, sans-serif" font-size="14" fill="#64748b" 
        text-anchor="middle">Drop files here</text>
  
  <!-- File list -->
  <rect x="60" y="380" width="420" height="40" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="80" y="405" font-family="Arial, sans-serif" font-size="12" fill="#374151">video.mp4</text>
  
  <!-- Progress -->
  <rect x="60" y="440" width="420" height="16" rx="8" fill="#e2e8f0"/>
  <rect x="60" y="440" width="168" height="16" rx="8" fill="#1e40af"/>
  
  <!-- Buttons -->
  <rect x="60" y="480" width="200" height="36" rx="6" fill="#1e40af"/>
  <text x="160" y="502" font-family="Arial, sans-serif" font-size="12" fill="white" 
        text-anchor="middle">Convert</text>
  
  <rect x="280" y="480" width="200" height="36" rx="6" fill="#10b981"/>
  <text x="380" y="502" font-family="Arial, sans-serif" font-size="12" fill="white" 
        text-anchor="middle">Download</text>
</svg>`;

fs.writeFileSync(path.join(screenshotsDir, 'narrow.svg'), narrowScreenshot);

console.log('✓ Generated screenshot placeholders');
console.log('\n🚀 PWA assets generated successfully!');
console.log('   Icons: public/icons/');
console.log('   Screenshots: public/screenshots/');