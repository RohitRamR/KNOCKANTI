import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Retailers from './pages/Retailers';
import DeliveryPartners from './pages/DeliveryPartners';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SmartSyncControlCenter from './pages/SmartSyncControlCenter';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import CookieConsent from './components/CookieConsent';
import { useAuth, AuthProvider } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'ADMIN') return <Navigate to="/login" />; // Strict Role Check

  return children;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="users" element={<div className="p-8">Users Management (Coming Soon)</div>} />
          <Route path="customers" element={<Customers />} />
          <Route path="retailers" element={<Retailers />} />
          <Route path="delivery" element={<DeliveryPartners />} />
          <Route path="smartsync" element={<SmartSyncControlCenter />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <CookieConsent />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
