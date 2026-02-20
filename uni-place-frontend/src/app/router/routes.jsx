import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "../../shared/pages/Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
]);

export default router;
