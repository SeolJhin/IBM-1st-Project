import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../features/user/hooks/useAuth';

function normalizeRole(user) {
  const raw =
    user?.userRole ??
    user?.role ??
    user?.userRl ??
    user?.user_role ??
    user?.authority ??
    user?.authorities?.[0];

  return String(raw ?? '').toLowerCase();
}

export default function RequireRole({ allow = [] }) {
  const { user, loading } = useAuth();

  if (loading)
    return <div style={{ padding: 24, fontWeight: 700 }}>로딩중...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(user);
  const ok = allow.map((r) => String(r).toLowerCase()).includes(role);

  if (!ok) return <Navigate to="/" replace />;

  return <Outlet />;
}
