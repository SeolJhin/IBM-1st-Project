import { Outlet } from "react-router-dom";
import AdminSidebar from "../admin/AdminSidebar";
import AdminTopbar from "../admin/AdminTopbar";

export default function AdminLayout() {
  return (
    <div className="min-h-dvh bg-[var(--color-surface-2)]">
      <div className="flex min-h-dvh">
        <AdminSidebar />
        <div className="flex-1">
          <AdminTopbar />
          <div className="mx-auto max-w-7xl px-6 py-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
