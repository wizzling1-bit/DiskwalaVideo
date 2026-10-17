const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript';
    case '.css': return 'text/css; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.ico': return 'image/x-icon';
    case '.xml': return 'application/xml';
    case '.json':
    case '.webmanifest': return 'application/json';
    case '.txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

function scanDir(dir, base = '') {
  let files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const rel = path.posix.join(base, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(scanDir(full, rel));
    } else {
      const content = fs.readFileSync(full);
      const hash = crypto.createHash('md5').update(content).digest('hex');
      files.push({
        path: '/' + rel,
        fullPath: full,
        hash: hash,
        size: stat.size,
        mime: getMimeType(full)
      });
    }
  }
  return files;
}

const distDir = path.resolve(__dirname, '../dist');
const allFiles = scanDir(distDir);

const manifest = {};
const hashMap = {};

for (const f of allFiles) {
  manifest[f.path] = {
    hash: f.hash,
    size: f.size
  };
  hashMap[f.hash] = {
    fullPath: f.fullPath,
    mime: f.mime
  };
}

fs.writeFileSync(path.resolve(__dirname, '../scratch/manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.resolve(__dirname, '../scratch/hash_map.json'), JSON.stringify(hashMap, null, 2));

console.log(`Indexed ${allFiles.length} files from dist/.`);
