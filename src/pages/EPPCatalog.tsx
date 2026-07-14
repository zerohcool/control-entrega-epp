import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryIcon } from '../models/types';
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

export const EPPCatalog: React.FC = () => {
  const { 
    eppItems, 
    workers, 
    selectedWorkerId, 
    navigate, 
    addToCart, 
    user, 
    updateEPPItem, 
    registerEPPItem,
    suppliers,
    registerStockReplenishment
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [quantities, setQuantities] = useState<{ [id: string]: number }>({});
  
  // Image loading fail fallback states
  const [failedImages, setFailedImages] = useState<{ [id: string]: boolean }>({});

  // Worker dropdown and search state
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');
  const [isWorkerDropdownOpen, setIsWorkerDropdownOpen] = useState(false);

  // Edit Product Modal states
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

  // Category creation states for Edit
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Product Create Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSku, setCreateSku] = useState('');
  const [createCategory, setCreateCategory] = useState('Protección Cabeza');
  const [createDescription, setCreateDescription] = useState('');
  const [createStock, setCreateStock] = useState(0);
  const [createMinStock, setCreateMinStock] = useState(10);
  const [createMaxStock, setCreateMaxStock] = useState(100);
  const [createImageUrl, setCreateImageUrl] = useState('');
  const [createPrice, setCreatePrice] = useState(0);

  // Category creation states for Create
  const [isNewCategoryModeForCreate, setIsNewCategoryModeForCreate] = useState(false);
  const [newCategoryNameForCreate, setNewCategoryNameForCreate] = useState('');

  // Stock entry states
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedEppId, setSelectedEppId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [stockQuantity, setStockQuantity] = useState(1);

  const handleQuantityChange = (itemId: string, val: number, maxStock: number) => {
    const qty = Math.max(1, Math.min(maxStock, val));
    setQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  // Get list of categories dynamically from inventory
  const categories = ['Todas', ...Array.from(new Set(eppItems.map(item => item.category)))];

  const filteredItems = eppItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Worker dropdown filter
  const filteredWorkersList = workers.filter(w => {
    const q = workerSearchQuery.toLowerCase().replace(/[\.-]/g, '');
    const fullName = `${w.first_name} ${w.last_name}`.toLowerCase();
    const rut = w.rut.replace(/[\.-]/g, '').toLowerCase();
    return fullName.includes(q) || rut.includes(q);
  });

  const handleAddToCart = (item: EPPItem) => {
    const qty = quantities[item.id] || 1;
    addToCart(item, qty);
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategory = isNewCategoryModeForCreate ? newCategoryNameForCreate.trim() : createCategory;
    if (!finalCategory) return;

    registerEPPItem({
      name: createName,
      sku: createSku,
      category: finalCategory,
      description: createDescription,
      stock: createStock,
      min_stock: createMinStock,
      max_stock: createMaxStock,
      price: createPrice,
      image_url: createImageUrl.trim()
    });
    setIsCreateModalOpen(false);
    // Reset fields
    setCreateName('');
    setCreateSku('');
    setCreateCategory('Protección Cabeza');
    setCreateDescription('');
    setCreateStock(0);
    setCreateMinStock(10);
    setCreateMaxStock(100);
    setCreateImageUrl('');
    setCreatePrice(0);
    setIsNewCategoryModeForCreate(false);
    setNewCategoryNameForCreate('');
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEppId || !selectedSupplierId) return;
    registerStockReplenishment({
      epp_id: selectedEppId,
      supplier_id: selectedSupplierId,
      quantity: stockQuantity
    });
    setIsStockModalOpen(false);
    setSelectedEppId('');
    setSelectedSupplierId('');
    setStockQuantity(1);
  };

  return (
    <div className="flex-grow p-margin-page flex flex-col gap-stack-lg bg-background text-left max-w-container-max mx-auto w-full">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-stack-md shrink-0">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Catálogo de Productos (EPP)
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Visualización de inventario disponible y asignación rápida de pedidos a colaboradores.
          </p>
        </div>

        {/* Admin trigger buttons */}
        {user?.role === 'admin' && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                setSelectedEppId('');
                setSelectedSupplierId('');
                setStockQuantity(1);
                setIsStockModalOpen(true);
              }}
              className="w-full sm:w-auto bg-secondary-container text-on-secondary-container font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-all font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Nueva Entrada Stock
            </button>
            <button
              onClick={() => {
                setCreateName('');
                setCreateSku('');
                setCreateCategory('Protección Cabeza');
                setCreateDescription('');
                setCreateStock(0);
                setCreateMinStock(10);
                setCreateMaxStock(100);
                setCreateImageUrl('');
                setCreatePrice(0);
                setIsNewCategoryModeForCreate(false);
                setNewCategoryNameForCreate('');
                setIsCreateModalOpen(true);
              }}
              className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo Producto
            </button>
          </div>
        )}
      </div>

      {/* Selector Colaborador (Search Input with coincidences list) */}
      <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl bg-primary/10 p-2 rounded-xl">badge</span>
          <div className="text-left">
            <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider block">Colaborador Asignado</span>
            <span className="font-bold text-on-surface text-base">
              {selectedWorker ? `${selectedWorker.first_name} ${selectedWorker.last_name}` : 'Ninguno (Selecciona un colaborador)'}
            </span>
            {selectedWorker && <span className="text-xs text-on-surface-variant block mt-0.5">RUT: {selectedWorker.rut} | Cargo: {selectedWorker.cargo}</span>}
          </div>
        </div>

        {/* Interactive Search Input List */}
        <div className="relative w-full md:w-80">
          <button
            onClick={() => setIsWorkerDropdownOpen(!isWorkerDropdownOpen)}
            className="w-full h-10 px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-left flex justify-between items-center text-on-surface hover:bg-surface-container-high transition-colors focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <span className="truncate">{selectedWorker ? `${selectedWorker.first_name} ${selectedWorker.last_name}` : 'Buscar colaborador...'}</span>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_drop_down</span>
          </button>

          {isWorkerDropdownOpen && (
            <div className="absolute right-0 left-0 mt-1.5 bg-white border border-outline-variant rounded-xl shadow-xl z-30 p-3 flex flex-col gap-2 max-h-[300px]">
              <div className="relative w-full shrink-0">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Escribe el nombre o RUT..."
                  value={workerSearchQuery}
                  onChange={(e) => setWorkerSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs outline-none focus:border-primary text-left"
                />
              </div>
              <div className="overflow-y-auto flex-grow divide-y divide-outline-variant/30 mt-1">
                {filteredWorkersList.length === 0 ? (
                  <div className="py-4 text-center text-xs text-on-surface-variant opacity-60">
                    No se encontraron coincidencias.
                  </div>
                ) : (
                  filteredWorkersList.map(w => (
                    <button
                      key={w.id}
                      onClick={() => {
                        navigate('catalog', w.id);
                        setIsWorkerDropdownOpen(false);
                        setWorkerSearchQuery('');
                      }}
                      className={`w-full text-left p-2 hover:bg-surface-container-low text-xs transition-colors flex justify-between items-center ${
                        selectedWorkerId === w.id ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span>{w.first_name} {w.last_name}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono-data">RUT: {w.rut}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-semibold">{w.cargo}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Products */}
      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Search Field */}
        <div className="relative w-full lg:w-96 h-10">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por SKU, nombre de EPP o descripción..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg text-sm transition-colors h-10 text-left"
          />
        </div>

        {/* Categories Horizontal Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-white text-on-surface border-outline-variant hover:bg-surface-container-low'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid - Now in 4 columns for large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12 opacity-60">
            <span className="material-symbols-outlined text-4xl mb-3">sentiment_dissatisfied</span>
            <p className="text-body-lg">No se encontraron productos en esta categoría.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const currentQty = quantities[item.id] || 1;
            const isOutOfStock = item.stock <= 0;
            const isLowStock = item.stock <= item.min_stock;

            return (
              <article
                key={item.id}
                className={`bg-white border rounded-xl overflow-hidden flex flex-col transition-all duration-200 ${
                  isOutOfStock
                    ? 'border-outline-variant/40 opacity-75 shadow-none'
                    : isLowStock
                    ? 'border-amber-200 hover:border-amber-300 shadow-sm hover:shadow-md'
                    : 'border-outline-variant hover:border-primary/40 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Product Image */}
                <div className="h-48 bg-surface-container-low relative flex justify-center items-center p-6 border-b border-outline-variant/30">
                  {item.image_url && !failedImages[item.id] ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      onError={() => setFailedImages(prev => ({ ...prev, [item.id]: true }))}
                      className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center text-primary/60">
                      <span className="material-symbols-outlined text-5xl">{getCategoryIcon(item.category)}</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-surface-container px-2 py-0.5 rounded text-[10px] uppercase font-bold text-on-surface-variant border border-outline-variant/50">
                    {item.category}
                  </span>
                </div>

                {/* Product Details */}
                <div className="p-5 flex flex-col flex-grow text-left">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h2 className="font-label-lg text-label-lg text-on-surface font-bold line-clamp-2">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono-data text-mono-data text-on-surface-variant text-xs bg-surface-container px-1 py-0.5 rounded">
                        {item.sku}
                      </span>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 rounded border border-outline-variant hover:bg-surface-container-low text-primary flex items-center justify-center transition-colors cursor-pointer"
                          title="Editar Producto"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-3 flex-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Price info card block */}
                  <div className="mb-3 text-left border-y border-outline-variant/20 py-2">
                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider block">Precio Unitario</span>
                    <span className="text-base font-black text-primary block mt-0.5">${(item.price || 0).toLocaleString('es-CL')}</span>
                  </div>

                  <div className="flex justify-between items-center mb-4 shrink-0">
                    {isOutOfStock ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Sin Stock (ref: {item.max_stock || 100})
                      </span>
                    ) : isLowStock ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#b45309]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b45309]"></span> Crítico: {item.stock} / {item.max_stock || 100}
                      </span>
                    ) : item.stock > (item.max_stock || 100) ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Exceso: {item.stock} / {item.max_stock || 100}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#166534]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span> Stock: {item.stock} / {item.max_stock || 100}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-outline-variant pt-4 mt-auto shrink-0">
                    {/* Quantity selectors */}
                    {!isOutOfStock ? (
                      <div className="flex items-center border border-outline-variant rounded bg-surface h-[36px]">
                        <button
                          onClick={() => handleQuantityChange(item.id, currentQty - 1, item.stock)}
                          className="px-2 py-1 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">remove</span>
                        </button>
                        <input
                          type="number"
                          value={currentQty}
                          min="1"
                          max={item.stock}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1, item.stock)}
                          className="w-10 text-center bg-transparent border-none text-on-surface font-mono-data text-mono-data p-0 h-full text-sm outline-none"
                        />
                        <button
                          onClick={() => handleQuantityChange(item.id, currentQty + 1, item.stock)}
                          className="px-2 py-1 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">add</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center border border-outline-variant rounded bg-surface-container-high h-[36px] opacity-50 pointer-events-none">
                        <button className="px-2 py-1 text-outline cursor-not-allowed">
                          <span className="material-symbols-outlined text-xs">remove</span>
                        </button>
                        <input
                          type="number"
                          disabled
                          value="0"
                          className="w-10 text-center bg-transparent border-none text-outline font-mono-data text-mono-data p-0 h-full text-sm"
                        />
                        <button className="px-2 py-1 text-outline cursor-not-allowed">
                          <span className="material-symbols-outlined text-xs">add</span>
                        </button>
                      </div>
                    )}

                    {!isOutOfStock ? (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex-grow bg-[#f97316] hover:bg-[#ea580c] text-white font-label-md text-label-md py-2 px-3 rounded transition-colors flex justify-center items-center gap-1.5 h-[36px] font-semibold text-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                        Agregar
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-grow bg-surface-container-high border border-outline-variant text-outline font-label-md text-label-md py-2 px-3 rounded cursor-not-allowed flex justify-center items-center gap-1.5 h-[36px] font-semibold text-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                        Agotado
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* MODAL: Editar Producto (EPPItem) */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-lg p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg text-left w-full justify-between pr-4">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">edit_note</span>
                  Modificar Detalles de Producto
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {/* Row 1: Nombre de Producto / SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label htmlFor="p-sku" className="text-xs font-semibold text-on-surface-variant uppercase">SKU / Referencia</label>
                  <input
                    id="p-sku"
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none font-mono-data"
                  />
                </div>
              </div>

              {/* Row 2: Categoría / Stock Máximo / Stock Mínimo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label htmlFor="p-cat" className="text-xs font-semibold text-on-surface-variant uppercase">Categoría</label>
                  <select
                    id="p-cat"
                    required
                    value={isNewCategoryMode ? 'NEW' : editCategory}
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        setIsNewCategoryMode(true);
                      } else {
                        setIsNewCategoryMode(false);
                        setEditCategory(e.target.value);
                      }
                    }}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none bg-white"
                  >
                    {Array.from(new Set(eppItems.map(item => item.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="NEW">+ Nueva Categoría...</option>
                  </select>
                </div>

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

              {/* Row 3: Stock Actual / Precio / Carga de Archivo WebP */}
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

      {/* MODAL: Agregar Producto (EPPItem) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-lg p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg text-left w-full justify-between pr-4">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">add_circle</span>
                  Agregar Nuevo Producto
                </span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full transition-colors animate-fade-in"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              {/* Row 1: Nombre de Producto / SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="c-name" className="text-xs font-semibold text-on-surface-variant uppercase">Nombre de Producto</label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    placeholder="Ej: Tapón Auditivo de Silicona"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="c-sku" className="text-xs font-semibold text-on-surface-variant uppercase">SKU / Referencia</label>
                  <input
                    id="c-sku"
                    type="text"
                    required
                    placeholder="Ej: REF-189"
                    value={createSku}
                    onChange={(e) => setCreateSku(e.target.value)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none font-mono-data"
                  />
                </div>
              </div>

              {/* Row 2: Categoría / Stock Máximo / Stock Mínimo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label htmlFor="c-cat" className="text-xs font-semibold text-on-surface-variant uppercase">Categoría</label>
                  <select
                    id="c-cat"
                    required
                    value={isNewCategoryModeForCreate ? 'NEW' : createCategory}
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        setIsNewCategoryModeForCreate(true);
                      } else {
                        setIsNewCategoryModeForCreate(false);
                        setCreateCategory(e.target.value);
                      }
                    }}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none bg-white"
                  >
                    {Array.from(new Set(eppItems.map(item => item.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="NEW">+ Nueva Categoría...</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="c-max" className="text-xs font-semibold text-on-surface-variant uppercase">Stock Máximo</label>
                  <input
                    id="c-max"
                    type="number"
                    min="1"
                    required
                    value={createMaxStock}
                    onChange={(e) => setCreateMaxStock(parseInt(e.target.value) || 0)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none text-center font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="c-min" className="text-xs font-semibold text-on-surface-variant uppercase">Stock Mínimo</label>
                  <input
                    id="c-min"
                    type="number"
                    min="1"
                    required
                    value={createMinStock}
                    onChange={(e) => setCreateMinStock(parseInt(e.target.value) || 0)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none text-center font-mono-data"
                  />
                </div>
              </div>

              {/* Dynamic New Category Input Row */}
              {isNewCategoryModeForCreate && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="c-new-cat" className="text-xs font-semibold text-on-surface-variant uppercase">Nombre de Nueva Categoría</label>
                  <input
                    id="c-new-cat"
                    type="text"
                    required
                    placeholder="Ej: Protección Auditiva"
                    value={newCategoryNameForCreate}
                    onChange={(e) => setNewCategoryNameForCreate(e.target.value)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none"
                  />
                </div>
              )}

              {/* Row 3: Stock Inicial / Precio / Carga de Archivo WebP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="c-stock" className="text-xs font-semibold text-on-surface-variant uppercase">Stock Inicial</label>
                  <input
                    id="c-stock"
                    type="number"
                    min="0"
                    required
                    value={createStock}
                    onChange={(e) => setCreateStock(parseInt(e.target.value) || 0)}
                    className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none text-center font-mono-data"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="c-price" className="text-xs font-semibold text-on-surface-variant uppercase">Precio Unitario ($)</label>
                  <input
                    id="c-price"
                    type="number"
                    min="0"
                    required
                    value={createPrice}
                    onChange={(e) => setCreatePrice(parseInt(e.target.value) || 0)}
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
                            setCreateImageUrl(webpBase64);
                          } catch (err) {
                            console.error(err);
                            alert('Error al convertir la imagen a WebP');
                          }
                        }
                      }}
                      className="text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer w-full"
                    />
                    {createImageUrl && (
                      <div className="w-8 h-8 border border-outline-variant rounded overflow-hidden flex items-center justify-center bg-surface-container shrink-0">
                        <img src={createImageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Descripción */}
              <div className="flex flex-col gap-1">
                <label htmlFor="c-desc" className="text-xs font-semibold text-on-surface-variant uppercase">Descripción</label>
                <textarea
                  id="c-desc"
                  required
                  rows={3}
                  placeholder="Ingrese una breve descripción de las características técnicas del producto..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="p-3 border border-outline-variant rounded font-body-sm text-body-sm text-on-surface focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm"
                >
                  Registrar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Entrada de Stock */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-md p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined text-secondary">add_circle</span>
                Registrar Entrada de Stock
              </h3>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="sku-select" className="block text-xs font-semibold text-on-surface-variant uppercase">
                  Seleccionar Producto EPP
                </label>
                <select
                  id="sku-select"
                  value={selectedEppId}
                  onChange={(e) => setSelectedEppId(e.target.value)}
                  required
                  className="h-10 px-3 bg-white border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                >
                  <option value="">-- Seleccione un EPP --</option>
                  {eppItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - Stock actual: {item.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="supplier-select" className="block text-xs font-semibold text-on-surface-variant uppercase">
                  Seleccionar Proveedor
                </label>
                <select
                  id="supplier-select"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                  className="h-10 px-3 bg-white border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                >
                  <option value="">-- Seleccione un Proveedor --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="stock-qty" className="block text-xs font-semibold text-on-surface-variant uppercase">
                  Cantidad a Ingresar
                </label>
                <div className="flex items-center h-10 w-32 border border-outline-variant rounded bg-surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setStockQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors border-r border-outline-variant cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">remove</span>
                  </button>
                  <input
                    id="stock-qty"
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-12 text-center bg-transparent border-none focus:ring-0 font-mono-data text-mono-data p-0 h-full text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setStockQuantity(prev => prev + 1)}
                    className="w-10 h-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors border-l border-outline-variant cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">add</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
