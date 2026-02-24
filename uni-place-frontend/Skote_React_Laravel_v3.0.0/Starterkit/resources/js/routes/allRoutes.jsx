
// Authentication related pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";
import ResetPassword from "../pages/Authentication/ResetPassword";

import Dashboard from "../pages/Dashboard/index";

const authProtectedRoutes = [
  //Index Main
  {
    path: "/",
    exact: true,
    component: <Dashboard />,
  },
  { path: "/dashboard", component: <Dashboard /> },

];


const publicRoutes = [
  { path: "/login", component: <Login /> },
  { path: "/logout", component: <Logout /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },
  { path: "/reset-password/:token", component: <ResetPassword /> },
];

export { publicRoutes, authProtectedRoutes };
