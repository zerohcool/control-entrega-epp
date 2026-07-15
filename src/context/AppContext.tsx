import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { EPPItem, Worker, DeliveryWithDetails, Supplier, StockReplenishment, HistoryLog, AdminUser } from '../models/types';

export type ViewType = 'login' | 'worker-profile' | 'catalog' | 'worker-search' | 'admin-dashboard' | 'reports';

export interface CartItem {
  item: EPPItem;
  quantity: number;
}

export interface UserSession {
  role: 'admin' | 'worker';
  workerId?: string; // If worker role
  username?: string; // If admin role
}

export interface AlertNotification {
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface AppContextType {
  user: UserSession | null;
  activeView: ViewType;
  selectedWorkerId: string | null;
  cart: CartItem[];
  alert: AlertNotification | null;
  workers: Worker[];
  eppItems: EPPItem[];
  deliveries: DeliveryWithDetails[];
  loginAsAdmin: (username: string, password_hash: string) => boolean;
  loginAsWorker: (rut: string) => boolean;
  logout: () => void;
  navigate: (view: ViewType, workerId?: string | null) => void;
  addToCart: (item: EPPItem, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  submitCartRequest: (notes?: string) => boolean;
  setAlert: (message: string, type: 'success' | 'error' | 'warning', duration?: number) => void;
  refreshData: () => Promise<void>;
  approveRequest: (deliveryId: string) => void;
  rejectRequest: (deliveryId: string) => void;
  quickAddStock: (sku: string, quantity: number) => boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  suppliers: Supplier[];
  historyLogs: HistoryLog[];
  registerWorker: (workerData: Omit<Worker, 'id' | 'created_at' | 'status'>) => void;
  registerSupplier: (supplierData: Omit<Supplier, 'id' | 'created_at'>) => void;
  registerStockReplenishment: (replenishmentData: Omit<StockReplenishment, 'id' | 'created_at'>) => void;
  updateWorker: (worker: Worker) => void;
  deleteWorker: (id: string) => void;
  updateSupplier: (supplier: Supplier) => void;
  updateEPPItem: (item: EPPItem) => void;
  registerEPPItem: (itemData: Omit<EPPItem, 'id' | 'created_at'>) => void;
  isSubmittingRequest: boolean;
  submissionProgress: number;
  admins: AdminUser[];
  registerAdmin: (adminData: Omit<AdminUser, 'id' | 'created_at'>) => void;
  updateAdmin: (admin: AdminUser) => void;
  deleteAdmin: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('login');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [alertNotification, setAlertNotification] = useState<AlertNotification | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Request Submission loaders
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(10);

  // Live state mirroring dbService
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [eppItems, setEppItems] = useState<EPPItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Load initial data from Supabase
  const refreshData = async () => {
    try {
      const [workersList, eppItemsList, deliveriesList, suppliersList, historyLogsList, adminsList] = await Promise.all([
        dbService.getWorkers(),
        dbService.getEPPItems(),
        dbService.getDeliveriesWithDetails(),
        dbService.getSuppliers(),
        dbService.getHistoryLogs(),
        dbService.getAdmins()
      ]);
      setWorkers(workersList);
      setEppItems(eppItemsList);
      setDeliveries(deliveriesList);
      setSuppliers(suppliersList);
      setHistoryLogs(historyLogsList);
      setAdmins(adminsList);
    } catch (err) {
      console.error('Error al recargar datos de Supabase:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const setAlert = (message: string, type: 'success' | 'error' | 'warning', duration = 2000) => {
    setAlertNotification({ message, type });
    setTimeout(() => {
      setAlertNotification(null);
    }, duration);
  };

  // Synchronous checks against the loaded local React states for high speed interactions
  const loginAsAdmin = (username: string, password_hash: string): boolean => {
    const admin = admins.find(a => 
      a.username.toLowerCase().trim() === username.toLowerCase().trim() &&
      a.password_hash === password_hash
    );
    if (admin) {
      const session: UserSession = { role: 'admin', username: admin.username };
      setUser(session);
      setActiveView('admin-dashboard');
      setAlert(`Sesión iniciada como ${admin.first_name} ${admin.last_name}`, 'success');
      return true;
    }
    setAlert('Credenciales incorrectas o usuario no registrado', 'error');
    return false;
  };

  const loginAsWorker = (rut: string): boolean => {
    const cleanRut = rut.replace(/[\.-]/g, '').trim().toLowerCase();
    const worker = workers.find(w => w.rut.replace(/[\.-]/g, '').trim().toLowerCase() === cleanRut);
    if (worker) {
      if (worker.status !== 'Activo') {
        setAlert('El trabajador se encuentra inactivo en el sistema', 'error');
        return false;
      }
      const session: UserSession = { role: 'worker', workerId: worker.id };
      setUser(session);
      setSelectedWorkerId(worker.id);
      setActiveView('worker-profile');
      setAlert(`Bienvenido(a), ${worker.first_name} ${worker.last_name}`, 'success');
      return true;
    }
    setAlert('No se encontró ningún trabajador registrado con ese RUT', 'error');
    return false;
  };

  const logout = () => {
    setUser(null);
    setSelectedWorkerId(null);
    setCart([]);
    setActiveView('login');
    setAlert('Sesión cerrada con éxito', 'success');
  };

  const navigate = (view: ViewType, workerId?: string | null) => {
    setActiveView(view);
    if (workerId !== undefined) {
      setSelectedWorkerId(workerId);
    }
    setIsMobileMenuOpen(false); // Close menu on navigation
  };

  const addToCart = (item: EPPItem, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { item, quantity }];
    });
    setAlert(`${item.name} agregado a la solicitud`, 'success');
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.item.id !== itemId));
    setAlert('Artículo removido de la solicitud', 'warning');
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => i.item.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setCart([]);
  };

  const submitCartRequest = (notes = ''): boolean => {
    if (cart.length === 0) {
      setAlert('La solicitud está vacía', 'error');
      return false;
    }

    const targetWorkerId = user?.role === 'worker' ? user.workerId : selectedWorkerId;
    if (!targetWorkerId) {
      setAlert('No hay ningún trabajador seleccionado para la entrega', 'error');
      return false;
    }

    setIsSubmittingRequest(true);
    setSubmissionProgress(10);

    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, 10 + Math.floor((elapsed / duration) * 90));
      
      setSubmissionProgress(progress);

      if (elapsed >= duration) {
        clearInterval(interval);
        
        try {
          const nextRequestNum = await dbService.generateNextRequestNumber();

          // Push all deliveries to Supabase in parallel
          await Promise.all(cart.map(cartItem => 
            dbService.createDelivery({
              worker_id: targetWorkerId,
              epp_id: cartItem.item.id,
              quantity: cartItem.quantity,
              status: 'Pendiente',
              delivered_at: null,
              notes: notes || (user?.role === 'admin' ? 'Ingresado por administrador' : 'Solicitado por el trabajador'),
              request_number: nextRequestNum
            })
          ));

          clearCart();
          await refreshData();
          setIsSubmittingRequest(false);

          if (user?.role === 'admin') {
            setAlert('Solicitud de EPP creada con éxito', 'success');
            navigate('admin-dashboard');
          } else {
            setUser(null);
            setSelectedWorkerId(null);
            setActiveView('login');
            setAlert('Solicitud de EPP enviada al Administrador. Sesión cerrada.', 'success');
          }
        } catch (err) {
          console.error(err);
          setAlert('Error al enviar la solicitud a la base de datos', 'error');
          setIsSubmittingRequest(false);
        }
      }
    }, 50);

    return true;
  };

  const approveRequest = async (deliveryId: string) => {
    const success = await dbService.approveDelivery(deliveryId);
    if (success) {
      await refreshData();
      setAlert('Solicitud aprobada y stock actualizado', 'success');
    } else {
      setAlert('Error al aprobar: Stock insuficiente', 'error');
    }
  };

  const rejectRequest = async (deliveryId: string) => {
    const success = await dbService.rejectDelivery(deliveryId);
    if (success) {
      await refreshData();
      setAlert('Solicitud rechazada', 'warning');
    }
  };

  const quickAddStock = (sku: string, quantity: number): boolean => {
    // Keep quickAddStock signature synchronous. We invoke asynchronous operation in background
    dbService.addEPPItemStockBySku(sku, quantity).then((item) => {
      if (item) {
        refreshData();
        setAlert(`Stock incrementado para ${item.name} (+${quantity})`, 'success');
      } else {
        setAlert(`No se encontró ningún artículo con SKU "${sku}"`, 'error');
      }
    }).catch(err => {
      console.error(err);
      setAlert('Error al reabastecer stock', 'error');
    });
    return true;
  };

  const registerWorker = async (workerData: Omit<Worker, 'id' | 'created_at' | 'status'>) => {
    const res = await dbService.createWorker(workerData);
    if (res) {
      await refreshData();
      setAlert(`Trabajador ${workerData.first_name} ${workerData.last_name} registrado con éxito`, 'success');
    } else {
      setAlert('Error al registrar colaborador', 'error');
    }
  };

  const registerSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at'>) => {
    const res = await dbService.createSupplier(supplierData);
    if (res) {
      await refreshData();
      setAlert(`Proveedor ${supplierData.name} registrado con éxito`, 'success');
    } else {
      setAlert('Error al registrar proveedor', 'error');
    }
  };

  const registerStockReplenishment = async (replenishmentData: Omit<StockReplenishment, 'id' | 'created_at'>) => {
    const res = await dbService.createStockReplenishment(replenishmentData);
    if (res) {
      await refreshData();
      const item = eppItems.find(i => i.id === replenishmentData.epp_id);
      setAlert(`Ingreso de stock registrado con éxito para ${item?.name || 'EPP'}`, 'success');
    } else {
      setAlert('Error al registrar reabastecimiento', 'error');
    }
  };

  const updateWorker = async (worker: Worker) => {
    await dbService.updateWorker(worker);
    await refreshData();
    setAlert(`Colaborador ${worker.first_name} ${worker.last_name} actualizado con éxito`, 'success');
  };

  const deleteWorker = async (id: string) => {
    // Check if worker has any deliveries
    const workerDeliveries = deliveries.filter(d => d.worker_id === id);
    if (workerDeliveries.length > 0) {
      setAlert('No se puede eliminar el colaborador porque registra historial de entregas.', 'error');
      return;
    }

    const success = await dbService.deleteWorker(id);
    if (success) {
      await refreshData();
      setAlert('Colaborador eliminado con éxito', 'success');
    } else {
      setAlert('Error al eliminar colaborador', 'error');
    }
  };

  const updateSupplier = async (supplier: Supplier) => {
    await dbService.updateSupplier(supplier);
    await refreshData();
    setAlert(`Proveedor ${supplier.name} actualizado con éxito`, 'success');
  };

  const updateEPPItem = async (item: EPPItem) => {
    await dbService.updateEPPItem(item);
    await refreshData();
    setAlert(`Producto ${item.name} actualizado con éxito`, 'success');
  };

  const registerEPPItem = async (itemData: Omit<EPPItem, 'id' | 'created_at'>) => {
    const res = await dbService.createEPPItem(itemData);
    if (res) {
      await refreshData();
      setAlert(`Producto ${itemData.name} registrado con éxito`, 'success');
    } else {
      setAlert('Error al registrar producto', 'error');
    }
  };

  const registerAdmin = async (adminData: Omit<AdminUser, 'id' | 'created_at'>) => {
    const res = await dbService.createAdmin(adminData);
    if (res) {
      await refreshData();
      setAlert(`Administrador ${adminData.username} registrado con éxito`, 'success');
    } else {
      setAlert('Error al registrar administrador', 'error');
    }
  };

  const updateAdmin = async (admin: AdminUser) => {
    await dbService.updateAdmin(admin);
    await refreshData();
    setAlert(`Administrador ${admin.username} actualizado con éxito`, 'success');
  };

  const deleteAdmin = async (id: string) => {
    const success = await dbService.deleteAdmin(id);
    if (success) {
      await refreshData();
      setAlert('Administrador eliminado con éxito', 'success');
    } else {
      setAlert('No se puede eliminar el único administrador del sistema', 'error');
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      activeView,
      selectedWorkerId,
      cart,
      alert: alertNotification,
      workers,
      eppItems,
      deliveries,
      loginAsAdmin,
      loginAsWorker,
      logout,
      navigate,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      submitCartRequest,
      setAlert,
      refreshData,
      approveRequest,
      rejectRequest,
      quickAddStock,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      suppliers,
      historyLogs,
      registerWorker,
      registerSupplier,
      registerStockReplenishment,
      updateWorker,
      deleteWorker,
      updateSupplier,
      updateEPPItem,
      registerEPPItem,
      isSubmittingRequest,
      submissionProgress,
      admins,
      registerAdmin,
      updateAdmin,
      deleteAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
