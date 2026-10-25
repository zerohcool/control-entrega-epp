import React from 'react';
import { useApp } from '../context/AppContext';

interface CorporateHeaderProps {
  children?: React.ReactNode;
}

export const CorporateHeader: React.FC<CorporateHeaderProps> = ({ children }) => {
  const { navigate, currentUserInfo, pendingDeliveriesCount, activeView, cart, setIsCartOpen, user, logout } = useApp();
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isAdmin = user?.role === 'admin';

  return (
    <header className="relative bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 print:border-b-2 print:border-primary/20 print:border-t-0 print:border-x-0 print:rounded-none print:p-0 print:pb-4 print:shadow-none w-full shrink-0">
      
      {/* Left: Enaex Corporate Brand Details */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <img src="/logo.png" alt="Enaex Servicios S.A." className="h-11 sm:h-12 object-contain shrink-0" />
        <div className="border-l border-slate-300 pl-4">
          <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
            ENAEX SERVICIOS S.A.
          </h1>
          <p className="text-xs font-mono font-bold text-slate-700 tracking-wide">
            RUT: 76.041.871-4
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
            <span className="font-bold text-[#ea000c]">Planta:</span> Enaex Planta Sierra Gorda
          </p>
        </div>
      </div>

      {/* Right: Master Controls + Cart + (Admin Bell / Worker Navigation) + User Avatar */}
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto relative print:hidden">
        {children}

        {/* Cart Icon in Catalog or if items in cart */}
        {(activeView === 'catalog' || totalCartItems > 0) && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title={`Ver Carrito de Solicitudes (${totalCartItems} productos)`}
            aria-label="Ver carrito"
          >
            <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
            {totalCartItems > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#ea000c] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                {totalCartItems}
              </span>
            )}
          </button>
        )}

        {/* ADMIN ONLY: Notification Bell with Real Pending Authorizations Badge & Direct Navigation */}
        {isAdmin && (
          <button 
            onClick={() => navigate('admin-dashboard')}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title={`Ver autorizaciones pendientes (${pendingDeliveriesCount})`}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {pendingDeliveriesCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#ea000c] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                {pendingDeliveriesCount}
              </span>
            )}
          </button>
        )}

        {/* WORKER ONLY: Quick Return to Profile & Logout */}
        {!isAdmin && user && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('worker-profile', user.workerId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Volver a mi Ficha de Colaborador"
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span className="hidden sm:inline">Mi Ficha</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}

        {/* User Avatar Circle */}
        <div 
          onClick={() => {
            if (isAdmin) {
              navigate('admin-dashboard');
            } else if (user?.workerId) {
              navigate('worker-profile', user.workerId);
            }
          }}
          className="relative cursor-pointer" 
          title={`${currentUserInfo.fullName} (${currentUserInfo.role})`}
        >
          <div className="w-9 h-9 rounded-full bg-[#ea000c] text-white flex items-center justify-center font-bold text-xs shadow-2xs ring-2 ring-slate-100 select-none">
            {currentUserInfo.initials}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
        </div>
      </div>

    </header>
  );
};
