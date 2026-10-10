import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const WorkerProfile: React.FC = () => {
  const { user, selectedWorkerId, navigate, deliveries, workers, setAlert } = useApp();
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  
  // New Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

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
    // 1. Text search filter
    if (searchHistoryQuery) {
      const nameMatch = d.epp_item?.name.toLowerCase().includes(searchHistoryQuery.toLowerCase()) || false;
      const notesMatch = d.notes?.toLowerCase().includes(searchHistoryQuery.toLowerCase()) || false;
      const dateMatch = d.delivered_at ? new Date(d.delivered_at).toLocaleDateString().includes(searchHistoryQuery) : false;
      if (!nameMatch && !notesMatch && !dateMatch) return false;
    }

    // 2. Status filter
    if (filterStatus !== 'Todos') {
      const dbStatus = filterStatus === 'Aprobado' ? 'Entregado' : filterStatus;
      if (d.status !== dbStatus) return false;
    }

    // 3. Date range filter
    const recordDateStr = d.delivered_at || d.created_at;
    if (recordDateStr) {
      const recordDate = new Date(recordDateStr);
      recordDate.setHours(0, 0, 0, 0);

      if (filterStartDate) {
        const startDate = new Date(filterStartDate + 'T00:00:00');
        if (recordDate < startDate) return false;
      }

      if (filterEndDate) {
        const endDate = new Date(filterEndDate + 'T23:59:59');
        if (recordDate > endDate) return false;
      }
    }

    return true;
  });

  const handlePrint = () => {
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate + 'T00:00:00');
      const end = new Date(filterEndDate + 'T00:00:00');
      if (start > end) {
        setAlert('La fecha "Desde" no puede ser mayor que "Hasta".', 'error');
        return;
      }
    }

    if (filteredDeliveries.length === 0) {
      setAlert('No existen registros para imprimir con los filtros seleccionados.', 'warning');
      return;
    }

    window.print();
  };

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
            onClick={handlePrint}
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

      {/* Official Company Document Header (Visible on Screen and in Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-outline-variant/60 rounded-xl p-5 mb-6 bg-white shadow-sm print:shadow-none print:border-b-2 print:border-primary/20 print:border-t-0 print:border-x-0 print:rounded-none print:p-0 print:pb-4 text-left w-full">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Enaex Servicios S.A." className="h-12 object-contain" />
          <div className="border-l-2 border-outline-variant/60 pl-4">
            <h1 className="text-base font-extrabold text-primary tracking-tight uppercase">Enaex Servicios S.A.</h1>
            <p className="text-xs font-mono font-bold text-on-surface">RUT: 76.041.871-4</p>
            <p className="text-xs font-medium text-on-surface-variant mt-0.5">
              <span className="font-semibold text-primary">Planta:</span> Enaex Planta Sierra Gorda
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right flex flex-col sm:items-end">
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20 self-start sm:self-auto">
            Ficha de Control Entrega EPP
          </span>
          <p className="text-[11px] text-on-surface-variant font-mono mt-1">
            Reporte Oficial de Auditoría
          </p>
          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
            Generado: {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Worker Info Card - Full width horizontal card directly below company header */}
      <div className="bg-white border border-outline-variant/60 rounded-xl p-5 mb-6 shadow-sm text-left w-full print:shadow-none print:mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-base shrink-0">
              {worker.first_name[0]}{worker.last_name[0]}
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                {worker.first_name} {worker.last_name}
              </h2>
              <p className="font-mono-data text-on-surface font-bold text-xs mt-0.5">
                RUT: {worker.rut}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase">Estado Operativo:</span>
            <span className={`px-3 py-0.5 rounded-full uppercase text-[10px] font-bold ${
              worker.status === 'Activo'
                ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]'
                : 'bg-error-container text-on-error-container border border-error/20'
            }`}>
              {worker.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
          <div>
            <span className="font-label-md text-[10px] uppercase font-semibold text-on-surface-variant block">Cargo / Puesto</span>
            <p className="font-body-md text-sm text-on-surface font-semibold mt-0.5">{worker.cargo}</p>
          </div>
          <div>
            <span className="font-label-md text-[10px] uppercase font-semibold text-on-surface-variant block">Departamento</span>
            <p className="font-body-md text-sm text-on-surface font-semibold mt-0.5">{worker.department}</p>
          </div>
          <div>
            <span className="font-label-md text-[10px] uppercase font-semibold text-on-surface-variant block">Email Corporativo</span>
            <p className="font-body-md text-sm text-on-surface font-semibold truncate mt-0.5" title={worker.email}>{worker.email}</p>
          </div>
          <div>
            <span className="font-label-md text-[10px] uppercase font-semibold text-on-surface-variant block">Teléfono / Fono</span>
            <p className="font-body-md text-sm text-on-surface font-semibold mt-0.5">{worker.phone}</p>
          </div>
        </div>
      </div>

      {/* Mini Stats Grid - Full Width */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 print:grid-cols-3 print:gap-4 print:mb-4">
        <div className="bg-white border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col justify-between text-center print:shadow-none">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">EPPs Entregados</span>
          <span className="text-2xl font-bold text-primary block mt-1">{totalDelivered}</span>
        </div>
        <div className="bg-white border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col justify-between text-center print:shadow-none">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Sol. Pendientes</span>
          <span className={`text-2xl font-bold block mt-1 ${totalPending > 0 ? 'text-[#ea580c]' : 'text-on-surface-variant'}`}>{totalPending}</span>
        </div>
        <div className="bg-white border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col justify-between text-left print:shadow-none">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Último Retiro Realizado</span>
          <span className="text-sm font-semibold text-on-surface block mt-1 truncate">{lastDeliveryItem?.epp_item?.name || 'Ninguno'}</span>
          <span className="text-[10px] text-on-surface-variant block mt-0.5">Fecha: {lastDeliveryDate}</span>
        </div>
      </div>

      {/* Deliveries History - Full Width */}
      <div className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-sm flex flex-col w-full text-left print:shadow-none print:border-none print:p-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline-variant/30 pb-4 mb-4 print:hidden">
          <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Historial de Asignaciones y Entregas</h3>
          
          {/* Search History */}
          <div className="relative w-full sm:w-64">
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

        {/* Filters Bar - Visible on screen, hidden on print */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 mb-4 flex flex-col gap-4 print:hidden text-left">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Filtros de Historial</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Start Date */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="filter-start" className="text-[10px] font-bold text-on-surface-variant uppercase">Desde</label>
                  <input
                    id="filter-start"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary outline-none transition-colors h-9"
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="filter-end" className="text-[10px] font-bold text-on-surface-variant uppercase">Hasta</label>
                  <input
                    id="filter-end"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary outline-none transition-colors h-9"
                  />
                </div>

                {/* Status Selector */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="filter-status" className="text-[10px] font-bold text-on-surface-variant uppercase">Estado</label>
                  <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary outline-none transition-colors h-9 cursor-pointer"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              {/* Date validation warning text */}
              {filterStartDate && filterEndDate && new Date(filterStartDate + 'T00:00:00') > new Date(filterEndDate + 'T00:00:00') && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold mt-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  La fecha "Desde" no puede ser mayor que "Hasta".
                </div>
              )}
            </div>

            {/* Table Container - Desktop/Tablet & Always in Print */}
            <div className="hidden sm:block print:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/50">
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-32 tracking-wider text-xs font-semibold">Fecha</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">Ítem EPP</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-20 tracking-wider text-xs font-semibold text-right">Cant.</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-36 tracking-wider text-xs font-semibold">Estado</th>
                    <th className="py-3 px-4 font-label-md text-label-md text-on-surface-variant uppercase w-36 tracking-wider text-xs font-semibold text-center">Firma</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-on-surface-variant opacity-60 text-sm">
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
                          <td className="py-2 px-4 text-center">
                            {d.signature ? (
                              <img
                                src={d.signature}
                                className="h-8 max-w-[100px] object-contain border border-outline-variant/30 rounded bg-white p-0.5 mx-auto"
                                alt="Firma Colaborador"
                              />
                            ) : (
                              <span className="text-xs text-on-surface-variant opacity-60">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Card List - Mobile only */}
            <div className="sm:hidden flex flex-col gap-3">
              {filteredDeliveries.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant opacity-60 text-sm">
                  No se encontraron registros de entrega.
                </div>
              ) : (
                filteredDeliveries.map((d) => {
                  const displayDate = d.delivered_at
                    ? new Date(d.delivered_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : new Date(d.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                  let statusBadge = '';
                  if (d.status === 'Entregado') {
                    statusBadge = 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]';
                  } else if (d.status === 'Pendiente') {
                    statusBadge = 'bg-error-container text-on-error-container border border-error/20';
                  } else if (d.status === 'Rechazado') {
                    statusBadge = 'bg-red-50 text-[#b91c1c] border border-red-100';
                  }

                  return (
                    <div key={d.id} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-3 text-left flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono-data text-[10px] text-on-surface-variant">{displayDate}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${statusBadge}`}>
                          {d.status}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{d.epp_item?.name || 'EPP Desconocido'}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono-data mt-0.5">SKU: {d.epp_item?.sku}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-outline-variant/20 pt-2 mt-1">
                        <span className="text-xs text-on-surface-variant">Cantidad: <strong className="font-mono-data text-on-surface text-sm">{d.quantity}</strong></span>
                        {d.notes && <span className="text-[10px] text-on-surface-variant truncate max-w-[150px]" title={d.notes}>Nota: {d.notes}</span>}
                      </div>
                      {d.signature && (
                        <div className="border-t border-outline-variant/20 pt-2 flex flex-col gap-1">
                          <span className="text-[9px] text-on-surface-variant font-bold uppercase">Firma digital:</span>
                          <img src={d.signature} className="h-10 w-auto max-w-[120px] object-contain border border-outline-variant/30 rounded bg-white p-0.5" alt="Firma Trabajador" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Legal Disclaimer Block */}
            <div className="mt-6 pt-4 border-t border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed">
              <p className="font-bold text-primary mb-1">Artículo 53 DS N° 594</p>
              <p className="italic">
                "El empleador deberá proporcionar a sus trabajadores, libres de costo, los elementos de protección personal adecuados al riesgo a cubrir y el adiestramiento necesario para su correcto empleo, debiendo, además, mantenerlos en perfecto estado de funcionamiento. Por su parte, el trabajador deberá usarlos en forma permanente mientras se encuentre expuesto al riesgo."
              </p>
            </div>
          </div>
    </div>
  );
};
