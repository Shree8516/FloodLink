// [Person 1 – auth] Guards a page: not logged in → go to /login; wrong role → go to the home map.
// Used in App.jsx around every page except Login and Register.
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ roles, children }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  // The backends check roles too; this only hides pages the user can't use
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
