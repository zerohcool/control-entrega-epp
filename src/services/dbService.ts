import type { EPPItem, Worker, Delivery, DeliveryWithDetails, Supplier, StockReplenishment, StockReplenishmentWithDetails, HistoryLog, AdminUser } from '../models/types';

// Helper to generate UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Seed Data
const DEFAULT_EPP_ITEMS: EPPItem[] = [
  {
    id: 'epp-1',
    sku: 'REF-001',
    name: 'Casco de Seguridad ABS',
    description: 'Casco de protección industrial tipo I clase E. Ajuste rachet de alta precisión.',
    category: 'Protección Cabeza',
    stock: 145,
    min_stock: 15,
    max_stock: 300,
    price: 14990,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2SWH9sxAzY-gxqgdHabuGNXQM1Lxt0kqZo8diivXJwwKdba3uakw9s27mNbnpzYmndS6nbXbic79diX-rHyASV3uFCID0je8P5Jw4zgSSKX-q1lWWF3BU-PsvXGItv6wdOFyGKgJKQI_URzWwbdBVGDdtvQjkmzWR59IPs-e21u7kLs2huWESH8xjqWuJK42_wLztAAAvg_nXcN5X_8ykUSo7719EYxdpQll3KbTiODYGsAyVY4qkqxLX9yzAjxIwBLse6Fupiw',
    created_at: new Date(2023, 5, 10).toISOString()
  },
  {
    id: 'epp-2',
    sku: 'REF-042',
    name: 'Guantes de Cuero Reforzado',
    description: 'Guante de descarne con refuerzo palmar. Alta resistencia a la abrasión y corte.',
    category: 'Protección Manos',
    stock: 12,
    min_stock: 20,
    max_stock: 150,
    price: 4990,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmjwUcqhshiBwMevptdD-Mst_BCsf_2VM0ZF0GobmF56lwtM9AtQcjsBJt4PDHyDfwGKa2L4vq9AXj2bVUCWA2SOz2w-2BRzQb-5l9kCrg17RX78cbkcC7VpuDtGWNtVQrV1BcNk5IedYM4nNZgnRUsE9qIanbBRUHVaR2oS-5T0NYjbTzlvtNQRBkkbJSPzQTyYuXrEK3CzJk2V0UmcWZ4g9o-j2ZhuQ7tXyCR1xgwWPBQJNFxb1dpsOwle8bZi_w4QfgHFsHYA',
    created_at: new Date(2023, 6, 12).toISOString()
  },
  {
    id: 'epp-3',
    sku: 'REF-089',
    name: 'Chaleco Reflectante Clase 2',
    description: 'Chaleco de malla transpirable con cintas reflectantes de alta visibilidad de 5cm.',
    category: 'Ropa Seguridad',
    stock: 230,
    min_stock: 30,
    max_stock: 500,
    price: 3500,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFRTx1TbY6OYWEBDhxhAFQ0Ls8igcbDPwThOp9Lnk9nBjAZohcm3bb3WZaUb8l01Xxc8FLSGh9gF8J6fqKBbzpox2xYqvupeb-aC2cuG0Jy_PYo4ZI3KXrev2o7HdI-gw37BlIM3Fs0bNeB7N2V3WEeb7fM01JCy6ysRBaX-qROyDpCYEUGFyVVnfRAJ6oJxx-mAkjYnJx_lO5aBv2PtE6A-dGb3IxnTxBkrnM6XXvO3fhqGnOYttI8IEVyv1pB1y3aWO8e_ZiMg',
    created_at: new Date(2023, 7, 15).toISOString()
  },
  {
    id: 'epp-4',
    sku: 'REF-102',
    name: 'Botas de Seguridad Dieléctricas',
    description: 'Calzado de seguridad con puntera composite, libre de metales. Alta resistencia eléctrica.',
    category: 'Protección Pies',
    stock: 0,
    min_stock: 15,
    max_stock: 100,
    price: 29990,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXANWa3z8-AbCfMXaVSCzpxfND5CCxP_vm7WppHuA6ntEJ2j0IjzcrvfX9TOCIJrNegvaoZhEOah_JfaevYUbro8mndD62Z9mLOpAaiz6mJACBlvDJ4KLM2Vq_q0O8ORyhLm2-TtSQUG7QQQHUeMZes0YtZw2lc_kHoQ6i3jGIun-mDIeCZoesvfRFxJi3tB7azGQpvcgP8gznlH3uFRY0LTJfXNTPVdBuYvS6GEQHwJaR17VNPRqCW6tFORchzibR4jBNX5_Rmw',
    created_at: new Date(2023, 8, 20).toISOString()
  },
  {
    id: 'epp-5',
    sku: 'REF-015',
    name: 'Lentes de Seguridad Antiparra',
    description: 'Lentes de policarbonato con tratamiento anti-empañante y anti-rayaduras.',
    category: 'Protección Visual',
    stock: 520,
    min_stock: 50,
    max_stock: 1000,
    price: 2990,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZEzyoW9k8-ZW-ljUjF6Rh70W3JGgY_14wXROwWjcZoiYFz4IywUOGpGiyBeTivHQ-r_nEkF5fsAGrsJQRwIdOlgcZY02vVpzvS-bAxkJc0Hou_vlIzPD42opQuZ066qmVL9i0bSMl1jNTaJdBmgLhvFWU7ZwVvpWFwsAl3I8zYZi1uCEJsDAbQw2FICmRfk944dODvF0xscHtZgPhmVb3Zyn9BELmN16N4DSYyf44uS6Oqhk3zLVV2PVGYAzbSsHsuTsnLdoGBw',
    created_at: new Date(2023, 9, 5).toISOString()
  }
];

