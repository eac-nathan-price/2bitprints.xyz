# Media Optimization Script

This script optimizes media files from `public/media/original` and saves them to `public/media/optimized`.

## Features

- **Images**: Converts to WebP format with quality optimization and resizing
- **Videos**: Compresses using H.264 codec with configurable quality settings
- **Smart resizing**: Maintains aspect ratio while limiting dimensions
- **Progress tracking**: Shows optimization progress and file size savings

## Prerequisites

1. **Node.js** (already installed in your project)
2. **Sharp** library for image processing (installed via npm)
3. **FFmpeg** for video processing (optional - install if you want video optimization)

### Installing FFmpeg

#### Windows (WSL/Ubuntu):
```bash
sudo apt update
sudo apt install ffmpeg
```

#### macOS:
```bash
brew install ffmpeg
```

#### Windows:
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)

## Usage

### Quick Start
```bash
npm run optimize-media
```

### Manual Run
```bash
node scripts/optimize-media.js
```

## Configuration

You can modify the optimization settings in `scripts/optimize-media.js`:

### Image Settings
- `IMAGE_QUALITY`: WebP quality (0-100, default: 80)
- `IMAGE_MAX_WIDTH`: Maximum width (default: 1920)
- `IMAGE_MAX_HEIGHT`: Maximum height (default: 1080)

### Video Settings
- `VIDEO_CRF`: Constant Rate Factor (18-28, default: 28)
  - Lower = better quality, larger file size
  - Higher = lower quality, smaller file size
- `VIDEO_PRESET`: Encoding speed (default: 'medium')
  - Options: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow

## Supported Formats

### Images
- JPG/JPEG
- PNG
- BMP
- TIFF

### Videos
- MP4
- AVI
- MOV
- MKV
- WMV

## Output

- **Images**: Converted to WebP format
- **Videos**: Compressed MP4 with H.264 codec
- **File naming**: Original filename with new extension
- **Directory**: All optimized files go to `public/media/optimized`

## Example Output

```
🚀 Starting media optimization...

📁 Found 32 files to process:

✓ PXL_20250428_221201935.MP.jpg → PXL_20250428_221201935.MP.webp (65.2% smaller)
✓ PXL_20250529_172330129.mp4 → PXL_20250529_172330129.mp4 (42.1% smaller)
...

✨ Optimization complete!
📊 Processed: 32 files
✅ Successful: 32 files
❌ Failed: 0 files
📁 Output directory: /path/to/public/media/optimized
```

## Troubleshooting

### Sharp Installation Issues
If you encounter Sharp installation problems:
```bash
npm rebuild sharp
```

### FFmpeg Not Found
The script will skip video optimization if FFmpeg is not installed. Install FFmpeg to enable video compression.

### Memory Issues
For very large files, you may need to increase Node.js memory:
```bash
node --max-old-space-size=4096 scripts/optimize-media.js
```

## Going Forward

1. **Add new media**: Place files in `public/media/original`
2. **Run optimization**: Execute `npm run optimize-media`
3. **Use optimized files**: Reference files from `public/media/optimized` in your application

The script automatically handles:
- Creating the optimized directory if it doesn't exist
- Skipping already processed files
- Error handling and reporting
- Progress tracking
