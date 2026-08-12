# HealthKey Backend

MERN Stack TypeScript Backend for HealthKey Healthcare Platform

## Tech Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Auth**: JWT + bcrypt
- **Validation**: Zod

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/healthkey
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Records
- `POST /api/records/upload` - Upload medical record (auth)
- `GET /api/records/my` - Get my records (auth)
- `GET /api/records/patient/:id` - Get patient records (auth)

### Prescriptions
- `POST /api/prescriptions/create` - Create prescription (doctor)
- `GET /api/prescriptions/my` - Get my prescriptions (patient)
- `GET /api/prescriptions/patient/:id` - Get patient prescriptions (doctor)

### Vitals
- `POST /api/vitals/ingest` - Ingest vital data (patient)
- `GET /api/vitals/my` - Get my vitals (patient)
- `GET /api/vitals/patient/:id` - Get patient vitals (doctor)

### Access Control
- `POST /api/access/request` - Request access to patient (patient)
- `GET /api/access/my` - Get my access requests (patient)
- `GET /api/access/doctor` - Get requests for doctor (doctor)
- `PATCH /api/access/:id/approve` - Approve request (patient)
- `PATCH /api/access/:id/deny` - Deny request (patient)

### Blockchain
- `POST /api/blockchain/record/:id` - Verify record on blockchain
- `GET /api/blockchain/verify/:txId` - Verify transaction

## Project Structure

```
src/
├── models/          # Mongoose models
│   ├── User.ts
│   ├── MedicalRecord.ts
│   ├── Prescription.ts
│   ├── Vital.ts
│   └── AccessRequest.ts
├── routes/          # Express routes
│   ├── auth.ts
│   ├── records.ts
│   ├── prescriptions.ts
│   ├── vitals.ts
│   ├── access.ts
│   └── blockchain.ts
├── middleware/       # Express middleware
│   └── auth.ts
├── types/           # TypeScript interfaces
│   └── index.ts
└── server.ts        # Entry point
```
