import React, { createContext, useContext, useState, useEffect } from 'react';
import type { EPPItem, Worker, DeliveryWithDetails, Supplier, StockReplenishment, HistoryLog, AdminUser } from '../models/types';
import { dbService } from '../services/dbService';

export type ViewType = 'login' | 'worker-search' | 'worker-profile' | 'catalog' | 'admin-dashboard' | 'reports';

interface UserSession {
  role: 'admin' | 'worker';
  username?: string;
  workerId?: string;
}

interface CartItem {
  item: EPPItem;
  quantity: number;
}

interface AlertNotification {
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
  refreshData: () => void;
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
  const [alert, setAlertNotification] = useState<AlertNotification | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(10);

  // Live state mirroring dbService
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [eppItems, setEppItems] = useState<EPPItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryWithDetails[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Load initial data
  const refreshData = () => {
    setWorkers(dbService.getWorkers());
    setEppItems(dbService.getEPPItems());
    setDeliveries(dbService.getDeliveriesWithDetails());
    setSuppliers(dbService.getSuppliers());
    setHistoryLogs(dbService.getHistoryLogs());
    setAdmins(dbService.getAdmins());
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

  const loginAsAdmin = (username: string, password_hash: string): boolean => {
    const admin = dbService.verifyAdminCredentials(username, password_hash);
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
    const worker = dbService.getWorkerByRut(rut);
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

    // Determine target worker ID
    const targetWorkerId = user?.role === 'worker' ? user.workerId : selectedWorkerId;
    if (!targetWorkerId) {
      setAlert('No hay ningún trabajador seleccionado para la entrega', 'error');
      return false;
    }

    // Start submission loader animation
    setIsSubmittingRequest(true);
    setSubmissionProgress(10);

    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, 10 + Math.floor((elapsed / duration) * 90));
      
      setSubmissionProgress(progress);

      if (elapsed >= duration) {
        clearInterval(interval);
        
        // Generate single request number for the transaction
        const nextRequestNum = dbService.generateNextRequestNumber();

        // Finalize transaction insertion
        cart.forEach(cartItem => {
          dbService.createDelivery({
            worker_id: targetWorkerId,
            epp_id: cartItem.item.id,
            quantity: cartItem.quantity,
            status: 'Pendiente', // Always pending so it appears on the dashboard to approve
            delivered_at: null,
            notes: notes || (user?.role === 'admin' ? 'Ingresado por administrador' : 'Solicitado por el trabajador'),
            request_number: nextRequestNum
          });
        });

        clearCart();
        refreshData();
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
      }
    }, 50);

    return true;
  };

  const approveRequest = (deliveryId: string) => {
    const success = dbService.approveDelivery(deliveryId);
    if (success) {
      refreshData();
      setAlert('Solicitud aprobada y stock actualizado', 'success');
    } else {
      setAlert('Error al aprobar: Stock insuficiente', 'error');
    }
  };

  const rejectRequest = (deliveryId: string) => {
    const success = dbService.rejectDelivery(deliveryId);
    if (success) {
      refreshData();
      setAlert('Solicitud rechazada', 'warning');
    }
  };

  const quickAddStock = (sku: string, quantity: number): boolean => {
    const item = dbService.addEPPItemStockBySku(sku, quantity);
    if (item) {
      refreshData();
      setAlert(`Stock incrementado para ${item.name} (+${quantity})`, 'success');
      return true;
    }
    setAlert(`No se encontró ningún artículo con SKU "${sku}"`, 'error');
    return false;
  };

  const registerWorker = (workerData: Omit<Worker, 'id' | 'created_at' | 'status'>) => {
    dbService.createWorker(workerData);
    refreshData();
    setAlert(`Trabajador ${workerData.first_name} ${workerData.last_name} registrado con éxito`, 'success');
  };

  const registerSupplier = (supplierData: Omit<Supplier, 'id' | 'created_at'>) => {
    dbService.createSupplier(supplierData);
    refreshData();
    setAlert(`Proveedor ${supplierData.name} registrado con éxito`, 'success');
  };

  const registerStockReplenishment = (replenishmentData: Omit<StockReplenishment, 'id' | 'created_at'>) => {
    dbService.createStockReplenishment(replenishmentData);
    refreshData();
    const item = dbService.getEPPItemById(replenishmentData.epp_id);
    setAlert(`Ingreso de stock registrado con éxito para ${item?.name || 'EPP'}`, 'success');
  };

  const updateWorker = (worker: Worker) => {
    dbService.updateWorker(worker);
    refreshData();
    setAlert(`Colaborador ${worker.first_name} ${worker.last_name} actualizado con éxito`, 'success');
  };

  const updateSupplier = (supplier: Supplier) => {
    dbService.updateSupplier(supplier);
    refreshData();
    setAlert(`Proveedor ${supplier.name} actualizado con éxito`, 'success');
  };

  const updateEPPItem = (item: EPPItem) => {
    dbService.updateEPPItem(item);
    refreshData();
    setAlert(`Producto ${item.name} actualizado con éxito`, 'success');
  };

  const registerEPPItem = (itemData: Omit<EPPItem, 'id' | 'created_at'>) => {
    dbService.createEPPItem(itemData);
    refreshData();
    setAlert(`Producto ${itemData.name} registrado con éxito`, 'success');
  };

  const registerAdmin = (adminData: Omit<AdminUser, 'id' | 'created_at'>) => {
    dbService.createAdmin(adminData);
    refreshData();
    setAlert(`Administrador ${adminData.username} registrado con éxito`, 'success');
  };

  const updateAdmin = (admin: AdminUser) => {
    dbService.updateAdmin(admin);
    refreshData();
    setAlert(`Administrador ${admin.username} actualizado con éxito`, 'success');
  };

  const deleteAdmin = (id: string) => {
    const success = dbService.deleteAdmin(id);
    if (success) {
      refreshData();
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
      alert,
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