const DEFAULT_WORKERS: Worker[] = [
  {
    id: 'worker-1',
    rut: '15.342.198-K',
    first_name: 'Carlos',
    last_name: 'Mendoza',
    email: 'c.mendoza@eppcontrol.cl',
    phone: '+56 9 8765 4321',
    cargo: 'Técnico Nivel 2',
    department: 'Operaciones Mantenimiento',
    status: 'Activo',
    created_at: new Date(2020, 4, 12).toISOString()
  },
  {
    id: 'worker-2',
    rut: '12.345.678-9',
    first_name: 'Juan',
    last_name: 'Pérez Gómez',
    email: 'j.perez@eppcontrol.cl',
    phone: '+56 9 1234 5678',
    cargo: 'Operario Nivel 2',
    department: 'Operaciones Planta',
    status: 'Activo',
    created_at: new Date(2021, 2, 22).toISOString()
  },
  {
    id: 'worker-3',
    rut: '15.678.901-2',
    first_name: 'María',
    last_name: 'Soto Silva',
    email: 'm.soto@eppcontrol.cl',
    phone: '+56 9 8765 1234',
    cargo: 'Supervisora Zona B',
    department: 'Operaciones Planta',
    status: 'Activo',
    created_at: new Date(2019, 8, 14).toISOString()
  },
  {
    id: 'worker-4',
    rut: '18.987.654-3',
    first_name: 'Ana',
    last_name: 'Silva Rivas',
    email: 'a.silva@eppcontrol.cl',
    phone: '+56 9 9988 7766',
    cargo: 'Encargada Logística',
    department: 'Logística',
    status: 'Activo',
    created_at: new Date(2022, 10, 5).toISOString()
  },
  {
    id: 'worker-5',
    rut: '14.234.567-8',
    first_name: 'Luis',
    last_name: 'Rojas Díaz',
    email: 'l.rojas@eppcontrol.cl',
    phone: '+56 9 5544 3322',
    cargo: 'Técnico Especialista',
    department: 'Operaciones Mantenimiento',
    status: 'Activo',
    created_at: new Date(2018, 5, 18).toISOString()
  }
];

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: '3M Seguridad Industrial',
    rut: '76.123.456-9',
    contact: 'Ignacio Fuentes',
    email: 'contacto@3mseguridad.cl',
    phone: '+56 2 2456 7890',
    created_at: new Date(2022, 1, 15).toISOString()
  },
  {
    id: 'sup-2',
    name: 'MSA Safety Chile',
    rut: '89.456.789-2',
    contact: 'Patricia Romero',
    email: 'ventas@msasafety.cl',
    phone: '+56 2 2789 1234',
    created_at: new Date(2022, 3, 20).toISOString()
  },
  {
    id: 'sup-3',
    name: 'Bata Industrials Calzado',
    rut: '79.789.123-5',
    contact: 'Roberto Muñoz',
    email: 'rmunoz@bataindustrials.cl',
    phone: '+56 2 2987 6543',
    created_at: new Date(2022, 6, 10).toISOString()
  },
  {
    id: 'sup-4',
    name: 'SteelPro Equipment',
    rut: '77.321.654-7',
    contact: 'Mónica Salazar',
    email: 'distribucion@steelpro.cl',
    phone: '+56 2 2321 0987',
    created_at: new Date(2023, 2, 5).toISOString()
  }
];

