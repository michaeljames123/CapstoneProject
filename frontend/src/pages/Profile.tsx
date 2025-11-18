import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-50">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-700 mt-2">Your account information</p>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full hero-shape animate-drift" />
      </div>

      <div className="card">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Username</label>
            <div className="input-field bg-gray-50">{user?.username ?? '—'}</div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <div className="input-field bg-gray-50">{user?.email ?? '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
