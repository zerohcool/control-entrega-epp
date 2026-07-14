import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const WorkerProfile: React.FC = () => {
  const { user, selectedWorkerId, navigate, deliveries, workers } = useApp();
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  // Fetch the current worker
  const worker = workers.find(w => w.id === selectedWorkerId);
  
  if (!worker) {
    return (
      <div className="p-margin-page text-center py-12 flex flex-col items-center">
        <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error</span>
        <p className="text-body-lg text-on-surface">No se ha seleccionado ningún trabajador válido.</p>
        <button onClick={() => navigate('worker-search')} className="mt-4 bg-primary text-on-primary px-4 py-2 rounded">
          Volver a búsqueda
        </button>
      </div>
    );
  }

  // Get deliveries for this worker
  const workerDeliveries = deliveries.filter(d => d.worker_id === worker.id);

  // Stats
  const totalDelivered = workerDeliveries.filter(d => d.status === 'Entregado').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPending = workerDeliveries.filter(d => d.status === 'Pendiente').length;
  
  const lastDeliveryItem = workerDeliveries
    .filter(d => d.status === 'Entregado' && d.delivered_at)
    .sort((a, b) => new Date(b.delivered_at!).getTime() - new Date(a.delivered_at!).getTime())[0];
  
  const lastDeliveryDate = lastDeliveryItem && lastDeliveryItem.delivered_at
    ? new Date(lastDeliveryItem.delivered_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No registra';

  // Filter history
  const filteredDeliveries = workerDeliveries.filter(d => {
    if (!searchHistoryQuery) return true;
    const nameMatch = d.epp_item?.name.toLowerCase().includes(searchHistoryQuery.toLowerCase()) || false;
    const notesMatch = d.notes?.toLowerCase().includes(searchHistoryQuery.toLowerCase()) || false;
    const dateMatch = d.delivered_at ? new Date(d.delivered_at).toLocaleDateString().includes(searchHistoryQuery) : false;
    return nameMatch || notesMatch || dateMatch;
  });

  return (
    <div className="p-margin-page flex-1 max-w-container-max mx-auto w-full">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-stack-lg border-b border-outline-variant/30 pb-4 print:hidden">
        {user?.role === 'admin' ? (
          <button
            onClick={() => navigate('worker-search')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-label-lg text-label-lg">Volver a Personal</span>
          </button>
        ) : (
          <div>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block">Sesión Activa</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">Portal del Colaborador</span>
          </div>
        )}

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              window.print();
            }}
            className="flex-1 sm:flex-initial bg-white border border-outline text-primary font-label-md text-label-md px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Imprimir Ficha
          </button>
          <button
            onClick={() => navigate('catalog', worker.id)}
            className="flex-1 sm:flex-initial bg-primary text-on-primary font-label-lg text-label-lg px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            Solicitar Nuevo EPP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left Column: Worker info card */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-gutter text-left">
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
                {worker.first_name[0]}{worker.last_name[0]}
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary font-bold">{worker.first_name} {worker.last_name}</h2>
                <p className="font-mono-data text-mono-data text-on-surface-variant font-bold text-xs mt-0.5">{worker.rut}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 print:grid print:grid-cols-2 print:gap-x-8 print:gap-y-3">
              <div>
                <span className="font-label-md text-label-md text-on-surface-variant text-[10px] uppercase font-semibold">Cargo / Puesto</span>
                <p className="font-body-md text-body-md text-on-surface font-semibold">{worker.cargo}</p>
              </div>
              <div>
                <span className="font-label-md text-label-md text-on-surface-variant text-[10px] uppercase font-semibold">Departamento</span>
                <p className="font-body-md text-body-md text-on-surface font-semibold">{worker.department}</p>
              </div>
              <div>
                <span className="font-label-md text-label-md text-on-surface-variant text-[10px] uppercase font-semibold">Contacto</span>
                <p className="font-body-md text-body-md text-on-surface font-semibold truncate" title={worker.email}>{worker.email}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant font-semibold mt-0.5">{worker.phone}</p>
              </div>
              <div className="border-t border-outline-variant/30 pt-3 flex justify-between items-center mt-1 print:border-none print:pt-0 print:mt-0 print:flex-col print:items-start print:gap-1">
                <span className="font-label-md text-label-md text-on-surface-variant text-[10px] uppercase font-semibold">Estado Operativo</span>
                <span className={`font-label-md text-label-md px-2.5 py-0.5 rounded-full uppercase text-[10px] font-bold ${
                  worker.status === 'Activo' ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]' : 'bg-error-container text-on-error-container border border-error/20'
                }`}>
                  {worker.status}
                </span>
              </div>
            </div>
          </div>

          {/* Mini Stats Grid */}
          <div className="grid grid-cols-2 gap-4 print:hidden">
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">EPP Entregados</span>
              <span className="text-2xl font-bold text-primary block mt-1">{totalDelivered}</span>
            </div>
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Sol. Pendientes</span>
              <span className={`text-2xl font-bold block mt-1 ${totalPending > 0 ? 'text-[#ea580c]' : 'text-on-surface-variant'}`}>{totalPending}</span>
            </div>
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between col-span-2 h-24">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Último Retiro Realizado</span>
              <span className="text-sm font-semibold text-on-surface block mt-1 truncate">{lastDeliveryItem?.epp_item?.name || 'Ninguno'}</span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">Fecha: {lastDeliveryDate}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Deliveries History */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-4 text-left">
          <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col flex-1 min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline-variant/30 pb-4 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Historial de Asignaciones y Entregas</h3>
              
              {/* Search History */}
              <div className="relative w-full sm:w-64 print:hidden">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
                </div>
                <input
                  type="text"
                  placeholder="Buscar en el historial..."
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary outline-none transition-colors h-8 text-left"
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/50">
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-32 tracking-wider text-xs font-semibold">Fecha</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">Ítem EPP</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-20 tracking-wider text-xs font-semibold text-right">Cant.</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-36 tracking-wider text-xs font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-on-surface-variant opacity-60 text-sm">
                        No se encontraron registros de entrega.
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((d) => {
                      const displayDate = d.delivered_at
                        ? new Date(d.delivered_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
                        : new Date(d.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });

                      let statusBadge = '';
                      if (d.status === 'Entregado') {
                        statusBadge = 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]';
                      } else if (d.status === 'Pendiente') {
                        statusBadge = 'bg-error-container text-on-error-container border border-error/20';
                      } else if (d.status === 'Rechazado') {
                        statusBadge = 'bg-red-50 text-[#b91c1c] border border-red-100';
                      }

                      return (
                        <tr key={d.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low/30 transition-colors h-[42px] even:bg-surface-container-low/10">
                          <td className="py-2 px-4 font-mono-data text-xs">{displayDate}</td>
                          <td className="py-2 px-4 text-left">
                            <p className="font-semibold text-on-surface text-sm">{d.epp_item?.name || 'EPP Desconocido'}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono-data mt-0.5">{d.epp_item?.sku} {d.notes ? `• ${d.notes}` : ''}</p>
                          </td>
                          <td className="py-2 px-4 font-mono-data text-right font-bold">{d.quantity}</td>
                          <td className="py-2 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusBadge}`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
