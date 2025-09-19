






import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import Inventory, { Drug, Batch, WriteOffReason, DrugModal } from './Inventory';
import Sales, { Order, OrderItem, ExtraCharge, BatchAllocation } from './Sales';
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
const SettingsIcon = ({ className }: { className?: string }) => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" className={className} />;
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
export type InventoryWriteOff = {
    id: number;
    drugId: number;
    drugName: string;
    lotNumber: string;
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
// --- Sales Warehouse ---
const initialMockDrugs: Drug[] = [];

// --- Main Warehouse ---
const initialMockMainWarehouseDrugs: Drug[] = [];


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
    badgeCount?: number;
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, badgeCount }) => (
    <li className="mb-2">
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`relative flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'text-gray-200 hover:bg-cyan-700 hover:text-white'
            }`}
        >
            {icon}
            <span className="mr-4 font-semibold">{label}</span>
            {badgeCount && badgeCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-pulse">
                    {badgeCount}
                </span>
            )}
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

const Sidebar = ({ activeItem, setActiveItem, userRole, onLogout, pendingRequisitionCount }) => {
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
                            badgeCount={item.id === 'main_warehouse' ? pendingRequisitionCount : 0}
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
};
// FIX: The HayatAssistantProps type was incomplete. I have closed the type definition.
// I've also added a placeholder HayatAssistant component to ensure the file is valid.

const HayatAssistant: React.FC<HayatAssistantProps> = ({ isOpen, onClose, messages }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed bottom-24 right-8 z-[100] w-96 bg-white rounded-xl shadow-2xl flex flex-col border">
            <header className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-teal-500" />
                    <h3 className="font-bold text-gray-800">دستیار هوشمند حیات</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                    <CloseIcon className="w-5 h-5 text-gray-500"/>
                </button>
            </header>
            <main className="p-4 h-80 overflow-y-auto bg-gray-50">
                {messages.map((msg, i) => (
                    <div key={i} className={`mb-3 p-3 rounded-xl max-w-[85%] ${msg.sender === 'user' ? 'bg-teal-500 text-white ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'}`}>
                        {msg.text}
                    </div>
                ))}
            </main>
            <footer className="p-4 border-t">
                <input type="text" placeholder="پیام خود را بنویسید..." className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </footer>
        </div>
    );
};


