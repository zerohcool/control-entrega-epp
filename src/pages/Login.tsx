import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const Login: React.FC = () => {
  const { loginAsAdmin, loginAsWorker, workers } = useApp();
  const [rut, setRut] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // RUT Autocomplete suggestions state
  const [showRutSuggestions, setShowRutSuggestions] = useState(false);

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rut.trim()) return;
    loginAsWorker(rut);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    loginAsAdmin(username, password);
  };

  // Filter matched workers in real time (minimum 2 characters typed)
  const cleanInput = rut.replace(/[\.-]/g, '').trim().toLowerCase();
  const matchedWorkers = cleanInput.length >= 2
    ? workers.filter(w => {
        const cleanRut = w.rut.replace(/[\.-]/g, '').trim().toLowerCase();
        const fullName = `${w.first_name} ${w.last_name}`.toLowerCase();
        return cleanRut.includes(cleanInput) || fullName.includes(cleanInput);
      })
    : [];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-margin-page bg-background">
      {/* Centered Corporate Logo */}
      <div className="flex flex-col items-center mb-8 text-center max-w-xl">
        <img
          src="/logo.png"
          alt="Enaex Logo"
          className="h-14 md:h-16 object-contain mb-3"
        />
        <h1 className="text-lg md:text-xl font-bold text-primary tracking-wider uppercase">
          Gestión de EPP & Control de Inventario
        </h1>
        <p className="text-xs md:text-sm text-on-surface-variant mt-1">
          Plataforma para el registro, asignación y auditoría de Elementos de Protección Personal.
        </p>
      </div>

      {/* Grid containing cards, perfectly centered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full max-w-5xl">
        {/* Worker Access Card */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-highest border border-outline-variant flex flex-col justify-end min-h-[380px] md:min-h-[400px]">
          {/* Background Image Overlay - To modify this background image, replace the URL string below */}
          <div
            className="absolute inset-0 bg-cover bg-center z-0 opacity-45 mix-blend-multiply"
            style={{
              backgroundImage: "url('/IMG_Inicio.webp')"
            }}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest via-surface-container-highest/85 to-transparent z-10"></div>
          
          <div className="relative z-20 p-6 md:p-stack-lg flex flex-col gap-stack-sm h-full justify-end text-left">
            <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2 border border-outline-variant/30 backdrop-blur-sm">
              <span className="material-symbols-outlined text-primary font-bold" style={{ fontSize: '28px' }}>badge</span>
            </div>
            <h2 className="font-headline-sm md:font-headline-lg text-headline-sm md:text-headline-lg text-on-surface font-bold">
              Acceso Trabajador
            </h2>
            <p className="font-body-sm md:font-body-md text-xs md:text-body-md text-on-surface-variant mb-4 max-w-sm">
              Ingreso rápido sin credenciales de red. Consulta tus asignaciones activas de EPP y solicita reposiciones con tu RUT.
            </p>

            <form onSubmit={handleWorkerSubmit} className="flex flex-col gap-3 mt-auto relative">
              <div className="flex flex-col gap-1 text-left relative">
                <label htmlFor="worker-rut" className="block text-[10px] md:text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Ingresa tu RUT
                </label>
                <div className="relative">
                  <input
                    id="worker-rut"
                    type="text"
                    value={rut}
                    onChange={(e) => {
                      setRut(e.target.value);
                      setShowRutSuggestions(true);
                    }}
                    onFocus={() => setShowRutSuggestions(true)}
                    placeholder="Ej: 15.342.198-K"
                    required
                    autoComplete="off"
                    className="w-full h-10 px-3 bg-white border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />

                  {/* RUT Autocomplete dropdown */}
                  {showRutSuggestions && matchedWorkers.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowRutSuggestions(false)}></div>
                      <ul className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-outline-variant rounded-md shadow-lg z-20 divide-y divide-outline-variant/40">
                        {matchedWorkers.map(w => (
                          <li
                            key={w.id}
                            onClick={() => {
                              setRut(w.rut);
                              setShowRutSuggestions(false);
                              loginAsWorker(w.rut);
                            }}
                            className="px-3 py-2.5 text-xs text-on-surface hover:bg-surface-container-low cursor-pointer flex flex-col text-left transition-colors"
                          >
                            <span className="font-bold text-primary">{w.first_name} {w.last_name}</span>
                            <span className="text-[10px] text-on-surface-variant font-mono-data mt-0.5">RUT: {w.rut} • {w.cargo}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-label-lg text-label-lg h-11 md:h-12 rounded flex items-center justify-center gap-2 transition-all shadow-sm font-bold uppercase tracking-wider text-xs md:text-sm"
              >
                <span className="material-symbols-outlined font-bold">search</span>
                Iniciar Búsqueda
              </button>
            </form>
          </div>
        </div>

        {/* Admin Access Card */}
        <div className="bg-white rounded-xl border border-outline-variant p-6 md:p-stack-lg flex flex-col justify-center min-h-[380px] md:min-h-[400px]">
          <div className="mb-6 text-left">
            <div className="bg-surface-container-low w-12 h-12 rounded-lg flex items-center justify-center mb-stack-sm border border-outline-variant/50">
              <span className="material-symbols-outlined text-on-surface font-bold" style={{ fontSize: '28px' }}>admin_panel_settings</span>
            </div>
            <h2 className="font-headline-sm md:font-headline-md text-headline-sm md:text-headline-md text-on-surface font-bold">
              Acceso Administrador
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1">
              Acceso restringido para personal de bodega y supervisores de seguridad.
            </p>
          </div>

          <form onSubmit={handleAdminSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="admin-user" className="block text-[10px] md:text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Usuario / Correo
              </label>
              <input
                id="admin-user"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: administrador"
                required
                className="h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="admin-pass" className="block text-[10px] md:text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Contraseña
              </label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 px-3 bg-surface border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg h-11 md:h-12 rounded flex items-center justify-center gap-2 transition-all shadow-sm font-bold uppercase tracking-wider text-xs md:text-sm mt-3"
            >
              <span className="material-symbols-outlined font-bold">lock_open</span>
              Ingresar al Portal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
