import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { recordsAPI, prescriptionsAPI, vitalsAPI, accessAPI } from '../lib/api';
import { MedicalRecord, Prescription, Vital, AccessRequest } from '../types';
import {
  FileText, Upload, Activity, Shield, CheckCircle,
  Heart, Thermometer, Droplets, Wind, Stethoscope
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'prescriptions' | 'vitals' | 'access'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, prescriptionsRes, vitalsRes, accessRes] = await Promise.all([
        recordsAPI.getMyRecords(),
        prescriptionsAPI.getMyPrescriptions(),
        vitalsAPI.getMyVitals(),
        accessAPI.getMyRequests()
      ]);
      setRecords(recordsRes.data);
      setPrescriptions(prescriptionsRes.data);
      setVitals(vitalsRes.data);
      setAccessRequests(accessRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-400">Loading your health data...</div>
      </div>
    );
  }

  const latestVital = vitals[0];
  const chartData = [...vitals].reverse().slice(0, 10).map(v => ({
    time: format(new Date(v.createdAt), 'MMM dd HH:mm'),
    heartRate: v.heartRate,
    spo2: v.spo2,
    temperature: v.temperature
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}</h1>
        <p className="text-zinc-400">Here's your health overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
            <span className="text-3xl font-bold">{records.length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Medical Records</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <Stethoscope className="w-8 h-8 text-emerald-400" />
            <span className="text-3xl font-bold">{prescriptions.length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Prescriptions</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-red-400" />
            <span className="text-3xl font-bold">{vitals.length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Vital Readings</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-purple-400" />
            <span className="text-3xl font-bold">{accessRequests.filter(r => r.status === 'approved').length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Active Access</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-zinc-800">
        {['overview', 'records', 'prescriptions', 'vitals', 'access'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 text-sm font-medium capitalize transition ${
              activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Latest Vitals */}
          {latestVital && (
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-xl font-semibold mb-6">Latest Vitals</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {latestVital.heartRate && (
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{latestVital.heartRate}</p>
                    <p className="text-xs text-zinc-400">BPM</p>
                  </div>
                )}
                {latestVital.spo2 && (
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <Wind className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{latestVital.spo2}%</p>
                    <p className="text-xs text-zinc-400">SpO2</p>
                  </div>
                )}
                {latestVital.temperature && (
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <Thermometer className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{latestVital.temperature}°</p>
                    <p className="text-xs text-zinc-400">Temp</p>
                  </div>
                )}
                {latestVital.bloodPressure && (
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{latestVital.bloodPressure}</p>
                    <p className="text-xs text-zinc-400">BP</p>
                  </div>
                )}
                {latestVital.glucose && (
                  <div className="bg-zinc-800 rounded-xl p-4 text-center">
                    <Droplets className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{latestVital.glucose}</p>
                    <p className="text-xs text-zinc-400">Glucose</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-xl font-semibold mb-6">Vitals Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                  />
                  <Line type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Your Medical Records</h3>
            <label className="bg-emerald-600 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-emerald-700 transition flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload
              <input type="file" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) {
                  const formData = new FormData();
                  formData.append('file', e.target.files[0]);
                  recordsAPI.upload(formData).then(() => fetchData());
                }
              }} />
            </label>
          </div>
          {records.map(record => (
            <div key={record._id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{record.title}</h4>
                <p className="text-sm text-zinc-400 capitalize">{record.type.replace('_', ' ')}</p>
                {record.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 mt-2">
                    <CheckCircle className="w-3 h-3" /> Blockchain Verified
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">{format(new Date(record.createdAt), 'MMM dd, yyyy')}</p>
                <a href={`http://localhost:5000/${record.fileUrl}`} target="_blank" className="text-emerald-400 text-sm hover:underline">View</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Prescriptions</h3>
          {prescriptions.map(prescription => (
            <div key={prescription._id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{prescription.diagnosis}</h4>
                  <p className="text-sm text-zinc-400">{format(new Date(prescription.createdAt), 'MMM dd, yyyy')}</p>
                </div>
                {prescription.blockchainTxId && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {prescription.medicines.map((med, i) => (
                  <div key={i} className="bg-zinc-800 rounded-xl p-4">
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-zinc-400">{med.dosage} - {med.frequency} - {med.duration}</p>
                  </div>
                ))}
              </div>
              {prescription.aiSummary && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-sm text-blue-400"><strong>AI Summary:</strong> {prescription.aiSummary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Vital Signs History</h3>
          {vitals.map(vital => (
            <div key={vital._id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 grid grid-cols-2 md:grid-cols-5 gap-4">
              {vital.heartRate && <div><p className="text-xs text-zinc-400">Heart Rate</p><p className="font-semibold">{vital.heartRate} BPM</p></div>}
              {vital.spo2 && <div><p className="text-xs text-zinc-400">SpO2</p><p className="font-semibold">{vital.spo2}%</p></div>}
              {vital.temperature && <div><p className="text-xs text-zinc-400">Temperature</p><p className="font-semibold">{vital.temperature}°C</p></div>}
              {vital.bloodPressure && <div><p className="text-xs text-zinc-400">Blood Pressure</p><p className="font-semibold">{vital.bloodPressure}</p></div>}
              <div><p className="text-xs text-zinc-400">Recorded</p><p className="font-semibold">{format(new Date(vital.createdAt), 'MMM dd HH:mm')}</p></div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'access' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Access Requests</h3>
          {accessRequests.map(request => (
            <div key={request._id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex justify-between items-center">
              <div>
                <h4 className="font-semibold">Doctor #{request.doctorId.toString().slice(-6)}</h4>
                <p className="text-sm text-zinc-400">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                request.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                request.status === 'denied' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {request.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
