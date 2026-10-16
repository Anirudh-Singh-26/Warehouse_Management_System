import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({
  user,
  authChecking,
  allowedRoles,
  children,
}) {
  const location = useLocation();

  // Wait until the authentication check finishes.
  if (authChecking) {
    return (
      <div className="loading-screen">
        <p>Opening warehouse workspace…</p>
      </div>
    );
  }

  // Redirect unauthenticated users to login.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Restrict access when a route defines allowed roles.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
