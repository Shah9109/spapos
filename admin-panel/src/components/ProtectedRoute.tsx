import { useEffect, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore, useCurrentUser } from '../lib/store';

export const ProtectedRoute = ({
  role,
  children,
}: {
  role: 'SUPER_ADMIN' | 'SPA_OWNER';
  children: ReactElement;
}) => {
  const currentUserId = useAppStore((state) => state.session.currentUserId);
  const logout = useAppStore((state) => state.logout);
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (currentUserId && !currentUser) {
      logout();
    }
  }, [currentUser, currentUserId, logout]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdminAuthorized = role === 'SUPER_ADMIN' && currentUser.role === 'SUPER_ADMIN';
  const isOwnerOrStaffAuthorized = role === 'SPA_OWNER' && ['SPA_OWNER', 'MANAGER', 'RECEPTIONIST', 'THERAPIST', 'ACCOUNTANT'].includes(currentUser.role);

  if (!isSuperAdminAuthorized && !isOwnerOrStaffAuthorized) {
    return <Navigate to={currentUser.role === 'SUPER_ADMIN' ? '/super-admin' : '/owner'} replace />;
  }

  return children;
};
