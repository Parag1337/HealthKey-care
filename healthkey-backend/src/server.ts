import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import recordRoutes from './routes/records.js';
import prescriptionRoutes from './routes/prescriptions.js';
import vitalRoutes from './routes/vitals.js';
import accessRoutes from './routes/access.js';
import blockchainRoutes from './routes/blockchain.js';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/blockchain', blockchainRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthkey')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
