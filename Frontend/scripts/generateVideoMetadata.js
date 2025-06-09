const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
let ffmpegPath = 'ffmpeg';
try {
  ffmpegPath = require('ffmpeg-static') || 'ffmpeg';
} catch {}

async function collectFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(full));
    } else if (/\.(mp4|mov|webm|mkv)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function ensureDir(p) {
  return fs.promises.mkdir(p, { recursive: true });
}

async function generateThumbnail(videoPath, thumbPath) {
  await ensureDir(path.dirname(thumbPath));
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      '-y',
      '-i',
      videoPath,
      '-ss',
      '00:00:01',
      '-vframes',
      '1',
      '-vf',
      'scale=320:-1',
      thumbPath,
    ]);
    ff.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error('ffmpeg exit ' + code));
    });
    ff.on('error', err => reject(err));
  });
}

async function build(dir, outJson, thumbDir) {
  const absDir = path.resolve(dir);
  const absThumbDir = path.resolve(thumbDir);
  const files = await collectFiles(absDir);
  const data = [];
  for (const file of files) {
    const rel = path.relative(absDir, file).replace(/\\/g, '/');
    const webPath = '/' + path.join(path.basename(dir), rel).replace(/\\/g, '/');
    const thumbRel = rel.replace(/\.[^/.]+$/, '.jpg');
    const thumbWeb = '/' + path.join('thumbnails', path.basename(thumbDir), thumbRel).replace(/\\/g, '/');
    const thumbFile = path.join(absThumbDir, thumbRel);
    if (!fs.existsSync(thumbFile)) {
      try {
        await generateThumbnail(file, thumbFile);
      } catch (e) {
        console.warn('Failed to generate thumbnail for', file, e);
      }
    }
    data.push({ src: webPath, thumbnail: thumbWeb, bounce: false, enabled: true });
  }
  await fs.promises.writeFile(path.resolve(outJson), JSON.stringify(data, null, 2));
}

async function main() {
  const base = path.join(__dirname, '..', 'public');
  await build(
    path.join(base, 'videos'),
    path.join(base, 'video-data.json'),
    path.join(base, 'thumbnails', 'videos')
  );
  await build(
    path.join(base, 'masks'),
    path.join(base, 'mask-data.json'),
    path.join(base, 'thumbnails', 'masks')
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
