import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Worker, Supplier, AdminUser, DeliveryWithDetails } from '../models/types';
import { dbService } from '../services/dbService';

interface ParsedWorkerRow {
  rut: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cargo: string;
  department: string;
  isValid: boolean;
  error?: string;
}

const parseImportText = (text: string, existingWorkers: Worker[]): ParsedWorkerRow[] => {
  if (!text.trim()) return [];
  const lines = text.split(/\r?\n/);
  const rows: ParsedWorkerRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect separator: Tab, Semicolon, or Comma
    let cols: string[] = [];
    if (line.includes('\t')) {
      cols = line.split('\t');
    } else if (line.includes(';')) {
      cols = line.split(';');
    } else {
      cols = line.split(',');
    }

    // Expecting 7 columns: RUT, Nombre, Apellido, Email, Teléfono, Cargo, Departamento
    if (cols.length < 7) {
      rows.push({
        rut: cols[0] || '',
        first_name: cols[1] || '',
        last_name: cols[2] || '',
        email: cols[3] || '',
        phone: cols[4] || '',
        cargo: cols[5] || '',
        department: cols[6] || '',
        isValid: false,
        error: `Faltan columnas (se detectaron ${cols.length} de 7)`
      });
      continue;
    }

    const cleanRut = cols[0].trim();
    const first_name = cols[1].trim();
    const last_name = cols[2].trim();
    const email = cols[3].trim();
    const phone = cols[4].trim();
    const cargo = cols[5].trim();
    const department = cols[6].trim();

    // Validations
    let error = '';
    const cleanRutSearch = cleanRut.replace(/[\.-]/g, '').toLowerCase();
    
    // Check duplication in existing workers
    const isDuplicateInDb = existingWorkers.some(w => w.rut.replace(/[\.-]/g, '').toLowerCase() === cleanRutSearch);
    // Check duplication in current import batch
    const isDuplicateInBatch = rows.some(r => r.rut.replace(/[\.-]/g, '').toLowerCase() === cleanRutSearch);

    if (!cleanRut) {
      error = 'RUT requerido';
    } else if (!first_name || !last_name) {
      error = 'Nombre/Apellido requerido';
    } else if (isDuplicateInDb) {
      error = 'El RUT ya está registrado en el sistema';
    } else if (isDuplicateInBatch) {
      error = 'RUT duplicado en este listado';
    }

    rows.push({
      rut: cleanRut,
      first_name,
      last_name,
      email,
      phone,
      cargo,
      department,
      isValid: !error,
      error
    });
  }

  return rows;
};

