import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for admin token
    const adminToken = req.headers['x-admin-token'] as string;
    const expectedToken = process.env.ADMIN_TOKEN; // Set this in .env.local
    
    if (expectedToken && adminToken !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const form = new IncomingForm({
      keepExtensions: true,
      multiples: false,
    });

    const formData: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;
    const file = files.file as File;
    const folder = (fields.folder as string) || '/assets/';
    const type = (fields.type as string) || 'general';

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Get the uploaded file
    const oldPath = file.filepath;
    
    // Get file extension
    const originalFilename = file.originalFilename || 'upload';
    const fileExt = originalFilename.split('.').pop()?.toLowerCase() || 'png';
    
    // Generate a safe filename
    const safeName = originalFilename
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50);

    const timestamp = Date.now();
    const finalFilename = `${safeName}_${timestamp}.${fileExt}`;
    
    // Remove leading slash from folder if present
    const cleanFolder = folder.startsWith('/') ? folder.slice(1) : folder;
    
    // Determine the upload directory
    const uploadDir = join(process.cwd(), 'public', cleanFolder);
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const newPath = join(uploadDir, finalFilename);
    
    // Read the file and write it to the new location
    const fileBuffer = await fs.readFile(oldPath);
    await fs.writeFile(newPath, fileBuffer);
    
    // Clean up the temporary file
    await fs.unlink(oldPath);

    // Return the public URL
    const publicUrl = `/${cleanFolder}${finalFilename}`;
    
    res.status(200).json({
      success: true,
      url: publicUrl,
      filePath: publicUrl,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}
