import { Outlet, useLocation } from "react-router-dom";
import SiteHeader from "../pages/site/components/SiteHeader";
import SiteFooter from "../pages/site/components/SiteFooter";

export default function SiteLayout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {/* 관리자센터에서는 Header 제거 */}
      {!isAdminPage && <SiteHeader />}

      <main className="flex-1">
        <Outlet />
      </main>

      {/* 관리자센터에서는 Footer도 제거 */}
      {!isAdminPage && <SiteFooter />}
    </div>
  );
}