export const WorkerSearch: React.FC = () => {
  const { 
    workers, 
    suppliers, 
    deliveries,
    historyLogs, 
    registerWorker, 
    registerSupplier, 
    updateWorker, 
    deleteWorker,
    updateSupplier, 
    navigate,
    admins,
    registerAdmin,
    updateAdmin,
    deleteAdmin,
    setAlert
  } = useApp();

  // Tab: 'workers' | 'suppliers' | 'admins'
  const [activeTab, setActiveTab] = useState<'workers' | 'suppliers' | 'admins'>('workers');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state: Worker
  const [isCreateWorkerOpen, setIsCreateWorkerOpen] = useState(false);
  const [isEditWorkerOpen, setIsEditWorkerOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Modals state: Bulk Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Modals state: Supplier
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [isSupplierMovementsOpen, setIsSupplierMovementsOpen] = useState(false);
  const [selectedSupplierForMovements, setSelectedSupplierForMovements] = useState<Supplier | null>(null);

  // Modals state: Admin
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Form State: Worker
  const [wRut, setWRut] = useState('');
  const [wFirstName, setWFirstName] = useState('');
  const [wLastName, setWLastName] = useState('');
  const [wEmail, setWEmail] = useState('');
  const [wPhone, setWPhone] = useState('');
  const [wCargo, setWCargo] = useState('');
  const [wDepartment, setWDepartment] = useState('');
  const [wStatus, setWStatus] = useState<'Activo' | 'Inactivo'>('Activo');

  // Form State: Supplier
  const [sRut, setSRut] = useState('');
  const [sName, setSName] = useState('');
  const [sContact, setSContact] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPhone, setSPhone] = useState('');

  // Form State: Admin
  const [admUsername, setAdmUsername] = useState('');
  const [admFirstName, setAdmFirstName] = useState('');
  const [admLastName, setAdmLastName] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admPassword, setAdmPassword] = useState('');

  // Mass Print States
  const [isMassPrintModalOpen, setIsMassPrintModalOpen] = useState(false);
  const [massPrintStartDate, setMassPrintStartDate] = useState('');
  const [massPrintEndDate, setMassPrintEndDate] = useState('');
  const [massPrintStatus, setMassPrintStatus] = useState('Todos');
  const [massPrintDeliveries, setMassPrintDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [isFetchingMassPrint, setIsFetchingMassPrint] = useState(false);

  // Filter lists in memory
  const filteredWorkers = workers.filter(w => {
    const q = searchQuery.toLowerCase().replace(/[\.-]/g, '');
    const fullName = `${w.first_name} ${w.last_name}`.toLowerCase();
    const rut = w.rut.replace(/[\.-]/g, '').toLowerCase();
    const cargo = w.cargo.toLowerCase();
    const dept = w.department.toLowerCase();
    return fullName.includes(q) || rut.includes(q) || cargo.includes(q) || dept.includes(q);
  });

  const filteredSuppliers = suppliers.filter(s => {
    const q = searchQuery.toLowerCase().replace(/[\.-]/g, '');
    const name = s.name.toLowerCase();
    const rut = s.rut.replace(/[\.-]/g, '').toLowerCase();
    const contact = s.contact.toLowerCase();
    return name.includes(q) || rut.includes(q) || contact.includes(q);
  });

  const filteredAdmins = admins.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${a.first_name} ${a.last_name}`.toLowerCase();
    const user = a.username.toLowerCase();
    const email = a.email.toLowerCase();
    return fullName.includes(q) || user.includes(q) || email.includes(q);
  });

  // Group deliveries by Worker for mass printing
  const workerGroups: { worker: Worker; deliveries: DeliveryWithDetails[] }[] = [];
  massPrintDeliveries.forEach(d => {
    if (!d.worker) return;
    let group = workerGroups.find(g => g.worker.id === d.worker_id);
    if (!group) {
      group = { worker: d.worker, deliveries: [] };
      workerGroups.push(group);
    }
    group.deliveries.push(d);
  });

  // Modal Handlers: Worker Create
  const handleCreateWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerWorker({
      rut: wRut,
      first_name: wFirstName,
      last_name: wLastName,
      email: wEmail,
      phone: wPhone,
      cargo: wCargo,
      department: wDepartment
    });
    setIsCreateWorkerOpen(false);
    clearWorkerForm();
  };

  // Modal Handlers: Worker Edit
  const openEditWorker = (w: Worker) => {
    setSelectedWorker(w);
    setWRut(w.rut);
    setWFirstName(w.first_name);
    setWLastName(w.last_name);
    setWEmail(w.email);
    setWPhone(w.phone);
    setWCargo(w.cargo);
    setWDepartment(w.department);
    setWStatus(w.status);
    setIsEditWorkerOpen(true);
  };

  const handleEditWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    updateWorker({
      ...selectedWorker,
      rut: wRut,
      first_name: wFirstName,
      last_name: wLastName,
      email: wEmail,
      phone: wPhone,
      cargo: wCargo,
      department: wDepartment,
      status: wStatus
    });
    setIsEditWorkerOpen(false);
    setSelectedWorker(null);
    clearWorkerForm();
  };

  const clearWorkerForm = () => {
    setWRut('');
    setWFirstName('');
    setWLastName('');
    setWEmail('');
    setWPhone('');
    setWCargo('');
    setWDepartment('');
    setWStatus('Activo');
  };

  // Bulk Import logic
  const parsedImportRows = parseImportText(importText, workers);
  const validImportRowsCount = parsedImportRows.filter(r => r.isValid).length;

  const handleBulkImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = parsedImportRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    validRows.forEach(row => {
      registerWorker({
        rut: row.rut,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        cargo: row.cargo,
        department: row.department
      });
    });

    setIsImportModalOpen(false);
    setImportText('');
    setAlert(`Importación exitosa: se registraron ${validRows.length} colaboradores`, 'success');
  };

  // Modal Handlers: Supplier Create
  const handleCreateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerSupplier({
      rut: sRut,
      name: sName,
      contact: sContact,
      email: sEmail,
      phone: sPhone
    });
    setIsCreateSupplierOpen(false);
    clearSupplierForm();
  };

  // Modal Handlers: Supplier Edit
  const openEditSupplier = (s: Supplier) => {
    setSelectedSupplier(s);
    setSRut(s.rut);
    setSName(s.name);
    setSContact(s.contact);
    setSEmail(s.email);
    setSPhone(s.phone);
    setIsEditSupplierOpen(true);
  };

  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    updateSupplier({
      ...selectedSupplier,
      rut: sRut,
      name: sName,
      contact: sContact,
      email: sEmail,
      phone: sPhone
    });
    setIsEditSupplierOpen(false);
    setSelectedSupplier(null);
    clearSupplierForm();
  };

  const clearSupplierForm = () => {
    setSRut('');
    setSName('');
    setSContact('');
    setSEmail('');
    setSPhone('');
  };

  // Supplier movements list calculation
  const getSupplierMovements = (supplierRut: string) => {
    return historyLogs.filter(log => log.type === 'Ingreso' && log.details.includes(supplierRut));
  };

  const openSupplierMovements = (s: Supplier) => {
    setSelectedSupplierForMovements(s);
    setIsSupplierMovementsOpen(true);
  };

  // Modal Handlers: Admin Create
  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerAdmin({
      username: admUsername.trim(),
      first_name: admFirstName.trim(),
      last_name: admLastName.trim(),
      email: admEmail.trim(),
      password_hash: admPassword
    });
    setIsCreateAdminOpen(false);
    clearAdminForm();
  };

  // Modal Handlers: Admin Edit
  const openEditAdmin = (a: AdminUser) => {
    setSelectedAdmin(a);
    setAdmUsername(a.username);
    setAdmFirstName(a.first_name);
    setAdmLastName(a.last_name);
    setAdmEmail(a.email);
    setAdmPassword(''); // Clear password field for typing new one
    setIsEditAdminOpen(true);
  };

  const handleEditAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    updateAdmin({
      ...selectedAdmin,
      username: admUsername.trim(),
      first_name: admFirstName.trim(),
      last_name: admLastName.trim(),
      email: admEmail.trim(),
      password_hash: admPassword || selectedAdmin.password_hash // keep old password if left blank
    });
    setIsEditAdminOpen(false);
    setSelectedAdmin(null);
    clearAdminForm();
  };

  const clearAdminForm = () => {
    setAdmUsername('');
    setAdmFirstName('');
    setAdmLastName('');
    setAdmEmail('');
    setAdmPassword('');
  };

  const getWorkerStats = (workerId: string) => {
    const wDeliveries = deliveries.filter(d => d.worker_id === workerId);
    const totalDelivered = wDeliveries.filter(d => d.status === 'Entregado').reduce((acc, curr) => acc + curr.quantity, 0);
    const totalPending = wDeliveries.filter(d => d.status === 'Pendiente').length;
    
    const lastDeliveryItem = wDeliveries
      .filter(d => d.status === 'Entregado' && d.delivered_at)
      .sort((a, b) => new Date(b.delivered_at!).getTime() - new Date(a.delivered_at!).getTime())[0];
    
    const lastDeliveryDate = lastDeliveryItem && lastDeliveryItem.delivered_at
      ? new Date(lastDeliveryItem.delivered_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'No registra';
      
    return { totalDelivered, totalPending, lastDeliveryItem, lastDeliveryDate };
  };

  const handleMassPrintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (massPrintStartDate && massPrintEndDate) {
      const start = new Date(massPrintStartDate + 'T00:00:00');
      const end = new Date(massPrintEndDate + 'T00:00:00');
      if (start > end) {
        setAlert('La fecha "Desde" no puede ser mayor que "Hasta".', 'error');
        return;
      }
    }

    setIsFetchingMassPrint(true);
    try {
      const data = await dbService.getFilteredDeliveriesForPrinting(
        massPrintStartDate,
        massPrintEndDate,
        massPrintStatus
      );

      if (data.length === 0) {
        setAlert('No existen registros para los criterios seleccionados.', 'warning');
        setIsMassPrintModalOpen(false);
        return;
      }

      // Group and sort deliveries: Department -> Worker Name -> Date of Delivery
      const sorted = [...data].sort((a, b) => {
        const deptA = a.worker?.department || '';
        const deptB = b.worker?.department || '';
        const deptComp = deptA.localeCompare(deptB);
        if (deptComp !== 0) return deptComp;

        const nameA = `${a.worker?.first_name} ${a.worker?.last_name}` || '';
        const nameB = `${b.worker?.first_name} ${b.worker?.last_name}` || '';
        const nameComp = nameA.localeCompare(nameB);
        if (nameComp !== 0) return nameComp;

        const dateA = new Date(a.delivered_at || a.created_at).getTime();
        const dateB = new Date(b.delivered_at || b.created_at).getTime();
        return dateA - dateB;
      });

      setMassPrintDeliveries(sorted);
      setIsMassPrintModalOpen(false);

      // Trigger print in next tick
      setTimeout(() => {
        window.print();
        setMassPrintDeliveries([]);
      }, 500);

    } catch (error) {
      console.error(error);
      setAlert('Error al generar la impresión masiva', 'error');
    } finally {
      setIsFetchingMassPrint(false);
    }
  };

  return (
    <>
      <div className={`px-margin-page py-stack-lg max-w-container-max mx-auto w-full text-left flex flex-col gap-stack-lg ${massPrintDeliveries.length > 0 ? 'print:hidden' : ''}`}>
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Personal / Proveedores
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Administración unificada de colaboradores autorizados, proveedores del almacén y cuentas administrativas.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {activeTab === 'workers' && (
            <>
              <button
                onClick={() => {
                  setImportText('');
                  setIsImportModalOpen(true);
                }}
                className="w-full sm:w-auto bg-surface-container-high border border-outline text-primary font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">publish</span>
                Importar Masivo
              </button>
              <button
                onClick={() => {
                  setMassPrintStartDate('');
                  setMassPrintEndDate('');
                  setMassPrintStatus('Todos');
                  setIsMassPrintModalOpen(true);
                }}
                className="w-full sm:w-auto bg-white border border-outline text-primary font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors font-bold shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Imprimir Registros Masivos
              </button>
              <button
                onClick={() => setIsCreateWorkerOpen(true)}
                className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Crear Colaborador
              </button>
            </>
          )}
          {activeTab === 'suppliers' && (
            <button
              onClick={() => setIsCreateSupplierOpen(true)}
              className="w-full sm:w-auto bg-secondary-container text-on-secondary-container font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-all font-bold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              Crear Proveedor
            </button>
          )}
          {activeTab === 'admins' && (
            <button
              onClick={() => setIsCreateAdminOpen(true)}
              className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors font-bold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              Crear Administrador
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/60 flex-wrap">
        <button
          onClick={() => {
            setActiveTab('workers');
            setSearchQuery('');
          }}
          className={`px-5 py-3 font-label-lg text-label-lg font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'workers'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">badge</span>
          Colaboradores ({filteredWorkers.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('suppliers');
            setSearchQuery('');
          }}
          className={`px-5 py-3 font-label-lg text-label-lg font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'suppliers'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          Proveedores ({filteredSuppliers.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('admins');
            setSearchQuery('');
          }}
          className={`px-5 py-3 font-label-lg text-label-lg font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'admins'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          Administradores ({filteredAdmins.length})
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'workers' ? "Buscar por RUT, Nombre, Cargo o Departamento..." : 
              activeTab === 'suppliers' ? "Buscar por RUT, Razón Social o Representante..." :
              "Buscar por Nombre, Usuario o Email de Administrador..."
            }
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg text-sm transition-colors h-10 text-left"
          />
        </div>
      </div>

      {/* Data Directory lists */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex-grow flex flex-col min-h-[350px]">
        {activeTab === 'workers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Colaborador</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Área / Cargo</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Contacto</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold text-center">Estado</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/30">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant opacity-60">
                      No se encontraron colaboradores registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map(w => (
                    <tr key={w.id} className="hover:bg-surface-container-low/10 transition-colors h-[48px] even:bg-surface-container-low/5">
                      <td className="px-4 py-2 text-left">
                        <span className="font-semibold text-primary block">{w.first_name} {w.last_name}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono-data">RUT: {w.rut}</span>
                      </td>
                      <td className="px-4 py-2 text-left">
                        <span className="font-semibold text-on-surface text-sm block">{w.cargo}</span>
                        <span className="text-[10px] text-on-surface-variant block">{w.department}</span>
                      </td>
                      <td className="px-4 py-2 text-left text-xs">
                        <span className="block truncate font-semibold" title={w.email}>{w.email}</span>
                        <span className="text-on-surface-variant block mt-0.5">{w.phone}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]">
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditWorker(w)}
                            className="px-2.5 py-1 text-xs text-primary font-bold border border-outline rounded hover:bg-surface-container-low transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => navigate('worker-profile', w.id)}
                            className="px-2.5 py-1 text-xs bg-primary text-on-primary font-bold rounded hover:bg-primary-container transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">analytics</span>
                            Ficha
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Está seguro que desea eliminar al colaborador ${w.first_name} ${w.last_name}?`)) {
                                deleteWorker(w.id);
                              }
                            }}
                            className="px-2.5 py-1 text-xs text-red-600 font-bold border border-red-200 rounded hover:bg-red-50 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Proveedor</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Representante</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Contacto</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/30">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-on-surface-variant opacity-60">
                      No se encontraron proveedores registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(s => (
                    <tr key={s.id} className="hover:bg-surface-container-low/10 transition-colors h-[48px] even:bg-surface-container-low/5">
                      <td className="px-4 py-2 text-left">
                        <span className="font-semibold text-primary block">{s.name}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono-data">RUT: {s.rut}</span>
                      </td>
                      <td className="px-4 py-2 text-left font-semibold text-on-surface text-sm">
                        {s.contact}
                      </td>
                      <td className="px-4 py-2 text-left text-xs">
                        <span className="block truncate font-semibold" title={s.email}>{s.email}</span>
                        <span className="text-on-surface-variant block mt-0.5">{s.phone}</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditSupplier(s)}
                            className="px-2.5 py-1 text-xs text-primary font-bold border border-outline rounded hover:bg-surface-container-low transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => openSupplierMovements(s)}
                            className="px-2.5 py-1 text-xs bg-secondary-container text-on-secondary-container font-bold rounded hover:opacity-90 transition-opacity flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">history</span>
                            Movimientos
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Administrador</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Usuario</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold">Email</th>
                  <th className="px-4 py-3.5 font-label-md text-label-md text-on-surface-variant uppercase text-xs font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/30">
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-on-surface-variant opacity-60">
                      No se encontraron administradores registrados.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map(a => (
                    <tr key={a.id} className="hover:bg-surface-container-low/10 transition-colors h-[48px] even:bg-surface-container-low/5">
                      <td className="px-4 py-2 text-left font-semibold text-primary text-sm">
                        {a.first_name} {a.last_name}
                      </td>
                      <td className="px-4 py-2 text-left font-mono-data text-xs text-on-surface font-semibold">
                        {a.username}
                      </td>
                      <td className="px-4 py-2 text-left text-xs font-semibold">
                        {a.email}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEditAdmin(a)}
                            className="px-2.5 py-1 text-xs text-primary font-bold border border-outline rounded hover:bg-surface-container-low transition-colors"
                          >
                            Modificar / Clave
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Está seguro de eliminar la cuenta administrativa de "${a.username}"?`)) {
                                deleteAdmin(a.id);
                              }
                            }}
                            className="px-2.5 py-1 text-xs bg-red-50 text-red-600 border border-red-200 font-bold rounded hover:bg-red-100 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Importación Masiva */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-2xl p-6 shadow-xl text-left flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4 shrink-0">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">publish</span>
                Importación Masiva de Colaboradores
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="flex-1 overflow-y-auto flex flex-col gap-4">
              <div className="text-xs text-on-surface-variant bg-surface-container-low border border-outline-variant/60 rounded-lg p-3 flex flex-col gap-1 leading-normal shrink-0">
                <span className="font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Instrucciones de formato:
                </span>
                <p>Copia y pega celdas directamente desde Excel o un archivo de texto separado por tabuladores, punto y coma o comas.</p>
                <p className="font-mono bg-white border border-outline-variant/50 p-1.5 rounded mt-1 overflow-x-auto text-[10px]">
                  RUT *[Tab]* Nombres *[Tab]* Apellidos *[Tab]* Correo *[Tab]* Teléfono *[Tab]* Cargo *[Tab]* Departamento
                </p>
                <p className="mt-1 text-on-error font-semibold">Nota: El RUT y el Correo deben ser únicos. Filas vacías o incompletas serán ignoradas o marcadas con error.</p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Pegar datos de Excel:</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Pega las filas aquí..."
                  className="w-full h-36 p-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded font-mono text-[11px] resize-none text-left"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0 py-1 bg-surface-container-low/30 border-y border-outline-variant/30 px-2 rounded">
                <span className="text-[11px] text-on-surface-variant font-bold">O seleccionar archivo (.csv / .txt):</span>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setImportText(evt.target?.result as string);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="text-xs text-on-surface-variant file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
                />
              </div>

              {parsedImportRows.length > 0 && (
                <div className="flex flex-col gap-2 flex-grow min-h-[150px]">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Vista Previa de Filas ({parsedImportRows.length} detectadas, {validImportRowsCount} válidas)
                  </span>
                  <div className="border border-outline-variant rounded-lg overflow-hidden overflow-y-auto max-h-48 bg-surface-container-low">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-container-high sticky top-0 border-b border-outline-variant z-10 font-bold">
                        <tr>
                          <th className="px-3 py-2">RUT</th>
                          <th className="px-3 py-2">Colaborador</th>
                          <th className="px-3 py-2">Área / Cargo</th>
                          <th className="px-3 py-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30 font-body-sm">
                        {parsedImportRows.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-green-50/20' : 'bg-red-50/10 hover:bg-red-50/20'}>
                            <td className="px-3 py-1.5 font-mono-data">{row.rut || <span className="text-red-500 font-bold">Vacío</span>}</td>
                            <td className="px-3 py-1.5">{row.first_name} {row.last_name}</td>
                            <td className="px-3 py-1.5 text-on-surface-variant">{row.cargo} / {row.department}</td>
                            <td className="px-3 py-1.5">
                              {row.isValid ? (
                                <span className="text-green-600 font-bold flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                  Listo
                                </span>
                              ) : (
                                <span className="text-red-600 font-bold flex items-center gap-1" title={row.error}>
                                  <span className="material-symbols-outlined text-[14px]">error</span>
                                  Error
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={validImportRowsCount === 0}
                  className={`px-5 py-2 rounded text-sm font-bold shadow-sm transition-colors ${
                    validImportRowsCount > 0 
                      ? 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer' 
                      : 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed'
                  }`}
                >
                  Importar {validImportRowsCount} Fila(s)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Colaborador */}
      {isCreateWorkerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-lg p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">person_add</span>
                Registrar Colaborador
              </h3>
              <button onClick={() => setIsCreateWorkerOpen(false)} className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateWorkerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">RUT</label>
                <input type="text" required placeholder="Ej: 15.342.198-K" value={wRut} onChange={(e) => setWRut(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Nombres</label>
                <input type="text" required placeholder="Ej: Carlos" value={wFirstName} onChange={(e) => setWFirstName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Apellidos</label>
                <input type="text" required placeholder="Ej: Mendoza" value={wLastName} onChange={(e) => setWLastName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Email</label>
                <input type="email" required placeholder="Ej: c.mendoza@empresa.cl" value={wEmail} onChange={(e) => setWEmail(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Teléfono</label>
                <input type="text" required placeholder="Ej: +56 9 8765 4321" value={wPhone} onChange={(e) => setWPhone(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Cargo</label>
                <input type="text" required placeholder="Ej: Técnico Nivel 2" value={wCargo} onChange={(e) => setWCargo(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Departamento / Área</label>
                <input type="text" required placeholder="Ej: Operaciones Mantenimiento" value={wDepartment} onChange={(e) => setWDepartment(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant mt-2 md:col-span-2">
                <button type="button" onClick={() => setIsCreateWorkerOpen(false)} className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm">Registrar Colaborador</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Colaborador */}
      {isEditWorkerOpen && selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-lg p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">edit_note</span>
                Modificar Ficha de Colaborador
              </h3>
              <button onClick={() => { setIsEditWorkerOpen(false); setSelectedWorker(null); }} className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditWorkerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">RUT (Solo lectura)</label>
                <input type="text" disabled value={wRut} className="h-10 px-3 border border-outline-variant rounded bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Nombres</label>
                <input type="text" required value={wFirstName} onChange={(e) => setWFirstName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Apellidos</label>
                <input type="text" required value={wLastName} onChange={(e) => setWLastName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Email</label>
                <input type="email" required value={wEmail} onChange={(e) => setWEmail(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Teléfono</label>
                <input type="text" required value={wPhone} onChange={(e) => setWPhone(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Cargo</label>
                <input type="text" required value={wCargo} onChange={(e) => setWCargo(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Departamento</label>
                <input type="text" required value={wDepartment} onChange={(e) => setWDepartment(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Estado Operativo</label>
                <select value={wStatus} onChange={(e) => setWStatus(e.target.value as any)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary bg-white">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant mt-2 md:col-span-2">
                <button type="button" onClick={() => { setIsEditWorkerOpen(false); setSelectedWorker(null); }} className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Proveedor */}
      {isCreateSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-lg p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">local_shipping</span>
                Registrar Proveedor
              </h3>
              <button onClick={() => setIsCreateSupplierOpen(false)} className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateSupplierSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Razón Social</label>
                <input type="text" required placeholder="Ej: 3M Seguridad Industrial Ltda." value={sName} onChange={(e) => setSName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">RUT</label>
                  <input type="text" required placeholder="Ej: 76.123.456-9" value={sRut} onChange={(e) => setSRut(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Representante / Contacto</label>
                  <input type="text" required placeholder="Ej: Ignacio Fuentes" value={sContact} onChange={(e) => setSContact(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Email</label>
                  <input type="email" required placeholder="contacto@empresa.cl" value={sEmail} onChange={(e) => setSEmail(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Teléfono</label>
                  <input type="text" required placeholder="+56 2 2456 7890" value={sPhone} onChange={(e) => setSPhone(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant mt-2">
                <button type="button" onClick={() => setIsCreateSupplierOpen(false)} className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm">Registrar Proveedor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Proveedor */}
      {isEditSupplierOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-lg p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">edit_note</span>
                Modificar Ficha de Proveedor
              </h3>
              <button onClick={() => { setIsEditSupplierOpen(false); setSelectedSupplier(null); }} className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSupplierSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Razón Social</label>
                <input type="text" required value={sName} onChange={(e) => setSName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">RUT (Solo lectura)</label>
                  <input type="text" disabled value={sRut} className="h-10 px-3 border border-outline-variant bg-surface-container-low text-on-surface-variant rounded font-body-sm text-body-sm outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Representante / Contacto</label>
                  <input type="text" required value={sContact} onChange={(e) => setSContact(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Email</label>
                  <input type="email" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Teléfono</label>
                  <input type="text" required value={sPhone} onChange={(e) => setSPhone(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant mt-2">
                <button type="button" onClick={() => { setIsEditSupplierOpen(false); setSelectedSupplier(null); }} className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Movimientos de Proveedor */}
      {isSupplierMovementsOpen && selectedSupplierForMovements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-2xl p-6 shadow-xl text-left flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">history</span>
                Movimientos de Proveedor: {selectedSupplierForMovements.name}
              </h3>
              <button
                onClick={() => {
                  setIsSupplierMovementsOpen(false);
                  setSelectedSupplierForMovements(null);
                }}
                className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface sticky top-0 border-b border-outline-variant z-10">
                  <tr className="bg-surface-container-low">
                    <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">Fecha</th>
                    <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">SKU</th>
                    <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">EPP / Producto</th>
                    <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant text-right">Cantidad Ingresada</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-mono-data text-on-surface text-sm divide-y divide-outline-variant/30">
                  {getSupplierMovements(selectedSupplierForMovements.name).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-on-surface-variant opacity-60 font-body-sm">
                        No se registran ingresos de bodega provistos por esta entidad.
                      </td>
                    </tr>
                  ) : (
                    getSupplierMovements(selectedSupplierForMovements.name).map(log => {
                      const displayDate = new Date(log.date).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      return (
                        <tr key={log.id} className="hover:bg-surface-container-low/20 transition-colors h-[42px] even:bg-surface-container-low/10">
                          <td className="px-4 py-2 text-xs">{displayDate}</td>
                          <td className="px-4 py-2 text-xs">{log.item_sku}</td>
                          <td className="px-4 py-2 font-body-sm text-body-sm font-semibold">{log.item_name}</td>
                          <td className="px-4 py-2 text-right font-bold text-green-700">+{log.quantity}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-4 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSupplierMovementsOpen(false);
                  setSelectedSupplierForMovements(null);
                }}
                className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container font-semibold rounded text-sm transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear Administrador */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-lg p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">person_add</span>
                Registrar Administrador
              </h3>
              <button onClick={() => setIsCreateAdminOpen(false)} className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateAdminSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Nombre de Usuario</label>
                <input type="text" required placeholder="Ej: pedro.bodega" value={admUsername} onChange={(e) => setAdmUsername(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Contraseña</label>
                <input type="password" required placeholder="Contraseña de acceso" value={admPassword} onChange={(e) => setAdmPassword(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Nombres</label>
                <input type="text" required placeholder="Ej: Pedro" value={admFirstName} onChange={(e) => setAdmFirstName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Apellidos</label>
                <input type="text" required placeholder="Ej: Infante" value={admLastName} onChange={(e) => setAdmLastName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Correo Electrónico</label>
                <input type="email" required placeholder="Ej: p.infante@eppcontrol.cl" value={admEmail} onChange={(e) => setAdmEmail(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant mt-2 md:col-span-2">
                <button type="button" onClick={() => setIsCreateAdminOpen(false)} className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm">Registrar Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Administrador / Contraseña */}
      {isEditAdminOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-lg p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">edit_note</span>
                Modificar Cuenta / Contraseña
              </h3>
              <button onClick={() => { setIsEditAdminOpen(false); setSelectedAdmin(null); }} className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditAdminSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Usuario (Solo Lectura)</label>
                  <input type="text" disabled value={admUsername} className="h-10 px-3 border border-outline-variant bg-surface-container-low text-on-surface-variant rounded font-body-sm text-body-sm outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Nueva Clave (Dejar en blanco para mantener)</label>
                  <input type="password" placeholder="Nueva contraseña opcional" value={admPassword} onChange={(e) => setAdmPassword(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Nombres</label>
                  <input type="text" required value={admFirstName} onChange={(e) => setAdmFirstName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Apellidos</label>
                  <input type="text" required value={admLastName} onChange={(e) => setAdmLastName(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Email</label>
                <input type="email" required value={admEmail} onChange={(e) => setAdmEmail(e.target.value)} className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant mt-2">
                <button type="button" onClick={() => { setIsEditAdminOpen(false); setSelectedAdmin(null); }} className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded text-sm font-bold shadow-sm">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* MODAL: Impresión Registros Masivos */}
      {isMassPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-md p-6 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 font-semibold text-lg">
                <span className="material-symbols-outlined">print</span>
                Impresión Registros Masivos
              </h3>
              <button
                onClick={() => setIsMassPrintModalOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleMassPrintSubmit} className="flex flex-col gap-4">
              {isFetchingMassPrint ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <div className="loader"></div>
                  <span className="text-xs text-on-surface-variant font-semibold">Buscando registros en base de datos...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="mass-start" className="text-xs font-semibold text-on-surface-variant uppercase">Desde</label>
                      <input
                        id="mass-start"
                        type="date"
                        required
                        value={massPrintStartDate}
                        onChange={(e) => setMassPrintStartDate(e.target.value)}
                        className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="mass-end" className="text-xs font-semibold text-on-surface-variant uppercase">Hasta</label>
                      <input
                        id="mass-end"
                        type="date"
                        required
                        value={massPrintEndDate}
                        onChange={(e) => setMassPrintEndDate(e.target.value)}
                        className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="mass-status" className="text-xs font-semibold text-on-surface-variant uppercase">Estado</label>
                    <select
                      id="mass-status"
                      value={massPrintStatus}
                      onChange={(e) => setMassPrintStatus(e.target.value)}
                      className="h-10 px-3 border border-outline-variant rounded font-body-sm text-body-sm outline-none focus:border-primary cursor-pointer bg-white"
                    >
                      <option value="Todos">Todos</option>
                      <option value="Aprobado">Aprobado</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </div>

                  {massPrintStartDate && massPrintEndDate && new Date(massPrintStartDate + 'T00:00:00') > new Date(massPrintEndDate + 'T00:00:00') && (
                    <div className="flex items-center gap-1 text-xs text-red-600 font-bold">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      La fecha "Desde" no puede ser mayor que "Hasta".
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant mt-2">
                    <button
                      type="button"
                      onClick={() => setIsMassPrintModalOpen(false)}
                      className="px-4 py-2 border border-outline rounded text-sm text-on-surface hover:bg-surface-container-low cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!!(massPrintStartDate && massPrintEndDate && new Date(massPrintStartDate + 'T00:00:00') > new Date(massPrintEndDate + 'T00:00:00'))}
                      className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container disabled:bg-surface-container-high disabled:text-outline disabled:cursor-not-allowed rounded text-sm font-bold shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                      Generar PDF
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Hidden Mass Print Template Container - Only visible during print */}
      {massPrintDeliveries.length > 0 && (
        <div className="hidden print:block bg-white text-on-surface w-full p-4">
          {workerGroups.map((group) => {
            const stats = getWorkerStats(group.worker.id);
            return (
              <div
                key={group.worker.id}
                className="flex flex-col gap-6 text-left w-full border border-outline-variant/60 rounded-xl p-6 mb-8 bg-white min-h-[600px] break-after-page page-break-after"
                style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
              >
                {/* Logo and Header */}
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Enaex" className="h-10 object-contain" />
                    <div>
                      <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Ficha de Control Entrega EPP</h2>
                      <p className="text-[10px] text-on-surface-variant font-mono-data">Reporte Oficial de Auditoría</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono-data text-on-surface-variant">Generado: {new Date().toLocaleDateString('es-CL')}</span>
                  </div>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-12 gap-6 mt-4">
                  {/* Worker Info Card */}
                  <div className="col-span-4 border border-outline-variant/60 rounded-xl p-5 bg-surface-container-low/20">
                    <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                        {group.worker.first_name[0]}{group.worker.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-primary text-sm">{group.worker.first_name} {group.worker.last_name}</h3>
                        <p className="font-mono-data text-on-surface-variant text-[10px] font-bold mt-0.5">{group.worker.rut}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase">Cargo</span>
                        <p className="text-xs font-semibold text-on-surface">{group.worker.cargo}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase">Departamento</span>
                        <p className="text-xs font-semibold text-on-surface">{group.worker.department}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase">Email / Fono</span>
                        <p className="text-xs font-semibold text-on-surface truncate">{group.worker.email}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{group.worker.phone}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-outline-variant/30 pt-2.5 mt-1">
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase">Estado</span>
                        <span className="text-[9px] font-bold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] px-2.5 py-0.5 rounded-full uppercase">
                          {group.worker.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deliveries Table and stats */}
                  <div className="col-span-8 flex flex-col gap-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-outline-variant/60 rounded-xl p-3 text-center">
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase">EPPs Entregados</span>
                        <span className="block text-lg font-bold text-primary mt-0.5">{stats.totalDelivered}</span>
                      </div>
                      <div className="border border-outline-variant/60 rounded-xl p-3 text-center">
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase">Sol. Pendientes</span>
                        <span className="block text-lg font-bold text-[#ea580c] mt-0.5">{stats.totalPending}</span>
                      </div>
                      <div className="border border-outline-variant/60 rounded-xl p-3 text-left">
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase block">Último Retiro</span>
                        <span className="text-[10px] font-bold text-on-surface truncate block mt-0.5">{stats.lastDeliveryItem?.epp_item?.name || 'Ninguno'}</span>
                        <span className="text-[9px] text-on-surface-variant block">{stats.lastDeliveryDate}</span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-outline-variant/60 rounded-xl overflow-hidden mt-1">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-outline-variant bg-surface-container-low/50">
                            <th className="py-2 px-3 font-bold text-on-surface-variant uppercase">Fecha</th>
                            <th className="py-2 px-3 font-bold text-on-surface-variant uppercase">EPP</th>
                            <th className="py-2 px-3 font-bold text-on-surface-variant uppercase text-right w-16">Cant.</th>
                            <th className="py-2 px-3 font-bold text-on-surface-variant uppercase w-24">Estado</th>
                            <th className="py-2 px-3 font-bold text-on-surface-variant uppercase text-center w-24">Firma</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.deliveries.map(d => {
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
                              <tr key={d.id} className="border-b border-outline-variant/40 hover:bg-surface-container-low/20 h-9">
                                <td className="py-1 px-3 font-mono-data text-[10px]">{displayDate}</td>
                                <td className="py-1 px-3 font-semibold text-on-surface">
                                  {d.epp_item?.name}
                                  <span className="block text-[8px] font-mono-data text-on-surface-variant">SKU: {d.epp_item?.sku}</span>
                                </td>
                                <td className="py-1 px-3 text-right font-bold font-mono-data">{d.quantity}</td>
                                <td className="py-1 px-3">
                                  <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${statusBadge}`}>
                                    {d.status}
                                  </span>
                                </td>
                                <td className="py-1 px-3 text-center">
                                  {d.signature ? (
                                    <img src={d.signature} className="h-6 max-w-[80px] object-contain border border-outline-variant/30 rounded bg-white p-0.5 mx-auto" alt="Firma" />
                                  ) : (
                                    <span className="text-[10px] text-on-surface-variant opacity-60">N/A</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footnote disclaimer */}
                <div className="mt-auto pt-4 border-t border-outline-variant/30 text-[9px] text-on-surface-variant leading-relaxed">
                  <p className="font-bold text-primary mb-1">Artículo 53 DS N° 594</p>
                  <p className="italic">
                    "El empleador deberá proporcionar a sus trabajadores, libres de costo, los elementos de protección personal adecuados al riesgo a cubrir y el adiestramiento necesario para su correcto empleo, debiendo, además, mantenerlos en perfecto estado de funcionamiento. Por su parte, el trabajador deberá usarlos en forma permanente mientras se encuentre expuesto al riesgo."
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
