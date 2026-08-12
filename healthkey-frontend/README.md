# HealthKey Frontend

React + TypeScript + Tailwind CSS Frontend for HealthKey Healthcare Platform

## Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: React Context API

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

## Features

### Landing Page
- Modern hero section
- Feature highlights (Blockchain, Cloud, AI, IoT)
- How it Works section
- CTA buttons for patients and doctors

### Authentication
- Patient/Doctor registration
- Login with email/password
- Protected routes

### Patient Dashboard
- **Overview**: Stats cards, latest vitals, trend charts
- **Records**: View and upload medical records
- **Prescriptions**: View prescriptions with AI summaries
- **Vitals**: Real-time vital signs history
- **Access**: Manage doctor access requests

### Doctor Dashboard
- **Overview**: Stats and pending requests
- **Patients**: View access requests
- **Records**: Search and view patient records
- **Prescriptions**: Create and manage prescriptions
- **Vitals**: Monitor patient vital signs

## Project Structure

```
src/
├── components/      # Reusable components
│   └── Layout.tsx
├── pages/           # Page components
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── DoctorLogin.tsx
│   ├── PatientDashboard.tsx
│   └── DoctorDashboard.tsx
├── context/         # React context
│   └── AuthContext.tsx
├── lib/             # API client
│   └── api.ts
├── types/           # TypeScript interfaces
│   └── index.ts
├── App.tsx          # Routes configuration
├── main.tsx         # Entry point
└── index.css        # Global styles
```
