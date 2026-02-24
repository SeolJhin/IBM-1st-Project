import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireRole({ allow = [], role, children }) {
  // role은 AuthProvider/토큰 파싱 등으로 주입받는 걸 전제로 함
  if (allow.length && !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
