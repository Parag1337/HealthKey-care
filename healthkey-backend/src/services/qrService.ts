import crypto from 'crypto';
import User from '../models/User.js';
import { env } from '../config/env.js';

const ALGO = 'aes-256-gcm';

function encryptionKey(): Buffer {
  return crypto.createHash('sha256').update(env.jwtSecret).digest();
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(payload: string): string {
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function generateQrToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function buildQrPayload(token: string): string {
  return `${env.frontendUrl}/connect/doctor/${token}`;
}

export async function issueDoctorQrToken(
  doctorId: string
): Promise<{ token: string; payload: string; expiresAt: Date }> {
  const token = generateQrToken();
  const expiresAt = new Date(Date.now() + env.qrTokenTtlHours * 60 * 60 * 1000);
  await User.findByIdAndUpdate(doctorId, {
    $set: {
      qrTokenHash: hashToken(token),
      qrTokenCipher: encrypt(token),
      qrTokenExpiresAt: expiresAt
    }
  });
  return { token, payload: buildQrPayload(token), expiresAt };
}

export async function getDoctorQrToken(
  doctorId: string
): Promise<{ token: string | null; payload: string | null; expiresAt: Date | null }> {
  const user = await User.findById(doctorId).select('qrTokenHash qrTokenCipher qrTokenExpiresAt role');
  if (!user || !user.qrTokenHash || !user.qrTokenCipher || !user.qrTokenExpiresAt) {
    return { token: null, payload: null, expiresAt: null };
  }
  if (user.qrTokenExpiresAt.getTime() <= Date.now()) {
    return { token: null, payload: null, expiresAt: null };
  }
  try {
    const token = decrypt(user.qrTokenCipher);
    if (hashToken(token) !== user.qrTokenHash) {
      return { token: null, payload: null, expiresAt: null };
    }
    return { token, payload: buildQrPayload(token), expiresAt: user.qrTokenExpiresAt };
  } catch {
    return { token: null, payload: null, expiresAt: null };
  }
}

export async function resolveQrToken(
  token: string
): Promise<{ doctorId: string; expiresAt: Date } | null> {
  if (!token || token.length < 32 || token.length > 128) return null;
  const hashed = hashToken(token);
  const user = await User.findOne({ qrTokenHash: hashed, role: 'doctor' });
  if (!user) return null;
  if (!user.qrTokenExpiresAt || user.qrTokenExpiresAt.getTime() <= Date.now()) return null;
  return { doctorId: String(user._id), expiresAt: user.qrTokenExpiresAt };
}