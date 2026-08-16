import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ALLOWED_MIME_TYPES } from '../constants/index.js';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export interface DetectedFileType {
  mimeType: string;
  extension: string;
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function detectFileType(buffer: Buffer): DetectedFileType | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-') {
    return { mimeType: 'application/pdf', extension: 'pdf' };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }
  return null;
}

export function isAllowedMime(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function sanitizeFilename(filename: string): string {
  return path.basename(String(filename || '')).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export function generateStoredFilename(extension: string): string {
  return `${crypto.randomUUID()}.${extension}`;
}

export async function storeUpload(buffer: Buffer, detected: DetectedFileType): Promise<{ storedFilename: string; sha256Hash: string }> {
  const storedFilename = generateStoredFilename(detected.extension);
  await ensureUploadDir();
  await fs.writeFile(path.join(UPLOAD_DIR, storedFilename), buffer, { flag: 'wx' });
  const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return { storedFilename, sha256Hash };
}

export function resolveStoredPath(storedFilename: string): string {
  const base = path.basename(storedFilename);
  return path.join(UPLOAD_DIR, base);
}

export function isPathSafe(candidate: string): boolean {
  return path.basename(candidate) === candidate && !candidate.includes('..') && !path.isAbsolute(candidate);
}

export async function sha256File(storedFilename: string): Promise<string> {
  const data = await fs.readFile(resolveStoredPath(storedFilename));
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function readStoredFile(storedFilename: string): Promise<Buffer> {
  return fs.readFile(resolveStoredPath(storedFilename));
}

export function tempUploadPath(): string {
  return path.join(os.tmpdir(), `hk-${crypto.randomUUID()}`);
}