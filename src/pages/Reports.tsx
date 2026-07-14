import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const Reports: React.FC = () => {
  const { historyLogs } = useApp();
  
  // Tabs: 'dashboard' | 'logs'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs'>('dashboard');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // 1. Filtered logs specifically for dashboard stats calculations (applying dates)
  const dashboardLogs = historyLogs.filter(log => {
    // Start Date
    if (startDate) {
      const logDate = new Date(log.date);
      const sDate = new Date(startDate + 'T00:00:00');
      if (logDate < sDate) return false;
    }

    // End Date
    if (endDate) {
      const logDate = new Date(log.date);
      const eDate = new Date(endDate + 'T23:59:59');
      if (logDate > eDate) return false;
    }
    return true;
  });

  const entregas = dashboardLogs.filter(log => log.type === 'Entrega');
  const ingresos = dashboardLogs.filter(log => log.type === 'Ingreso');
  const rechazos = dashboardLogs.filter(log => log.type === 'Rechazo');

  const totalDeliveredQty = entregas.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalIngresosQty = ingresos.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalRechazadosCount = rechazos.length;

  // Most requested EPP item
  const eppCounts: { [name: string]: number } = {};
  entregas.forEach(d => {
    eppCounts[d.item_name] = (eppCounts[d.item_name] || 0) + d.quantity;
  });

  let topEppName = 'N/A';
  let topEppCount = 0;
  Object.keys(eppCounts).forEach(name => {
    if (eppCounts[name] > topEppCount) {
      topEppCount = eppCounts[name];
      topEppName = name;
    }
  });

  // Top 10 EPP most requested
  const topEpps = Object.entries(eppCounts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Top 10 workers with most EPP delivered
  const workerCounts: { [details: string]: number } = {};
  entregas.forEach(log => {
    workerCounts[log.details] = (workerCounts[log.details] || 0) + log.quantity;
  });

  const topWorkers = Object.entries(workerCounts)
    .map(([details, qty]) => ({ details, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Category breakdown for chart
  const categoryCounts: { [category: string]: number } = {};
  entregas.forEach(log => {
    categoryCounts[log.category] = (categoryCounts[log.category] || 0) + log.quantity;
  });

  // 2. Filter logic for the detailed table
  const filteredLogs = historyLogs.filter(log => {
    // Search query (worker details, supplier, SKU or product name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/[\.-]/g, '');
      const cleanDetails = log.details.toLowerCase().replace(/[\.-]/g, '');
      const cleanSku = log.item_sku.toLowerCase();
      const cleanName = log.item_name.toLowerCase();
      const cleanNotes = log.notes?.toLowerCase() || '';

      if (!cleanDetails.includes(q) && !cleanSku.includes(q) && !cleanName.includes(q) && !cleanNotes.includes(q)) {
        return false;
      }
    }

    // Start Date
    if (startDate) {
      const logDate = new Date(log.date);
      const sDate = new Date(startDate + 'T00:00:00');
      if (logDate < sDate) return false;
    }

    // End Date
    if (endDate) {
      const logDate = new Date(log.date);
      const eDate = new Date(endDate + 'T23:59:59');
      if (logDate > eDate) return false;
    }

    // Category
    if (selectedCategory) {
      if (log.category !== selectedCategory) return false;
    }

    // Transaction Type
    if (selectedType) {
      if (log.type !== selectedType) return false;
    }

    return true;
  });

  const handleExportLogsExcel = () => {
    let csvContent = "\uFEFF";
    csvContent += "Fecha;Tipo;SKU;Producto;Categoría;Cantidad;Precio Unitario;Valor Total;Entidad;Notas\n";
    filteredLogs.forEach(log => {
      const displayDate = new Date(log.date).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const row = [
        displayDate,
        log.statusLabel || log.type,
        log.item_sku,
        log.item_name,
        log.category,
        log.quantity,
        log.price || 0,
        log.total_cost || 0,
        log.details,
        log.notes || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(';');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `registro_movimientos_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-grow p-margin-page flex flex-col gap-stack-lg bg-background text-left max-w-container-max mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Historial de Movimientos y Reportes
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Visualización y análisis unificado de entregas de EPP, rechazos e ingresos de stock de proveedores.
          </p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {activeTab === 'dashboard' && (
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-white border border-outline text-primary font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Exportar PDF
            </button>
          )}
          {activeTab === 'logs' && (
            <button
              onClick={handleExportLogsExcel}
              className="w-full sm:w-auto bg-[#166534] hover:bg-green-700 text-white font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">table_view</span>
              Exportar Excel
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex border-b border-outline-variant/60">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 font-label-lg text-label-lg font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'dashboard'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">insights</span>
          Dashboard Dinámico
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-3 font-label-lg text-label-lg font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">list_alt</span>
          Registro de Movimientos ({filteredLogs.length})
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="flex flex-col gap-6">
          
          {/* Dynamic Date Filter Bar */}
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <span className="text-sm font-bold text-on-surface">Rango de Fecha del Dashboard:</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface focus:border-primary outline-none h-9"
                />
                <span className="text-xs text-on-surface-variant self-center">hasta</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold text-on-surface focus:border-primary outline-none h-9"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1.5 rounded hover:bg-red-50 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="bg-white border border-outline-variant rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">Total Entregado</span>
                <span className="material-symbols-outlined text-primary p-1.5 bg-primary/10 rounded-lg">inventory_2</span>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-primary font-bold">{totalDeliveredQty}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">Costo: ${(entregas.reduce((acc, curr) => acc + (curr.total_cost || 0), 0)).toLocaleString('es-CL')}</span>
              </div>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">Total Ingresado</span>
                <span className="material-symbols-outlined text-[#166534] p-1.5 bg-green-50 rounded-lg">add_business</span>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-[#166534] font-bold">{totalIngresosQty}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">Costo: ${(ingresos.reduce((acc, curr) => acc + (curr.total_cost || 0), 0)).toLocaleString('es-CL')}</span>
              </div>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">Solicitudes Rechazadas</span>
                <span className="material-symbols-outlined text-[#b91c1c] p-1.5 bg-red-50 rounded-lg">cancel_schedule_send</span>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-[#b91c1c] font-bold">{totalRechazadosCount}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">Sin afectación de inventario</span>
              </div>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs font-semibold">EPP Más Solicitado</span>
                <span className="material-symbols-outlined text-blue-700 p-1.5 bg-blue-50 rounded-lg">construction</span>
              </div>
              <div>
                <span className="font-headline-sm text-headline-sm text-primary block font-bold truncate" title={topEppName}>
                  {topEppName}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">{topEppCount} Unidades</span>
              </div>
            </div>
          </div>

          {/* Graphical Dashboard Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Category Chart */}
            <div className="bg-white border border-outline-variant rounded-xl p-6 flex flex-col shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined">analytics</span>
                Consumo de EPP por Categoría
              </h3>
              <div className="flex flex-col gap-4 flex-grow justify-center">
                {Object.keys(categoryCounts).length === 0 ? (
                  <p className="text-sm text-on-surface-variant opacity-60 text-center py-10">No hay datos de consumo disponibles.</p>
                ) : (
                  Object.entries(categoryCounts).map(([cat, qty]) => {
                    const percentage = Math.round((qty / (totalDeliveredQty || 1)) * 100);
                    return (
                      <div key={cat} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-semibold text-on-surface">
                          <span>{cat}</span>
                          <span>{qty} unds. ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Balance Inventory Chart */}
            <div className="bg-white border border-outline-variant rounded-xl p-6 flex flex-col shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined">balance</span>
                Balance de Movimientos de Bodega
              </h3>
              <div className="flex flex-col gap-5 flex-grow justify-center">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold text-on-surface">
                    <span>Ingresos a Bodega (Nuevas Reposiciones)</span>
                    <span className="text-[#166534] font-bold">{totalIngresosQty} unidades</span>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#166534] h-full rounded-full" style={{ width: `${Math.min(100, Math.round((totalIngresosQty / (totalIngresosQty + totalDeliveredQty || 1)) * 100))}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold text-on-surface">
                    <span>Entregas de EPP a Colaboradores (Despacho)</span>
                    <span className="text-primary font-bold">{totalDeliveredQty} unidades</span>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, Math.round((totalDeliveredQty / (totalIngresosQty + totalDeliveredQty || 1)) * 100))}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-outline-variant/30 pt-4">
                  <div className="flex justify-between text-xs font-semibold text-on-surface">
                    <span>Proporción de Solicitudes Rechazadas</span>
                    <span className="text-[#b91c1c] font-bold">{totalRechazadosCount} solicitudes ({dashboardLogs.length > 0 ? Math.round((totalRechazadosCount / dashboardLogs.length) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#b91c1c] h-full rounded-full" style={{ width: `${dashboardLogs.length > 0 ? Math.round((totalRechazadosCount / dashboardLogs.length) * 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 10 Rankings Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            
            {/* Top 10 EPP most requested */}
            <div className="bg-white border border-outline-variant rounded-xl p-6 flex flex-col shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                Top 10 EPP Más Solicitados
              </h3>
              <div className="flex flex-col gap-2.5 flex-grow">
                {topEpps.length === 0 ? (
                  <p className="text-sm text-on-surface-variant opacity-60 text-center py-10">No hay datos de consumo en este rango.</p>
                ) : (
                  topEpps.map((epp, index) => (
                    <div key={epp.name} className="flex items-center justify-between border-b border-outline-variant/30 pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          index === 1 ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                          index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          'bg-surface-container text-on-surface-variant'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-on-surface truncate max-w-[200px] sm:max-w-xs">{epp.name}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{epp.qty} uds.</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top 10 Workers with most EPP delivered */}
            <div className="bg-white border border-outline-variant rounded-xl p-6 flex flex-col shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-primary">groups</span>
                Top 10 Colaboradores con Más EPP
              </h3>
              <div className="flex flex-col gap-2.5 flex-grow">
                {topWorkers.length === 0 ? (
                  <p className="text-sm text-on-surface-variant opacity-60 text-center py-10">No hay datos de entregas en este rango.</p>
                ) : (
                  topWorkers.map((worker, index) => {
                    const parts = worker.details.split(' (');
                    const name = parts[0];
                    const rut = parts[1] ? parts[1].replace(')', '') : '';
                    return (
                      <div key={worker.details} className="flex items-center justify-between border-b border-outline-variant/30 pb-2 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            index === 1 ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                            index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            'bg-surface-container text-on-surface-variant'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold text-on-surface truncate max-w-[200px] sm:max-w-xs">{name}</span>
                            {rut && <span className="text-[10px] text-on-surface-variant font-mono-data">RUT: {rut}</span>}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary">{worker.qty} uds.</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Filters Section */}
          <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">filter_list</span>
              <h3 className="font-label-md text-label-md text-primary uppercase font-bold text-xs">Filtros de Búsqueda</h3>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-gutter items-end">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant text-[11px] uppercase font-semibold">Término de Búsqueda</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[18px]">search</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rut, nombre, SKU..."
                    className="w-full pl-10 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-9 text-left"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant text-[11px] uppercase font-semibold">Tipo Movimiento</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-9 bg-white"
                >
                  <option value="">Todos los tipos</option>
                  <option value="Entrega">Entrega (Despacho)</option>
                  <option value="Ingreso">Ingreso (Stock)</option>
                  <option value="Rechazo">Rechazo (Sin impacto)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant text-[11px] uppercase font-semibold">Categoría EPP</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-9 bg-white"
                >
                  <option value="">Todas las categorías</option>
                  <option value="Protección Cabeza">Protección Cabeza</option>
                  <option value="Protección Manos">Protección Manos</option>
                  <option value="Ropa Seguridad">Ropa Seguridad</option>
                  <option value="Protección Pies">Protección Pies</option>
                  <option value="Protección Visual">Protección Visual</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant text-[11px] uppercase font-semibold">Fecha Desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant text-[11px] uppercase font-semibold">Fecha Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-9"
                />
              </div>
            </form>
          </div>

          {/* Historical Logs List */}
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col flex-grow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Fecha / Hora</th>
                    <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Tipo</th>
                    <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">SKU / Producto</th>
                    <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold text-right">Cant.</th>
                    <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold text-right">Val. Unitario</th>
                    <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold text-right">Val. Total</th>
                    <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Colaborador / Entidad</th>
                    <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Notas</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/30">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant opacity-60">
                        No hay movimientos registrados que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const displayDate = new Date(log.date).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      return (
                        <tr key={log.id} className="hover:bg-surface-container-low/10 transition-colors h-[48px] even:bg-surface-container-low/5">
                          <td className="px-4 py-2 font-mono-data text-xs whitespace-nowrap">{displayDate}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.type === 'Entrega' ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]' : 
                              log.type === 'Ingreso' ? 'bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]' : 
                              'bg-error-container text-on-error-container border border-error/20'
                            }`}>
                              {log.statusLabel || log.type}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="font-semibold text-on-surface block text-sm">{log.item_name}</span>
                            <span className="text-[10px] text-on-surface-variant font-mono-data">SKU: {log.item_sku}</span>
                          </td>
                          <td className="px-4 py-2 text-right font-bold font-mono-data">{log.quantity}</td>
                          <td className="px-4 py-2 text-right font-mono-data text-xs">${(log.price || 0).toLocaleString('es-CL')}</td>
                          <td className="px-4 py-2 text-right font-mono-data text-xs font-semibold">${(log.total_cost || 0).toLocaleString('es-CL')}</td>
                          <td className="px-4 py-2 font-semibold text-sm">{log.details}</td>
                          <td className="px-4 py-2 text-xs text-on-surface-variant leading-normal max-w-xs truncate" title={log.notes}>
                            {log.notes || 'Sin observaciones'}
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
      )}
    </div>
  );
};