const DEFAULT_DELIVERIES: Delivery[] = [
  // Carlos Mendoza (worker-1)
  {
    id: 'del-1',
    worker_id: 'worker-1',
    epp_id: 'epp-1', // Casco
    quantity: 1,
    status: 'Entregado',
    delivered_at: '2023-11-12T08:30:00Z',
    notes: 'Casco de Seguridad MSA V-Gard Blanco',
    request_number: 'SOL-0001',
    created_at: '2023-11-12T08:00:00Z'
  },
  {
    id: 'del-2',
    worker_id: 'worker-1',
    epp_id: 'epp-2', // Guantes
    quantity: 2,
    status: 'Rechazado',
    delivered_at: '2023-11-05T09:15:00Z',
    notes: 'Guantes de Cuero Cabritilla (Talla L)',
    request_number: 'SOL-0002',
    created_at: '2023-11-05T08:45:00Z'
  },
  {
    id: 'del-3',
    worker_id: 'worker-1',
    epp_id: 'epp-5', // Lentes
    quantity: 1,
    status: 'Entregado',
    delivered_at: '2023-10-28T14:20:00Z',
    notes: 'Lentes de Seguridad Claros Anti-empañante',
    request_number: 'SOL-0003',
    created_at: '2023-10-28T14:00:00Z'
  },
  {
    id: 'del-4',
    worker_id: 'worker-1',
    epp_id: 'epp-4', // Botas
    quantity: 1,
    status: 'Entregado',
    delivered_at: '2023-09-15T11:00:00Z',
    notes: 'Zapatos de Seguridad Bata Industrials (Talla 42)',
    request_number: 'SOL-0004',
    created_at: '2023-09-15T10:30:00Z'
  },
  {
    id: 'del-5',
    worker_id: 'worker-1',
    epp_id: 'epp-3', // Chaleco
    quantity: 1,
    status: 'Pendiente',
    delivered_at: null,
    notes: 'Chaleco Reflectante Alta Visibilidad Naranja - Solicitud de reposición',
    request_number: 'SOL-0005',
    created_at: '2023-11-13T10:15:00Z'
  },
  // Juan Pérez (worker-2)
  {
    id: 'del-6',
    worker_id: 'worker-2',
    epp_id: 'epp-1', // Casco
    quantity: 1,
    status: 'Pendiente',
    delivered_at: null,
    notes: 'Solicitud rápida por ingreso nuevo a faena',
    request_number: 'SOL-0006',
    created_at: '2023-11-13T09:30:00Z'
  },
  // Ana Silva (worker-4)
  {
    id: 'del-7',
    worker_id: 'worker-4',
    epp_id: 'epp-2', // Guantes
    quantity: 2,
    status: 'Pendiente',
    delivered_at: null,
    notes: 'Reposición mensual de guantes nitrilo',
    request_number: 'SOL-0007',
    created_at: '2023-11-13T08:45:00Z'
  },
  // Luis Rojas (worker-5)
  {
    id: 'del-8',
    worker_id: 'worker-5',
    epp_id: 'epp-5', // Lentes
    quantity: 1,
    status: 'Entregado',
    delivered_at: '2023-11-10T15:40:00Z',
    notes: 'Lentes antiparra repuesto',
    request_number: 'SOL-0008',
    created_at: '2023-11-10T15:10:00Z'
  }
];

const DEFAULT_STOCK_REPLENISHMENTS: StockReplenishment[] = [
  { id: 'rep-1', epp_id: 'epp-1', supplier_id: 'sup-2', quantity: 100, created_at: new Date(2023, 9, 1).toISOString() },
  { id: 'rep-2', epp_id: 'epp-3', supplier_id: 'sup-1', quantity: 200, created_at: new Date(2023, 9, 5).toISOString() },
  { id: 'rep-3', epp_id: 'epp-5', supplier_id: 'sup-4', quantity: 500, created_at: new Date(2023, 9, 10).toISOString() }
];

