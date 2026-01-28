import { NextApiRequest, NextApiResponse } from 'next';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Increase body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for admin token
    const adminToken = req.headers['x-admin-token'] as string;
    const expectedToken = 'tech2026SINGAWE'; // Your token
    
    // Token checking is ENABLED:
    if (adminToken !== expectedToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or missing admin token'
      });
    }

    // Parse the request body
    const { imageData, filename, folder = '/assets/', type } = req.body;
    
    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Missing required fields: imageData and filename' });
    }

    // Validate it's a base64 image
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data. Must be base64 image.' });
    }

    // Remove data:image/...;base64, prefix
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Validate base64
    if (!/^[A-Za-z0-9+/]+=*$/.test(base64Data)) {
      return res.status(400).json({ error: 'Invalid base64 data format' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate safe filename with timestamp
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    // Clean the filename - remove extension if present
    let safeName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    safeName = safeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
    
    // Determine file extension from imageData
    let fileExt = 'png';
    if (imageData.includes('image/jpeg') || imageData.includes('image/jpg')) {
      fileExt = 'jpg';
    } else if (imageData.includes('image/gif')) {
      fileExt = 'gif';
    } else if (imageData.includes('image/webp')) {
      fileExt = 'webp';
    } else if (imageData.includes('image/svg+xml')) {
      fileExt = 'svg';
    }
    
    const finalFilename = `${safeName}_${timestamp}_${random}.${fileExt}`;
    
    // Determine the upload path - remove leading slash for join
    const cleanFolder = folder.startsWith('/') ? folder.slice(1) : folder;
    const uploadDir = join(process.cwd(), 'public', cleanFolder);
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }

    const filePath = join(uploadDir, finalFilename);
    
    // Write the file
    await writeFile(filePath, buffer);
    console.log(`File saved: ${filePath}`);

    // Return the public URL
    const publicUrl = `/${cleanFolder}${finalFilename}`;
    
    res.status(200).json({
      success: true,
      url: publicUrl,
      filePath: publicUrl,
      filename: finalFilename,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
