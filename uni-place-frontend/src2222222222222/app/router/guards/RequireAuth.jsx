import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { tokenStore } from "../../http/tokenStore";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const access = tokenStore.getAccess();
  if (!access) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
