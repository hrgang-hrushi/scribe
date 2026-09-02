const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  const svgBuffer = require('fs').readFileSync(path.join(__dirname, 'public/icon-192.svg'));
  
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public/icon-192.png'));
  
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public/icon-512.png'));
  
  console.log('Icons generated!');
}

generateIcons().catch(console.error);
