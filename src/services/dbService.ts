import { supabase } from './supabaseClient';
import type { EPPItem, Worker, Delivery, DeliveryWithDetails, Supplier, StockReplenishment, StockReplenishmentWithDetails, HistoryLog, AdminUser } from '../models/types';

// Seed Data with valid UUID strings to prevent PostgreSQL UUID format exceptions
const DEFAULT_EPP_ITEMS: EPPItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
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
    id: '00000000-0000-0000-0000-000000000002',
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
    id: '00000000-0000-0000-0000-000000000003',
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
    id: '00000000-0000-0000-0000-000000000004',
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
    id: '00000000-0000-0000-0000-000000000005',
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
    id: '11111111-1111-1111-1111-111111111101',
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
    id: '11111111-1111-1111-1111-111111111102',
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
    id: '11111111-1111-1111-1111-111111111103',
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
    id: '11111111-1111-1111-1111-111111111104',
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
    id: '11111111-1111-1111-1111-111111111105',
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
    id: '22222222-2222-2222-2222-222222222201',
    name: '3M Seguridad Industrial',
    rut: '76.123.456-9',
    contact: 'Ignacio Fuentes',
    email: 'contacto@3mseguridad.cl',
    phone: '+56 2 2456 7890',
    created_at: new Date(2022, 1, 15).toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'MSA Safety Chile',
    rut: '89.456.789-2',
    contact: 'Patricia Romero',
    email: 'ventas@msasafety.cl',
    phone: '+56 2 2789 1234',
    created_at: new Date(2022, 3, 20).toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    name: 'Bata Industrials Calzado',
    rut: '79.789.123-5',
    contact: 'Roberto Muñoz',
    email: 'rmunoz@bataindustrials.cl',
    phone: '+56 2 2987 6543',
    created_at: new Date(2022, 6, 10).toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'SteelPro Equipment',
    rut: '77.321.654-7',
    contact: 'Mónica Salazar',
    email: 'distribucion@steelpro.cl',
    phone: '+56 2 2321 0987',
    created_at: new Date(2023, 2, 5).toISOString()
  }
];

const DEFAULT_DELIVERIES: Delivery[] = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    worker_id: '11111111-1111-1111-1111-111111111101',
    epp_id: '00000000-0000-0000-0000-000000000001',
    quantity: 1,
    status: 'Entregado',
    delivered_at: '2023-11-12T08:30:00Z',
    notes: 'Casco de Seguridad MSA V-Gard Blanco',
    request_number: 'SOL-0001',
    created_at: '2023-11-12T08:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    worker_id: '11111111-1111-1111-1111-111111111101',
    epp_id: '00000000-0000-0000-0000-000000000002',
    quantity: 2,
    status: 'Rechazado',
    delivered_at: '2023-11-05T09:15:00Z',
    notes: 'Guantes de Cuero Cabritilla (Talla L)',
    request_number: 'SOL-0002',
    created_at: '2023-11-05T08:45:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444403',
    worker_id: '11111111-1111-1111-1111-111111111101',
    epp_id: '00000000-0000-0000-0000-000000000005',
    quantity: 1,
    status: 'Entregado',
    delivered_at: '2023-10-28T14:20:00Z',
    notes: 'Lentes de Seguridad Claros Anti-empañante',
    request_number: 'SOL-0003',
    created_at: '2023-10-28T14:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444404',
    worker_id: '11111111-1111-1111-1111-111111111101',
    epp_id: '00000000-0000-0000-0000-000000000004',
    quantity: 1,
    status: 'Entregado',
    delivered_at: '2023-09-15T11:00:00Z',
    notes: 'Zapatos de Seguridad Bata Industrials (Talla 42)',
    request_number: 'SOL-0004',
    created_at: '2023-09-15T10:30:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444405',
    worker_id: '11111111-1111-1111-1111-111111111101',
    epp_id: '00000000-0000-0000-0000-000000000003',
    quantity: 1,
    status: 'Pendiente',
    delivered_at: null,
    notes: 'Chaleco Reflectante Alta Visibilidad Naranja - Solicitud de reposición',
    request_number: 'SOL-0005',
    created_at: '2023-11-13T10:15:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444406',
    worker_id: '11111111-1111-1111-1111-111111111102',
    epp_id: '00000000-0000-0000-0000-000000000001',
    quantity: 1,
    status: 'Pendiente',
    delivered_at: null,
    notes: 'Solicitud rápida por ingreso nuevo a faena',
    request_number: 'SOL-0006',
    created_at: '2023-11-13T09:30:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444407',
    worker_id: '11111111-1111-1111-1111-111111111104',
    epp_id: '00000000-0000-0000-0000-000000000002',
    quantity: 2,
    status: 'Pendiente',
    delivered_at: null,
    notes: 'Reposición mensual de guantes nitrilo',
    request_number: 'SOL-0007',
    created_at: '2023-11-13T08:45:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444408',
    worker_id: '11111111-1111-1111-1111-111111111105',
    epp_id: '00000000-0000-0000-0000-000000000005',
    quantity: 1,
    status: 'Entregado',
    delivered_at: '2023-11-10T15:40:00Z',
    notes: 'Lentes antiparra repuesto',
    request_number: 'SOL-0008',
    created_at: '2023-11-10T15:10:00Z'
  }
];

