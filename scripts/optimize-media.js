#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const ORIGINAL_DIR = path.join(__dirname, '../public/media/original');
const OPTIMIZED_DIR = path.join(__dirname, '../public/media/optimized');
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.wmv'];

// Image optimization settings
const IMAGE_QUALITY = 80;
const IMAGE_MAX_WIDTH = 1920;
const IMAGE_MAX_HEIGHT = 1080;

// Video optimization settings
const VIDEO_CRF = 28; // Constant Rate Factor (18-28 is good, lower = better quality, higher file size)
const VIDEO_PRESET = 'medium'; // ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow

async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    console.error('FFmpeg not found. Please install FFmpeg to optimize videos.');
    console.error('Installation: https://ffmpeg.org/download.html');
    return false;
  }
}

async function optimizeImage(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Calculate new dimensions while maintaining aspect ratio
    let { width, height } = metadata;
    if (width > IMAGE_MAX_WIDTH || height > IMAGE_MAX_HEIGHT) {
      const ratio = Math.min(IMAGE_MAX_WIDTH / width, IMAGE_MAX_HEIGHT / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    await image
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: IMAGE_QUALITY })
      .toFile(outputPath);
    
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${savings}% smaller)`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to optimize ${inputPath}:`, error.message);
    return false;
  }
}

async function optimizeVideo(inputPath, outputPath) {
  try {
    const outputDir = path.dirname(outputPath);
    const outputName = path.basename(outputPath, path.extname(outputPath));
    const outputPathMP4 = path.join(outputDir, `${outputName}.mp4`);
    
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf ${VIDEO_CRF} -preset ${VIDEO_PRESET} -c:a aac -b:a 128k -movflags +faststart -y "${outputPathMP4}"`;
    
    await execAsync(command);
    
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPathMP4).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPathMP4)} (${savings}% smaller)`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to optimize ${inputPath}:`, error.message);
    return false;
  }
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const nameWithoutExt = path.basename(fileName, extension);
  
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) {
    const outputPath = path.join(OPTIMIZED_DIR, `${nameWithoutExt}.webp`);
    return await optimizeImage(filePath, outputPath);
  } else if (SUPPORTED_VIDEO_EXTENSIONS.includes(extension)) {
    const outputPath = path.join(OPTIMIZED_DIR, `${nameWithoutExt}.mp4`);
    return await optimizeVideo(filePath, outputPath);
  } else {
    console.log(`⚠ Skipping unsupported file: ${fileName}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting media optimization...\n');
  
  // Check if directories exist
  if (!fs.existsSync(ORIGINAL_DIR)) {
    console.error(`❌ Original directory not found: ${ORIGINAL_DIR}`);
    process.exit(1);
  }
  
  await ensureDirectoryExists(OPTIMIZED_DIR);
  
  // Check FFmpeg availability
  const ffmpegAvailable = await checkFFmpeg();
  if (!ffmpegAvailable) {
    console.log('⚠️  Video optimization will be skipped due to missing FFmpeg\n');
  }
  
  // Get all files in the original directory
  const files = fs.readdirSync(ORIGINAL_DIR)
    .filter(file => !fs.statSync(path.join(ORIGINAL_DIR, file)).isDirectory())
    .map(file => path.join(ORIGINAL_DIR, file));
  
  if (files.length === 0) {
    console.log('📁 No files found in the original directory.');
    return;
  }
  
  console.log(`📁 Found ${files.length} files to process:\n`);
  
  let processedCount = 0;
  let successCount = 0;
  
  for (const file of files) {
    const success = await processFile(file);
    processedCount++;
    if (success) successCount++;
  }
  
  console.log(`\n✨ Optimization complete!`);
  console.log(`📊 Processed: ${processedCount} files`);
  console.log(`✅ Successful: ${successCount} files`);
  console.log(`❌ Failed: ${processedCount - successCount} files`);
  console.log(`📁 Output directory: ${OPTIMIZED_DIR}`);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { optimizeImage, optimizeVideo };
