import fs from 'fs/promises';
import path from 'path';

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

export const storage = new LocalStorageProvider();
