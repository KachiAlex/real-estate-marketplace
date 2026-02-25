import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedVendorRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (!user || !(user.role === 'vendor' || (user.roles && user.roles.includes('vendor')))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
