import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Web3Provider } from "./context/Web3Context";
import { ThemeProvider } from "./context/ThemeContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CouponsPage from "./pages/CouponsPage";
import CouponDetailsPage from "./pages/CouponDetailsPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import WalletPage from "./pages/WalletPage";
import CashbackHistoryPage from "./pages/CashbackHistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their appropriate dashboard
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "merchant") return <Navigate to="/merchant" replace />;
    return <Navigate to="/customer" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col mesh-background">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/coupons" element={<CouponsPage />} />
                  <Route path="/coupons/:id" element={<CouponDetailsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Customer Portal */}
                  <Route
                    path="/customer"
                    element={
                      <ProtectedRoute allowedRoles={["customer"]}>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wallet"
                    element={
                      <ProtectedRoute allowedRoles={["customer"]}>
                        <WalletPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cashback-history"
                    element={
                      <ProtectedRoute allowedRoles={["customer"]}>
                        <CashbackHistoryPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Merchant Portal */}
                  <Route
                    path="/merchant/*"
                    element={
                      <ProtectedRoute allowedRoles={["merchant", "admin"]}>
                        <MerchantDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Portal */}
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Shared Profile */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
