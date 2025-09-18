import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import Inventory, { DrugDefinition } from './Inventory';
// FIX: Corrected import. The module now exports correctly after fixing syntax errors in it.
import Sales, { Order, OrderItem, ExtraCharge } from './Sales';
import Customers, { Customer } from './Customers';
import Accounting, { Expense, Income } from './Accounting';
import Reports from './Reports';
import Settings, { CompanyInfo as CompanyInfoType, User, UserRole, mockUsers as initialMockUsers, DocumentSettings } from './Settings';
import Fulfillment from './Fulfillment';
import Dashboard from './Dashboard';
import CustomerAccounts from './CustomerAccounts';
import Suppliers, { Supplier } from './Suppliers';
import Purchasing, { PurchaseBill, PurchaseItem } from './Purchasing';
// FIX: Corrected import. The module now exports correctly after fixing syntax errors in it.
import SupplierAccounts from './SupplierAccounts';
import RecycleBin, { TrashItem, TrashableItem } from './RecycleBin';
import Checkneh, { ChecknehInvoice } from './Checkneh';
import Alerts, { AlertSettings } from './Alerts';
import MainWarehouse from './MainWarehouse';


//=========== SUPABASE CLIENT ===========//
const supabaseUrl = 'https://uqokruakwmqfynszaine.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxb2tydWFrd21xZnluc3phaW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODg5ODYsImV4cCI6MjA3MzA2NDk4Nn0.6hAotsw9GStdteP4NWcqvFmjCq8_81Y9IpGVkJx2dT0';
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);


//=========== ICONS ===========//
const Icon = ({ path, className = "w-6 h-6" }: { path: string, className?: string | null }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
  </svg>
);

const DashboardIcon = ({ className }: { className?: string }) => <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" className={className} />;
const MainWarehouseIcon = ({ className }: { className?: string }) => <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className={className} />;
const InventoryIcon = ({ className }: { className?: string }) => <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" className={className} />;
const SalesIcon = ({ className }: { className?: string }) => <Icon path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" className={className} />;
const FulfillmentIcon = ({ className }: { className?: string }) => <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className={className} />;
const CustomersIcon = ({ className }: { className?: string }) => <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" className={className} />;
const CustomerAccountsIcon = ({ className }: { className?: string }) => <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" className={className} />;
const AccountingIcon = ({ className }: { className?: string }) => <Icon path="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M12 21a9 9 0 110-18 9 9 0 010 18z" className={className} />;
const ReportsIcon = ({ className }: { className?: string }) => <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className={className} />;
const SettingsIcon = ({ className }: { className?: string }) => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" className={className} />;
const LogoutIcon = ({ className }: { className?: string }) => <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className={className} />;
const SuppliersIcon = ({ className }: { className?: string }) => <Icon path="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V6a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-1m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className={className} />;
const PurchasingIcon = ({ className }: { className?: string }) => <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className={className} />;
const SupplierAccountsIcon = ({ className }: { className?: string }) => <Icon path="M4 4h16v16H4z M4 9h16v2H4z M9 13h2v4H9z M13 13h2v4h-2z" className={className} />;
const RecycleBinIcon = ({ className }: { className?: string }) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className} />;
const ChecknehIcon = ({ className }: { className?: string }) => <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m2 14h-2m2-4h-4m-2-4h6" className={className} />;
const CloudSyncIcon = ({ className }: { className?: string }) => <Icon path="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a4 4 0 01-4-4V9a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V16a4 4 0 01-4 4z" className={className} />;
const AlertIcon = ({ className }: { className?: string }) => <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className={className} />;


