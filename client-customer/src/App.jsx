import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import Register from './pages/Register';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderSuccess from './pages/OrderSuccess';
import Settings from './pages/Settings';
import ProductDetails from './pages/ProductDetails';
import CookieConsent from './components/CookieConsent';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="cart" element={<Cart />} />
              <Route path="orders" element={<Orders />} />
              <Route path="order-success" element={<OrderSuccess />} />
              <Route path="settings" element={<Settings />} />
              <Route path="product/:id" element={<ProductDetails />} />
            </Route>
          </Routes>
          <CookieConsent />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
