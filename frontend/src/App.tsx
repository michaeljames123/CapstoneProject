import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Navbar from './components/Navbar';
import SidebarRoot from './components/SidebarRoot';
import AuthedLayout from './components/AuthedLayout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Analyze from './pages/Analyze';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import FieldEstimationLeaflet from './pages/FieldEstimationLeaflet';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <SidebarRoot />
            <main>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AuthedLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analyze" element={<Analyze />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/field-estimation" element={<FieldEstimationLeaflet />} />
              </Route>
              </Routes>
            </main>
          </div>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
