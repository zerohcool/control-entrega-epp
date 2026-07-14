import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryIcon } from '../models/types';

export const NavBar: React.FC = () => {
  const { user, logout, activeView, navigate, cart, removeFromCart, updateCartQuantity, submitCartRequest, isMobileMenuOpen, setIsMobileMenuOpen, workers, selectedWorkerId } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');
  const [isWorkerDropdownOpen, setIsWorkerDropdownOpen] = useState(false);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = submitCartRequest(notes);
    if (success) {
      setIsCartOpen(false);
      setNotes('');
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 w-full ${user?.role === 'admin' ? 'md:left-[260px] md:w-[calc(100%-260px)]' : ''} z-50 flex justify-between items-center px-margin-page h-16 bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline ${user?.role === 'admin' && activeView !== 'catalog' ? 'md:hidden' : ''} print:hidden`}>
        <div className="flex items-center gap-2">
          {/* Hamburger Menu on mobile for Admins */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 -ml-1 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full mr-1 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(user?.role === 'admin' ? 'admin-dashboard' : 'worker-search')}>
            <img src="/logo.png" alt="Enaex Logo" className="h-6 md:h-7 object-contain mr-1" />
            <span className="hidden sm:inline font-headline-md text-headline-md font-bold text-primary tracking-tight border-l border-outline-variant/60 pl-3 ml-1">EPP Control</span>
            <span className="sm:hidden font-label-lg text-label-lg font-bold text-primary tracking-tight ml-1">EPP Control</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-primary dark:text-primary-fixed-dim relative">
          {/* Cart Icon (only if there are items or if we are a worker/admin selecting items) */}
          {activeView !== 'login' && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors p-2 rounded-full cursor-pointer active:opacity-80"
              aria-label="Carrito de compras"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              {totalCartItems > 0 && (
                <span className="absolute top-0 right-0 bg-[#ea000c] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalCartItems}
                </span>
              )}
            </button>
          )}

          {/* User Icon & Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors p-2 rounded-full cursor-pointer active:opacity-80 flex items-center"
                aria-label="Menú de usuario"
              >
                <span className="material-symbols-outlined">account_circle</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant rounded shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant">
                    <p className="text-sm font-semibold text-on-surface">
                      {user.role === 'admin' ? 'Administrador' : 'Trabajador'}
                    </p>
                    {user.username && <p className="text-xs text-on-surface-variant">{user.username}</p>}
                  </div>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        navigate('admin-dashboard');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      Panel Admin
                    </button>
                  )}
                  {user.role === 'worker' && (
                    <button
                      onClick={() => {
                        navigate('worker-profile', user.workerId);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      Mi Perfil
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Background overlay */}
            <div
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsCartOpen(false)}
            ></div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="flex items-start justify-between border-b border-outline-variant pb-4">
                      <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        Solicitud de EPP
                      </h2>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="ml-3 p-1 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    {/* Destinatario de la solicitud */}
                    <div className="mt-4 border-b border-outline-variant/60 pb-4 text-left">
                      {user?.role === 'admin' ? (
                        <div className="relative w-full">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                            Asignar a Colaborador
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Buscar colaborador..."
                              value={isWorkerDropdownOpen ? workerSearchQuery : (() => {
                                const targetWorker = workers.find(w => w.id === selectedWorkerId);
                                return targetWorker ? `${targetWorker.first_name} ${targetWorker.last_name}` : '';
                              })()}
                              onChange={(e) => {
                                setWorkerSearchQuery(e.target.value);
                                setIsWorkerDropdownOpen(true);
                              }}
                              onFocus={() => {
                                setWorkerSearchQuery('');
                                setIsWorkerDropdownOpen(true);
                              }}
                              className="w-full h-10 pl-3 pr-8 bg-surface border border-outline-variant rounded font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">
                              arrow_drop_down
                            </span>
                          </div>

                          {isWorkerDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setIsWorkerDropdownOpen(false)}></div>
                              <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-outline-variant rounded-md shadow-lg z-20 divide-y divide-outline-variant/40">
                                <li
                                  onClick={() => {
                                    navigate(activeView, null);
                                    setWorkerSearchQuery('');
                                    setIsWorkerDropdownOpen(false);
                                  }}
                                  className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer font-semibold"
                                >
                                  -- Quitar Selección --
                                </li>
                                {workers
                                  .filter(w => {
                                    const full = `${w.first_name} ${w.last_name}`.toLowerCase();
                                    const rut = w.rut.replace(/[\.-]/g, '').toLowerCase();
                                    const q = workerSearchQuery.toLowerCase().replace(/[\.-]/g, '');
                                    return full.includes(q) || rut.includes(q);
                                  })
                                  .map(w => (
                                    <li
                                      key={w.id}
                                      onClick={() => {
                                        navigate(activeView, w.id);
                                        setWorkerSearchQuery(`${w.first_name} ${w.last_name}`);
                                        setIsWorkerDropdownOpen(false);
                                      }}
                                      className="px-3 py-2 text-xs text-on-surface hover:bg-surface-container-low cursor-pointer flex flex-col"
                                    >
                                      <span className="font-semibold text-primary">{w.first_name} {w.last_name}</span>
                                      <span className="text-[10px] text-on-surface-variant font-mono-data">RUT: {w.rut} • {w.cargo}</span>
                                    </li>
                                  ))
                                }
                              </ul>
                            </>
                          )}
                        </div>
                      ) : (
                        (() => {
                          const targetWorkerId = user?.role === 'worker' ? user?.workerId : selectedWorkerId;
                          const targetWorker = workers.find(w => w.id === targetWorkerId);
                          return targetWorker && (
                            <div className="bg-surface-container-low border border-outline-variant p-3 rounded">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Trabajador Destinatario</span>
                              <span className="font-semibold text-primary block mt-0.5">{targetWorker.first_name} {targetWorker.last_name}</span>
                              <span className="text-xs text-on-surface-variant block font-mono-data">RUT: {targetWorker.rut} • {targetWorker.cargo}</span>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    <div className="mt-8">
                      {cart.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center opacity-60">
                          <span className="material-symbols-outlined text-4xl mb-4 text-outline">shopping_cart_off</span>
                          <p className="text-body-md text-on-surface-variant">No hay EPP seleccionados en esta solicitud.</p>
                          <button
                            onClick={() => {
                              setIsCartOpen(false);
                              navigate('catalog');
                            }}
                            className="mt-4 text-sm text-primary hover:underline font-semibold"
                          >
                            Ir al catálogo de EPP
                          </button>
                        </div>
                      ) : (
                        <div className="flow-root">
                          <ul role="list" className="-my-6 divide-y divide-outline-variant/50">
                            {cart.map((cartItem) => (
                              <li key={cartItem.item.id} className="flex py-6">
                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded border border-outline-variant bg-surface-container flex items-center justify-center">
                                   {cartItem.item.image_url ? (
                                     <img
                                       src={cartItem.item.image_url}
                                       alt={cartItem.item.name}
                                       className="h-full w-full object-cover mix-blend-multiply"
                                       onError={(e) => {
                                         (e.target as HTMLElement).style.display = 'none';
                                         const parent = (e.target as HTMLElement).parentElement;
                                         if (parent) {
                                           const icon = document.createElement('span');
                                           icon.className = "material-symbols-outlined text-3xl text-primary/60";
                                           icon.innerText = getCategoryIcon(cartItem.item.category);
                                           parent.appendChild(icon);
                                         }
                                       }}
                                     />
                                   ) : (
                                     <span className="material-symbols-outlined text-3xl text-primary/60">{getCategoryIcon(cartItem.item.category)}</span>
                                   )}
                                </div>

                                <div className="ml-4 flex flex-1 flex-col">
                                  <div>
                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                      <h3 className="font-label-lg text-label-lg text-on-surface line-clamp-1">{cartItem.item.name}</h3>
                                      <p className="ml-4 font-mono-data text-mono-data text-on-surface-variant">{cartItem.item.sku}</p>
                                    </div>
                                    <p className="mt-1 text-xs text-on-surface-variant">{cartItem.item.category}</p>
                                    <p className="text-[11px] text-primary font-bold mt-0.5">${(cartItem.item.price || 0).toLocaleString('es-CL')}</p>
                                  </div>
                                  <div className="flex flex-1 items-end justify-between text-sm">
                                    <div className="flex items-center border border-outline-variant rounded bg-surface h-[30px]">
                                      <button
                                        onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
                                        className="px-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-xs">remove</span>
                                      </button>
                                      <span className="w-8 text-center font-mono-data text-xs text-on-surface">{cartItem.quantity}</span>
                                      <button
                                        onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                                        className="px-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-xs">add</span>
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(cartItem.item.id)}
                                      className="font-medium text-red-600 hover:text-red-500 text-xs flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">delete</span>
                                      Quitar
                                    </button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t border-outline-variant px-6 py-6 bg-surface-container-low">
                      <div className="flex justify-between items-center mb-4 border-b border-outline-variant/60 pb-3">
                        <span className="text-sm font-bold text-on-surface">Total de la Solicitud:</span>
                        <span className="text-base font-black text-primary">
                          ${cart.reduce((acc, curr) => acc + (curr.quantity * (curr.item.price || 0)), 0).toLocaleString('es-CL')}
                        </span>
                      </div>
                      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                          <label htmlFor="notes" className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                            Notas u Observaciones (opcional)
                          </label>
                          <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Indique motivo o talla específica si es necesario..."
                            className="w-full text-xs p-2 border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-label-lg text-label-lg py-3 rounded transition-colors flex justify-center items-center gap-2 h-12 shadow-sm font-semibold"
                        >
                          <span className="material-symbols-outlined">send</span>
                          {user?.role === 'admin' ? 'Confirmar Entrega Directa' : 'Enviar Solicitud'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
