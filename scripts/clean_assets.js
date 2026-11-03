import fs from 'fs';
import { execSync } from 'child_process';

function cleanImage(inputPath, outputPath, isPhoto = false) {
  execSync(`convert "${inputPath}" /tmp/temp.ppm`);
  const buf = fs.readFileSync('/tmp/temp.ppm');

  let pos = 0;
  function readWord() {
    while (pos < buf.length && (buf[pos] === 32 || buf[pos] === 10 || buf[pos] === 13 || buf[pos] === 9)) pos++;
    if (buf[pos] === 35) {
      while (pos < buf.length && buf[pos] !== 10) pos++;
      return readWord();
    }
    const start = pos;
    while (pos < buf.length && buf[pos] !== 32 && buf[pos] !== 10 && buf[pos] !== 13 && buf[pos] !== 9) pos++;
    return buf.toString('ascii', start, pos);
  }

  const magic = readWord();
  const width = parseInt(readWord(), 10);
  const height = parseInt(readWord(), 10);
  const maxVal = parseInt(readWord(), 10);
  pos++;

  const imgData = Buffer.from(buf.subarray(pos));

  function getPixel(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return null;
    const idx = (y * width + x) * 3;
    return [imgData[idx], imgData[idx + 1], imgData[idx + 2]];
  }

  function setPixel(x, y, r, g, b) {
    const idx = (y * width + x) * 3;
    imgData[idx] = r;
    imgData[idx + 1] = g;
    imgData[idx + 2] = b;
  }

  function isBlueGrid(r, g, b) {
    // Specifically target the blue selection dots in SMART iDesigner
    return (b > 150 && r < 120 && g < 155) || (b > 130 && r < 80 && g < 100);
  }

  // 3 passes of neighbor interpolation
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = getPixel(x, y);
        if (p && isBlueGrid(p[0], p[1], p[2])) {
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              if (dx === 0 && dy === 0) continue;
              const np = getPixel(x + dx, y + dy);
              if (np && !isBlueGrid(np[0], np[1], np[2])) {
                sumR += np[0];
                sumG += np[1];
                sumB += np[2];
                count++;
              }
            }
          }
          if (count > 0) {
            setPixel(x, y, Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count));
          }
        }
      }
    }
  }

  const header = Buffer.from(`P6\n${width} ${height}\n${maxVal}\n`);
  const finalBuf = Buffer.concat([header, imgData]);
  fs.writeFileSync('/tmp/cleaned.ppm', finalBuf);
  execSync(`convert /tmp/cleaned.ppm "${outputPath}"`);
}

// Ensure public/assets and public/uploads exist
fs.mkdirSync('public/assets', { recursive: true });
fs.mkdirSync('public/uploads', { recursive: true });

// Extract clean photo of Juanito Santana
execSync('convert public/assets/card_reference.png -crop 200x240+160+235 +repage /tmp/juanito_raw.png');
cleanImage('/tmp/juanito_raw.png', 'public/uploads/juanito_santana.png', true);

// Extract clean official Agrofem logo
cleanImage('public/assets/agrofem_logo_raw.png', 'public/assets/agrofem_logo.png', false);

console.log('Cleaned all template assets successfully!');
