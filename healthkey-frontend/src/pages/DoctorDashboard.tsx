import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { recordsAPI, prescriptionsAPI, vitalsAPI, accessAPI } from '../lib/api';
import { MedicalRecord, Prescription, Vital, AccessRequest } from '../types';
import { FileText, Upload, Users, Clock, CheckCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'records' | 'prescriptions' | 'vitals'>('overview');
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accessRes] = await Promise.all([
        accessAPI.getDoctorRequests()
      ]);
      setAccessRequests(accessRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchPatient = async () => {
    if (!searchId) return;
    try {
      const [recordsRes, prescriptionsRes, vitalsRes] = await Promise.all([
        recordsAPI.getPatientRecords(searchId),
        prescriptionsAPI.getPatientPrescriptions(searchId),
        vitalsAPI.getPatientVitals(searchId)
      ]);
      setRecords(recordsRes.data);
      setPrescriptions(prescriptionsRes.data);
      setVitals(vitalsRes.data);
      setActiveTab('records');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Doctor Dashboard</h1>
        <p className="text-zinc-400">{user?.name} | {user?.specialization} | {user?.hospital}</p>
      </div>

      {/* Search */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-8">
        <h3 className="text-lg font-semibold mb-4">Access Patient Records</h3>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              placeholder="Enter Patient ID"
            />
          </div>
          <button
            onClick={searchPatient}
            className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-zinc-200 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-zinc-800">
        {['overview', 'patients', 'prescriptions', 'vitals'].map(tab => (
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

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <Users className="w-8 h-8 text-blue-400 mb-4" />
            <p className="text-3xl font-bold">{accessRequests.filter(r => r.status === 'approved').length}</p>
            <p className="text-zinc-400 text-sm">Authorized Patients</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <FileText className="w-8 h-8 text-emerald-400 mb-4" />
            <p className="text-3xl font-bold">{prescriptions.length}</p>
            <p className="text-zinc-400 text-sm">Prescriptions Written</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <Clock className="w-8 h-8 text-orange-400 mb-4" />
            <p className="text-3xl font-bold">{accessRequests.filter(r => r.status === 'pending').length}</p>
            <p className="text-zinc-400 text-sm">Pending Requests</p>
          </div>
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Access Requests</h3>
          {accessRequests.length === 0 ? (
            <p className="text-zinc-400">No access requests yet</p>
          ) : (
            accessRequests.map(request => (
              <div key={request._id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Patient #{request.patientId.toString().slice(-6)}</h4>
                  <p className="text-sm text-zinc-400">{format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  request.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  request.status === 'denied' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {request.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Patient Records</h3>
          {records.length === 0 ? (
            <p className="text-zinc-400">Search for a patient to view their records</p>
          ) : (
            records.map(record => (
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
            ))
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Prescriptions</h3>
            <label className="bg-emerald-600 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-emerald-700 transition flex items-center gap-2">
              <Upload className="w-4 h-4" /> New Prescription
              <input type="file" className="hidden" />
            </label>
          </div>
          {prescriptions.length === 0 ? (
            <p className="text-zinc-400">No prescriptions yet</p>
          ) : (
            prescriptions.map(prescription => (
              <div key={prescription._id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h4 className="font-semibold text-lg">{prescription.diagnosis}</h4>
                <p className="text-sm text-zinc-400 mb-4">{format(new Date(prescription.createdAt), 'MMM dd, yyyy')}</p>
                <div className="space-y-2">
                  {prescription.medicines.map((med, i) => (
                    <div key={i} className="bg-zinc-800 rounded-xl p-4">
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-zinc-400">{med.dosage} - {med.frequency} - {med.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Patient Vitals</h3>
          {vitals.length === 0 ? (
            <p className="text-zinc-400">Search for a patient to view their vitals</p>
          ) : (
            vitals.map(vital => (
              <div key={vital._id} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 grid grid-cols-2 md:grid-cols-5 gap-4">
                {vital.heartRate && <div><p className="text-xs text-zinc-400">Heart Rate</p><p className="font-semibold">{vital.heartRate} BPM</p></div>}
                {vital.spo2 && <div><p className="text-xs text-zinc-400">SpO2</p><p className="font-semibold">{vital.spo2}%</p></div>}
                {vital.temperature && <div><p className="text-xs text-zinc-400">Temperature</p><p className="font-semibold">{vital.temperature}°C</p></div>}
                {vital.bloodPressure && <div><p className="text-xs text-zinc-400">Blood Pressure</p><p className="font-semibold">{vital.bloodPressure}</p></div>}
                <div><p className="text-xs text-zinc-400">Recorded</p><p className="font-semibold">{format(new Date(vital.createdAt), 'MMM dd HH:mm')}</p></div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
