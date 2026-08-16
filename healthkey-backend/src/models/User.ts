import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserDocument } from '../types/documents.js';

const userSchema = new Schema<UserDocument>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['patient', 'doctor'], required: true },
  phone: String,
  specialization: String,
  hospital: String,
  address: String,
  avatar: String,
  qrTokenHash: String,
  qrTokenCipher: String,
  qrTokenExpiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.password;
    delete ret.qrTokenHash;
    delete ret.qrTokenCipher;
    delete ret.qrTokenExpiresAt;
    return ret;
  }
});

export default mongoose.model<UserDocument>('User', userSchema);