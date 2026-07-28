'use client';

import { Stethoscope, Phone, Mail, Search, Plus } from '@/components/ui/LucideIcon';

export default function DoctorsPage() {
  const doctors = [
    { name: 'Dr. Michael Anderson', specialty: 'Cardiologist', phone: '+1 (555) 123-4567', email: 'michael.anderson@med.com', patients: 145, status: 'Available' },
    { name: 'Dr. Emily Thompson', specialty: 'Pediatrician', phone: '+1 (555) 234-5678', email: 'emily.thompson@med.com', patients: 98, status: 'Available' },
    { name: 'Dr. David Wilson', specialty: 'Neurologist', phone: '+1 (555) 345-6789', email: 'david.wilson@med.com', patients: 67, status: 'Busy' },
    { name: 'Dr. Sophia Martinez', specialty: 'Dermatologist', phone: '+1 (555) 456-7890', email: 'sophia.martinez@med.com', patients: 112, status: 'Available' },
    { name: 'Dr. James Carter', specialty: 'Orthopedist', phone: '+1 (555) 567-8901', email: 'james.carter@med.com', patients: 84, status: 'Offline' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctor referrals and consultations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search doctors..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-60" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" />Add Doctor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doc, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                {doc.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                <p className="text-xs text-gray-500">{doc.specialty}</p>
              </div>
              <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-semibold ${
                doc.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                doc.status === 'Busy' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>{doc.status}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-3.5 h-3.5" />
                <span>{doc.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{doc.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{doc.patients} patients</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
