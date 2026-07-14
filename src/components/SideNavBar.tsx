import React from 'react';
import { useApp } from '../context/AppContext';
import type { ViewType } from '../context/AppContext';

export const SideNavBar: React.FC = () => {
  const { activeView, navigate, logout, user, isMobileMenuOpen, setIsMobileMenuOpen } = useApp();

  // If the user is not an admin, they shouldn't see this bar
  if (user?.role !== 'admin') return null;

  const menuItems: { view: ViewType; label: string; icon: string }[] = [
    { view: 'admin-dashboard', label: 'Solicitudes e Inventario', icon: 'dashboard' },
    { view: 'catalog', label: 'Catálogo', icon: 'widgets' },
    { view: 'worker-search', label: 'Personal / Proveedores', icon: 'group' },
    { view: 'reports', label: 'Reportes Históricos', icon: 'analytics' }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        ></div>
      )}

      <aside className={`fixed flex flex-col left-0 top-0 h-full w-[260px] bg-primary text-on-primary py-stack-lg border-r border-outline-variant/20 z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
        {/* Header Profile info */}
        <div className="px-5 mb-6 flex flex-col gap-4">
          <div className="flex justify-center items-center py-2">
            <img src="/Logo Enaex Letra Blanca.png" alt="Enaex Logo" className="h-10 object-contain" />
          </div>
          <div className="flex items-center gap-3 border-t border-outline-variant/10 pt-4">
            <div className="w-8 h-8 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div>
              <h2 className="font-label-lg text-label-lg text-on-primary font-bold">Panel Administrativo</h2>
              <p className="text-[10px] text-on-primary-container uppercase font-bold tracking-wider">Control Operativo</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2 font-label-lg text-label-lg">
          {menuItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                className={`w-full text-left mx-2 my-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out font-medium ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-primary-container hover:bg-primary-container/50 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="mt-auto px-2 border-t border-outline-variant/20 pt-4 font-label-lg text-label-lg">
          <button
            onClick={() => logout()}
            className="w-full text-left mx-2 my-1 flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/20 transition-all duration-200 ease-in-out font-medium"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};
