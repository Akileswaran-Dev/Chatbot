import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';


export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-teal-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-450"></div>
      </div>
    );
  }

  // If no auth token is available, redirect to login page.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