const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'admin-1',
    username: 'admin',
    first_name: 'Administrador',
    last_name: 'Principal',
    email: 'admin@eppcontrol.cl',
    password_hash: '123456',
    created_at: new Date(2023, 1, 1).toISOString()
  },
  {
    id: 'admin-2',
    username: 'admin.almacen',
    first_name: 'Jaime',
    last_name: 'Valdés',
    email: 'j.valdes@eppcontrol.cl',
    password_hash: 'enaex2026',
    created_at: new Date(2024, 0, 15).toISOString()
  }
];

class DBService {
  private getStorageKey(key: string): string {
    return `epp_control_${key}`;
  }

  private load<T>(key: string, defaultValue: T[]): T[] {
    const data = localStorage.getItem(this.getStorageKey(key));
    if (!data) {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(data);
  }

  private save<T>(key: string, data: T[]): void {
    localStorage.setItem(this.getStorageKey(key), JSON.stringify(data));
  }

  // --- EPP ITEMS ---
  getEPPItems(): EPPItem[] {
    return this.load<EPPItem>('epp_items', DEFAULT_EPP_ITEMS);
  }

  getEPPItemById(id: string): EPPItem | undefined {
    return this.getEPPItems().find(item => item.id === id);
  }

  createEPPItem(itemData: Omit<EPPItem, 'id' | 'created_at'>): EPPItem {
    const items = this.getEPPItems();
    const newItem: EPPItem = {
      ...itemData,
      id: `epp-${generateUUID()}`,
      created_at: new Date().toISOString()
    };
    items.push(newItem);
    this.save('epp_items', items);
    return newItem;
  }

  updateEPPItem(item: EPPItem): void {
    const items = this.getEPPItems();
    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
      this.save('epp_items', items);
    }
  }

  updateEPPItemStock(id: string, newStock: number): void {
    const items = this.getEPPItems();
    const item = items.find(i => i.id === id);
    if (item) {
      item.stock = newStock;
      this.save('epp_items', items);
    }
  }

  addEPPItemStockBySku(sku: string, quantity: number): EPPItem | null {
    const items = this.getEPPItems();
    const item = items.find(i => i.sku.toLowerCase() === sku.trim().toLowerCase());
    if (item) {
      item.stock += quantity;
      this.save('epp_items', items);
      return item;
    }
    return null;
  }

  // --- WORKERS ---
  getWorkers(): Worker[] {
    return this.load<Worker>('workers', DEFAULT_WORKERS);
  }

  getWorkerById(id: string): Worker | undefined {
    return this.getWorkers().find(w => w.id === id);
  }

  getWorkerByRut(rut: string): Worker | undefined {
    const cleanRut = rut.replace(/[\.-]/g, '').trim().toLowerCase();
    return this.getWorkers().find(w => {
      const wCleanRut = w.rut.replace(/[\.-]/g, '').trim().toLowerCase();
      return wCleanRut === cleanRut;
    });
  }

  searchWorkers(query: string): Worker[] {
    const cleanQuery = query.toLowerCase().trim().replace(/[\.-]/g, '');
    if (!cleanQuery) return [];
    
    return this.getWorkers().filter(w => {
      const fullName = `${w.first_name} ${w.last_name}`.toLowerCase();
      const cleanRut = w.rut.replace(/[\.-]/g, '').trim().toLowerCase();
      return fullName.includes(cleanQuery) || cleanRut.includes(cleanQuery);
    });
  }

  createWorker(workerData: Omit<Worker, 'id' | 'created_at' | 'status'>): Worker {
    const workers = this.getWorkers();
    const newWorker: Worker = {
      ...workerData,
      id: `worker-${generateUUID()}`,
      status: 'Activo',
      created_at: new Date().toISOString()
    };
    workers.push(newWorker);
    this.save('workers', workers);
    return newWorker;
  }

  updateWorker(worker: Worker): void {
    const workers = this.getWorkers();
    const index = workers.findIndex(w => w.id === worker.id);
    if (index !== -1) {
      workers[index] = worker;
      this.save('workers', workers);
    }
  }

  // --- SUPPLIERS ---
  getSuppliers(): Supplier[] {
    return this.load<Supplier>('suppliers', DEFAULT_SUPPLIERS);
  }

  getSupplierById(id: string): Supplier | undefined {
    return this.getSuppliers().find(s => s.id === id);
  }

  createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at'>): Supplier {
    const suppliers = this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${generateUUID()}`,
      created_at: new Date().toISOString()
    };
    suppliers.push(newSupplier);
    this.save('suppliers', suppliers);
    return newSupplier;
  }

  updateSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === supplier.id);
    if (index !== -1) {
      suppliers[index] = supplier;
      this.save('suppliers', suppliers);
    }
  }

  // --- ADMIN USERS ---
  getAdmins(): AdminUser[] {
    return this.load<AdminUser>('admins', DEFAULT_ADMINS);
  }

  createAdmin(adminData: Omit<AdminUser, 'id' | 'created_at'>): AdminUser {
    const admins = this.getAdmins();
    const newAdmin: AdminUser = {
      ...adminData,
      id: `admin-${generateUUID()}`,
      created_at: new Date().toISOString()
    };
    admins.push(newAdmin);
    this.save('admins', admins);
    return newAdmin;
  }

  updateAdmin(admin: AdminUser): void {
    const admins = this.getAdmins();
    const index = admins.findIndex(a => a.id === admin.id);
    if (index !== -1) {
      admins[index] = admin;
      this.save('admins', admins);
    }
  }

  deleteAdmin(id: string): boolean {
    const admins = this.getAdmins();
    if (admins.length <= 1) return false; // Cannot delete last admin
    const filtered = admins.filter(a => a.id !== id);
    this.save('admins', filtered);
    return true;
  }

  verifyAdminCredentials(username: string, password_hash: string): AdminUser | undefined {
    return this.getAdmins().find(a => 
      a.username.toLowerCase().trim() === username.toLowerCase().trim() &&
      a.password_hash === password_hash
    );
  }

  // --- STOCK REPLENISHMENTS ---
  getStockReplenishments(): StockReplenishment[] {
    return this.load<StockReplenishment>('stock_replenishments', DEFAULT_STOCK_REPLENISHMENTS);
  }

  getStockReplenishmentsWithDetails(): StockReplenishmentWithDetails[] {
    const reps = this.getStockReplenishments();
    const items = this.getEPPItems();
    const sups = this.getSuppliers();
    
    return reps.map(r => ({
      ...r,
      epp_item: items.find(i => i.id === r.epp_id),
      supplier: sups.find(s => s.id === r.supplier_id)
    }));
  }

  createStockReplenishment(replenishmentData: Omit<StockReplenishment, 'id' | 'created_at'>): StockReplenishment {
    const replenishments = this.getStockReplenishments();
    const newReplenishment: StockReplenishment = {
      ...replenishmentData,
      id: `rep-${generateUUID()}`,
      created_at: new Date().toISOString()
    };
    replenishments.push(newReplenishment);
    this.save('stock_replenishments', replenishments);

    // Increase stock in catalog
    const item = this.getEPPItemById(newReplenishment.epp_id);
    if (item) {
      this.updateEPPItemStock(item.id, item.stock + newReplenishment.quantity);
    }

    return newReplenishment;
  }

  // --- DELIVERIES ---
  getDeliveries(): Delivery[] {
    return this.load<Delivery>('deliveries', DEFAULT_DELIVERIES);
  }

  getDeliveriesWithDetails(): DeliveryWithDetails[] {
    const deliveries = this.getDeliveries();
    const workers = this.getWorkers();
    const eppItems = this.getEPPItems();

    return deliveries.map(d => ({
      ...d,
      worker: workers.find(w => w.id === d.worker_id),
      epp_item: eppItems.find(e => e.id === d.epp_id)
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Newer first
  }

  getDeliveriesByWorkerId(workerId: string): DeliveryWithDetails[] {
    return this.getDeliveriesWithDetails().filter(d => d.worker_id === workerId);
  }

  generateNextRequestNumber(): string {
    const deliveries = this.getDeliveries();
    const uniqueNums = Array.from(new Set(deliveries.map(d => d.request_number).filter(Boolean)));
    const nextNum = uniqueNums.length + 1;
    return `SOL-${nextNum.toString().padStart(4, '0')}`;
  }

  createDelivery(deliveryData: Omit<Delivery, 'id' | 'created_at'>): Delivery {
    const deliveries = this.getDeliveries();
    
    // Create new delivery
    const newDelivery: Delivery = {
      ...deliveryData,
      id: `del-${generateUUID()}`,
      created_at: new Date().toISOString()
    };
    
    deliveries.push(newDelivery);
    this.save('deliveries', deliveries);

    // If status is 'Entregado' immediately, decrease EPP stock!
    if (newDelivery.status === 'Entregado') {
      const epp = this.getEPPItemById(newDelivery.epp_id);
      if (epp) {
        this.updateEPPItemStock(epp.id, Math.max(0, epp.stock - newDelivery.quantity));
      }
    }

    return newDelivery;
  }

  approveDelivery(id: string): boolean {
    const deliveries = this.getDeliveries();
    const index = deliveries.findIndex(d => d.id === id);
    if (index !== -1) {
      const delivery = deliveries[index];
      if (delivery.status === 'Pendiente') {
        // Decrease stock
        const epp = this.getEPPItemById(delivery.epp_id);
        if (epp && epp.stock >= delivery.quantity) {
          delivery.status = 'Entregado';
          delivery.delivered_at = new Date().toISOString();
          
          this.updateEPPItemStock(epp.id, epp.stock - delivery.quantity);
          this.save('deliveries', deliveries);
          return true;
        }
      }
    }
    return false;
  }

  rejectDelivery(id: string): boolean {
    const deliveries = this.getDeliveries();
    const index = deliveries.findIndex(d => d.id === id);
    if (index !== -1) {
      const delivery = deliveries[index];
      if (delivery.status === 'Pendiente') {
        delivery.status = 'Rechazado';
        delivery.delivered_at = new Date().toISOString();
        this.save('deliveries', deliveries);
        return true;
      }
    }
    return false;
  }

  requestRecambio(workerId: string, eppId: string, quantity: number, notes: string): Delivery {
    return this.createDelivery({
      worker_id: workerId,
      epp_id: eppId,
      quantity,
      status: 'Pendiente',
      delivered_at: null,
      notes: `SOLICITUD RECAMBIO: ${notes}`,
      request_number: this.generateNextRequestNumber()
    });
  }

  // --- UNIFIED HISTORY LOG ---
  getHistoryLogs(): HistoryLog[] {
    const deliveries = this.getDeliveriesWithDetails();
    const replenishments = this.getStockReplenishmentsWithDetails();

    const logs: HistoryLog[] = [];

    // Map deliveries
    deliveries.forEach(d => {
      const priceVal = d.epp_item?.price || 0;
      const costVal = d.quantity * priceVal;
      
      if (d.status === 'Entregado') {
        logs.push({
          id: d.id,
          date: d.delivered_at || d.created_at,
          type: 'Entrega',
          item_sku: d.epp_item?.sku || 'N/A',
          item_name: d.epp_item?.name || 'EPP Desconocido',
          category: d.epp_item?.category || 'General',
          quantity: d.quantity,
          price: priceVal,
          total_cost: costVal,
          details: d.worker ? `${d.worker.first_name} ${d.worker.last_name} (${d.worker.rut})` : 'N/A',
          notes: `${d.notes || ''} [Solicitud: ${d.request_number}]`.trim(),
          statusLabel: 'Entregado'
        });
      } else if (d.status === 'Rechazado') {
        logs.push({
          id: d.id,
          date: d.delivered_at || d.created_at,
          type: 'Rechazo',
          item_sku: d.epp_item?.sku || 'N/A',
          item_name: d.epp_item?.name || 'EPP Desconocido',
          category: d.epp_item?.category || 'General',
          quantity: d.quantity,
          price: priceVal,
          total_cost: 0, // Rejected means no financial flow/impact
          details: d.worker ? `${d.worker.first_name} ${d.worker.last_name} (${d.worker.rut})` : 'N/A',
          notes: `${d.notes || ''} [Solicitud: ${d.request_number}]`.trim(),
          statusLabel: 'Rechazado'
        });
      }
    });

    // Map replenishments
    replenishments.forEach(r => {
      const priceVal = r.epp_item?.price || 0;
      const costVal = r.quantity * priceVal;
      
      logs.push({
        id: r.id,
        date: r.created_at,
        type: 'Ingreso',
        item_sku: r.epp_item?.sku || 'N/A',
        item_name: r.epp_item?.name || 'EPP Desconocido',
        category: r.epp_item?.category || 'General',
        quantity: r.quantity,
        price: priceVal,
        total_cost: costVal,
        details: r.supplier ? `${r.supplier.name} (${r.supplier.rut})` : 'N/A',
        notes: 'Ingreso a Bodega / Reposición de Inventario',
        statusLabel: 'Ingreso'
      });
    });

    // Sort by date descending
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const dbService = new DBService();