const DEFAULT_STOCK_REPLENISHMENTS: StockReplenishment[] = [
  { id: '55555555-5555-5555-5555-555555555501', epp_id: '00000000-0000-0000-0000-000000000001', supplier_id: '22222222-2222-2222-2222-222222222202', quantity: 100, created_at: new Date(2023, 9, 1).toISOString() },
  { id: '55555555-5555-5555-5555-555555555502', epp_id: '00000000-0000-0000-0000-000000000003', supplier_id: '22222222-2222-2222-2222-222222222201', quantity: 200, created_at: new Date(2023, 9, 5).toISOString() },
  { id: '55555555-5555-5555-5555-555555555503', epp_id: '00000000-0000-0000-0000-000000000005', supplier_id: '22222222-2222-2222-2222-222222222204', quantity: 500, created_at: new Date(2023, 9, 10).toISOString() }
];

const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    username: 'admin',
    first_name: 'Administrador',
    last_name: 'Principal',
    email: 'admin@eppcontrol.cl',
    password_hash: '123456',
    created_at: new Date(2023, 1, 1).toISOString()
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    username: 'admin.almacen',
    first_name: 'Jaime',
    last_name: 'Valdés',
    email: 'j.valdes@eppcontrol.cl',
    password_hash: 'enaex2026',
    created_at: new Date(2024, 0, 15).toISOString()
  }
];

class DBService {
  private seedingPromise: Promise<void> | null = null;

  // Check and seed databases dynamically on startup if they have 0 records
  private async seedIfEmpty(): Promise<void> {
    if (this.seedingPromise) {
      return this.seedingPromise;
    }

    this.seedingPromise = (async () => {
      try {
        const { count, error } = await supabase.from('epp_items').select('*', { count: 'exact', head: true });
        if (error) {
          console.error('Error al verificar existencias en Supabase:', error.message);
          return;
        }
        
        if (count === 0) {
          console.log('Detectada base de datos vacía. Sembrando datos iniciales en Supabase...');
          // Insert in logical sequence of relationships
          await supabase.from('suppliers').insert(DEFAULT_SUPPLIERS);
          await supabase.from('epp_items').insert(DEFAULT_EPP_ITEMS);
          await supabase.from('workers').insert(DEFAULT_WORKERS);
          await supabase.from('admins').insert(DEFAULT_ADMINS);
          await supabase.from('stock_replenishments').insert(DEFAULT_STOCK_REPLENISHMENTS);
          await supabase.from('deliveries').insert(DEFAULT_DELIVERIES);
          console.log('Sembrado completado con éxito.');
        }
      } catch (err) {
        console.error('Fallo crítico al sembrar datos en Supabase:', err);
      }
    })();

    return this.seedingPromise;
  }

