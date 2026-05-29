import React from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  Menu as MenuIcon,
  Settings,
  LogOut,
  Store,
} from "lucide-react";

export const AdminLayout: React.FC = () => {
  const { user, tenant, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { name: "Pedidos", path: "/admin", icon: LayoutDashboard },
    { name: "Cardápio", path: "/admin/menu", icon: MenuIcon },
    { name: "Configurações", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-slate-200 bg-white md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Store className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">Ordery HQ</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-orange-600" : "text-slate-500"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          {tenant?.slug && (
            <Link
              to={`/r/${tenant.slug}`}
              target="_blank"
              className="bg-white border border-slate-200 hover:border-orange-200 transition-colors w-full flex items-center justify-center rounded-lg py-2 text-xs font-bold text-slate-600 gap-2"
            >
              VER CARDÁPIO DA LOJA
            </Link>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-md">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">Ordey HQ</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
            <span className="text-[10px] font-bold text-slate-500">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-20 bg-white border-b border-slate-200 px-8 items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Painel de Controle</h1>
            <p className="text-slate-500 text-sm">
              Bem-vindo, {tenant?.name || user.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Conectado
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 border-2 border-white shadow-sm flex items-center justify-center font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav - Bottom */}
      <nav className="fixed bottom-0 z-50 flex w-full border-t bg-white pb-safe md:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-1 flex-col items-center justify-center py-3 text-xs font-medium ${
                isActive ? "text-orange-600" : "text-slate-500"
              }`}
            >
              <Icon className="mb-1 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
