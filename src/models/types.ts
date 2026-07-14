export interface EPPItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string; // e.g., 'Cabeza', 'Manos', 'Pies', 'Visual', 'Respiratorio', 'Ropa'
  stock: number;
  min_stock: number;
  max_stock: number;
  image_url: string;
  price: number;
  created_at: string;
}

export interface Worker {
  id: string;
  rut: string; // e.g., "15.342.198-K"
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cargo: string; // e.g., "Técnico Nivel 2"
  department: string; // e.g., "Operaciones Mantenimiento"
  status: 'Activo' | 'Inactivo';
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  rut: string;
  contact: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Delivery {
  id: string;
  worker_id: string;
  epp_id: string;
  quantity: number;
  status: 'Entregado' | 'Pendiente' | 'Recambio Requerido' | 'Rechazado';
  delivered_at: string | null; // ISO Date String
  notes?: string;
  request_number: string; // Unique number for group tracking (e.g. SOL-0001)
  created_at: string;
}

export interface DeliveryWithDetails extends Delivery {
  worker?: Worker;
  epp_item?: EPPItem;
}

export interface StockReplenishment {
  id: string;
  epp_id: string;
  supplier_id: string;
  quantity: number;
  created_at: string;
}

export interface StockReplenishmentWithDetails extends StockReplenishment {
  epp_item?: EPPItem;
  supplier?: Supplier;
}

export interface HistoryLog {
  id: string;
  date: string;
  type: 'Entrega' | 'Rechazo' | 'Ingreso';
  item_sku: string;
  item_name: string;
  category: string;
  quantity: number;
  price?: number;
  total_cost?: number;
  details: string; // Worker RUT/Name for Deliveries/Rejections, Supplier for Replenishments
  notes?: string;
  statusLabel: string;
}

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'Protección Cabeza': return 'construction';
    case 'Protección Manos': return 'front_hand';
    case 'Ropa Seguridad': return 'apparel';
    case 'Protección Pies': return 'sports_boot';
    case 'Protección Visual': return 'visibility';
    default: return 'shield';
  }
};

export interface AdminUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  created_at: string;
}