  // --- EPP ITEMS ---
  async getEPPItems(): Promise<EPPItem[]> {
    await this.seedIfEmpty();
    const { data, error } = await supabase.from('epp_items').select('*').order('name');
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async getEPPItemById(id: string): Promise<EPPItem | undefined> {
    const { data, error } = await supabase.from('epp_items').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async createEPPItem(itemData: Omit<EPPItem, 'id' | 'created_at'>): Promise<EPPItem | null> {
    const { data, error } = await supabase.from('epp_items').insert(itemData).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  async updateEPPItem(item: EPPItem): Promise<void> {
    const { error } = await supabase.from('epp_items').update(item).eq('id', item.id);
    if (error) console.error(error);
  }

  async addEPPItemStockBySku(sku: string, quantity: number): Promise<EPPItem | null> {
    const { data: item, error } = await supabase.from('epp_items').select('*').eq('sku', sku).single();
    if (error || !item) return null;
    const newStock = item.stock + quantity;
    const { data: updatedItem, error: updateErr } = await supabase
      .from('epp_items')
      .update({ stock: newStock })
      .eq('id', item.id)
      .select()
      .single();
    if (updateErr) return null;
    return updatedItem;
  }

  // --- WORKERS ---
  async getWorkers(): Promise<Worker[]> {
    await this.seedIfEmpty();
    const { data, error } = await supabase.from('workers').select('*').order('last_name');
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async getWorkerById(id: string): Promise<Worker | undefined> {
    const { data, error } = await supabase.from('workers').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async getWorkerByRut(rut: string): Promise<Worker | undefined> {
    const cleanRut = rut.replace(/[\.-]/g, '').trim().toLowerCase();
    const { data, error } = await supabase.from('workers').select('*');
    if (error || !data) return undefined;
    return data.find(w => w.rut.replace(/[\.-]/g, '').trim().toLowerCase() === cleanRut);
  }

  async createWorker(workerData: Omit<Worker, 'id' | 'created_at' | 'status'>): Promise<Worker | null> {
    const { data, error } = await supabase.from('workers').insert({ ...workerData, status: 'Activo' }).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  async updateWorker(worker: Worker): Promise<void> {
    const { error } = await supabase.from('workers').update(worker).eq('id', worker.id);
    if (error) console.error(error);
  }

  async deleteWorker(id: string): Promise<boolean> {
    const { error } = await supabase.from('workers').delete().eq('id', id);
    return !error;
  }

  // --- SUPPLIERS ---
  async getSuppliers(): Promise<Supplier[]> {
    await this.seedIfEmpty();
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier | null> {
    const { data, error } = await supabase.from('suppliers').insert(supplierData).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  async updateSupplier(supplier: Supplier): Promise<void> {
    const { error } = await supabase.from('suppliers').update(supplier).eq('id', supplier.id);
    if (error) console.error(error);
  }

  // --- ADMIN USERS ---
  async getAdmins(): Promise<AdminUser[]> {
    await this.seedIfEmpty();
    const { data, error } = await supabase.from('admins').select('*').order('username');
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async createAdmin(adminData: Omit<AdminUser, 'id' | 'created_at'>): Promise<AdminUser | null> {
    const { data, error } = await supabase.from('admins').insert(adminData).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  async updateAdmin(admin: AdminUser): Promise<void> {
    const { error } = await supabase.from('admins').update(admin).eq('id', admin.id);
    if (error) console.error(error);
  }

  async deleteAdmin(id: string): Promise<boolean> {
    const { data: admins } = await supabase.from('admins').select('id');
    if (admins && admins.length <= 1) return false;
    const { error } = await supabase.from('admins').delete().eq('id', id);
    return !error;
  }

  async verifyAdminCredentials(username: string, password_hash: string): Promise<AdminUser | undefined> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username.trim())
      .eq('password_hash', password_hash)
      .single();
    if (error || !data) return undefined;
    return data;
  }

  // --- STOCK REPLENISHMENTS ---
  async getStockReplenishments(): Promise<StockReplenishment[]> {
    await this.seedIfEmpty();
    const { data, error } = await supabase.from('stock_replenishments').select('*');
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async getStockReplenishmentsWithDetails(): Promise<StockReplenishmentWithDetails[]> {
    const { data, error } = await supabase
      .from('stock_replenishments')
      .select(`
        *,
        epp_item:epp_items(*),
        supplier:suppliers(*)
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return (data || []) as unknown as StockReplenishmentWithDetails[];
  }

  async createStockReplenishment(replenishmentData: Omit<StockReplenishment, 'id' | 'created_at'>): Promise<StockReplenishment | null> {
    // Inserts the row. Trigger trg_on_stock_replenishment automatically increases the stock in database!
    const { data, error } = await supabase.from('stock_replenishments').insert(replenishmentData).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  // --- DELIVERIES ---
  async getDeliveries(): Promise<Delivery[]> {
    await this.seedIfEmpty();
    const { data, error } = await supabase.from('deliveries').select('*');
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async getDeliveriesWithDetails(): Promise<DeliveryWithDetails[]> {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        worker:workers(*),
        epp_item:epp_items(*)
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return (data || []) as unknown as DeliveryWithDetails[];
  }

  async generateNextRequestNumber(): Promise<string> {
    const { data, error } = await supabase.from('deliveries').select('request_number');
    if (error || !data) return 'SOL-0001';
    const uniqueNums = Array.from(new Set(data.map(d => d.request_number).filter(Boolean)));
    const nextNum = uniqueNums.length + 1;
    return `SOL-${nextNum.toString().padStart(4, '0')}`;
  }

  async createDelivery(deliveryData: Omit<Delivery, 'id' | 'created_at'>): Promise<Delivery | null> {
    const { data, error } = await supabase.from('deliveries').insert(deliveryData).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  async approveDelivery(id: string): Promise<boolean> {
    const { data: delivery, error: fetchErr } = await supabase.from('deliveries').select('*').eq('id', id).single();
    if (fetchErr || !delivery) return false;
    
    // Check stock
    const { data: epp, error: eppErr } = await supabase.from('epp_items').select('stock').eq('id', delivery.epp_id).single();
    if (eppErr || !epp || epp.stock < delivery.quantity) return false;

    // Update status. Trigger trg_on_delivery_approval will automatically reduce stock!
    const { error: updateErr } = await supabase
      .from('deliveries')
      .update({
        status: 'Entregado',
        delivered_at: new Date().toISOString()
      })
      .eq('id', id);

    return !updateErr;
  }

  async rejectDelivery(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('deliveries')
      .update({
        status: 'Rechazado',
        delivered_at: new Date().toISOString()
      })
      .eq('id', id);
    return !error;
  }

  // --- UNIFIED HISTORY LOG ---
  async getHistoryLogs(): Promise<HistoryLog[]> {
    const [deliveries, replenishments] = await Promise.all([
      this.getDeliveriesWithDetails(),
      this.getStockReplenishmentsWithDetails()
    ]);

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
          total_cost: 0,
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
