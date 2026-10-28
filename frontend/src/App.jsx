import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { QuickRoleSwitcher } from './components/QuickRoleSwitcher';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ResidentDashboard } from './pages/ResidentDashboard';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'ROLE_PROVIDER') {
    return <Navigate to="/provider" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#1E2622] font-sans selection:bg-[#E6EEEA] selection:text-[#2F5D50]">
          {/* Calm Role Switcher Bar */}
          <QuickRoleSwitcher />

          {/* Global Header */}
          <Header />

          {/* Main App Content - Centered 1120px Column */}
          <main className="grow">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_RESIDENT']}>
                    <ResidentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/provider"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_PROVIDER']}>
                    <ProviderDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </main>

          {/* Minimal Calm Footer */}
          <footer className="bg-[#F7F6F2] border-t border-[#E8E6E0] py-6 text-center text-[12px] text-[#5C6862]">
            <div className="max-w-[1120px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1E2622]">CampusServe</span>
                <span>· Closed-community services marketplace</span>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[#5C6862]">
                <span>Shantiniketan Heights & Campus Residency</span>
                <span>Passcode: CAMPUS2026</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
