import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const SideNavBar: React.FC = () => {
  const { activeView, navigate, logout, user, isMobileMenuOpen, setIsMobileMenuOpen, reportsTab, setReportsTab, setAlert, currentUserInfo } = useApp();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // If the user is not an admin, they shouldn't see this bar
  if (user?.role !== 'admin') return null;

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      setAlert('Modo oscuro activado', 'success', 1500);
    } else {
      document.documentElement.classList.remove('dark');
      setAlert('Modo claro activado', 'success', 1500);
    }
  };

  const isDashboardActive = activeView === 'reports' && reportsTab === 'dashboard';
  const isLogsActive = activeView === 'reports' && reportsTab === 'logs';

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        ></div>
      )}

      <aside className={`fixed flex flex-col left-0 top-0 h-full w-[260px] bg-primary text-on-primary py-4 border-r border-outline-variant/20 z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden shadow-xl select-none`}>
        {/* Header Profile info */}
        <div className="px-5 mb-4 flex flex-col gap-2.5">
          <div className="flex justify-center items-center py-1">
            <img src="/Logo Enaex Letra Blanca.png" alt="Enaex Logo" className="h-9 object-contain" />
          </div>
          <div className="text-center bg-white/5 border border-white/10 rounded-lg p-2.5">
            <p className="text-xs font-extrabold text-white tracking-wider uppercase">Enaex Servicios S.A.</p>
            <p className="text-[11px] text-white/70 font-mono font-medium mt-0.5">RUT: 76.041.871-4</p>
            <p className="text-[10px] text-red-400 font-bold mt-1 tracking-tight">Enaex Planta Sierra Gorda</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 font-label-md text-sm">
          {/* 1. Dashboard */}
          <button
            onClick={() => {
              setReportsTab('dashboard');
              navigate('reports', null, 'dashboard');
            }}
            className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
              isDashboardActive
                ? 'bg-[#ea000c] text-white shadow-md shadow-red-900/30 font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
            Dashboard
          </button>

          {/* 2. Solicitudes e Inventario */}
          <button
            onClick={() => navigate('admin-dashboard')}
            className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
              activeView === 'admin-dashboard'
                ? 'bg-[#ea000c] text-white shadow-md shadow-red-900/30 font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            Solicitudes e Inventario
          </button>

          {/* 3. Catálogo */}
          <button
            onClick={() => navigate('catalog')}
            className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
              activeView === 'catalog'
                ? 'bg-[#ea000c] text-white shadow-md shadow-red-900/30 font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">widgets</span>
            Catálogo
          </button>

          {/* 4. Personal / Proveedores */}
          <button
            onClick={() => navigate('worker-search')}
            className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
              activeView === 'worker-search'
                ? 'bg-[#ea000c] text-white shadow-md shadow-red-900/30 font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            Personal / Proveedores
          </button>

          {/* 5. Reportes Históricos */}
          <button
            onClick={() => {
              setReportsTab('logs');
              navigate('reports', null, 'logs');
            }}
            className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
              isLogsActive
                ? 'bg-[#ea000c] text-white shadow-md shadow-red-900/30 font-bold'
                : 'text-white/80 hover:bg-white/10 hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            Reportes Históricos
          </button>

          {/* Subheader: CONFIGURACIÓN */}
          <div className="pt-4 pb-1 px-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">
              Configuración
            </span>
          </div>

          {/* 6. Usuarios */}
          <button
            onClick={() => navigate('worker-search')}
            className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 font-semibold text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
            Usuarios
          </button>
        </nav>

        {/* Footer Navigation: User Info + Dark Mode + Logout */}
        <div className="mt-auto px-4 pt-3 border-t border-white/10 flex flex-col gap-3">
          {/* User Profile Pill */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
            <div className="w-9 h-9 rounded-full bg-[#ea000c] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white/20 shrink-0">
              {currentUserInfo.initials}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-white truncate">{currentUserInfo.fullName}</p>
              <p className="text-[10px] text-white/60 truncate font-medium">{currentUserInfo.role}</p>
            </div>
          </div>

          {/* Dark Mode Toggle Switch */}
          <div className="flex items-center justify-between px-2 py-1 text-white/80">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="text-xs font-medium">Modo oscuro</span>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                isDarkMode ? 'bg-[#ea000c]' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isDarkMode ? 'transform translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="w-full text-left flex items-center gap-3 px-3.5 py-2 rounded-lg text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all duration-200 font-semibold text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};
