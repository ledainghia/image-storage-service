// src/index.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

// Define image storage interface
interface ImageMetadata {
  id: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  createdAt: Date;
}

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3002;
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const METADATA_FILE = path.join(__dirname, '../data/metadata.json');
const PUBLIC_PATH = '/images';

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(path.dirname(METADATA_FILE))) {
  fs.mkdirSync(path.dirname(METADATA_FILE), { recursive: true });
}

// Initialize metadata file if it doesn't exist
if (!fs.existsSync(METADATA_FILE)) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify([]));
}

// Configure middleware
app.use(express.json());
app.use(cors());
app.use('/images', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

// Helper functions
const readMetadata = (): ImageMetadata[] => {
  const data = fs.readFileSync(METADATA_FILE, 'utf8');
  return JSON.parse(data);
};

const writeMetadata = (metadata: ImageMetadata[]): void => {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
};

const getImageDimensions = async (
  filePath: string
): Promise<{ width: number; height: number }> => {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
};

// API Routes
// Upload image
app.post('/api/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const filePath = req.file.path;
    const { width, height } = await getImageDimensions(filePath);

    const imageMetadata: ImageMetadata = {
      id: path.basename(filePath, path.extname(filePath)),
      originalName: req.file.originalname,
      path: `${PUBLIC_PATH}/${path.basename(filePath)}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      width,
      height,
      createdAt: new Date(),
    };

    const metadata = readMetadata();
    metadata.push(imageMetadata);
    writeMetadata(metadata);

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: imageMetadata,
      path: imageMetadata.path,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get all images
app.get('/api/images', (req, res) => {
  const metadata = readMetadata();
  res.json(metadata);
});

// Get image by ID
app.get('/api/images/:id', (req, res) => {
  const metadata = readMetadata();
  const image = metadata.find((img) => img.id === req.params.id);

  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.json(image);
});

// Get resized image
app.get('/api/resize/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { width, height } = req.query;

    const metadata = readMetadata();
    const image = metadata.find((img) => img.id === id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const sourcePath = path.join(UPLOAD_DIR, path.basename(image.path));

    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    const resizeOptions: sharp.ResizeOptions = {};

    if (width) {
      resizeOptions.width = parseInt(width as string, 10);
    }

    if (height) {
      resizeOptions.height = parseInt(height as string, 10);
    }

    const resizedImageBuffer = await sharp(sourcePath)
      .resize(resizeOptions)
      .toBuffer();

    // Set appropriate content type
    res.setHeader('Content-Type', image.mimeType);
    res.send(resizedImageBuffer);
  } catch (error) {
    console.error('Error resizing image:', error);
    res.status(500).json({ error: 'Failed to resize image' });
  }
});

// Delete image by ID
app.delete('/api/images/:id', (req, res) => {
  try {
    const { id } = req.params;
    const metadata = readMetadata();
    const imageIndex = metadata.findIndex((img) => img.id === id);

    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = metadata[imageIndex];
    const filePath = path.join(UPLOAD_DIR, path.basename(image.path));

    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update metadata
    metadata.splice(imageIndex, 1);
    writeMetadata(metadata);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Update image metadata
app.patch('/api/images/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Only allow certain fields to be updated
    const allowedUpdates = ['originalName'];
    const requestedUpdates = Object.keys(updates);

    const isValidUpdate = requestedUpdates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidUpdate) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const metadata = readMetadata();
    const imageIndex = metadata.findIndex((img) => img.id === id);

    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update metadata
    metadata[imageIndex] = {
      ...metadata[imageIndex],
      ...updates,
    };

    writeMetadata(metadata);

    res.json(metadata[imageIndex]);
  } catch (error) {
    console.error('Error updating image metadata:', error);
    res.status(500).json({ error: 'Failed to update image metadata' });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const metadata = readMetadata();

  const totalImages = metadata.length;
  const totalSize = metadata.reduce((sum, img) => sum + img.size, 0);

  const stats = {
    totalImages,
    totalSize,
    formattedSize: formatFileSize(totalSize),
  };

  res.json(stats);
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
