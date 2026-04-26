import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingScreen from './pages/LandingScreen';
import DashboardScreen from './pages/DashboardScreen';
import EntityDetailScreen from './pages/EntityDetailScreen';
import UploadScreen from './pages/UploadScreen';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingScreen />} />
      <Route path="/dashboard" element={<DashboardScreen />} />
      <Route path="/entity/:entityId" element={<EntityDetailScreen />} />
      <Route path="/upload" element={<UploadScreen />} />
    </Routes>
  );
};

export default App;
