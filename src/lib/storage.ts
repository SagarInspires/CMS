import fs from 'fs/promises';
import path from 'path';
import { put, del } from '@vercel/blob';

export interface StorageProvider {
  upload(file: File): Promise<string>;
  delete(url: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  private uploadDir = path.join(process.cwd(), 'public', 'uploads');

  constructor() {
    fs.mkdir(this.uploadDir, { recursive: true }).catch(() => {});
  }

  async upload(file: File): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true }).catch(() => {});
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `${uniqueSuffix}-${safeName}`;
    
    await fs.writeFile(path.join(this.uploadDir, filename), buffer);
    return `/uploads/${filename}`;
  }

  async delete(url: string): Promise<void> {
    const filename = url.replace('/uploads/', '');
    const filepath = path.join(this.uploadDir, filename);
    await fs.unlink(filepath).catch(() => {});
  }
}

class VercelBlobStorageProvider implements StorageProvider {
  async upload(file: File): Promise<string> {
    // Safety check in case it's called improperly
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not configured for Vercel Blob.');
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `uploads/${uniqueSuffix}-${safeName}`;
    
    const { url } = await put(filename, file, { access: 'public' });
    return url;
  }

  async delete(url: string): Promise<void> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not configured for Vercel Blob.');
    }
    
    try {
      await del(url);
    } catch (error) {
      console.error('Failed to delete blob from Vercel:', error);
    }
  }
}

// Determine provider
const resolveProvider = (): StorageProvider => {
  const provider = process.env.STORAGE_PROVIDER;

  if (!provider) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('WARNING: STORAGE_PROVIDER environment variable is not set in production. Defaulting to "local".');
    }
    return new LocalStorageProvider();
  }

  if (provider === 'vercel-blob') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('WARNING: BLOB_READ_WRITE_TOKEN is missing. Vercel Blob storage will fail if used.');
    }
    return new VercelBlobStorageProvider();
  }

  if (provider === 'local') {
    return new LocalStorageProvider();
  }

  console.warn(`WARNING: Invalid STORAGE_PROVIDER "${provider}". Defaulting to "local".`);
  return new LocalStorageProvider();
};

export const storage: StorageProvider = resolveProvider();
