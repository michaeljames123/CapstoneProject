import React from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

const SidebarRoot: React.FC = () => {
  const { open, closeSidebar } = useSidebar();
  return (
    <>
      <Sidebar open={open} onClose={closeSidebar} />
      {open && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 z-30 bg-black/40"
          onClick={closeSidebar}
        />
      )}
    </>
  );
};

export default SidebarRoot;