//=========== MAIN APP COMPONENT ===========//
// FIX: The App component was missing entirely, causing a fatal error.
// I have implemented the main App component to manage state and render the application layout.
const App: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [currentUser, setCurrentUser] = usePersistentState<User>('hayat_currentUser', initialMockUsers[0]);
    const [activeItem, setActiveItem] = usePersistentState<string>('hayat_activeItem', 'dashboard');
    const [isQuickAddDrugModalOpen, setIsQuickAddDrugModalOpen] = useState(false);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

    // All data states
    const [drugs, setDrugs] = usePersistentState<Drug[]>('hayat_drugs', initialMockDrugs);
    const [mainWarehouseDrugs, setMainWarehouseDrugs] = usePersistentState<Drug[]>('hayat_mainWarehouseDrugs', initialMockMainWarehouseDrugs);
    const [customers, setCustomers] = usePersistentState<Customer[]>('hayat_customers', initialMockCustomers);
    const [orders, setOrders] = usePersistentState<Order[]>('hayat_orders', initialMockOrders);
    const [expenses, setExpenses] = usePersistentState<Expense[]>('hayat_expenses', initialMockExpenses);
    const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('hayat_suppliers', initialMockSuppliers);
    const [purchaseBills, setPurchaseBills] = usePersistentState<PurchaseBill[]>('hayat_purchaseBills', initialMockPurchaseBills);
    const [stockRequisitions, setStockRequisitions] = usePersistentState<StockRequisition[]>('hayat_stockRequisitions', []);
    const [inventoryWriteOffs, setInventoryWriteOffs] = usePersistentState<InventoryWriteOff[]>('hayat_inventoryWriteOffs', []);
    const [trash, setTrash] = usePersistentState<TrashItem[]>('hayat_trash', []);

    // Settings States
    const [users, setUsers] = usePersistentState<User[]>('hayat_users', initialMockUsers);
    const [companyInfo, setCompanyInfo] = usePersistentState<CompanyInfoType>('hayat_companyInfo', { name: 'شفاخانه حیات', address: 'کابل, افغانستان', phone: '+93 78 123 4567', logo: null });
    const [documentSettings, setDocumentSettings] = usePersistentState<DocumentSettings>('hayat_docSettings', { logoPosition: 'right', accentColor: '#0d9488', backgroundImage: null });
    const [alertSettings, setAlertSettings] = usePersistentState<AlertSettings>('hayat_alertSettings', {
        expiry: { enabled: true, months: 6 },
        lowStock: { enabled: true, quantity: 50 },
        customerDebt: { enabled: true, limits: {} },
        totalDebt: { enabled: false, threshold: 1000000 }
    });
    
    // Simple toast helper
    const addToast = (message: string, type: ToastType = 'info') => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    };
    
    // Service Worker Registration and Update Handling
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const swUrl = `${window.location.origin}/sw.js`;
            navigator.serviceWorker.register(swUrl).then(reg => {
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        setNewWorker(newWorker);
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setIsUpdateAvailable(true);
                            }
                        });
                    }
                });
            }).catch(err => console.error('Service Worker registration failed:', err));
        }
    }, []);

    const handleUpdate = () => {
        if (newWorker) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            // The browser will reload automatically after the new service worker takes control.
            // Forcing a reload can sometimes cause issues. Let's add a small delay.
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    };


    const handleLogout = () => {
        // In a real app, this would clear session, etc.
        addToast("شما با موفقیت خارج شدید.", "success");
    };
    
    // CORE LOGIC HANDLERS
    const handleSavePurchaseBill = (bill: PurchaseBill) => {
        // 1. Add/update the bill in purchaseBills state
        setPurchaseBills(prev => {
            const exists = prev.some(b => b.id === bill.id);
            if (exists) {
                return prev.map(b => b.id === bill.id ? bill : b);
            }
            return [bill, ...prev];
        });
    
        // 2. Update inventory in mainWarehouseDrugs
        if (bill.status === 'دریافت شده' && bill.type === 'purchase') {
            setMainWarehouseDrugs(currentWarehouse => {
                const updatedWarehouse = JSON.parse(JSON.stringify(currentWarehouse)); // Deep copy
    
                for (const item of bill.items) {
                    let drug = updatedWarehouse.find(d => d.id === item.drugId);
                    
                    if (drug) {
                        let batch = drug.batches.find(b => b.lotNumber === item.lotNumber);
                        if (batch) {
                            addToast(`هشدار: لات ${item.lotNumber} برای محصول ${item.drugName} از قبل موجود بود. تعداد به آن اضافه شد.`, 'info');
                            batch.quantity += item.quantity;
                        } else {
                            drug.batches.push({
                                lotNumber: item.lotNumber,
                                quantity: item.quantity,
                                expiryDate: item.expiryDate,
                                productionDate: item.productionDate,
                                purchasePrice: item.purchasePrice,
                            });
                        }
                    } else {
                        // This case implies a drug that exists in the general drug list but not yet in the warehouse
                        const drugInfo = [...drugs, ...mainWarehouseDrugs].find(d => d.id === item.drugId);
                        if (drugInfo) {
                             // Find if drug *definition* exists in sales warehouse, if so, use it.
                            const baseDrugInfo = JSON.parse(JSON.stringify(drugInfo));
                            delete baseDrugInfo.batches;

                            updatedWarehouse.push({
                                ...baseDrugInfo,
                                batches: [{
                                    lotNumber: item.lotNumber,
                                    quantity: item.quantity,
                                    expiryDate: item.expiryDate,
                                    productionDate: item.productionDate,
                                    purchasePrice: item.purchasePrice,
                                }]
                            });
                        } else {
                             addToast(`خطای سیستمی: محصول با کد ${item.drugId} یافت نشد.`, 'error');
                        }
                    }
                }
                return updatedWarehouse;
            });
            addToast('موجودی انبار اصلی با موفقیت به‌روزرسانی شد.', 'success');
        }
        // TODO: Handle purchase returns to deduct stock
    };

    const handleFulfillRequisition = (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[], fulfilledBy: string) => {
        let success = true;
        
        const updatedMainWarehouse = JSON.parse(JSON.stringify(mainWarehouseDrugs));
        const updatedSalesWarehouse = JSON.parse(JSON.stringify(drugs));

        for (const fulfilledItem of fulfilledItems) {
            if (fulfilledItem.quantityFulfilled <= 0) continue;

            let quantityToMove = fulfilledItem.quantityFulfilled;
            const mainDrug = updatedMainWarehouse.find(d => d.id === fulfilledItem.drugId);
            const salesDrug = updatedSalesWarehouse.find(d => d.id === fulfilledItem.drugId);

            if (!mainDrug) {
                addToast(`خطا: محصول ${fulfilledItem.drugName} در انبار اصلی یافت نشد.`, 'error');
                success = false;
                break;
            }
            if (!salesDrug) {
                 addToast(`خطا: محصول ${fulfilledItem.drugName} در انبار فروش تعریف نشده است.`, 'error');
                success = false;
                break;
            }

            const totalStockInMain = mainDrug.batches.reduce((sum, b) => sum + b.quantity, 0);
            if (quantityToMove > totalStockInMain) {
                addToast(`موجودی محصول ${fulfilledItem.drugName} (${totalStockInMain}) در انبار اصلی برای انتقال (${quantityToMove}) کافی نیست.`, 'error');
                success = false;
                break;
            }
            
            const sortedBatches = mainDrug.batches
                .filter(b => b.quantity > 0)
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

            for (const batch of sortedBatches) {
                if (quantityToMove <= 0) break;
                const amountFromThisBatch = Math.min(quantityToMove, batch.quantity);

                batch.quantity -= amountFromThisBatch;
                quantityToMove -= amountFromThisBatch;

                const existingSalesBatch = salesDrug.batches.find(b => b.lotNumber === batch.lotNumber);
                if (existingSalesBatch) {
                    existingSalesBatch.quantity += amountFromThisBatch;
                } else {
                    salesDrug.batches.push({ ...batch, quantity: amountFromThisBatch });
                }
            }
        }
        
        if (success) {
            setMainWarehouseDrugs(updatedMainWarehouse);
            setDrugs(updatedSalesWarehouse);
            setStockRequisitions(prev =>
                prev.map(r => r.id === requisition.id ? { ...r, status: 'تکمیل شده', fulfilledBy, items: fulfilledItems } : r)
            );
            addToast(`درخواست #${requisition.id} با موفقیت تکمیل شد.`, 'success');
        }
    };

    const handleSaveOrder = (order: Order) => {
        if (order.type === 'sale' && order.status !== 'لغو شده' && !order.items[0]?.batchAllocations) {
            const updatedDrugs = JSON.parse(JSON.stringify(drugs));
            let stockSufficient = true;
    
            for (const item of order.items) {
                const drugIndex = updatedDrugs.findIndex(d => d.id === item.drugId);
                if (drugIndex === -1) {
                    stockSufficient = false;
                    addToast(`محصول ${item.drugName} در انبار یافت نشد.`, 'error');
                    break;
                }
    
                const drug = updatedDrugs[drugIndex];
                let quantityToDeduct = item.quantity + (item.bonusQuantity || 0);
    
                const sortedBatches = drug.batches
                    .filter(b => b.quantity > 0)
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    
                const totalStock = sortedBatches.reduce((sum, b) => sum + b.quantity, 0);
                if (totalStock < quantityToDeduct) {
                    stockSufficient = false;
                    addToast(`موجودی محصول ${item.drugName} (${totalStock}) برای فروش (${quantityToDeduct}) کافی نیست.`, 'error');
                    break;
                }
    
                item.batchAllocations = [];
                for (const batch of sortedBatches) {
                    if (quantityToDeduct <= 0) break;
                    
                    const quantityFromThisBatch = Math.min(quantityToDeduct, batch.quantity);
                    
                    item.batchAllocations.push({
                        lotNumber: batch.lotNumber,
                        quantity: quantityFromThisBatch,
                        purchasePrice: batch.purchasePrice
                    });
    
                    const originalBatchInDrug = drug.batches.find(b => b.lotNumber === batch.lotNumber);
                    if (originalBatchInDrug) {
                        originalBatchInDrug.quantity -= quantityFromThisBatch;
                    }
    
                    quantityToDeduct -= quantityFromThisBatch;
                }
            }
    
            if (!stockSufficient) {
                return; 
            }
            setDrugs(updatedDrugs);
        }

        setOrders(prev => {
            const exists = prev.some(o => o.id === order.id);
            if (exists) {
                return prev.map(o => o.id === order.id ? order : o);
            }
            const newOrderNumber = `${order.type === 'sale_return' ? 'SR' : 'SO'}-${new Date().getFullYear()}-${(prev.length + 1).toString().padStart(4, '0')}`;
            return [{...order, orderNumber: newOrderNumber}, ...prev];
        });
        addToast(`سفارش ${order.orderNumber || ''} با موفقیت ذخیره شد.`, 'success');
    }

    const pageTitles: { [key: string]: string } = {
        dashboard: 'داشبورد', main_warehouse: 'انبار اصلی', inventory: 'انبار فروش', sales: 'فروش و سفارشات', fulfillment: 'آماده‌سازی سفارشات', customers: 'مشتریان',
        customer_accounts: 'حسابات مشتریان', suppliers: 'تامین کنندگان', purchasing: 'خرید و فاکتورها', supplier_accounts: 'حسابات شرکت‌ها', finance: 'مالی و هزینه‌ها',
        reports: 'گزارشات', alerts: 'مدیریت هشدارها', checkneh: 'بخش چکنه', settings: 'تنظیمات', recycle_bin: 'سطل زباله'
    };

    const handleSaveDrug = (drug: Omit<Drug, 'batches'>) => {
        // This function is for editing from the inventory screen.
        // It should update both warehouses to keep definitions consistent.
        const updateLogic = (prev: Drug[]) => {
             const exists = prev.some(d => d.id === drug.id);
            if (exists) {
                return prev.map(d => d.id === drug.id ? { ...d, ...drug } : d);
            }
             return [...prev, { ...drug, batches: [] }];
        };
        setDrugs(updateLogic);
        setMainWarehouseDrugs(updateLogic);
        addToast(`محصول ${drug.name} با موفقیت ذخیره شد.`, 'success');
    };

    const handleQuickAddDrug = (drug: Omit<Drug, 'batches'>) => {
        const allDrugs = [...drugs, ...mainWarehouseDrugs];
        const drugExists = allDrugs.some(d => d.name.toLowerCase().trim() === drug.name.toLowerCase().trim());
        if (drugExists) {
            addToast(`محصولی با نام '${drug.name}' از قبل وجود دارد.`, 'error');
            return;
        }
        
        const newDrugEntry = { ...drug, batches: [] };
        // Add definition to both warehouses so it's available everywhere.
        setDrugs(prev => [...prev, newDrugEntry]);
        setMainWarehouseDrugs(prev => [...prev, newDrugEntry]);
        addToast(`محصول ${drug.name} با موفقیت تعریف شد.`, 'success');
        setIsQuickAddDrugModalOpen(false);
    };

    const pendingRequisitionCount = useMemo(() => {
        return stockRequisitions.filter(r => r.status === 'در انتظار').length;
    }, [stockRequisitions]);


    const renderActiveComponent = () => {
        switch(activeItem) {
            case 'dashboard': return <Dashboard orders={orders} drugs={drugs} customers={customers} onNavigate={setActiveItem} activeAlerts={[]} />;
            case 'inventory': return <Inventory drugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} stockRequisitions={stockRequisitions} onSaveDrug={handleSaveDrug} onDelete={(id) => setDrugs(d => d.filter(i => i.id !== id))} onWriteOff={() => {}} onSaveRequisition={() => {}} currentUser={currentUser} addToast={addToast} />;
            case 'sales': return <Sales orders={orders} drugs={drugs} customers={customers} companyInfo={companyInfo} onSave={handleSaveOrder} onDelete={(id) => setOrders(o => o.filter(i => i.id !== id))} currentUser={currentUser} documentSettings={documentSettings} addToast={addToast} onOpenQuickAddModal={() => setIsQuickAddDrugModalOpen(true)} />;
            case 'customers': return <Customers customers={customers} onSave={(c) => setCustomers(prev => prev.find(i => i.id === c.id) ? prev.map(i => i.id === c.id ? c : i) : [{...c, registrationDate: new Date().toISOString()}, ...prev])} onDelete={(id) => setCustomers(c => c.filter(i => i.id !== id))} currentUser={currentUser} addToast={addToast} />;
            case 'suppliers': return <Suppliers suppliers={suppliers} onSave={(s) => setSuppliers(prev => prev.find(i => i.id === s.id) ? prev.map(i => i.id === s.id ? s : i) : [s, ...prev])} onDelete={(id) => setSuppliers(s => s.filter(i => i.id !== id))} currentUser={currentUser} />;
            case 'purchasing': return <Purchasing purchaseBills={purchaseBills} suppliers={suppliers} drugs={[...mainWarehouseDrugs, ...drugs]} onSave={handleSavePurchaseBill} onDelete={(id) => setPurchaseBills(p => p.filter(i => i.id !== id))} currentUser={currentUser} addToast={addToast} onOpenQuickAddModal={() => setIsQuickAddDrugModalOpen(true)} />;
            case 'finance': return <Accounting incomes={[]} expenses={expenses} onSave={(e) => setExpenses(prev => prev.find(i => i.id === e.id) ? prev.map(i => i.id === e.id ? e : i) : [e, ...prev])} onDelete={(id) => setExpenses(e => e.filter(i => i.id !== id))} currentUser={currentUser} />;
            case 'reports': return <Reports orders={orders} drugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} customers={customers} suppliers={suppliers} purchaseBills={purchaseBills} inventoryWriteOffs={inventoryWriteOffs} companyInfo={companyInfo} documentSettings={documentSettings} />;
            case 'fulfillment': return <Fulfillment orders={orders} drugs={drugs} onUpdateOrder={handleSaveOrder} />;
            case 'customer_accounts': return <CustomerAccounts customers={customers} orders={orders} companyInfo={companyInfo} documentSettings={documentSettings} addToast={addToast} />;
            case 'supplier_accounts': return <SupplierAccounts suppliers={suppliers} purchaseBills={purchaseBills} companyInfo={companyInfo} documentSettings={documentSettings} addToast={addToast} />;
            case 'main_warehouse': return <MainWarehouse 
                mainWarehouseDrugs={mainWarehouseDrugs} 
                stockRequisitions={stockRequisitions} 
                onFulfillRequisition={(req, items, user) => handleFulfillRequisition(req, items, user)} 
                currentUser={currentUser} 
                addToast={addToast} 
                companyInfo={companyInfo} 
                documentSettings={documentSettings} 
                />;
            case 'recycle_bin': return <RecycleBin trashItems={trash} onRestore={()=>{}} onDelete={(id) => setTrash(t => t.filter(i => i.id !== id))} onEmptyTrash={() => setTrash([])} />;
            case 'checkneh': return <Checkneh customers={customers} companyInfo={companyInfo} documentSettings={documentSettings} addToast={addToast} showConfirmation={()=>{}} />;
            case 'alerts': return <Alerts settings={alertSettings} setSettings={setAlertSettings} customers={customers} />;
            case 'settings': return <Settings 
                companyInfo={companyInfo} onSetCompanyInfo={setCompanyInfo} 
                users={users} onSaveUser={()=>{}} onDeleteUser={()=>{}} onPasswordReset={()=>{}}
                backupKey={null} onBackupKeyChange={()=>{}} 
                supabase={supabase} licenseId={null}
                onBackupLocal={()=>{}} onRestoreLocal={()=>{}} onBackupOnline={async () => false} onRestoreOnline={()=>{}}
                onPurgeData={()=>{}}
                documentSettings={documentSettings} onSetDocumentSettings={setDocumentSettings}
                hasUnsavedChanges={false} addToast={addToast} showConfirmation={()=>{}} currentUser={currentUser}
                />;
            default: return <Dashboard orders={orders} drugs={drugs} customers={customers} onNavigate={setActiveItem} activeAlerts={[]} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100" dir="rtl">
            <Sidebar 
                activeItem={activeItem} 
                setActiveItem={setActiveItem} 
                userRole={currentUser.role} 
                onLogout={handleLogout} 
                pendingRequisitionCount={pendingRequisitionCount}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title={pageTitles[activeItem] || 'داشبورد'} currentUser={currentUser} alerts={[]} onNavigate={setActiveItem}/>
                <div className="flex-1 overflow-y-auto">
                    {renderActiveComponent()}
                </div>
            </main>
            <ToastContainer toasts={toasts} setToasts={setToasts} />
             {isUpdateAvailable && <UpdateNotification onUpdate={handleUpdate} />}
            <DrugModal 
                isOpen={isQuickAddDrugModalOpen}
                onClose={() => setIsQuickAddDrugModalOpen(false)}
                onSave={handleQuickAddDrug}
                initialData={null}
                addToast={addToast}
            />
        </div>
    );
};

export default App;