import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['patient', 'doctor']),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  hospital: z.string().optional(),
  address: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const generateToken = (id: string) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET || 'healthkey_secret', {
    expiresIn: '30d'
  });
};

router.post('/register', async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create(validated);
    const token = generateToken(user._id.toString());
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid input' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user._id.toString());
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, specialization: user.specialization, hospital: user.hospital } });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Invalid input' });
  }
});

router.get('/me', async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