const LogoIcon = () => (
    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
    </svg>
);
const SparklesIcon = ({ className = "w-6 h-6" }: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.684-2.684l-1.938-.648.648-1.938a3.375 3.375 0 002.684-2.684l1.938-.648-.648 1.938a3.375 3.375 0 002.684 2.684l1.938.648z" />
    </svg>
);
const CloseIcon = ({ className = "w-6 h-6" }: { className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

//=========== TOAST & MODAL & UPDATE COMPONENTS ===========//
type ToastType = 'success' | 'error' | 'info';
type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

const ToastMessage = ({ message, type, onDismiss }: { message: string, type: ToastType, onDismiss: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const styles = {
    success: { bg: 'bg-green-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    error: { bg: 'bg-red-600', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
    info: { bg: 'bg-blue-600', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  };

  return (
    <div className={`flex items-center p-4 mb-4 rounded-lg shadow-2xl text-white ${styles[type].bg} animate-fade-in-up`}>
      <Icon path={styles[type].icon} className="w-6 h-6 mr-3" />
      <p className="flex-1">{message}</p>
      <button onClick={onDismiss} className="ml-4 -mr-2 p-1 rounded-full opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white">
          <CloseIcon className="w-5 h-5"/>
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, setToasts }: { toasts: Toast[], setToasts: React.Dispatch<React.SetStateAction<Toast[]>> }) => {
  const dismissToast = (id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed bottom-8 left-8 z-[100] w-96">
      {toasts.map(toast => (
        <ToastMessage key={toast.id} {...toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
};

type ConfirmationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }: ConfirmationModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[90] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl p-8 max-w-md w-full text-center space-y-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <div className="text-gray-600">{children}</div>
                <div className="flex justify-center gap-4 pt-4">
                    <button onClick={onClose} className="px-8 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold transition-colors">لغو</button>
                    <button onClick={onConfirm} className="px-8 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors">تایید</button>
                </div>
            </div>
        </div>
    );
};

const UpdateNotification = ({ onUpdate }: { onUpdate: () => void; }) => (
    <div className="fixed bottom-8 right-8 z-[101] bg-gray-800 text-white rounded-lg shadow-2xl p-4 flex items-center gap-4 animate-fade-in-up">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5m-4-1a4 4 0 01-4-4V7a4 4 0 014-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293h4.586a4 4 0 014 4v5a4 4 0 01-4 4H7z" />
        </svg>
        <div>
            <p className="font-semibold">نسخه جدیدی از برنامه در دسترس است.</p>
            <p className="text-sm text-gray-300">برای اعمال تغییرات، برنامه را به‌روزرسانی کنید.</p>
        </div>
        <button onClick={onUpdate} className="px-4 py-2 bg-teal-600 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
            به‌روزرسانی
        </button>
    </div>
);


//=========== PERSISTENCE HOOK ===========//
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(error);
        }
    }, [key, state]);

    return [state, setState];
}

//=========== PERMISSIONS & ROLES ===========//
type PermissionsMap = {
    [key in UserRole]: string[];
};

const permissions: PermissionsMap = {
    'مدیر کل': ['dashboard', 'main_warehouse', 'inventory', 'sales', 'fulfillment', 'customers', 'customer_accounts', 'suppliers', 'purchasing', 'supplier_accounts', 'finance', 'reports', 'checkneh', 'alerts', 'settings', 'recycle_bin'],
    'فروشنده': ['dashboard', 'sales', 'customers', 'customer_accounts'],
    'انباردار': ['dashboard', 'main_warehouse', 'inventory', 'fulfillment', 'suppliers', 'purchasing'],
    'حسابدار': ['dashboard', 'customer_accounts', 'supplier_accounts', 'finance', 'reports'],
};

//=========== NEW DATA TYPES ===========//
export type Batch = {
  id: string; // uuid
  lotNumber: string;
  drugId: number; // Foreign key to DrugDefinition
  quantity: number;
  expiryDate: string;
  purchasePrice: number; // cost of goods for this batch
  location: 'main_warehouse' | 'sales_warehouse';
};

export type WriteOffReason = 'تاریخ گذشته' | 'آسیب دیده' | 'مفقود شده' | 'سایر';
export type InventoryWriteOff = {
    id: number;
    drugId: number;
    drugName: string;
    lotNumber: string; // Added lotNumber
    quantity: number;
    reason: WriteOffReason;
    notes?: string;
    date: string;
    adjustedBy: string;
    costAtTime: number; // purchase price per unit
    totalLossValue: number;
};

export type StockRequisitionItem = {
    drugId: number;
    drugName: string;
    quantityRequested: number;
    quantityFulfilled: number;
};

export type StockRequisition = {
    id: number;
    date: string;
    requestedBy: string; // username
    fulfilledBy?: string; // username
    status: 'در انتظار' | 'تکمیل شده' | 'رد شده';
    items: StockRequisitionItem[];
    notes?: string;
};



//=========== MOCK DATA FOR DEMO ===========//
const initialMockDrugDefinitions: DrugDefinition[] = [];
const initialMockBatches: Batch[] = [];

const initialMockCustomers: Customer[] = [];

const initialMockOrders: Order[] = [];

const initialMockExpenses: Expense[] = [];

const initialMockSuppliers: Supplier[] = [];

const initialMockPurchaseBills: PurchaseBill[] = [];

// --- Checkneh Mock Data (Will be managed by its own hook) ---
const initialMockChecknehInvoices: ChecknehInvoice[] = [];

// --- Internal Transfers Mock Data ---
export type InternalTransfer = { 
    id: number; 
    date: string; 
    drugName: string; 
    quantity: number; 
    from: 'main'; 
    to: 'sales'; 
    transferredBy: string; 
};


//=========== COMPONENTS ===========//
type NavItemProps = {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
    <li className="mb-2">
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'text-gray-200 hover:bg-cyan-700 hover:text-white'
            }`}
        >
            {icon}
            <span className="mr-4 font-semibold">{label}</span>
        </a>
    </li>
);

const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: <DashboardIcon /> },
    { id: 'main_warehouse', label: 'انبار اصلی', icon: <MainWarehouseIcon /> },
    { id: 'inventory', label: 'انبار فروش', icon: <InventoryIcon /> },
    { id: 'sales', label: 'فروش و سفارشات', icon: <SalesIcon /> },
    { id: 'fulfillment', label: 'آماده‌سازی سفارشات', icon: <FulfillmentIcon /> },
    { id: 'customers', label: 'مشتریان', icon: <CustomersIcon /> },
    { id: 'customer_accounts', label: 'حسابات مشتریان', icon: <CustomerAccountsIcon /> },
    { id: 'suppliers', label: 'تامین کنندگان', icon: <SuppliersIcon /> },
    { id: 'purchasing', label: 'خرید و فاکتورها', icon: <PurchasingIcon /> },
    { id: 'supplier_accounts', label: 'حسابات شرکت‌ها', icon: <SupplierAccountsIcon /> },
    { id: 'finance', label: 'مالی و هزینه‌ها', icon: <AccountingIcon /> },
    { id: 'reports', label: 'گزارشات', icon: <ReportsIcon /> },
    { id: 'alerts', label: 'مدیریت هشدارها', icon: <AlertIcon /> },
    { id: 'checkneh', label: 'بخش چکنه', icon: <ChecknehIcon /> },
];

const Sidebar = ({ activeItem, setActiveItem, userRole, onLogout }) => {
    const allowedNavItems = navItems.filter(item => permissions[userRole].includes(item.id));
    const canAccessSettings = permissions[userRole].includes('settings');
    const canAccessRecycleBin = permissions[userRole].includes('recycle_bin');

    return (
        <aside className="w-64 bg-teal-800 text-white flex flex-col shadow-2xl flex-shrink-0">
            <div className="h-20 flex items-center justify-center bg-teal-900">
                <LogoIcon />
                <h1 className="text-2xl font-bold mr-3">حیات</h1>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul>
                    {allowedNavItems.map(item => (
                        <NavItem
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            isActive={activeItem === item.id}
                            onClick={() => setActiveItem(item.id)}
                        />
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-teal-700 space-y-2">
                 {canAccessRecycleBin && (
                     <NavItem
                        icon={<RecycleBinIcon />}
                        label="سطل زباله"
                        isActive={activeItem === 'recycle_bin'}
                        onClick={() => setActiveItem('recycle_bin')}
                    />
                 )}
                 {canAccessSettings && (
                     <NavItem
                        icon={<SettingsIcon />}
                        label="تنظیمات"
                        isActive={activeItem === 'settings'}
                        onClick={() => setActiveItem('settings')}
                    />
                 )}
                  <NavItem
                    icon={<LogoutIcon />}
                    label="خروج از سیستم"
                    isActive={false} 
                    onClick={onLogout}
                />
            </div>
        </aside>
    );
};

// --- ALERTS TYPES & COMPONENTS ---
export type ActiveAlert = {
    id: string;
    type: 'expiry' | 'low-stock' | 'customer-debt' | 'total-debt';
    severity: 'warning' | 'error';
    message: string;
    navigateTo: string;
};

const NotificationCenter = ({ alerts, onNavigate }: { alerts: ActiveAlert[], onNavigate: (page: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleNavigate = (page: string) => {
        onNavigate(page);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-100">
                <AlertIcon className="w-6 h-6 text-gray-600" />
                {alerts.length > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 text-white text-xs font-bold">{alerts.length}</span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border z-20">
                    <div className="p-3 font-bold border-b">مرکز اطلاع‌رسانی</div>
                    <div className="max-h-96 overflow-y-auto">
                        {alerts.length === 0 ? (
                            <p className="text-center text-gray-500 p-4">هیچ هشدار فعالی وجود ندارد.</p>
                        ) : (
                            alerts.map(alert => (
                                <button key={alert.id} onClick={() => handleNavigate(alert.navigateTo)} className="w-full text-right p-3 hover:bg-gray-50 border-b last:border-0">
                                    <p className={`font-semibold ${alert.severity === 'error' ? 'text-red-600' : 'text-yellow-700'}`}>{alert.message}</p>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="p-2 bg-gray-50 rounded-b-xl">
                        <button onClick={() => handleNavigate('alerts')} className="w-full text-center text-sm font-semibold text-teal-600 hover:underline">
                            تنظیمات هشدارها
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const Header = ({ title, currentUser, alerts, onNavigate }) => (
    <header className="bg-white shadow-md p-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-700">{title}</h2>
        <div className="flex items-center gap-4">
             <NotificationCenter alerts={alerts} onNavigate={onNavigate} />
            <div className="text-right">
                <span className="font-semibold text-gray-700">{currentUser.username}</span>
                <span className="block text-xs text-gray-500">{currentUser.role}</span>
            </div>
            <img className="w-10 h-10 rounded-full mr-4 object-cover" src={`https://i.pravatar.cc/150?u=${currentUser.username}`} alt="User Avatar" />
        </div>
    </header>
);

//=========== HAYAT AI ASSISTANT ===========//
type Message = {
    sender: 'user' | 'ai';
    text: string;
};

type HayatAssistantProps = {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
};

const HayatAssistant: React.FC<HayatAssistantProps> = ({ isOpen, onClose, messages, isLoading, onSendMessage }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const suggestionPrompts = [
        "خلاصه‌ای از وضعیت امروز به من بده",
        "کدام مشتریان بدهکارند؟",
        "داروهای نزدیک به انقضا کدامند؟"
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center">
                        <SparklesIcon className="w-6 h-6 text-teal-500" />
                        <h2 className="text-lg font-bold text-gray-800 mr-2">دستیار هوشمند حیات</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="بستن">
                        <CloseIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, index) => (
                         <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white" /></div>}
                            <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-gray-200 text-gray-800 rounded-br-none' : 'bg-teal-600 text-white rounded-bl-none'}`}>
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-3 justify-start">
                             <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white" /></div>
                            <div className="p-3 rounded-2xl bg-teal-600 text-white rounded-bl-none">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse delay-0"></span>
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse delay-200"></span>
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse delay-400"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>
                 {messages.length === 0 && (
                    <div className="px-6 pb-4 flex flex-wrap gap-2">
                        {suggestionPrompts.map(prompt => (
                            <button key={prompt} onClick={() => onSendMessage(prompt)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors">
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}
                <footer className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="پیام خود را بنویسید..."
                            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                            disabled={isLoading}
                        />
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-teal-300 transition-colors" disabled={isLoading || !input.trim()}>
                            ارسال
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

//=========== AUTH HELPER ===========//
function getOrCreateMachineId() {
    let id = window.localStorage.getItem('hayat_machineId');
    if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16).toUpperCase();
        });
        window.localStorage.setItem('hayat_machineId', id);
    }
    return id;
}


//=========== ACTIVATION SCREEN ===========//
const ActivationScreen = ({ onActivate, onSwitchToLogin }: { onActivate: () => void, onSwitchToLogin: () => void }) => {
    const [machineId, setMachineId] = useState<string | null>(null);
    const [activationKey, setActivationKey] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMachineId(getOrCreateMachineId());
    }, []);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!machineId) {
            setError("شناسه دستگاه در حال بارگذاری است، لطفاً لحظه‌ای صبر کنید.");
            setIsLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError("رمزهای عبور وارد شده مطابقت ندارند.");
            setIsLoading(false);
            return;
        }
        if (password.length < 6) {
            setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
            setIsLoading(false);
            return;
        }

        const reversedMachineId = machineId.split('').reverse().join('');
        const correctKey = btoa('ACTIVATED-' + reversedMachineId + '-SYS');

        if (activationKey.trim() !== correctKey) {
            setError("کلید فعال‌سازی نامعتبر است.");
            setIsLoading(false);
            return;
        }

        try {
            const { data: existingLicense } = await supabase.from('licenses').select('username').eq('username', username.trim()).single();
            if (existingLicense) {
                setError('این نام کاربری قبلاً استفاده شده است. لطفاً نام دیگری انتخاب کنید.');
                setIsLoading(false);
                return;
            }

            const email = `${username.trim().toLowerCase()}@example.com`;
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

            if (signUpError) throw new Error(signUpError.message);
            if (!signUpData.user || !signUpData.session) throw new Error('ایجاد حساب کاربری با شکست مواجه شد.');

            const { data: newLicense, error: insertError } = await supabase.from('licenses').insert({ username: username.trim(), machine_id: machineId, user_id: signUpData.user.id, is_active: true }).select().single();
            
            if (insertError) throw new Error(`خطا در ثبت لایسنس: ${insertError.message}`);
            if (!newLicense) throw new Error('ثبت لایسنس با شکست مواجه شد.');

            window.localStorage.setItem('hayat_isDeviceActivated', JSON.stringify(true));
            window.localStorage.setItem('hayat_licenseId', JSON.stringify(newLicense.id));
            window.localStorage.setItem('hayat_session', JSON.stringify(signUpData.session));
            window.localStorage.setItem('hayat_lastLicenseCheck', JSON.stringify(new Date().toISOString()));

            alert("برنامه با موفقیت فعال شد!");
            onActivate();

        } catch (error: any) {
             const message = error.message.includes("User already registered") 
                ? "این نام کاربری قبلا ثبت شده است. لطفا نام دیگری انتخاب کنید."
                : error.message || "یک خطای ناشناخته رخ داد.";
            setError(`خطا در ایجاد حساب کاربری: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if(machineId) navigator.clipboard.writeText(machineId).then(() => alert('شناسه دستگاه کپی شد!'), () => alert('خطا در کپی کردن شناسه.'));
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center"><div className="p-4 bg-teal-600 rounded-full mb-4"><LogoIcon /></div><h1 className="text-3xl font-bold text-gray-800">فعال‌سازی پلتفرم حیات</h1><p className="text-gray-500 mt-2 text-center">برای استفاده از برنامه، لطفاً آن را فعال کنید.</p></div>
                
                <div className="p-4 bg-gray-50 rounded-lg border"><label className="block text-sm font-medium text-gray-700 mb-2">۱. شناسه دستگاه شما:</label><p className="text-center font-mono text-gray-800 bg-gray-200 p-3 rounded-md break-all">{machineId || 'در حال تولید...'}</p><button onClick={handleCopy} className="w-full mt-2 py-2 text-sm font-semibold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200 transition-colors">کپی کردن شناسه</button><p className="text-xs text-gray-500 mt-2 text-center">این شناسه را برای توسعه‌دهنده ارسال کنید تا کلید فعال‌سازی را دریافت نمایید.</p></div>

                <form className="space-y-4" onSubmit={handleActivate}>
                     <div><label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">۲. نام کاربری (برای پشتیبان‌گیری آنلاین)</label><input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition disabled:bg-gray-100" placeholder="یک نام کاربری به انگلیسی انتخاب کنید" required disabled={isLoading} /></div>
                     <div className="grid grid-cols-2 gap-4">
                         <div><label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="حداقل ۶ کاراکتر" required disabled={isLoading} /></div>
                         <div><label className="block text-sm font-medium text-gray-700 mb-2">تکرار رمز عبور</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required disabled={isLoading} /></div>
                     </div>
                     <div><label htmlFor="activation-key" className="block text-sm font-medium text-gray-700 mb-2">۳. کلید فعال‌سازی:</label><input id="activation-key" type="text" value={activationKey} onChange={(e) => setActivationKey(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition disabled:bg-gray-100" placeholder="کلید دریافت شده را اینجا وارد کنید" required disabled={isLoading} /></div>
                    
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    
                    <div><button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-lg disabled:bg-teal-300" disabled={isLoading}>{isLoading ? 'در حال فعال‌سازی...' : 'فعال‌سازی برنامه'}</button></div>
                </form>
                <div className="text-center"><button onClick={onSwitchToLogin} className="text-sm font-medium text-teal-600 hover:text-teal-800">حساب کاربری دارید؟ وارد شوید</button></div>
            </div>
        </div>
    );
};

//=========== LOGIN SCREEN (for online sync) ===========//
const OnlineLoginScreen = ({ onLoginSuccess, onSwitchToActivation }: { onLoginSuccess: () => void, onSwitchToActivation: () => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for license transfer modal
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [pendingLoginData, setPendingLoginData] = useState<{ session: Session, license: any } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const email = `${username.trim().toLowerCase()}@example.com`;
            const { data: { session, user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

            if (signInError) throw new Error("نام کاربری یا رمز عبور اشتباه است.");
            if (!session || !user) throw new Error("ورود با شکست مواجه شد.");

            const { data: license, error: licenseError } = await supabase.from('licenses').select('id, machine_id, is_active').eq('user_id', user.id).single();
            if (licenseError || !license) throw new Error("لایسنس مرتبط با این کاربر یافت نشد.");
            
            if (!license.is_active) {
                throw new Error("دسترسی شما مسدود شده است. لطفاً با پشتیبانی تماس بگیرید.");
            }

            const currentMachineId = getOrCreateMachineId();
            if (license.machine_id === currentMachineId) {
                // Machine ID matches, proceed with login
                finalizeLogin(session, license.id);
            } else {
                // Machine ID mismatch, show transfer modal
                setPendingLoginData({ session, license });
                setShowTransferModal(true);
            }

        } catch (error: any) {
            setError(error.message || "یک خطای ناشناخته رخ داد. اتصال اینترنت خود را بررسی کنید.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmTransfer = async () => {
        if (!pendingLoginData) return;
        setIsLoading(true);
        setShowTransferModal(false);
        
        try {
            const newMachineId = getOrCreateMachineId();
            const { error: updateError } = await supabase.from('licenses').update({ machine_id: newMachineId }).eq('id', pendingLoginData.license.id);
            if (updateError) throw new Error(`خطا در انتقال لایسنس: ${updateError.message}`);

            finalizeLogin(pendingLoginData.session, pendingLoginData.license.id);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
            setPendingLoginData(null);
        }
    };

    const finalizeLogin = (session: Session, licenseId: string) => {
        window.localStorage.setItem('hayat_isDeviceActivated', JSON.stringify(true));
        window.localStorage.setItem('hayat_licenseId', JSON.stringify(licenseId));
        window.localStorage.setItem('hayat_session', JSON.stringify(session));
        window.localStorage.setItem('hayat_lastLicenseCheck', JSON.stringify(new Date().toISOString()));
        
        alert("با موفقیت وارد شدید. برای بازیابی اطلاعات، به بخش تنظیمات بروید.");
        onLoginSuccess();
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
            {showTransferModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full text-center space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">انتقال لایسنس</h2>
                        <p className="text-gray-600">این حساب کاربری روی دستگاه دیگری فعال است. آیا می‌خواهید لایسنس خود را به این دستگاه جدید منتقل کنید؟</p>
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">توجه: با این کار، دسترسی از دستگاه قبلی به محض اتصال به اینترنت مسدود خواهد شد.</p>
                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={() => { setShowTransferModal(false); setPendingLoginData(null); }} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold" disabled={isLoading}>انصراف</button>
                            <button onClick={handleConfirmTransfer} className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold" disabled={isLoading}>{isLoading ? 'در حال انتقال...' : 'بله، انتقال بده'}</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
                 <div className="flex flex-col items-center"><div className="p-4 bg-teal-600 rounded-full mb-4"><LogoIcon /></div><h1 className="text-3xl font-bold text-gray-800">ورود به پلتفرم حیات</h1><p className="text-gray-500 mt-2">برای بازیابی اطلاعات، وارد حساب کاربری خود شوید</p></div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                     <div><label className="block text-sm font-medium text-gray-700 mb-2">نام کاربری</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div>
                     <div><label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div>
                     {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div><button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 shadow-lg">{isLoading ? 'در حال ورود...' : 'ورود به سیستم'}</button></div>
                </form>
                 <div className="text-center"><button onClick={onSwitchToActivation} className="text-sm font-medium text-teal-600 hover:text-teal-800">حساب کاربری ندارید؟ فعال‌سازی کنید</button></div>
            </div>
        </div>
    );
};

//=========== NEW: USER LOGIN SCREEN ===========//
const UserLoginScreen = ({ users, onLogin, onBackupKeyReset, backupKey, addToast }) => {
    const [selectedUser, setSelectedUser] = useState(users[0]?.username || '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [recoveryKey, setRecoveryKey] = useState('');
    const [recoveryPassword, setRecoveryPassword] = useState('');
    const [recoveryUser, setRecoveryUser] = useState(users[0]?.username || '');


    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = onLogin(selectedUser, password);
        if (!success) {
            setError('نام کاربری یا رمز عبور اشتباه است.');
        }
    };
    
    const handleRecoverySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (recoveryKey !== backupKey) {
            addToast('شاه کلید پشتیبان اشتباه است.', 'error');
            return;
        }
        if (recoveryPassword.length < 4) {
             addToast('رمز عبور جدید باید حداقل ۴ کاراکتر باشد.', 'error');
            return;
        }
        onBackupKeyReset(recoveryUser, recoveryPassword);
        addToast(`رمز عبور کاربر ${recoveryUser} با موفقیت بازنشانی شد.`, 'success');
        setIsRecoveryMode(false);
        setRecoveryKey('');
        setRecoveryPassword('');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
             {isRecoveryMode && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 text-center">بازیابی اضطراری رمز عبور</h2>
                        <form onSubmit={handleRecoverySubmit} className="space-y-4">
                            <div><label className="block text-sm font-bold mb-1">شاه کلید پشتیبان</label><input type="password" value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} className="w-full p-2 border rounded" required /></div>
                            <div><label className="block text-sm font-bold mb-1">کاربر مورد نظر</label><select value={recoveryUser} onChange={e => setRecoveryUser(e.target.value)} className="w-full p-2 border rounded bg-white"><option value="" disabled>انتخاب کنید</option>{users.map(u => <option key={u.id} value={u.username}>{u.username} ({u.role})</option>)}</select></div>
                            <div><label className="block text-sm font-bold mb-1">رمز عبور جدید</label><input type="password" value={recoveryPassword} onChange={e => setRecoveryPassword(e.target.value)} className="w-full p-2 border rounded" required /></div>
                            <div className="flex justify-center gap-4 pt-4">
                                <button type="button" onClick={() => setIsRecoveryMode(false)} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">انصراف</button>
                                <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold">بازنشانی رمز</button>
                            </div>
                        </form>
                    </div>
                </div>
             )}
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center">
                    <div className="p-4 bg-teal-600 rounded-full mb-4"><LogoIcon /></div>
                    <h1 className="text-3xl font-bold text-gray-800">ورود به حیات</h1>
                    <p className="text-gray-500 mt-2">لطفاً کاربر خود را انتخاب و وارد شوید</p>
                </div>
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">نام کاربری</label><select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="" disabled>کاربر را انتخاب کنید</option>{users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div><button type="submit" className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 shadow-lg">ورود</button></div>
                </form>
                <div className="text-center text-sm">
                    <button onClick={() => alert("لطفاً برای بازنشانی رمز عبور به مدیر سیستم مراجعه کنید.")} className="font-medium text-teal-600 hover:text-teal-800">رمز عبور خود را فراموش کرده‌اید؟</button>
                    <span className="mx-2 text-gray-300">|</span>
                    <button onClick={() => setIsRecoveryMode(true)} className="font-medium text-gray-500 hover:text-gray-800">بازیابی اضطراری</button>
                </div>
            </div>
        </div>
    );
};


//=========== MAIN APP ===========//
const App: React.FC = () => {
    // Auth State
    const [isDeviceActivated, setIsDeviceActivated] = usePersistentState<boolean>('hayat_isDeviceActivated', false);
    const [licenseId, setLicenseId] = usePersistentState<string | null>('hayat_licenseId', null);
    const [session, setSession] = usePersistentState<Session | null>('hayat_session', null);
    const [authMode, setAuthMode] = useState<'activation' | 'login'>('login');
    const [isLicenseDeactivated, setIsLicenseDeactivated] = useState(false);
    const [isUpdateRequired, setIsUpdateRequired] = useState(false);
    
    // State
    const [currentUser, setCurrentUser] = usePersistentState<User | null>('hayat_currentUser', null);
    const [activeItem, setActiveItem] = usePersistentState('activeItem', 'dashboard');
    
    // Centralized, Persistent State
    const [users, setUsers] = usePersistentState<User[]>('hayat_users', initialMockUsers);
    const [backupKey, setBackupKey] = usePersistentState<string | null>('hayat_backupKey', 'HAYAT-BACKUP-2024');
    
    // NEW BATCH-BASED INVENTORY STATE
    const [drugDefinitions, setDrugDefinitions] = usePersistentState<DrugDefinition[]>('hayat_drugDefinitions', initialMockDrugDefinitions);
    const [batches, setBatches] = usePersistentState<Batch[]>('hayat_batches', initialMockBatches);

    const [internalTransfers, setInternalTransfers] = usePersistentState<InternalTransfer[]>('hayat_internalTransfers', []);
    const [stockRequisitions, setStockRequisitions] = usePersistentState<StockRequisition[]>('hayat_stockRequisitions', []);
    const [orders, setOrders] = usePersistentState<Order[]>('hayat_orders', initialMockOrders);
    const [customers, setCustomers] = usePersistentState<Customer[]>('hayat_customers', initialMockCustomers);
    const [expenses, setExpenses] = usePersistentState<Expense[]>('hayat_expenses', initialMockExpenses);
    const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('hayat_suppliers', initialMockSuppliers);
    const [purchaseBills, setPurchaseBills] = usePersistentState<PurchaseBill[]>('hayat_purchaseBills', initialMockPurchaseBills);
    const [trash, setTrash] = usePersistentState<TrashItem[]>('hayat_trash', []);
    const [inventoryWriteOffs, setInventoryWriteOffs] = usePersistentState<InventoryWriteOff[]>('hayat_inventoryWriteOffs', []);
    
    // State for unsaved changes warning
    const [hasUnsavedChanges, setHasUnsavedChanges] = usePersistentState<boolean>('hayat_hasUnsavedChanges', false);


    const [companyInfo, setCompanyInfo] = usePersistentState<CompanyInfoType>('hayat_companyInfo', {
        name: 'شرکت پخش دارویی حیات',
        address: 'کابل، افغانستان',
        phone: '0788123456',
        logo: null
    });

    const [documentSettings, setDocumentSettings] = usePersistentState<DocumentSettings>('hayat_documentSettings', {
        logoPosition: 'right',
        accentColor: '#0d9488',
        backgroundImage: null,
    });
    
    const [alertSettings, setAlertSettings] = usePersistentState<AlertSettings>('hayat_alertSettings', {
        expiry: { enabled: true, months: 6 },
        lowStock: { enabled: true, quantity: 50 },
        customerDebt: { enabled: true, limits: {} },
        totalDebt: { enabled: true, threshold: 500000 },
    });

    // AI Assistant State
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState<Message[]>([]);
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);
    
    // Toast & Confirmation Modal State
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmationState, setConfirmationState] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        onCancel?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: null,
        onConfirm: () => {},
        onCancel: () => {}
    });

    // PWA Update State
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    // FIX: Moved toast handlers before usage in useEffect to prevent "used before its declaration" error.
    // --- Toast & Confirmation Handlers ---
    const addToast = (message: string, type: ToastType = 'info') => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    };
    
    const showConfirmation = (title: string, message: React.ReactNode, onConfirm: () => void, onCancel?: () => void) => {
        setConfirmationState({ isOpen: true, title, message, onConfirm, onCancel: onCancel || (() => {}) });
    };

    const closeConfirmation = () => {
        confirmationState.onCancel?.();
        setConfirmationState(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = () => {
        confirmationState.onConfirm();
        setConfirmationState(prev => ({ ...prev, isOpen: false }));
    };

    // --- ONE-TIME DATA MIGRATION ---
    useEffect(() => {
        const migrationDone = JSON.parse(window.localStorage.getItem('hayat_migrated_to_batches_v1') || 'false');
        if (!migrationDone) {
            console.log("Running one-time migration to batch-based inventory...");
            try {
                const oldDrugs = JSON.parse(window.localStorage.getItem('hayat_drugs') || '[]');
                const oldMainWarehouseDrugs = JSON.parse(window.localStorage.getItem('hayat_mainWarehouseDrugs') || '[]');
                
                if (oldDrugs.length === 0 && oldMainWarehouseDrugs.length === 0) {
                    console.log("No old data to migrate.");
                    window.localStorage.setItem('hayat_migrated_to_batches_v1', 'true');
                    return;
                }

                const allOldDrugs = [
                    ...oldDrugs.map(d => ({ ...d, isMain: false })),
                    ...oldMainWarehouseDrugs.map(d => ({ ...d, isMain: true }))
                ];
                
                const newDrugDefinitions: DrugDefinition[] = [];
                const newBatches: Batch[] = [];
                const seenDrugIds = new Set();

                for (const oldDrug of allOldDrugs) {
                    if (!seenDrugIds.has(oldDrug.id)) {
                        newDrugDefinitions.push({
                            id: oldDrug.id,
                            name: oldDrug.name,
                            barcode: oldDrug.barcode,
                            code: oldDrug.code,
                            manufacturer: oldDrug.manufacturer,
                            unitsPerCarton: oldDrug.unitsPerCarton,
                            price: oldDrug.price,
                            discountPercentage: oldDrug.discountPercentage,
                            category: oldDrug.category,
                        });
                        seenDrugIds.add(oldDrug.id);
                    }

                    if (oldDrug.quantity > 0) {
                         newBatches.push({
                            id: `migrated-${oldDrug.id}-${oldDrug.isMain ? 'main' : 'sales'}`,
                            lotNumber: 'UNKNOWN_LOT',
                            drugId: oldDrug.id,
                            quantity: oldDrug.quantity,
                            expiryDate: oldDrug.expiryDate,
                            purchasePrice: oldDrug.purchasePrice,
                            location: oldDrug.isMain ? 'main_warehouse' : 'sales_warehouse',
                        });
                    }
                }
                
                // Set the new state directly into localStorage
                window.localStorage.setItem('hayat_drugDefinitions', JSON.stringify(newDrugDefinitions));
                window.localStorage.setItem('hayat_batches', JSON.stringify(newBatches));
                
                // Mark migration as done and clean up old keys
                window.localStorage.setItem('hayat_migrated_to_batches_v1', 'true');
                window.localStorage.removeItem('hayat_drugs');
                window.localStorage.removeItem('hayat_mainWarehouseDrugs');
                
                addToast("ساختار داده با موفقیت به‌روزرسانی شد!", "success");
                console.log("Migration successful! Reloading to apply new state.");
                // Reload to apply new state from localStorage
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error("Migration failed:", error);
                addToast("مهاجرت به ساختار داده جدید با خطا مواجه شد.", "error");
            }
        }
    }, [addToast]);


    // --- ALERTS ENGINE ---
    const activeAlerts = useMemo<ActiveAlert[]>(() => {
        const generatedAlerts: ActiveAlert[] = [];
        const now = new Date();
        const drugQuantities = new Map<number, { sales: number; main: number; allBatches: Batch[] }>();

        drugDefinitions.forEach(def => drugQuantities.set(def.id, { sales: 0, main: 0, allBatches: [] }));
        batches.forEach(batch => {
            const entry = drugQuantities.get(batch.drugId);
            if(entry) {
                if (batch.location === 'sales_warehouse') entry.sales += batch.quantity;
                else entry.main += batch.quantity;
                entry.allBatches.push(batch);
            }
        });

        // 1. Drug Expiry
        if (alertSettings.expiry.enabled) {
            const thresholdDate = new Date();
            thresholdDate.setMonth(now.getMonth() + alertSettings.expiry.months);

            batches.forEach(batch => {
                const drugDef = drugDefinitions.find(d => d.id === batch.drugId);
                if (!drugDef) return;

                const expiryDate = new Date(batch.expiryDate);
                if (batch.quantity > 0 && expiryDate < thresholdDate && expiryDate > now) {
                    const monthsLeft = (expiryDate.getFullYear() - now.getFullYear()) * 12 + (expiryDate.getMonth() - now.getMonth());
                    generatedAlerts.push({
                        id: `expiry-batch-${batch.id}`,
                        type: 'expiry',
                        severity: monthsLeft < 3 ? 'error' : 'warning',
                        message: `انقضای ${drugDef.name} (لات: ${batch.lotNumber}) نزدیک است.`,
                        navigateTo: batch.location === 'sales_warehouse' ? 'inventory' : 'main_warehouse'
                    });
                }
            });
        }
        
        // 2. Low Stock (Only for Sales Warehouse)
        if (alertSettings.lowStock.enabled) {
             drugQuantities.forEach((data, drugId) => {
                const drugDef = drugDefinitions.find(d => d.id === drugId);
                if (drugDef && data.sales > 0 && data.sales < alertSettings.lowStock.quantity) {
                     generatedAlerts.push({
                        id: `lowstock-${drugId}`,
                        type: 'low-stock',
                        severity: 'warning',
                        message: `موجودی ${drugDef.name} در انبار فروش کم است (${data.sales} عدد).`,
                        navigateTo: 'inventory'
                    });
                }
             });
        }

        // 3. Customer & Total Debt
        const customerBalances = customers.map(c => {
             const totalBilled = orders.filter(o => o.customerName === c.name && o.type === 'sale').reduce((sum, o) => sum + Number(o.totalAmount), 0);
             const totalReturned = orders.filter(o => o.customerName === c.name && o.type === 'sale_return').reduce((sum, o) => sum + Number(o.totalAmount), 0);
             const totalPaid = orders.filter(o => o.customerName === c.name).reduce((sum, o) => sum + Number(o.amountPaid), 0);
             return { customerId: c.id, name: c.name, balance: totalBilled - totalReturned - totalPaid };
        });

        if (alertSettings.customerDebt.enabled) {
            customerBalances.forEach(cb => {
                const limit = alertSettings.customerDebt.limits[cb.customerId];
                if (limit && cb.balance > limit) {
                     generatedAlerts.push({
                        id: `custdebt-${cb.customerId}`,
                        type: 'customer-debt',
                        severity: 'error',
                        message: `بدهی ${cb.name} از سقف تعیین شده (${limit.toLocaleString()}) عبور کرده است.`,
                        navigateTo: 'customer_accounts'
                    });
                }
            });
        }

        if (alertSettings.totalDebt.enabled) {
            const totalDebt = customerBalances.reduce((sum, cb) => (cb.balance > 0 ? sum + cb.balance : sum), 0);
            if (totalDebt > alertSettings.totalDebt.threshold) {
                 generatedAlerts.push({
                    id: 'totaldebt',
                    type: 'total-debt',
                    severity: 'error',
                    message: `مجموع کل بدهی مشتریان (${totalDebt.toLocaleString()}) از سقف تعیین شده عبور کرده است.`,
                    navigateTo: 'customer_accounts'
                });
            }
        }

        // Use a map to remove duplicate messages before returning
        const uniqueAlerts = new Map<string, ActiveAlert>();
        generatedAlerts.forEach(alert => {
            if (!uniqueAlerts.has(alert.message)) {
                uniqueAlerts.set(alert.message, alert);
            }
        });
        return Array.from(uniqueAlerts.values());
    }, [batches, drugDefinitions, orders, customers, alertSettings]);


     // --- PWA Update Handler ---
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const registerServiceWorker = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('ServiceWorker registration successful:', registration);

                    if (registration.waiting) {
                        console.log("Update found on load: A new service worker is waiting.");
                        setWaitingWorker(registration.waiting);
                        setShowUpdateNotification(true);
                        return;
                    }

                    registration.addEventListener('updatefound', () => {
                        console.log("Update found: A new service worker is installing.");
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log("Update installed: New service worker is ready.");
                                    setWaitingWorker(newWorker);
                                    setShowUpdateNotification(true);
                                }
                            });
                        }
                    });

                } catch (err) {
                    console.log('ServiceWorker registration failed: ', err);
                }
            };
            
            window.addEventListener('load', registerServiceWorker);
            
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    console.log("Controller changed. Reloading page.");
                    window.location.reload();
                    refreshing = true;
                }
            });

            return () => window.removeEventListener('load', registerServiceWorker);
        }
    }, []);

    const handleUpdate = () => {
        if (waitingWorker) {
            console.log("User clicked update. Sending SKIP_WAITING message.");
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            setShowUpdateNotification(false);
        }
    };


    // --- Unsaved Changes Warning ---
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                const message = 'تغییرات ذخیره نشده‌ای وجود دارد. برای اطمینان از حفظ اطلاعات، لطفاً قبل از خروج یک نسخه پشتیبان تهیه کنید.';
                event.returnValue = message; // Standard for most browsers
                return message; // For older browsers
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);


    // Effect to manage custom print background styles
    useEffect(() => {
        const styleId = 'custom-print-background-style';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        if (documentSettings.backgroundImage) {
            styleElement.innerHTML = `
                #print-section::before {
                    background-image: url(${documentSettings.backgroundImage}) !important;
                    background-size: cover !important;
                    background-repeat: no-repeat !important;
                    background-position: center !important;
                    opacity: 1 !important;
                }
                #print-section::after {
                    background-color: rgba(255, 255, 255, 0.9) !important;
                }
            `;
        } else {
            // Revert to default by clearing the overrides
            styleElement.innerHTML = ``;
        }
        
    }, [documentSettings.backgroundImage]);

    // --- Auth Handlers ---
    const handleLogout = () => {
        setCurrentUser(null);
    };

    const handleLogin = (username: string, password_provided: string): boolean => {
        const user = users.find(u => u.username === username);
        if (user && user.password === password_provided) {
            const updatedUser = { ...user, lastLogin: new Date().toLocaleString('fa-IR') };
            setCurrentUser(updatedUser);
            setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
            return true;
        }
        return false;
    };
    
    const handlePasswordReset = (username: string, newPassword_provided: string) => {
        setUsers(prev => prev.map(u => u.username === username ? {...u, password: newPassword_provided} : u));
        setHasUnsavedChanges(true);
    };
    
    const verifyLicense = async (isManualTrigger = false) => {
        if (!isDeviceActivated || !licenseId || !session) return;
    
        try {
            // Attempt to refresh the session. This is the first network call.
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession(session);
    
            // If there's a session error, it's likely a network issue when offline.
            // Re-throw the original error to be handled by the catch block.
            if (sessionError) {
                throw sessionError;
            }
    
            // If the session was refreshed, update our stored session.
            if (sessionData.session) {
                setSession(sessionData.session);
            } else {
                console.warn("Could not establish a valid session after setSession. License check might fail.");
            }
    
            const localMachineId = getOrCreateMachineId();
            // This is the second network call.
            const { data, error: licenseError } = await supabase.from('licenses').select('is_active, machine_id').eq('id', licenseId).single();
    
            // Re-throw the original error to be handled by the catch block.
            if (licenseError) {
                throw licenseError;
            }
    
            if (data) {
                if (data.is_active === false || data.machine_id !== localMachineId) {
                    setIsLicenseDeactivated(true);
                } else {
                    setIsLicenseDeactivated(false);
                    if (isUpdateRequired) setIsUpdateRequired(false);
                    window.localStorage.setItem('hayat_lastLicenseCheck', JSON.stringify(new Date().toISOString()));
                    if (isManualTrigger) addToast("برنامه با موفقیت به‌روزرسانی و تایید شد!", "success");
                }
            } else {
                console.error(`CRITICAL: License verification for ID ${licenseId} returned no data. This could be an authentication or RLS policy issue. Not deactivating user.`);
                if (isManualTrigger) addToast("اطلاعات لایسنس دریافت نشد. ممکن است مشکل از سمت سرور باشد.", "error");
            }
        } catch (error: any) {
            // Centralized error handling for network issues.
            const errorMessage = error.message || '';
            if (errorMessage.toLowerCase().includes('failed to fetch') || errorMessage.toLowerCase().includes('networkerror')) {
                console.warn("Could not verify license due to a network issue. The app will continue in its current state.");
                if (isManualTrigger) addToast("اتصال به سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.", "error");
            } else {
                // For other errors (e.g., actual auth errors from Supabase if online)
                console.error("An unexpected error occurred during license verification:", errorMessage);
                if (isManualTrigger) addToast(`خطا در اعتبارسنجی: ${errorMessage}`, "error");
            }
        }
    };
    
    // Initial license verifier on app load
    useEffect(() => {
        // Run once on load if online
        if (navigator.onLine && isDeviceActivated) {
            verifyLicense();
        }
    }, [isDeviceActivated, licenseId, session]);

    // Real-time license verifier using Supabase subscriptions
    useEffect(() => {
        if (!isDeviceActivated || !licenseId) {
            return; // Don't subscribe if not activated
        }

        const handleLicenseUpdate = (payload: any) => {
            console.log('Real-time license update received:', payload);
            const newLicenseData = payload.new;
            const localMachineId = getOrCreateMachineId();

            if (!newLicenseData || !newLicenseData.is_active || newLicenseData.machine_id !== localMachineId) {
                console.error("License deactivated or transferred in real-time. Locking app.");
                addToast("دسترسی شما به دلیل تغییر در وضعیت لایسنس مسدود شد.", "error");
                setIsLicenseDeactivated(true);
            } else {
                 if (isLicenseDeactivated) {
                     console.log("License re-activated in real-time. Unlocking app.");
                     setIsLicenseDeactivated(false);
                 }
            }
        };

        const channel = supabase.channel(`license-updates-${licenseId}`);
        channel
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'licenses',
                    filter: `id=eq.${licenseId}`,
                },
                handleLicenseUpdate
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully subscribed to real-time updates for license ${licenseId}.`);
                }
                if (status === 'CHANNEL_ERROR' || err) {
                    console.error('Subscription error:', err || 'Channel error');
                }
            });

        // Cleanup function
        return () => {
            if (channel) {
                supabase.removeChannel(channel).then(() => {
                    console.log(`Unsubscribed from license updates for ${licenseId}.`);
                });
            }
        };
    }, [isDeviceActivated, licenseId, isLicenseDeactivated, addToast]);


    // 30-day offline check
    useEffect(() => {
        if (isDeviceActivated) {
            const lastCheckString = window.localStorage.getItem('hayat_lastLicenseCheck');
            if (lastCheckString) {
                const lastCheckDate = new Date(JSON.parse(lastCheckString));
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                if (Date.now() - lastCheckDate.getTime() > thirtyDaysInMs) {
                    setIsUpdateRequired(true);
                }
            } else {
                // If it never existed, force a check on first run after update.
                setIsUpdateRequired(true);
            }
        }
    }, [isDeviceActivated]);

    // Auto-login/user setup effect after activation
    useEffect(() => {
        // This effect is no longer needed with the new login screen.
        // It's commented out to prevent auto-login.
        /*
        if (isDeviceActivated && !currentUser) {
            const adminUser = users.find(u => u.role === 'مدیر کل') || users[0];
            if (adminUser) {
                const updatedUser = { ...adminUser, lastLogin: new Date().toLocaleString('fa-IR') };
                setCurrentUser(updatedUser);
                setUsers(prevUsers => prevUsers.map(u => u.id === adminUser.id ? updatedUser : u));
            }
        }
        */
    }, [isDeviceActivated, currentUser, users, setCurrentUser, setUsers]);


    // Derived State for Incomes
    const incomes: Income[] = useMemo(() => {
        const salesIncomes = orders
            .filter(order => order.type === 'sale' && order.amountPaid > 0)
            .map(order => ({
                id: order.id,
                description: `فروش - سفارش ${order.orderNumber}`,
                amount: order.amountPaid,
                date: order.orderDate,
            }));

        const returnRefunds = orders
            .filter(order => order.type === 'sale_return' && order.amountPaid > 0)
            .map(order => ({
                id: order.id,
                description: `بازپرداخت - مستردی ${order.orderNumber}`,
                amount: -order.amountPaid, // Negative amount
                date: order.orderDate,
            }));

        return [...salesIncomes, ...returnRefunds];
    }, [orders]);

    // --- Backup & Restore Handlers ---
    const getAllData = () => ({
        users, drugDefinitions, batches, internalTransfers, orders, customers, expenses, suppliers, purchaseBills, trash, inventoryWriteOffs, stockRequisitions, companyInfo, documentSettings, alertSettings, backupKey
    });

    const setAllData = (data: any) => {
        if (!data || typeof data !== 'object') {
            addToast('فایل پشتیبان نامعتبر است.', 'error');
            return;
        }
        if (data.users) setUsers(data.users);
        if (data.drugDefinitions) setDrugDefinitions(data.drugDefinitions);
        if (data.batches) setBatches(data.batches);
        if (data.internalTransfers) setInternalTransfers(data.internalTransfers);
        if (data.stockRequisitions) setStockRequisitions(data.stockRequisitions);
        if (data.orders) setOrders(data.orders);
        if (data.customers) setCustomers(data.customers);
        if (data.expenses) setExpenses(data.expenses);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.purchaseBills) setPurchaseBills(data.purchaseBills);
        if (data.trash) setTrash(data.trash);
        if (data.inventoryWriteOffs) setInventoryWriteOffs(data.inventoryWriteOffs);
        if (data.companyInfo) setCompanyInfo(data.companyInfo);
        if (data.documentSettings) setDocumentSettings(data.documentSettings);
        if (data.alertSettings) setAlertSettings(data.alertSettings);
        if (data.backupKey) setBackupKey(data.backupKey);
        setHasUnsavedChanges(false);
    };

    const handleBackupLocal = () => {
        try {
            const data = getAllData();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hayat-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addToast('نسخه پشتیبان با موفقیت ایجاد شد.', 'success');
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error creating local backup:', error);
            addToast('خطا در ایجاد نسخه پشتیبان.', 'error');
        }
    };

    const handleRestoreLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        showConfirmation('تایید بازیابی اطلاعات', 'آیا مطمئن هستید؟ با بازیابی اطلاعات، تمام داده‌های فعلی شما بازنویسی خواهد شد.', () => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error("File content is not readable.");
                    const data = JSON.parse(text);
                    setAllData(data);
                    addToast('اطلاعات با موفقیت بازیابی شد.', 'success');
                } catch (error) {
                    console.error('Error restoring from local backup:', error);
                    addToast('خطا در بازیابی اطلاعات. ممکن است فایل پشتیبان شما خراب باشد.', 'error');
                }
            };
            reader.readAsText(file);
        });
    };
    
    const handleBackupOnline = async () => {
        if (!licenseId) {
            addToast("برای پشتیبان‌گیری آنلاین، ابتدا باید برنامه را فعال کنید.", 'error');
            return false;
        }

        const proceed = await new Promise<boolean>(resolve => {
            showConfirmation(
                'تایید بازنویسی',
                'این کار نسخه پشتیبان آنلاین قبلی شما را بازنویسی می‌کند. آیا می‌خواهید ادامه دهید؟',
                () => resolve(true), // onConfirm
                () => resolve(false)  // onCancel
            );
        });

        if (!proceed) {
            addToast("عملیات پشتیبان‌گیری لغو شد.", "info");
            return false;
        }
        
        try {
            const backup_data = getAllData();
            const { error: deleteError } = await supabase.from('backups').delete().eq('license_id', licenseId);
            if (deleteError) console.warn("Could not delete old backups, proceeding anyway:", deleteError.message);
            
            const { error: insertError } = await supabase.from('backups').insert({ license_id: licenseId, backup_data });
            if (insertError) throw insertError;
            
            addToast('نسخه پشتیبان آنلاین با موفقیت ایجاد و جایگزین شد.', 'success');
            setHasUnsavedChanges(false);
            return true;
        } catch (error: any) {
            console.error("Error creating online backup:", error);
            addToast(`خطا در ایجاد نسخه پشتیبان آنلاین: ${error.message}`, 'error');
            return false;
        }
    };

    const handleRestoreOnline = async () => {
        showConfirmation('تایید بازیابی اطلاعات', 'آیا مطمئن هستید؟ با بازیابی اطلاعات، تمام داده‌های فعلی شما بازنویسی خواهد شد.', async () => {
            if (!licenseId) {
                addToast("لایسنس یافت نشد.", "error");
                return;
            }
            try {
                const { data, error } = await supabase.from('backups').select('backup_data').eq('license_id', licenseId).single();
                if (error) throw error;
                if (data && data.backup_data) {
                    setAllData(data.backup_data);
                    addToast('اطلاعات با موفقیت از نسخه پشتیبان آنلاین بازیابی شد.', 'success');
                } else {
                    throw new Error("فایل پشتیبان یافت نشد یا خالی است.");
                }
            } catch (error: any) {
                console.error("Error restoring from online backup:", error);
                addToast(`خطا در بازیابی اطلاعات: ${error.message}`, "error");
            }
        });
    };
    
    const handlePurgeData = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const isWithinRange = (dateStr: string) => {
            const date = new Date(dateStr);
            return date >= start && date <= end;
        };

        setOrders(prev => prev.filter(o => !isWithinRange(o.orderDate)));
        setExpenses(prev => prev.filter(e => !isWithinRange(e.date)));
        setPurchaseBills(prev => prev.filter(p => !isWithinRange(p.purchaseDate)));
        setHasUnsavedChanges(true);
        addToast("داده‌های تاریخی در بازه مشخص شده با موفقیت حذف شدند.", "success");
    };


    // --- Generic Soft Delete Handler ---
    const softDeleteItem = (item: TrashableItem, itemType: TrashItem['itemType']) => {
        if (!currentUser) return;
        const trashItem: TrashItem = {
            id: `${itemType}-${'id' in item ? item.id : Date.now()}-${Date.now()}`,
            deletedAt: new Date().toISOString(),
            deletedBy: currentUser.username,
            itemType,
            data: item,
        };
        setTrash(prev => [trashItem, ...prev]);
        setHasUnsavedChanges(true);
    };

    // --- Inventory Adjustment ---
    const adjustInventory = (items: OrderItem[], operation: 'subtract' | 'add') => {
        setBatches(currentBatches => {
            const updatedBatches = [...currentBatches];
            
            for (const item of items) {
                let quantityToProcess = item.quantity + (item.bonusQuantity || 0);

                if (operation === 'subtract') {
                    // FEFO Logic
                    const relevantBatches = updatedBatches
                        .filter(b => b.drugId === item.drugId && b.location === 'sales_warehouse' && b.quantity > 0)
                        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

                    for (const batch of relevantBatches) {
                        if (quantityToProcess <= 0) break;
                        const deductAmount = Math.min(quantityToProcess, batch.quantity);
                        batch.quantity -= deductAmount;
                        quantityToProcess -= deductAmount;
                    }
                } else { // 'add' for sales returns
                    // Create a new batch for returned items
                    const newReturnBatch: Batch = {
                        id: `RETURN-${item.drugId}-${Date.now()}`,
                        drugId: item.drugId,
                        lotNumber: `RETURN-${item.drugName.substring(0,5)}`,
                        quantity: quantityToProcess,
                        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Assume 1 year expiry for now
                        purchasePrice: 0, // No cost basis for returns yet
                        location: 'sales_warehouse'
                    };
                    updatedBatches.push(newReturnBatch);
                }
            }
            return updatedBatches.filter(b => b.quantity > 0);
        });
    };
    
    // --- Drug Handlers ---
    const handleSaveDrugDefinition = (drugData: DrugDefinition) => {
        const exists = drugDefinitions.some(d => d.id === drugData.id);
        if (exists) {
            setDrugDefinitions(prev => prev.map(d => d.id === drugData.id ? drugData : d));
            addToast('اطلاعات دارو با موفقیت به‌روزرسانی شد.', 'success');
        } else {
            setDrugDefinitions(prev => [drugData, ...prev]);
            addToast('داروی جدید با موفقیت اضافه شد.', 'success');
        }
        setHasUnsavedChanges(true);
    };
    const handleDeleteDrugDefinition = (id: number) => {
        const hasBatches = batches.some(b => b.drugId === id);
        if (hasBatches) {
            addToast("امکان حذف دارو وجود ندارد چون هنوز در انبار موجودی دارد.", 'error');
            return;
        }
        showConfirmation('تایید حذف', 'آیا از انتقال این تعریف دارو به سطل زباله اطمینان دارید؟', () => {
             const itemToDelete = drugDefinitions.find(d => d.id === id);
            if (itemToDelete) {
                softDeleteItem(itemToDelete, 'drug');
                setDrugDefinitions(prev => prev.filter(d => d.id !== id));
                addToast('تعریف دارو با موفقیت به سطل زباله منتقل شد.', 'success');
            }
        });
    };
    
    const handleWriteOff = (batch: Batch, quantity: number, reason: WriteOffReason, notes: string) => {
        if (!currentUser) return;
        const drugDef = drugDefinitions.find(d => d.id === batch.drugId);
        
        const newWriteOff: InventoryWriteOff = {
            id: Date.now(),
            drugId: batch.drugId,
            drugName: drugDef?.name || 'نامشخص',
            lotNumber: batch.lotNumber,
            quantity,
            reason,
            notes,
            date: new Date().toISOString(),
            adjustedBy: currentUser.username,
            costAtTime: batch.purchasePrice,
            totalLossValue: batch.purchasePrice * quantity,
        };
        setInventoryWriteOffs(prev => [newWriteOff, ...prev]);
    
        setBatches(currentBatches => currentBatches.map(b =>
            b.id === batch.id ? { ...b, quantity: b.quantity - quantity } : b
        ).filter(b => b.quantity > 0));
        
        addToast(`${quantity.toLocaleString()} عدد از ${drugDef?.name} (لات: ${batch.lotNumber}) به عنوان ضایعات ثبت شد.`, 'success');
        setHasUnsavedChanges(true);
    };

    // --- Order Handlers ---
    const handleSaveOrder = (orderData: Order) => {
        const existingOrder = orders.find(o => o.id === orderData.id);
        
        if (orderData.type === 'sale_return') {
            adjustInventory(orderData.items, 'add');
            setOrders(prev => [orderData, ...prev]);
            addToast(`مستردی ${orderData.orderNumber} با موفقیت ثبت شد.`, 'success');

        } else if (existingOrder) { // It's an update to a sale
            const wasShipped = existingOrder.status === 'ارسال شده' || existingOrder.status === 'تکمیل شده';
            const isShipped = orderData.status === 'ارسال شده' || orderData.status === 'تکمیل شده';

            if (!wasShipped && isShipped) { // From processing to shipped
                adjustInventory(orderData.items, 'subtract');
            } else if (wasShipped && !isShipped) { // From shipped to processing
                adjustInventory(orderData.items, 'add');
            }
            setOrders(prev => prev.map(o => o.id === orderData.id ? orderData : o));
            addToast(`سفارش ${orderData.orderNumber} با موفقیت به‌روزرسانی شد.`, 'success');

        } else { // It's a new sale
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const dailyCount = orders.filter(o => o.orderDate === new Date().toISOString().split('T')[0] && o.type === 'sale').length + 1;
            
            const customer = customers.find(c => c.name === orderData.customerName);
            let ledgerRefCode = '';
            if (customer) {
                const customerOrderCount = orders.filter(o => o.customerName === customer.name).length;
                ledgerRefCode = `C${customer.id}-${(customerOrderCount + 1).toString().padStart(3, '0')}`;
            }

            const newOrder: Order = {
                ...orderData,
                type: 'sale',
                orderDate: new Date().toISOString().split('T')[0],
                orderNumber: `ORD-${year}${month}-${dailyCount.toString().padStart(3, '0')}`,
                ledgerRefCode: ledgerRefCode,
            };
             if (newOrder.status === 'ارسال شده' || newOrder.status === 'تکمیل شده') {
                adjustInventory(newOrder.items, 'subtract');
            }
            setOrders(prev => [newOrder, ...prev]);
            addToast(`سفارش جدید ${newOrder.orderNumber} با موفقیت ثبت شد.`, 'success');
        }
        setHasUnsavedChanges(true);
    };

    const handleDeleteOrder = (id: number) => {
        showConfirmation('تایید حذف', 'آیا از حذف این سند اطمینان دارید؟ اگر سفارش ارسال شده باشد، موجودی کالاها به انبار باز خواهد گشت.', () => {
            const itemToDelete = orders.find(o => o.id === id);
            if (itemToDelete) {
                if (itemToDelete.type === 'sale' && (itemToDelete.status === 'ارسال شده' || itemToDelete.status === 'تکمیل شده')) {
                    adjustInventory(itemToDelete.items, 'add'); // Return stock to inventory
                } else if (itemToDelete.type === 'sale_return') {
                     adjustInventory(itemToDelete.items, 'subtract'); // Re-deduct returned stock
                }
                softDeleteItem(itemToDelete, 'order');
                setOrders(prev => prev.filter(o => o.id !== id));
                addToast('سند با موفقیت به سطل زباله منتقل شد.', 'success');
            }
        });
    };

    // --- Customer Handlers ---
    const handleSaveCustomer = (customerData: Customer) => {
        const exists = customers.some(c => c.id === customerData.id);
        if (exists) {
            setCustomers(prev => prev.map(c => c.id === customerData.id ? customerData : c));
            addToast('اطلاعات مشتری با موفقیت به‌روزرسانی شد.', 'success');
        } else {
             setCustomers(prev => [{...customerData, registrationDate: new Date().toISOString().split('T')[0]}, ...prev]);
             addToast('مشتری جدید با موفقیت اضافه شد.', 'success');
        }
        setHasUnsavedChanges(true);
    };
    const handleDeleteCustomer = (id: number) => {
        showConfirmation('تایید حذف', 'آیا از انتقال این مشتری به سطل زباله اطمینان دارید؟', () => {
            const itemToDelete = customers.find(c => c.id === id);
            if (itemToDelete) {
                softDeleteItem(itemToDelete, 'customer');
                setCustomers(prev => prev.filter(c => c.id !== id));
                addToast('مشتری با موفقیت به سطل زباله منتقل شد.', 'success');
            }
        });
    };
    
    // --- Supplier Handlers ---
    const handleSaveSupplier = (supplierData: Supplier) => {
        const exists = suppliers.some(s => s.id === supplierData.id);
        if (exists) {
            setSuppliers(prev => prev.map(s => s.id === supplierData.id ? supplierData : s));
            addToast('اطلاعات تامین کننده با موفقیت به‌روزرسانی شد.', 'success');
        } else {
             setSuppliers(prev => [supplierData, ...prev]);
             addToast('تامین کننده جدید با موفقیت اضافه شد.', 'success');
        }
        setHasUnsavedChanges(true);
    };
    const handleDeleteSupplier = (id: number) => {
        showConfirmation('تایید حذف', 'آیا از انتقال این تامین کننده به سطل زباله اطمینان دارید؟', () => {
            const itemToDelete = suppliers.find(s => s.id === id);
            if (itemToDelete) {
                softDeleteItem(itemToDelete, 'supplier');
                setSuppliers(prev => prev.filter(s => s.id !== id));
                addToast('تامین کننده با موفقیت به سطل زباله منتقل شد.', 'success');
            }
        });
    };
    
    // --- Purchase Bill Handlers ---
    const handleSavePurchaseBill = (billData: PurchaseBill) => {
        // Since purchase logic now creates batches directly, we just save the bill.
        // Inventory changes happen on "received" status.
        if (billData.status === 'دریافت شده') {
             setBatches(currentBatches => {
                const newBatches = billData.items.map(item => ({
                    // FIX: PurchaseItem now contains lotNumber and expiryDate after changes in Purchasing.tsx
                    id: `${billData.id}-${item.drugId}-${item.lotNumber}`,
                    drugId: item.drugId,
                    lotNumber: item.lotNumber,
                    quantity: item.quantity,
                    expiryDate: item.expiryDate,
                    purchasePrice: item.purchasePrice,
                    location: 'main_warehouse' as 'main_warehouse'
                }));
                // This simple add assumes new purchases don't edit existing batches, which is correct.
                return [...currentBatches, ...newBatches];
             });
        }
        
        const isEditing = purchaseBills.some(b => b.id === billData.id);
        if(isEditing) {
            // NOTE: Editing logic for received bills is complex and not handled in this phase.
            // A proper implementation would need to find and adjust the created batches.
            setPurchaseBills(prev => prev.map(b => b.id === billData.id ? billData : b));
            addToast(`فاکتور خرید ${billData.billNumber} به‌روزرسانی شد.`, 'success');
        } else {
            setPurchaseBills(prev => [billData, ...prev]);
            addToast(`فاکتور ${billData.type === 'purchase' ? 'خرید' : 'مستردی'} ${billData.billNumber} با موفقیت ثبت شد.`, 'success');
        }
        setHasUnsavedChanges(true);
    };
    
    const handleDeletePurchaseBill = (id: number) => {
        showConfirmation('تایید حذف', 'آیا از حذف این فاکتور خرید اطمینان دارید؟ این عمل، بچ‌های مرتبط را از انبار حذف نمی‌کند (باید دستی انجام شود).', () => {
            const itemToDelete = purchaseBills.find(b => b.id === id);
            if (itemToDelete) {
                // Deleting batches is complex, warn user for now.
                softDeleteItem(itemToDelete, 'purchaseBill');
                setPurchaseBills(prev => prev.filter(b => b.id !== id));
                addToast('فاکتور خرید به سطل زباله منتقل شد. لطفا بچ‌های مربوطه را دستی بررسی کنید.', 'info');
            }
        });
    };


    // --- Expense Handlers ---
    const handleSaveExpense = (expenseData: Expense) => {
        const exists = expenses.some(e => e.id === expenseData.id);
        if (exists) {
            setExpenses(prev => prev.map(e => e.id === expenseData.id ? expenseData : e));
            addToast('هزینه با موفقیت به‌روزرسانی شد.', 'success');
        } else {
            setExpenses(prev => [expenseData, ...prev]);
            addToast('هزینه جدید با موفقیت ثبت شد.', 'success');
        }
        setHasUnsavedChanges(true);
    };
    const handleDeleteExpense = (id: number) => {
        showConfirmation('تایید حذف', 'آیا از انتقال این هزینه به سطل زباله اطمینان دارید؟', () => {
            const itemToDelete = expenses.find(e => e.id === id);
            if (itemToDelete) {
                softDeleteItem(itemToDelete, 'expense');
                setExpenses(prev => prev.filter(e => e.id !== id));
                addToast('هزینه با موفقیت به سطل زباله منتقل شد.', 'success');
            }
        });
    };
    
    // --- User Handlers (from Settings) ---
    const handleSaveUser = (userData: Omit<User, 'lastLogin'>) => {
        const isEditing = users.some(u => u.id === userData.id);
        if (isEditing) {
            setUsers(prev => prev.map(u => u.id === userData.id ? { ...u, ...userData } : u));
            addToast('اطلاعات کاربر به‌روزرسانی شد.', 'success');
        } else {
            const newUser: User = {
                ...userData,
                lastLogin: 'هرگز وارد نشده'
            };
            setUsers(prev => [newUser, ...prev]);
            addToast('کاربر جدید اضافه شد.', 'success');
        }
        setHasUnsavedChanges(true);
    };

    const handleDeleteUser = (id: number) => {
        if (id === 1) { 
            addToast("کاربر مدیر کل قابل حذف نیست.", 'error');
            return;
        }
        showConfirmation('تایید حذف', 'آیا از انتقال این کاربر به سطل زباله اطمینان دارید؟', () => {
             const itemToDelete = users.find(u => u.id === id);
            if(itemToDelete) {
                softDeleteItem(itemToDelete, 'user');
                setUsers(prev => prev.filter(u => u.id !== id));
                addToast('کاربر با موفقیت به سطل زباله منتقل شد.', 'success');
            }
        });
    };
    
    // --- Settings Handlers ---
    const handleSetCompanyInfo = (newInfo: CompanyInfoType) => {
        setCompanyInfo(newInfo);
        setHasUnsavedChanges(true);
        addToast('اطلاعات شرکت با موفقیت ذخیره شد.', 'success');
    };
    
    const handleSetDocumentSettings = (newSettings: DocumentSettings) => {
        setDocumentSettings(newSettings);
        setHasUnsavedChanges(true);
        addToast('تنظیمات اسناد با موفقیت ذخیره شد.', 'success');
    };


    // --- Recycle Bin Handlers ---
    const handleRestoreItem = (itemToRestore: TrashItem) => {
        switch (itemToRestore.itemType) {
            case 'drug': setDrugDefinitions(prev => [itemToRestore.data as DrugDefinition, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'customer': setCustomers(prev => [itemToRestore.data as Customer, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'supplier': setSuppliers(prev => [itemToRestore.data as Supplier, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'expense': setExpenses(prev => [itemToRestore.data as Expense, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'user': setUsers(prev => [itemToRestore.data as User, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'order':
                const restoredOrder = itemToRestore.data as Order;
                if (restoredOrder.type === 'sale' && (restoredOrder.status === 'ارسال شده' || restoredOrder.status === 'تکمیل شده')) {
                    adjustInventory(restoredOrder.items, 'subtract'); // Re-deduct stock
                } else if (restoredOrder.type === 'sale_return') {
                     adjustInventory(restoredOrder.items, 'add'); // Re-add returned stock
                }
                setOrders(prev => [restoredOrder, ...prev].sort((a,b) => a.id - b.id));
                break;
            case 'purchaseBill':
                // Restoring purchase bills does not affect inventory in this phase to prevent data inconsistency.
                setPurchaseBills(prev => [itemToRestore.data as PurchaseBill, ...prev].sort((a,b) => a.id - b.id));
                break;
        }
        setTrash(prev => prev.filter(t => t.id !== itemToRestore.id));
        setHasUnsavedChanges(true);
        addToast('آیتم با موفقیت بازیابی شد.', 'success');
    };

    const handlePermanentlyDeleteItem = (id: string) => {
        showConfirmation('حذف دائمی', 'آیا از حذف دائمی این آیتم اطمینان دارید؟ این عمل غیرقابل بازگشت است.', () => {
             setTrash(prev => prev.filter(t => t.id !== id));
             setHasUnsavedChanges(true);
             addToast('آیتم برای همیشه حذف شد.', 'info');
        });
    };
    
    const handleEmptyTrash = () => {
        showConfirmation('خالی کردن سطل زباله', 'آیا از خالی کردن کامل سطل زباله اطمینان دارید؟ تمام آیتم‌ها به صورت دائمی حذف خواهند شد.', () => {
            setTrash([]);
            setHasUnsavedChanges(true);
            addToast('سطل زباله خالی شد.', 'info');
        });
    }

    // --- Stock Requisition Handlers ---
    const handleSaveRequisition = (newRequisition: Omit<StockRequisition, 'id' | 'status' | 'requestedBy' | 'date'>) => {
        if (!currentUser) return;
        const finalRequisition: StockRequisition = {
            ...newRequisition,
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'در انتظار',
            requestedBy: currentUser.username,
        };
        setStockRequisitions(prev => [finalRequisition, ...prev]);
        addToast('درخواست کالا با موفقیت ثبت و برای انبار اصلی ارسال شد.', 'success');
        setHasUnsavedChanges(true);
    };

    const handleFulfillRequisition = (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[], fulfilledBy: string) => {
        setBatches(currentBatches => {
            const updatedBatches = [...currentBatches];
            for (const item of fulfilledItems) {
                let quantityToFulfill = item.quantityFulfilled;
                if (quantityToFulfill <= 0) continue;

                const sourceBatches = updatedBatches
                    .filter(b => b.drugId === item.drugId && b.location === 'main_warehouse' && b.quantity > 0)
                    .sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

                for (const sourceBatch of sourceBatches) {
                    if (quantityToFulfill <= 0) break;
                    
                    const moveQuantity = Math.min(quantityToFulfill, sourceBatch.quantity);
                    sourceBatch.quantity -= moveQuantity;
                    quantityToFulfill -= moveQuantity;

                    const existingDestBatch = updatedBatches.find(b => b.drugId === item.drugId && b.location === 'sales_warehouse' && b.lotNumber === sourceBatch.lotNumber);
                    if (existingDestBatch) {
                        existingDestBatch.quantity += moveQuantity;
                    } else {
                        updatedBatches.push({ ...sourceBatch, quantity: moveQuantity, location: 'sales_warehouse' });
                    }
                }
            }
            return updatedBatches.filter(b => b.quantity > 0);
        });

        // 2. Update requisition status
        setStockRequisitions(prev => prev.map(req => 
            req.id === requisition.id 
                ? { ...req, status: 'تکمیل شده', fulfilledBy, items: fulfilledItems } 
                : req
        ));

        // 3. Create a log in internalTransfers for history
        const transferLog: InternalTransfer = {
            id: Date.now(),
            date: new Date().toISOString(),
            drugName: `انتقال بر اساس درخواست #${requisition.id}`,
            quantity: fulfilledItems.reduce((sum, item) => sum + item.quantityFulfilled, 0),
            from: 'main',
            to: 'sales',
            transferredBy: fulfilledBy,
        };
        setInternalTransfers(prev => [transferLog, ...prev]);

        addToast(`درخواست #${requisition.id} با موفقیت تکمیل و کالاها منتقل شدند.`, 'success');
        setHasUnsavedChanges(true);
    };


    // --- AI Assistant Handler ---
    const handleSendToAssistant = async (message: string) => {
        setAssistantMessages(prev => [...prev, { sender: 'user', text: message }]);
        setIsAssistantLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const systemInstruction = `You are 'Hayat Assistant', an expert business analyst for a pharmaceutical distribution company in Afghanistan. Your responses must be in Farsi. Analyze the provided JSON data to answer the user's question. Today's date is ${new Date().toISOString().split('T')[0]}.`;
            
            const prompt = `${systemInstruction}\n\n## Data:\n\n### Sales Warehouse Stock (Grouped):\n${JSON.stringify(drugDefinitions, null, 2)}\n\n### Customers:\n${JSON.stringify(customers, null, 2)}\n\n### Orders:\n${JSON.stringify(orders, null, 2)}\n\n## User Question:\n${message}`;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });

            const aiResponseText = response.text;
            setAssistantMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage = "متاسفانه در حال حاضر امکان برقراری ارتباط با دستیار هوشمند وجود ندارد. لطفاً بعداً دوباره امتحان کنید.";
            setAssistantMessages(prev => [...prev, { sender: 'ai', text: errorMessage }]);
        } finally {
            setIsAssistantLoading(false);
        }
    };
    
    const handleAuthSuccess = () => {
        const activated = JSON.parse(window.localStorage.getItem('hayat_isDeviceActivated') || 'false');
        const licId = JSON.parse(window.localStorage.getItem('hayat_licenseId') || 'null');
        const sess = JSON.parse(window.localStorage.getItem('hayat_session') || 'null');
        
        setLicenseId(licId);
        setSession(sess);
        setIsDeviceActivated(activated);
    };
    
    const DeactivatedScreen = () => (
        <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-2xl text-center">
                 <h1 className="text-3xl font-bold text-red-600">دسترسی شما به برنامه مسدود شده است</h1>
                 <p className="text-gray-600">ممکن است لایسنس شما به دستگاه دیگری منتقل شده باشد یا توسط مدیر سیستم غیرفعال شده باشد. لطفاً برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.</p>
                 <button onClick={handleLogout} className="mt-4 px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg">خروج</button>
            </div>
        </div>
    );

    const UpdateRequiredScreen = () => {
        const [isVerifying, setIsVerifying] = useState(false);
        const handleVerify = async () => {
            if (!navigator.onLine) {
                addToast("لطفاً به اینترنت متصل شوید و دوباره تلاش کنید.", "error");
                return;
            }
            setIsVerifying(true);
            await verifyLicense(true);
            setIsVerifying(false);
        }

        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
                 <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-2xl text-center">
                    <div className="flex justify-center"><CloudSyncIcon className="w-16 h-16 text-teal-500" /></div>
                    <h1 className="text-3xl font-bold text-gray-800">نیاز به همگام‌سازی</h1>
                    <p className="text-gray-600">برای دریافت آخرین به‌روزرسانی‌ها و اطمینان از عملکرد صحیح برنامه، لطفاً برای چند لحظه به اینترنت متصل شوید.</p>
                    <button onClick={handleVerify} disabled={isVerifying} className="w-full mt-4 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-teal-300">
                        {isVerifying ? 'در حال بررسی...' : 'بررسی برای آپدیت'}
                    </button>
                 </div>
            </div>
        );
    };
    
    // --- Render Logic ---
    if (isUpdateRequired) {
        return <UpdateRequiredScreen />;
    }
    if (isLicenseDeactivated) {
        return <DeactivatedScreen />;
    }

    if (!isDeviceActivated) {
        if (authMode === 'activation') {
            return <ActivationScreen onActivate={handleAuthSuccess} onSwitchToLogin={() => setAuthMode('login')} />;
        }
        return <OnlineLoginScreen onLoginSuccess={handleAuthSuccess} onSwitchToActivation={() => setAuthMode('activation')} />;
    }

    if (!currentUser) {
        return <UserLoginScreen users={users} onLogin={handleLogin} onBackupKeyReset={handlePasswordReset} backupKey={backupKey} addToast={addToast}/>;
    }


    const getPageTitle = () => {
        if (activeItem === 'settings') return 'تنظیمات';
        if (activeItem === 'recycle_bin') return 'سطل زباله';
        if (activeItem === 'alerts') return 'مدیریت هشدارها';
        return navItems.find(item => item.id === activeItem)?.label || 'داشبورد';
    };

    const renderContent = () => {
        switch (activeItem) {
            case 'dashboard':
                // FIX: Pass drugDefinitions and batches to Dashboard instead of an empty array.
                return <Dashboard drugDefinitions={drugDefinitions} batches={batches} orders={orders} customers={customers} onNavigate={setActiveItem} activeAlerts={activeAlerts} />;
            case 'main_warehouse':
                // FIX: Pass correct props to MainWarehouse.
                return <MainWarehouse 
                    drugDefinitions={drugDefinitions}
                    batches={batches}
                    stockRequisitions={stockRequisitions}
                    onFulfillRequisition={handleFulfillRequisition}
                    currentUser={currentUser}
                    addToast={addToast}
                />;
            case 'inventory':
                return <Inventory 
                    drugDefinitions={drugDefinitions}
                    batches={batches}
                    stockRequisitions={stockRequisitions}
                    onSaveDrugDefinition={handleSaveDrugDefinition} 
                    onDelete={handleDeleteDrugDefinition} 
                    onWriteOff={handleWriteOff} 
                    onSaveRequisition={handleSaveRequisition}
                    currentUser={currentUser} 
                    addToast={addToast} 
                />;
            case 'sales':
                return <Sales orders={orders} drugDefinitions={drugDefinitions} batches={batches} customers={customers} companyInfo={companyInfo} onSave={handleSaveOrder} onDelete={handleDeleteOrder} currentUser={currentUser} documentSettings={documentSettings} addToast={addToast} onSaveDrug={handleSaveDrugDefinition} />;
            case 'fulfillment':
                // FIX: Pass correct props to Fulfillment.
                return <Fulfillment orders={orders} drugDefinitions={drugDefinitions} batches={batches} onUpdateOrder={handleSaveOrder} />;
            case 'customers':
                return <Customers customers={customers} onSave={handleSaveCustomer} onDelete={handleDeleteCustomer} currentUser={currentUser} addToast={addToast} />;
            case 'customer_accounts':
                return <CustomerAccounts customers={customers} orders={orders} companyInfo={companyInfo} documentSettings={documentSettings} addToast={addToast} />;
            case 'suppliers':
                return <Suppliers suppliers={suppliers} onSave={handleSaveSupplier} onDelete={handleDeleteSupplier} currentUser={currentUser} />;
            case 'purchasing':
                // FIX: Pass correct props to Purchasing.
                return <Purchasing purchaseBills={purchaseBills} suppliers={suppliers} drugDefinitions={drugDefinitions} onSave={handleSavePurchaseBill} onDelete={handleDeletePurchaseBill} currentUser={currentUser} addToast={addToast} />;
            case 'supplier_accounts':
                return <SupplierAccounts suppliers={suppliers} purchaseBills={purchaseBills} companyInfo={companyInfo} documentSettings={documentSettings} addToast={addToast} />;
            case 'finance':
                return <Accounting incomes={incomes} expenses={expenses} onSave={handleSaveExpense} onDelete={handleDeleteExpense} currentUser={currentUser} />;
            case 'reports':
                // FIX: Pass correct props to Reports.
                return <Reports orders={orders} drugDefinitions={drugDefinitions} batches={batches} customers={customers} suppliers={suppliers} purchaseBills={purchaseBills} inventoryWriteOffs={inventoryWriteOffs} companyInfo={companyInfo} documentSettings={documentSettings} />;
             case 'checkneh':
                return <Checkneh 
                    customers={customers} 
                    companyInfo={companyInfo} 
                    documentSettings={documentSettings}
                    addToast={addToast}
                    showConfirmation={showConfirmation}
                />;
            case 'alerts':
                return <Alerts settings={alertSettings} setSettings={setAlertSettings} customers={customers} />;
            case 'settings':
                return <Settings 
                    companyInfo={companyInfo} 
                    onSetCompanyInfo={handleSetCompanyInfo} 
                    users={users} 
                    onSaveUser={handleSaveUser} 
                    onDeleteUser={handleDeleteUser} 
                    onPasswordReset={handlePasswordReset}
                    backupKey={backupKey}
                    onBackupKeyChange={setBackupKey}
                    supabase={supabase}
                    licenseId={licenseId}
                    onBackupLocal={handleBackupLocal}
                    onRestoreLocal={handleRestoreLocal}
                    onBackupOnline={handleBackupOnline}
                    onRestoreOnline={handleRestoreOnline}
                    onPurgeData={handlePurgeData}
                    documentSettings={documentSettings}
                    onSetDocumentSettings={handleSetDocumentSettings}
                    hasUnsavedChanges={hasUnsavedChanges}
                    addToast={addToast}
                    showConfirmation={showConfirmation}
                    currentUser={currentUser}
                />;
            case 'recycle_bin':
                 return <RecycleBin 
                    trashItems={trash} 
                    onRestore={handleRestoreItem} 
                    onDelete={handlePermanentlyDeleteItem} 
                    onEmptyTrash={handleEmptyTrash} 
                />;
            default:
                // FIX: Pass drugDefinitions and batches to Dashboard instead of an empty array.
                return <Dashboard drugDefinitions={drugDefinitions} batches={batches} orders={orders} customers={customers} onNavigate={setActiveItem} activeAlerts={activeAlerts} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100" dir="rtl">
            <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} userRole={currentUser.role} onLogout={handleLogout} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={getPageTitle()} currentUser={currentUser} alerts={activeAlerts} onNavigate={setActiveItem} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
            
            <ToastContainer toasts={toasts} setToasts={setToasts} />
            <ConfirmationModal 
                isOpen={confirmationState.isOpen}
                onClose={closeConfirmation}
                onConfirm={handleConfirm}
                title={confirmationState.title}
            >
                {confirmationState.message}
            </ConfirmationModal>
            
             <button
                onClick={() => setIsAssistantOpen(true)}
                className="fixed bottom-8 left-8 bg-gradient-to-br from-teal-500 to-cyan-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300"
                aria-label="باز کردن دستیار هوشمند حیات"
            >
                <SparklesIcon className="w-8 h-8"/>
            </button>

            <HayatAssistant
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                messages={assistantMessages}
                isLoading={isAssistantLoading}
                onSendMessage={handleSendToAssistant}
            />

            {showUpdateNotification && <UpdateNotification onUpdate={handleUpdate} />}
        </div>
    );
};

export default App;
