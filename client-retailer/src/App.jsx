
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Migration from './pages/Migration';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import SmartSyncRetailer from './pages/SmartSyncRetailer';
import Layout from './components/Layout';
import CookieConsent from './components/CookieConsent';
import { useAuth, AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import SmartSyncDashboard from './pages/SmartSyncDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute: user', user, 'loading', loading);

  if (loading) return <div>Loading...</div>;
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" />;
  }
  if (user.role !== 'RETAILER') {
    console.log('ProtectedRoute: Role mismatch', user.role, 'redirecting');
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="billing" element={<Billing />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} /> {/* Added route */}
          <Route path="reports" element={<div className="text-gray-600">Reports (Coming Soon)</div>} />
          <Route path="settings" element={<Settings />} />
          <Route path="integration" element={<SmartSyncRetailer />} />
          <Route path="smartsync" element={<SmartSyncDashboard />} />
        </Route>
      </Routes>
      <CookieConsent />
    </AuthProvider>
  );
}

export default App;
