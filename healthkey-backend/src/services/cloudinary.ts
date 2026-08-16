import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Response } from 'express';
import { env } from '../config/env.js';

export interface CloudinaryAsset {
  publicId: string;
  assetId: string;
  resourceType: 'image' | 'raw';
  version: string;
  format: string;
  bytes: number;
  secureUrl?: string;
  createdAt?: string;
}

export interface UploadDocumentInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  extension: string;
  patientId: string;
  folderOverride?: string;
}

const isConfigured =
  Boolean(env.cloudinaryCloudName) &&
  Boolean(env.cloudinaryApiKey) &&
  Boolean(env.cloudinaryApiSecret) &&
  !env.cloudinarySimulation;

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true
  });
}

function resourceTypeFor(mimeType: string): 'image' | 'raw' {
  return mimeType.startsWith('image/') ? 'image' : 'raw';
}

function opaqueFolder(patientId: string): string {
  return `healthkey/medical-records/${patientId}`;
}

const SIM_DIR = path.join(process.cwd(), '.cloudinary-sim');

function simAssetPath(publicId: string): string {
  const normalized = publicId.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  const safe = normalized.replace(/\.\./g, '');
  return path.join(SIM_DIR, safe);
}

async function uploadToSim(input: UploadDocumentInput, folder: string): Promise<CloudinaryAsset> {
  if (env.cloudinarySimFailUploads) {
    throw new Error('Simulated Cloudinary upload failure');
  }
  const publicId = `${folder}/${crypto.randomUUID()}.${input.extension}`;
  await fs.mkdir(path.dirname(simAssetPath(publicId)), { recursive: true });
  await fs.writeFile(simAssetPath(publicId), input.buffer, { flag: 'wx' });
  return {
    publicId,
    assetId: crypto.createHash('sha1').update(publicId).digest('hex'),
    resourceType: resourceTypeFor(input.mimeType),
    version: String(Math.floor(Date.now() / 1000)),
    format: input.extension,
    bytes: input.buffer.length,
    createdAt: new Date().toISOString()
  };
}

function uploadToCloudinary(input: UploadDocumentInput, folder: string): Promise<CloudinaryAsset> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: crypto.randomUUID(),
        resource_type: resourceTypeFor(input.mimeType),
        type: 'authenticated',
        use_filename: false,
        unique_filename: false,
        overwrite: false
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed'));
        }
        resolve({
          publicId: result.public_id,
          assetId: result.asset_id,
          resourceType: result.resource_type === 'raw' ? 'raw' : 'image',
          version: String(result.version),
          format: String(result.format || input.extension),
          bytes: result.bytes,
          secureUrl: result.secure_url,
          createdAt: result.created_at
        });
      }
    );
    stream.end(input.buffer);
  });
}

export async function uploadDocument(input: UploadDocumentInput): Promise<CloudinaryAsset> {
  const folder = input.folderOverride || opaqueFolder(input.patientId);
  return isConfigured ? uploadToCloudinary(input, folder) : uploadToSim(input, folder);
}

export async function destroyDocument(asset: CloudinaryAsset): Promise<void> {
  if (isConfigured) {
    await cloudinary.uploader.destroy(asset.publicId, {
      resource_type: asset.resourceType,
      type: 'authenticated'
    });
    return;
  }
  try {
    await fs.unlink(simAssetPath(asset.publicId));
  } catch (err: any) {
    if (err?.code !== 'ENOENT') throw err;
  }
}

function signedSimUrl(asset: CloudinaryAsset, expiresAtSeconds: number): string {
  const payload = Buffer.from(
    JSON.stringify({ id: asset.publicId, exp: expiresAtSeconds })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', env.jwtSecret).update(payload).digest('hex').slice(0, 24);
  return `/api/records/asset?asset=${payload}&sig=${sig}&exp=${expiresAtSeconds}`;
}

export function getAuthorizedUrl(asset: CloudinaryAsset, ttlSeconds = 300): string {
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + ttlSeconds;
  if (!isConfigured) {
    return `${env.frontendUrl}${signedSimUrl(asset, expiresAtSeconds)}`;
  }
  const url = cloudinary.url(asset.publicId, {
    resource_type: asset.resourceType,
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAtSeconds
  });
  return url;
}

export function verifySimSignedReference(
  payload: string,
  sig: string,
  exp: string
): { publicId: string } | null {
  const expected = crypto.createHmac('sha256', env.jwtSecret).update(payload).digest('hex').slice(0, 24);
  if (sig !== expected) return null;
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed?.id) return null;
    return { publicId: String(parsed.id) };
  } catch {
    return null;
  }
}

export function mimeTypeForFormat(format: string): string {
  const f = String(format || '').toLowerCase();
  if (f === 'pdf') return 'application/pdf';
  if (f === 'png') return 'image/png';
  if (f === 'jpg' || f === 'jpeg') return 'image/jpeg';
  if (f === 'webp') return 'image/webp';
  return 'application/octet-stream';
}

async function fetchAssetBytes(asset: CloudinaryAsset): Promise<Buffer> {
  if (!isConfigured) {
    const signedUrl = signedSimUrl(asset, Math.floor(Date.now() / 1000) + 300);
    const res = await fetch(`http://127.0.0.1:${env.port}${signedUrl}`);
    if (!res.ok) {
      throw new Error(`Simulated asset fetch failed: ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  const url = getAuthorizedUrl(asset);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Cloudinary asset fetch failed: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function getAssetBytes(asset: CloudinaryAsset): Promise<Buffer> {
  return fetchAssetBytes(asset);
}

export async function readSimAssetByPublicId(publicId: string): Promise<Buffer> {
  return fs.readFile(simAssetPath(publicId));
}

export async function streamAuthorizedAsset(
  asset: CloudinaryAsset,
  res: Response,
  options: { filename?: string; download?: boolean; mimeType: string }
): Promise<void> {
  const bytes = await fetchAssetBytes(asset);
  const safeName = (options.filename || 'document').replace(/"/g, '');
  res.setHeader('Content-Type', options.mimeType);
  res.setHeader('Content-Length', String(bytes.length));
  res.setHeader(
    'Content-Disposition',
    options.download ? `attachment; filename="${safeName}"` : `inline; filename="${safeName}"`
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(bytes);
}