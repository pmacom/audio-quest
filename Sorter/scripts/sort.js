const fs = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Configuration
const SOURCE_DIRS = {
  masks: path.resolve(__dirname, '../unsorted/masks'),
  segments: path.resolve(__dirname, '../unsorted/segments'),
};
const DEST_DIRS = {
  videos: {
    masks: path.resolve(__dirname, '../files/videos/masks'),
    segments: path.resolve(__dirname, '../files/videos/segments'),
  },
  thumbnails: {
    masks: path.resolve(__dirname, '../files/thumbnails/masks'),
    segments: path.resolve(__dirname, '../files/thumbnails/segments'),
  },
  data: {
    masks: path.resolve(__dirname, '../data/masks.json'),
    segments: path.resolve(__dirname, '../data/segments.json'),
  },
};
const MAX_THUMBNAIL_SIZE = 500;

// Utility Functions
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function initializeJsonFile(filePath) {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      await fs.writeFile(filePath, '[]');
      console.log(`Initialized empty JSON file: ${filePath}`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]');
      console.log(`Created and initialized JSON file: ${filePath}`);
    } else {
      throw err;
    }
  }
}

async function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams[0];
      resolve({
        duration: metadata.format.duration,
        width: stream.width,
        height: stream.height,
        frameRate: eval(stream.r_frame_rate),
        nbFrames: stream.nb_frames,
      });
    });
  });
}

async function generateThumbnail(videoPath, thumbnailPath, width, height) {
  const scale = Math.min(MAX_THUMBNAIL_SIZE / width, MAX_THUMBNAIL_SIZE / height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshot({
        count: 1,
        folder: path.dirname(thumbnailPath),
        filename: path.basename(thumbnailPath),
        size: `${newWidth}x${newHeight}`,
      })
      .on('end', resolve)
      .on('error', reject);
  });
}

function getOrientation(width, height) {
  return width > height ? 'landscape' : width < height ? 'portrait' : 'square';
}

/**
 * Calculate normalized aspect ratio where the smaller dimension comes first
 * and the larger dimension is always 1.
 * 
 * Examples:
 * - 1920x1080 (landscape) → [0.5625, 1] (smaller, larger)
 * - 1080x1920 (portrait)  → [0.5625, 1] (smaller, larger) 
 * - 1080x1080 (square)    → [1, 1] (both dimensions=1)
 * 
 * This creates a consistent "value map" where [smaller_ratio, larger_ratio]
 * can be used directly for scaling operations.
 */
function getRatio(width, height) {
  let ratio;
  if (width > height) {
    // Landscape: smaller dimension (height) first, larger (width) = 1
    ratio = [height / width, 1];
  } else if (height > width) {
    // Portrait: smaller dimension (width) first, larger (height) = 1
    ratio = [width / height, 1];
  } else {
    // Square: both dimensions are equal, so both become 1
    ratio = [1, 1];
  }
  return ratio.map(n => parseFloat(n.toFixed(4)));
}

// Main Processing Function
async function processVideo(filePath, clipType) {
  try {
    const filename = path.basename(filePath);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);

    // Get metadata
    const { duration, width, height, frameRate, nbFrames } = await getVideoMetadata(filePath);

    // Generate thumbnail
    const thumbnailPath = path.join(DEST_DIRS.thumbnails[clipType], `${baseName}.png`);
    await ensureDir(path.dirname(thumbnailPath));
    await generateThumbnail(filePath, thumbnailPath, width, height);

    // Determine destination paths
    const videoDestPath = path.join(DEST_DIRS.videos[clipType], filename);
    const thumbnailSrc = path.join('thumbnails', clipType, `${baseName}.png`).replace(/\\/g, '/');
    const clipSrc = path.join('videos', clipType, filename).replace(/\\/g, '/');

    // Create metadata object
    const metadata = {
      clipType,
      length: Math.round(duration),
      frames: parseInt(nbFrames, 10),
      mode: 'loop',
      orientation: getOrientation(width, height),
      width,
      height,
      ratio: getRatio(width, height),
      speedMin: 1,
      speedMax: 1.5,
      thumbnailSrc,
      clipSrc,
      enabled: true, // Default to enabled
      title: baseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Generate friendly title from filename
    };

    // Move video
    await ensureDir(path.dirname(videoDestPath));
    await fs.rename(filePath, videoDestPath);

    // Update JSON
    const jsonPath = DEST_DIRS.data[clipType];
    await initializeJsonFile(jsonPath);
    const jsonData = JSON.parse(await fs.readFile(jsonPath));
    
    // Check if entry already exists
    const existingEntryIndex = jsonData.findIndex((entry) => entry.clipSrc === clipSrc);
    if (existingEntryIndex === -1) {
      // New entry - add it
      jsonData.push(metadata);
      await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
    } else {
      // Entry exists - update metadata but preserve custom title if it exists and is different from auto-generated
      const existingEntry = jsonData[existingEntryIndex];
      const autoGeneratedTitle = baseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Preserve custom title if it's different from what would be auto-generated
      const shouldPreserveTitle = existingEntry.title && existingEntry.title !== autoGeneratedTitle;
      
      jsonData[existingEntryIndex] = {
        ...metadata,
        title: shouldPreserveTitle ? existingEntry.title : metadata.title,
        // Also preserve any custom settings
        enabled: existingEntry.enabled ?? metadata.enabled,
        customSpeedMin: existingEntry.customSpeedMin ?? metadata.speedMin,
        customSpeedMax: existingEntry.customSpeedMax ?? metadata.speedMax,
        isLooping: existingEntry.isLooping ?? true,
        tags: existingEntry.tags ?? [],
      };
      
      await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
      console.log(`Updated existing entry for ${filename} (preserved custom settings)`);
    }

    console.log(`Processed ${filename} (${clipType})`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

async function main() {
  for (const clipType of Object.keys(SOURCE_DIRS)) {
    const sourceDir = SOURCE_DIRS[clipType];
    try {
      const files = await fs.readdir(sourceDir);
      for (const file of files) {
        if (file.endsWith('.mp4')) {
          const filePath = path.join(sourceDir, file);
          await processVideo(filePath, clipType);
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${sourceDir}:`, err);
    }
  }
}

main();