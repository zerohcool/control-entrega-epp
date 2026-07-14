import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { EPPItem } from '../models/types';

// Convert raw image uploads to optimized WebP base64 Data URLs
const convertToWebP = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = () => reject(new Error('Error al procesar la imagen'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

export const AdminDashboard: React.FC = () => {
  const { deliveries, eppItems, approveRequest, rejectRequest, updateEPPItem, navigate } = useApp();
  
  // Search product state (Buscador de existencias)
  const [productSearchInput, setProductSearchInput] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EPPItem | null>(null);

  // Product Edit Form fields
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStock, setEditStock] = useState(0);
  const [editMinStock, setEditMinStock] = useState(0);
  const [editMaxStock, setEditMaxStock] = useState(0);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPrice, setEditPrice] = useState(0);

  // Category creation states
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Filter pending requests
  const pendingRequests = deliveries.filter(d => d.status === 'Pendiente');

  // Filter and sort items for display in the inventory table
  const displayItems = eppItems
    .filter(item => {
      const q = productSearchInput.trim().toLowerCase();
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || 
             item.sku.toLowerCase().includes(q) || 
             item.category.toLowerCase().includes(q);
    })
    .sort((a, b) => a.stock - b.stock);

  const openEditModal = (item: EPPItem) => {
    setSelectedProduct(item);
    setEditName(item.name);
    setEditSku(item.sku);
    setEditCategory(item.category);
    setEditDescription(item.description);
    setEditStock(item.stock);
    setEditMinStock(item.min_stock);
    setEditMaxStock(item.max_stock || 100);
    setEditImageUrl(item.image_url || '');
    setEditPrice(item.price || 0);
    setIsNewCategoryMode(false);
    setNewCategoryName('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const finalCategory = isNewCategoryMode ? newCategoryName.trim() : editCategory;
    if (!finalCategory) return;

    updateEPPItem({
      ...selectedProduct,
      name: editName,
      sku: editSku,
      category: finalCategory,
      description: editDescription,
      stock: editStock,
      min_stock: editMinStock,
      max_stock: editMaxStock,
      price: editPrice,
      image_url: editImageUrl.trim()
    });
    setIsEditModalOpen(false);
    setSelectedProduct(null);
  };

  const handleExportExcel = (items: EPPItem[]) => {
    let csvContent = "\uFEFF";
    csvContent += "Código SKU;Producto;Categoría;Stock Actual;Stock Mínimo;Stock Máximo;Precio;Estado\n";
    items.forEach(item => {
      const statusText = item.stock <= 0 ? 'Sin Stock' : item.stock <= item.min_stock ? 'Crítico' : item.stock > (item.max_stock || 100) ? 'Exceso' : 'Normal';
      const row = [
        item.sku,
        item.name,
        item.category,
        item.stock,
        item.min_stock,
        item.max_stock || 100,
        item.price || 0,
        statusText
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(';');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_epp_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStockStatusBadge = (stock: number, minStock: number, maxStock: number) => {
    if (stock <= 0) {
      return 'bg-error-container text-on-error-container font-label-md px-2.5 py-0.5 rounded-full uppercase text-[10px] font-bold border border-error/20';
    }
    if (stock <= minStock) {
      return 'bg-secondary-fixed text-on-secondary-fixed font-label-md px-2.5 py-0.5 rounded-full uppercase text-[10px] font-bold border border-secondary-fixed-dim/40';
    }
    if (stock > (maxStock || 100)) {
      return 'bg-blue-100 text-blue-800 font-label-md px-2.5 py-0.5 rounded-full uppercase text-[10px] font-bold border border-blue-200';
    }
    return 'bg-surface-container-high text-on-surface font-label-md px-2.5 py-0.5 rounded-full uppercase text-[10px] font-bold border border-outline-variant/50';
  };

  return (
    <div className="px-margin-page py-stack-lg max-w-container-max mx-auto w-full text-left flex flex-col gap-stack-lg">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-stack-md shrink-0">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Solicitudes e Inventario
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Gestión y autorización en tiempo real de solicitudes de EPP y control de bodega de productos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
        
        {/* Left Column: Pending Authorizations (2 spans) */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm min-h-[350px] flex flex-col">
            <h2 className="font-headline-sm text-headline-sm text-primary font-bold mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-3 shrink-0">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
              Autorizaciones Pendientes ({pendingRequests.length})
            </h2>

            <div className="flex-grow overflow-y-auto max-h-[500px] pr-1">
              {pendingRequests.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant opacity-60 flex flex-col items-center justify-center h-full gap-2">
                  <span className="material-symbols-outlined text-4xl">task_alt</span>
                  <p className="font-body-lg text-body-lg font-semibold">Todas las solicitudes han sido resueltas</p>
                  <p className="text-xs">No hay requerimientos de EPP en espera de validación administrativa.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pendingRequests.map((req) => {
                    const dateFormatted = new Date(req.created_at).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    const isOverMax = req.epp_item ? (req.epp_item.stock - req.quantity < 0) : false;

                    return (
                      <div key={req.id} className="border border-outline-variant/80 rounded-lg p-4 bg-surface-container-low/30 hover:bg-surface-container-low/55 transition-colors flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                        <div className="text-left flex flex-col gap-1.5 flex-grow">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                              {req.request_number || 'SOL-N/A'}
                            </span>
                            <span className="text-xs text-on-surface-variant font-mono-data">
                              Solicitado: {dateFormatted}
                            </span>
                          </div>
                          
                          <div>
                            <span className="font-bold text-on-surface text-base block">
                              {req.epp_item?.name || 'EPP Desconocido'}
                            </span>
                            <span className="text-xs text-on-surface-variant block mt-0.5">
                              Colaborador: <span className="font-bold text-primary">{req.worker ? `${req.worker.first_name} ${req.worker.last_name}` : 'Cargando...'}</span> ({req.worker?.rut})
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs">
                            <span className="text-on-surface-variant">
                              Cantidad Pedida: <strong className="text-primary font-mono-data">{req.quantity}</strong>
                            </span>
                            <span className="text-on-surface-variant">
                              Stock en Bodega: <strong className={req.epp_item && req.epp_item.stock <= req.epp_item.min_stock ? 'text-red-600 font-mono-data' : 'text-green-700 font-mono-data'}>{req.epp_item?.stock}</strong>
                            </span>
                            {req.epp_item && (
                              <span className="text-on-surface-variant font-semibold">
                                Precio Unitario: <strong className="text-primary font-mono-data">${(req.epp_item.price || 0).toLocaleString('es-CL')}</strong> | Total: <strong className="text-primary font-mono-data">${((req.epp_item.price || 0) * req.quantity).toLocaleString('es-CL')}</strong>
                              </span>
                            )}
                          </div>

                          {req.notes && (
                            <p className="text-[11px] text-on-surface-variant italic bg-surface-container-low border border-outline-variant/40 p-2 rounded mt-1.5 leading-normal">
                              Observaciones: "{req.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                          <button
                            onClick={() => rejectRequest(req.id)}
                            className="flex-1 sm:flex-initial px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            Rechazar
                          </button>
                          <button
                            onClick={() => {
                              if (isOverMax) {
                                if (!confirm('¡ATENCIÓN! La cantidad solicitada supera el stock disponible en bodega. ¿Desea autorizar de todos modos?')) {
                                  return;
                                }
                              }
                              approveRequest(req.id);
                            }}
                            className="flex-1 sm:flex-initial px-3.5 py-2 bg-primary text-on-primary hover:bg-primary-container text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Aprobar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inventory Filter & Quick Search */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full">
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm text-left flex flex-col min-h-[350px]">
            <h2 className="font-headline-sm text-headline-sm text-primary font-bold mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-3 shrink-0">
              <span className="material-symbols-outlined text-[22px]">filter_alt</span>
              Filtro de Inventario
            </h2>
            
            <div className="flex flex-col gap-4 flex-grow justify-start">
              <p className="text-xs text-on-surface-variant leading-relaxed shrink-0">
                Escribe para buscar un producto por su Código SKU, Nombre o Categoría. Esto filtrará la tabla de existencias de forma instantánea.
              </p>

              <div className="relative shrink-0 mt-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Buscar por Nombre, SKU o Categoría..."
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant focus:border-primary outline-none rounded-lg text-sm transition-colors h-10 text-left"
                />
              </div>

              {productSearchInput.trim() && (
                <div className="mt-2 text-xs text-on-surface-variant flex justify-between items-center bg-surface-container-low border border-outline-variant/50 p-2.5 rounded">
                  <span>Filtrando tabla inferior</span>
                  <button
                    onClick={() => setProductSearchInput('')}
                    className="text-red-600 hover:text-red-800 font-bold hover:underline"
                  >
                    Limpiar Filtro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* LOWER SECTION: Inventory Catalog Control Table */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[350px]">
        <div className="px-6 py-4 border-b border-outline-variant/60 bg-surface-container-low/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <h2 className="font-headline-sm text-headline-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">inventory</span>
            Control de Inventario y Stock Crítico
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleExportExcel(displayItems)}
              className="w-full sm:w-auto bg-[#166534] hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Descargar Planilla Excel"
            >
              <span className="material-symbols-outlined text-[16px]">table_view</span>
              Descargar Excel
            </button>
            <button
              onClick={() => navigate('catalog')}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver Catálogo
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface sticky top-0 border-b border-outline-variant z-10">
              <tr>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase text-xs tracking-wider font-semibold">SKU</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase text-xs tracking-wider font-semibold">Producto</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase text-xs tracking-wider font-semibold text-right">Existencias</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase text-xs tracking-wider font-semibold">Límites (Mín/Máx)</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase text-xs tracking-wider font-semibold text-right">Precio</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant uppercase text-xs tracking-wider font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/30">
              {displayItems.map((item) => {
                const statusText = item.stock <= 0 ? 'Sin Stock' : item.stock <= item.min_stock ? 'Crítico' : item.stock > (item.max_stock || 100) ? 'Exceso' : 'Normal';
                return (
                  <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors h-[42px] even:bg-surface-container-low/10">
                    <td className="px-4 py-2 font-mono-data text-xs">{item.sku}</td>
                    <td className="px-4 py-2 text-left">
                      <span className="font-semibold text-on-surface text-sm block">{item.name}</span>
                      <span className="text-[10px] text-on-surface-variant">{item.category}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStockStatusBadge(item.stock, item.min_stock, item.max_stock)}`}>
                        {item.stock} - {statusText}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono-data text-xs text-on-surface-variant">
                      Min: {item.min_stock} / Max: {item.max_stock || 100}
                    </td>
                    <td className="px-4 py-2 text-right font-mono-data font-bold text-primary text-sm">
                      ${(item.price || 0).toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 text-xs text-primary font-bold border border-outline rounded hover:bg-surface-container-low transition-colors"
                      >
                        Modificar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Modificar Producto */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-2xl p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">edit_note</span>
                Modificar Parámetros de Producto
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {/* Row 1: Nombre / SKU / Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="p-name" className="text-xs font-semibold text-on-surface-variant uppercase">Nombre de Producto</label>
                  <input
                    id="p-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="p-sku" className="text-xs font-semibold text-on-surface-variant uppercase">Código SKU</label>
                  <input
                    id="p-sku"
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="p-cat" className="text-xs font-semibold text-on-surface-variant uppercase">Categoría</label>
                  <div className="flex gap-2">
                    <select
                      id="p-cat"
                      disabled={isNewCategoryMode}
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none bg-white flex-grow"
                    >
                      <option value="Protección Cabeza">Protección Cabeza</option>
                      <option value="Protección Manos">Protección Manos</option>
                      <option value="Ropa Seguridad">Ropa Seguridad</option>
                      <option value="Protección Pies">Protección Pies</option>
                      <option value="Protección Visual">Protección Visual</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}
                      className={`h-10 px-3 border rounded text-xs font-bold transition-all ${
                        isNewCategoryMode ? 'bg-primary text-on-primary border-primary' : 'border-outline hover:bg-surface-container-low'
                      }`}
                    >
                      Nueva
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Stock Mínimo / Stock Máximo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="p-max" className="text-xs font-semibold text-on-surface-variant uppercase">Stock Máximo</label>
                  <input
                    id="p-max"
                    type="number"
                    min="1"
                    required
                    value={editMaxStock}
                    onChange={(e) => setEditMaxStock(parseInt(e.target.value) || 0)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none text-center font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="p-min" className="text-xs font-semibold text-on-surface-variant uppercase">Stock Mínimo</label>
                  <input
                    id="p-min"
                    type="number"
                    min="1"
                    required
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(parseInt(e.target.value) || 0)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none text-center font-mono-data"
                  />
                </div>
              </div>

              {/* Dynamic New Category Input Row */}
              {isNewCategoryMode && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="p-new-cat" className="text-xs font-semibold text-on-surface-variant uppercase">Nombre de Nueva Categoría</label>
                  <input
                    id="p-new-cat"
                    type="text"
                    required
                    placeholder="Ej: Protección Auditiva"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none"
                  />
                </div>
              )}

              {/* Row 3: Stock Actual / Precio / Imagen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="p-stock" className="text-xs font-semibold text-on-surface-variant uppercase">Stock Actual</label>
                  <input
                    id="p-stock"
                    type="number"
                    min="0"
                    required
                    value={editStock}
                    onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none text-center font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="p-price" className="text-xs font-semibold text-on-surface-variant uppercase">Precio Unitario ($)</label>
                  <input
                    id="p-price"
                    type="number"
                    min="0"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none text-center font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Imagen (Archivo WebP)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const webpBase64 = await convertToWebP(file);
                            setEditImageUrl(webpBase64);
                          } catch (err) {
                            console.error(err);
                            alert('Error al convertir la imagen a WebP');
                          }
                        }
                      }}
                      className="text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer w-full"
                    />
                    {editImageUrl && (
                      <div className="w-8 h-8 border border-outline-variant rounded overflow-hidden flex items-center justify-center bg-surface-container shrink-0">
                        <img src={editImageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Descripción */}
              <div className="flex flex-col gap-1">
                <label htmlFor="p-desc" className="text-xs font-semibold text-on-surface-variant uppercase">Descripción</label>
                <textarea
                  id="p-desc"
                  required
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="p-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
