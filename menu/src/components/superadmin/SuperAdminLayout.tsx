import React from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LayoutDashboard, LogOut, Store } from "lucide-react";

export const SuperAdminLayout: React.FC = () => {
  const { user, isSuperAdmin, loading, logout } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        Carregando...
      </div>
    );
  if (!user)
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      <aside className="hidden w-64 border-r border-slate-200 bg-white md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight">Ordey HQ</span>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
              Super Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <Link
            to="/superadmin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              location.pathname === "/superadmin"
                ? "bg-orange-50 text-orange-600"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Restaurantes
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-20 bg-white border-b border-slate-200 px-8 items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Painel Master</h1>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Conectado
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
