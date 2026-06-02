import React, { useState } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  LogOut,
  Store,
  PlusCircle,
  Sun,
  Moon,
  AlignJustify,
  X,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export const SuperAdminLayout: React.FC = () => {
  const { user, isSuperAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const { isDark, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <span className="text-faint text-sm">Carregando...</span>
      </div>
    );
  if (!user)
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  const navItems = [
    { name: "Restaurantes", path: "/superadmin", icon: LayoutDashboard },
    { name: "Novo Restaurante", path: "/superadmin/new", icon: PlusCircle },
  ];

  const closeDrawer = () => setDrawerOpen(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-accent/12 text-accent"
                : "text-muted hover:bg-elevated hover:text-content"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "text-accent" : "text-faint"}`} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  const SidebarBottom = ({ onClick }: { onClick?: () => void }) => (
    <div className="p-4 border-t border-line space-y-2">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-muted hover:bg-elevated transition-colors"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {isDark ? "Modo claro" : "Modo escuro"}
      </button>
      <button
        onClick={() => { logout(); onClick?.(); }}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold text-warn hover:bg-warn/12 transition-colors"
      >
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </div>
  );

  return (
    <div className={`flex h-screen bg-bg font-sans text-content overflow-hidden${!isDark ? " light" : ""}`}>

      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-line bg-surface md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-content">Ordery HQ</span>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
              Super Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavLinks />
        </nav>

        <SidebarBottom />
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-line flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-content">Ordery HQ</span>
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">
                Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-faint hover:text-content hover:bg-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          <NavLinks onClick={closeDrawer} />
        </nav>

        <SidebarBottom onClick={closeDrawer} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-content hover:bg-elevated transition-colors"
          >
            <AlignJustify className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-content">Ordery HQ</span>
          </div>

          <div className="w-9 h-9 rounded-full bg-orange-500/12 border border-line flex items-center justify-center">
            <span className="text-[10px] font-bold text-orange-500">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-20 bg-surface border-b border-line px-8 items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-content">Painel Master</h1>
            <p className="text-muted text-sm">{user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 border border-line rounded-full text-sm font-medium text-muted">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              Conectado
            </div>
            <button
              onClick={toggle}
              title={isDark ? "Modo claro" : "Modo escuro"}
              className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-muted hover:text-content hover:bg-elevated transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-orange-500/12 text-orange-500 border border-line flex items-center justify-center font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
