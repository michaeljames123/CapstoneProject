import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthedLayout: React.FC = () => {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthedLayout;
