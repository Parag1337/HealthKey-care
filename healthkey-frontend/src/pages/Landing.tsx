import { Link } from 'react-router-dom';
import { Shield, Cloud, Cpu, Smartphone, ArrowRight } from 'lucide-react';

const features = [
  { icon: Shield, title: "Blockchain Security", desc: "Immutable records with cryptographic verification" },
  { icon: Cloud, title: "Cloud Storage", desc: "HIPAA compliant secure cloud infrastructure" },
  { icon: Cpu, title: "AI Insights", desc: "Smart health analysis and risk detection" },
  { icon: Smartphone, title: "IoT Wearables", desc: "Real-time vital signs monitoring" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Your Medical Records.<br />Owned by You.
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-zinc-400 mb-10">
            Blockchain-powered, patient-first healthcare platform with AI and IoT integration.
            Secure, smart, and seamless medical data sharing.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition inline-flex items-center gap-2">
              Start as Patient <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/doctor-login" className="px-8 py-4 border border-white/30 hover:border-white/70 font-semibold rounded-2xl transition">
              Access as Doctor
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 hover:border-emerald-500/50 transition">
                <f.icon className="w-10 h-10 mb-6 text-emerald-500" />
                <h3 className="font-semibold mb-2 text-lg">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-20 px-6 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Register Securely", desc: "Create your account as a patient or doctor with end-to-end encryption" },
              { step: "02", title: "Share with Consent", desc: "Patients grant temporary access via QR code or consent requests" },
              { step: "03", title: "Access Records", desc: "Doctors view records, upload prescriptions, and access real-time vitals" }
            ].map((item, i) => (
              <div key={i} className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 text-center">
                <div className="text-5xl font-bold text-emerald-500/30 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
