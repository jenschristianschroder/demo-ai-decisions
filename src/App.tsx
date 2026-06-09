import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WelcomeScreen from './pages/WelcomeScreen';
import FeaturesScreen from './pages/FeaturesScreen';
import LandingScreen from './pages/LandingScreen';
import DashboardScreen from './pages/DashboardScreen';
import EntityDetailScreen from './pages/EntityDetailScreen';
import UploadScreen from './pages/UploadScreen';
import AdpLandingScreen from './pages/AdpLandingScreen';
import AdpDashboardScreen from './pages/AdpDashboardScreen';
import AdpAccountDetailScreen from './pages/AdpAccountDetailScreen';
import AdpCaptureScreen from './pages/AdpCaptureScreen';
import AdpNudgeCentreScreen from './pages/AdpNudgeCentreScreen';
import RndLandingScreen from './pages/RndLandingScreen';
import RndDashboardScreen from './pages/RndDashboardScreen';
import RndConceptDetailScreen from './pages/RndConceptDetailScreen';
import RndDecisionScreen from './pages/RndDecisionScreen';
import RfpLandingScreen from './pages/RfpLandingScreen';
import RfpDashboardScreen from './pages/RfpDashboardScreen';
import ContractLandingScreen from './pages/ContractLandingScreen';
import ContractDashboardScreen from './pages/ContractDashboardScreen';
import NdaLandingScreen from './pages/NdaLandingScreen';
import NdaDashboardScreen from './pages/NdaDashboardScreen';
import MusicLandingScreen from './pages/MusicLandingScreen';
import MusicDashboardScreen from './pages/MusicDashboardScreen';
import OnboardingLandingScreen from './pages/OnboardingLandingScreen';
import OnboardingQueueScreen from './pages/OnboardingQueueScreen';
import OnboardingCaseDetailScreen from './pages/OnboardingCaseDetailScreen';
import OnboardingPortfolioScreen from './pages/OnboardingPortfolioScreen';
import OnboardingClientPortalScreen from './pages/OnboardingClientPortalScreen';
import DoeLandingScreen from './pages/DoeLandingScreen';
import DoeDashboardScreen from './pages/DoeDashboardScreen';
import DoeExperimentScreen from './pages/DoeExperimentScreen';
import DoeUploadScreen from './pages/DoeUploadScreen';
import DoeDataScreen from './pages/DoeDataScreen';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/features" element={<FeaturesScreen />} />
      <Route path="/finance-anomaly-demo" element={<LandingScreen />} />
      <Route path="/dashboard" element={<DashboardScreen />} />
      <Route path="/entity/:entityId" element={<EntityDetailScreen />} />
      <Route path="/upload" element={<UploadScreen />} />
      <Route path="/adp" element={<AdpLandingScreen />} />
      <Route path="/adp/dashboard" element={<AdpDashboardScreen />} />
      <Route path="/adp/account/:accountId" element={<AdpAccountDetailScreen />} />
      <Route path="/adp/account/:accountId/capture" element={<AdpCaptureScreen />} />
      <Route path="/adp/nudges" element={<AdpNudgeCentreScreen />} />
      <Route path="/rnd" element={<RndLandingScreen />} />
      <Route path="/rnd/dashboard" element={<RndDashboardScreen />} />
      <Route path="/rnd/concept/:conceptId" element={<RndConceptDetailScreen />} />
      <Route path="/rnd/decision" element={<RndDecisionScreen />} />
      <Route path="/rfp" element={<RfpLandingScreen />} />
      <Route path="/rfp/dashboard" element={<RfpDashboardScreen />} />
      <Route path="/contract" element={<ContractLandingScreen />} />
      <Route path="/contract/dashboard" element={<ContractDashboardScreen />} />
      <Route path="/nda" element={<NdaLandingScreen />} />
      <Route path="/nda/dashboard" element={<NdaDashboardScreen />} />
      <Route path="/music" element={<MusicLandingScreen />} />
      <Route path="/music/dashboard" element={<MusicDashboardScreen />} />
      <Route path="/onboarding" element={<OnboardingLandingScreen />} />
      <Route path="/onboarding/queue" element={<OnboardingQueueScreen />} />
      <Route path="/onboarding/case/:caseId" element={<OnboardingCaseDetailScreen />} />
      <Route path="/onboarding/portfolio" element={<OnboardingPortfolioScreen />} />
      <Route path="/onboarding/portal" element={<OnboardingClientPortalScreen />} />
      <Route path="/doe" element={<DoeLandingScreen />} />
      <Route path="/doe/dashboard" element={<DoeDashboardScreen />} />
      <Route path="/doe/experiment/:id" element={<DoeExperimentScreen />} />
      <Route path="/doe/upload" element={<DoeUploadScreen />} />
      <Route path="/doe/data" element={<DoeDataScreen />} />
      <Route path="/doe/data/:id" element={<DoeDataScreen />} />
    </Routes>
  );
};

export default App;
