import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./shared/pages/Home";
import Login from "./features/user/pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
