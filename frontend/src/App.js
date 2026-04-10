import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import OrgRegister from './pages/OrgRegister';
import DriverRegister from './pages/DriverRegister';
import Login from './pages/Login';
import OrgLogin from './pages/OrgLogin';
import DriverLogin from './pages/DriverLogin';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import Pricing from './pages/Pricing';
import Tracking from './pages/Tracking';
import Trust from './pages/Trust';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Marketplace from './pages/Marketplace';
import DriverTrips from './pages/DriverTrips';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/organization" element={<OrgRegister />} />
      <Route path="/register/driver" element={<DriverRegister />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/organization" element={<OrgLogin />} />
      <Route path="/login/driver" element={<DriverLogin />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/tracking" element={<Tracking />} />
      <Route path="/trust" element={<Trust />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:userId/:token" element={<ResetPassword />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/shipments" element={<PrivateRoute><Shipments /></PrivateRoute>} />
      <Route path="/marketplace" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
      <Route path="/driver-trips" element={<PrivateRoute><DriverTrips /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
