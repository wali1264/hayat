import React, { useState, useRef, useEffect, useMemo } from 'react';
// FIX: Import necessary types from @google/genai to align with API guidelines.
import { GoogleGenAI, FunctionDeclaration, Modality, Type } from "@google/genai";
// FIX: Import Supabase types with `import type` to resolve module export errors where `Session` and `RealtimeChannel` were not found.
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session, RealtimeChannel } from '@supabase/supabase-js';
import Inventory, { Drug, Batch, WriteOffReason, DrugModal } from './Inventory';
import Sales, { Order, OrderItem, ExtraCharge, BatchAllocation } from './Sales';
import Customers, { Customer } from './Customers';
import Accounting, { Expense, Income } from './Accounting';
import Reports from './Reports';
import Settings, { CompanyInfo as CompanyInfoType, User, UserRole, mockUsers as initialMockUsers, DocumentSettings, RolePermissions } from './Settings';
import Fulfillment from './Fulfillment';
import Dashboard from './Dashboard';
import CustomerAccounts from './CustomerAccounts';
import Suppliers, { Supplier } from './Suppliers';
import Purchasing, { PurchaseBill, PurchaseItem } from './Purchasing';
import SupplierAccounts from './SupplierAccounts';
import RecycleBin, { TrashItem, TrashableItem } from './RecycleBin';
import Checkneh, { ChecknehInvoice } from './Checkneh';
import Alerts, { AlertSettings } from './Alerts';
import MainWarehouse from './MainWarehouse';
import Login from './Login';
import { allFunctionDeclarations } from './voiceAssistant.declarations';
import { handlerMap } from './voiceAssistant.handlers';


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
const SettingsIcon = ({ className }: { className?: string }) => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426-1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" className={className} />;
const LogoutIcon = ({ className }: { className?: string }) => <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className={className} />;
const SuppliersIcon = ({ className }: { className?: string }) => <Icon path="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V6a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-1m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className={className} />;
const PurchasingIcon = ({ className }: { className?: string }) => <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className={className} />;
const SupplierAccountsIcon = ({ className }: { className?: string }) => <Icon path="M4 4h16v16H4z M4 9h16v2H4z M9 13h2v4H9z M13 13h2v4h-2z" className={className} />;
const RecycleBinIcon = ({ className }: { className?: string }) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className} />;
const ChecknehIcon = ({ className }: { className?: string }) => <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m2 14h-2m2-4h-4m-2-4h6" className={className} />;
const CloudSyncIcon = ({ className }: { className?: string }) => <Icon path="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a4 4 0 01-4-4V9a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V16a4 4 0 01-4 4z" className={className} />;
const AlertIcon = ({ className }: { className?: string }) => <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className={className} />;
const LockIcon = ({ className }: { className?: string }) => <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className={className} />;
const WifiOffIcon = ({ className }: { className?: string }) => <Icon path="M18.364 5.636a9 9 0 010 12.728M12 18h.01M4.929 4.929a12.003 12.003 0 0114.142 0M1 1l22 22M8.465 8.465a5 5 0 017.07 0" className={className}/>;
const PlusCircleIcon = ({ className }: { className?: string }) => <Icon path="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" className={className} />;


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
const MicrophoneIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
    </svg>
);
const StopIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3-3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
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
            <path strokeLinecap="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5m-4-1a4 4 0 01-4-4V7a4 4 0 014-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293h4.586a4 4 0 014 4v5a4 4 0 01-4 4H7z" />
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

export const NoPermissionMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-white p-10 rounded-2xl shadow-lg border">
            <LockIcon className="w-16 h-16 text-yellow-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-gray-800">عدم دسترسی</h2>
            <p className="mt-2 text-gray-600 max-w-sm">
                شما دسترسی لازم برای انجام عملیات در این بخش را ندارید. لطفاً با مدیر سیستم تماس بگیرید.
            </p>
        </div>
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
            if (state === null) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(state));
            }
        } catch (error) {
            console.error(error);
        }
    }, [key, state]);

    return [state, setState];
}

//=========== PERMISSIONS & ROLES ===========//
// The basePermissions map is now deprecated and will be replaced by the dynamic rolePermissions state.
// It remains here as a reference for the navigation items but is not used for action-level security.
const basePermissions = {
    'مدیر کل': ['dashboard', 'main_warehouse', 'inventory', 'sales', 'fulfillment', 'customers', 'customer_accounts', 'suppliers', 'purchasing', 'supplier_accounts', 'finance', 'reports', 'checkneh', 'alerts', 'settings', 'recycle_bin'],
    'فروشنده': ['dashboard', 'sales', 'customers', 'customer_accounts', 'reports', 'inventory'],
    'انباردار': ['dashboard', 'main_warehouse', 'inventory', 'fulfillment', 'suppliers', 'purchasing'],
    'حسابدار': ['dashboard', 'customer_accounts', 'supplier_accounts', 'finance', 'reports'],
};

// --- Default Granular Permissions ---
const initialRolePermissions: RolePermissions = {
    'فروشنده': {
        canCreateSale: true,
        canEditSale: true,
        canDeleteSale: false,
        canGiveManualDiscount: true,
        maxDiscountPercentage: 10,
        canCreateCustomer: true,
        canEditCustomer: true,
        canDeleteCustomer: false,
        canCreateDrug: false,
        canEditDrug: false,
        canDeleteDrug: false,
        canWriteOffStock: false,
    },
    'انباردار': {
        canCreateSale: false,
        canEditSale: false,
        canDeleteSale: false,
        canGiveManualDiscount: false,
        maxDiscountPercentage: 0,
        canCreateCustomer: false,
        canEditCustomer: false,
        canDeleteCustomer: false,
        canCreateDrug: true,
        canEditDrug: true,
        canDeleteDrug: false,
        canWriteOffStock: true,
    },
    'حسابدار': {
        canCreateSale: false,
        canEditSale: false,
        canDeleteSale: false,
        canGiveManualDiscount: false,
        maxDiscountPercentage: 0,
        canCreateCustomer: false,
        canEditCustomer: false,
        canDeleteCustomer: false,
        canCreateDrug: false,
        canEditDrug: false,
        canDeleteDrug: false,
        canWriteOffStock: false,
    },
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

// --- NEW OFFLINE QUEUE TYPES ---
type SyncAction = {
    id: string;
    type: 'UPSERT' | 'DELETE';
    table: string;
    payload?: any; // For UPSERT/INSERT
    match?: any; // For DELETE
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

export const navItems = [
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
    const allowedNavItems = navItems.filter(item => {
        // Handle remote users who might not have a role in the basePermissions map
        const permissions = basePermissions[userRole] || [];
        return permissions.includes(item.id);
    });
    const canAccessSettings = (basePermissions[userRole] || []).includes('settings');
    const canAccessRecycleBin = (basePermissions[userRole] || []).includes('recycle_bin');

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
                            badgeCount={item.id === 'main_warehouse' ? pendingRequisitionCount : undefined}
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

// --- NEW: Bottom Navigation for Mobile/Remote View ---
const BottomNav = ({ activeItem, setActiveItem, userRole }) => {
    // Remote users have a more focused set of tools
    const remoteAllowedIds = ['dashboard', 'inventory', 'sales', 'customers', 'customer_accounts', 'reports'];

    const allowedNavItems = navItems
        .filter(item => remoteAllowedIds.includes(item.id))
        .filter(item => {
            const permissions = basePermissions[userRole] || [];
            return permissions.includes(item.id);
        });

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-lg flex justify-around border-t z-50">
            {allowedNavItems.slice(0, 5).map(item => ( // Show first 5 items
                <button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    className={`flex flex-col items-center justify-center w-full transition-colors ${activeItem === item.id ? 'text-teal-600' : 'text-gray-500'}`}
                >
                    {React.cloneElement(item.icon, { className: 'w-6 h-6 mb-1' })}
                    <span className="text-xs font-semibold">{item.label}</span>
                </button>
            ))}
        </nav>
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

// --- NEW: System Offline Banner for Remote Users ---
const SystemOfflineBanner = () => (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm font-semibold z-[1000]">
        <div className="flex items-center justify-center gap-2">
            <WifiOffIcon className="w-5 h-5" />
            <span>اتصال با سیستم مرکزی قطع است. شما در حالت فقط خواندنی (Read-only) هستید.</span>
        </div>
    </div>
);


//=========== LICENSE SYSTEM TYPES AND HELPERS ===========//
type LicenseStatus = 'LOADING' | 'NEEDS_ACTIVATION' | 'NEEDS_VALIDATION' | 'INVALID' | 'VALID';
type OnlineValidationResult = 'VALID' | 'INVALID_DEACTIVATED' | 'INVALID_MACHINE_ID' | 'NOT_FOUND' | 'NETWORK_ERROR';

type LicenseInfo = {
    id: number; // Changed to number to match bigint
    user_id: string; // This is the auth.users UUID
    machine_id: string;
    session: Session;
};

function getOrCreateMachineId(): string {
    let machineId = localStorage.getItem('hayat_machine_id');
    if (!machineId) {
        machineId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
        localStorage.setItem('hayat_machine_id', machineId);
    }
    return machineId;
}


//=========== VOICE ASSISTANT COMPONENT (NEW) ===========//

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAssistant = ({ onNavigate, currentUser, addToast, activeItem, dispatchUiAction, drugs, customers, customerBalances, orders, onSaveRequisition, alertSettings, mainWarehouseDrugs }: { onNavigate: (page: string) => void; currentUser: User | null; addToast: (msg: string, type: ToastType) => void; activeItem: string; dispatchUiAction: (action: any) => void; drugs: Drug[]; customers: Customer[]; customerBalances: Map<string, number>; orders: Order[], onSaveRequisition: (req: any) => void, alertSettings: AlertSettings, mainWarehouseDrugs: Drug[] }) => {
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'>('IDLE');
    const [transcript, setTranscript] = useState<{ speaker: 'user' | 'ai'; text: string }[]>([]);
    
    const sessionPromiseRef = useRef<any | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextAudioStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const aiRef = useRef<GoogleGenAI | null>(null);

    // Initialize AI client once
    useEffect(() => {
        // The user has requested to hardcode the API key for testing purposes.
        // For production, it is strongly recommended to use environment variables.
        aiRef.current = new GoogleGenAI({ apiKey: 'AIzaSyCW-Z_sKzymBIFbWyPHcIN1HlS_QLZr0Ow' });
    }, []);

    const cleanup = () => {
        // RESILIENCY FIX: Guard to prevent race conditions from multiple cleanup calls.
        if (status === 'IDLE' && !sessionPromiseRef.current) return;
        setStatus('IDLE');

        // Close session
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                if (session && typeof session.close === 'function') session.close();
            }).catch(e => console.warn("Error during session close:", e));
            sessionPromiseRef.current = null;
        }
        
        // Disconnect audio nodes
        if (scriptProcessorRef.current) {
            try { scriptProcessorRef.current.disconnect(); } catch (e) {}
            scriptProcessorRef.current = null;
        }

        // Close contexts safely
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(e => console.warn("Input context close error:", e));
        }
        inputAudioContextRef.current = null;

        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(e => console.warn("Output context close error:", e));
        }
        outputAudioContextRef.current = null;
        
        // Stop media stream tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Reset audio playback state
        audioSourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
        audioSourcesRef.current.clear();
        nextAudioStartTimeRef.current = 0;
    };
    
    useEffect(() => {
        // Cleanup on unmount
        return () => cleanup();
    }, []);

    const startSession = async () => {
        if (!aiRef.current || status !== 'IDLE') return;

        setStatus('LISTENING');
        setTranscript([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            addToast('دسترسی به میکروفون لازم است.', 'error');
            console.error('Microphone access denied:', e);
            setStatus('IDLE');
            return;
        }

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextAudioStartTimeRef.current = 0;

        
        const systemInstruction = `دستور اصلی: شما یک دستیار هوشمند برای مدیریت داروخانه به نام "حیات" هستید. وظیفه شما اجرای فوری و دقیق دستورات کاربر است.

**قوانین مطلق:**
1.  **هرگز اجازه نگیر:** شما یک عامل مستقل هستید. **هرگز** برای استفاده از ابزارهای داخلی خود (مانند \`queryStockLevel\`) از کاربر اجازه نخواهید گرفت. اگر دستوری را دریافت کردید که با یک ابزار مطابقت دارد، آن را فوراً اجرا کنید.
    *   **رفتار اشتباه:** «برای بررسی موجودی باید از تابع استعلام استفاده کنم، آیا اجازه می‌دهید؟»
    *   **رفتار صحیح:** (پس از اجرای تابع) «در حال حاضر ۵ عدد پینیسیلین موجود است.»
2.  **جستجوی هوشمند:** برای پیدا کردن داروها، همیشه از منطق جستجوی هوشمند استفاده کنید. این یعنی نام‌های فارسی، انگلیسی، ناقص، و با حروف بزرگ/کوچک را یکسان در نظر بگیرید. (مثال: «پنسلین» باید داروی "Penicillin" را پیدا کند).
3.  **رفع ابهام:** اگر جستجوی شما چندین نتیجه داشت (مثلاً «شربت پاراستامول» و «قرص پاراستامول»)، از کاربر بپرسید کدام را انتخاب کند. نگویید که چیزی پیدا نکردید.
4.  **صداقت:** اگر ابزاری خطا برگرداند (مثلاً «موجودی کافی نیست»)، آن خطا را مستقیماً به کاربر اطلاع دهید. هرگز وانمود نکنید کاری را انجام داده‌اید که در عمل ناموفق بوده.`;


        const sessionPromise = aiRef.current.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    // RESILIENCY FIX: If cleanup has run while the connection was opening,
                    // the audio context will be null. Abort to prevent a crash.
                    if (!inputAudioContextRef.current || !streamRef.current) {
                        console.warn("[Voice Assistant] onopen triggered after cleanup. Aborting audio setup.");
                        return;
                    }
                    const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: any) => {
                    if (message.serverContent) {
                        if (message.serverContent.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent.turnComplete) {
                            if (currentInputTranscriptionRef.current.trim()) {
                                setTranscript(prev => [...prev, { speaker: 'user', text: currentInputTranscriptionRef.current.trim() }]);
                            }
                             if (currentOutputTranscriptionRef.current.trim()) {
                                setTranscript(prev => [...prev, { speaker: 'ai', text: currentOutputTranscriptionRef.current.trim() }]);
                            }
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }
                    }

                    if (message.toolCall) {
                        setStatus('THINKING');
                        for (const fc of message.toolCall.functionCalls) {
                            const handlerContext = {
                                dispatchUiAction,
                                drugs,
                                customers,
                                customerBalances,
                                orders,
                                onSaveRequisition,
                                alertSettings,
                                mainWarehouseDrugs,
                                activeItem,
                                onNavigate,
                                setIsAssistantOpen,
                            };

                            const handler = handlerMap[fc.name];
                            let result = 'ok';

                            if (handler) {
                                try {
                                    result = handler(fc.args, handlerContext);
                                } catch (error) {
                                    console.error(`Error executing handler for ${fc.name}:`, error);
                                    result = `خطایی در اجرای دستور «${fc.name}» رخ داد.`;
                                }
                            } else {
                                result = `دستور صوتی «${fc.name}» پشتیبانی نمی‌شود.`;
                            }
                            
                            // After executing, send a response back to the model.
                            sessionPromiseRef.current?.then(session => session.sendToolResponse({
                                functionResponses: { id : fc.id, name: fc.name, response: { result } }
                            }));
                        }
                    }

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData) {
                        setStatus('SPEAKING');
                        const outputContext = outputAudioContextRef.current!;
                        nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, outputContext.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outputContext, 24000, 1);
                        const source = outputContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputContext.destination);
                        source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                        source.start(nextAudioStartTimeRef.current);
                        nextAudioStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                },
                onerror: (e) => {
                    console.error('Session error:', e);
                    addToast('خطا در ارتباط با دستیار صوتی.', 'error');
                    cleanup();
                },
                onclose: () => {
                    console.log('Session closed.');
                    cleanup();
                },
            },
            config: {
                // FIX: Use Modality.AUDIO enum member instead of a string literal.
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                tools: [{ functionDeclarations: allFunctionDeclarations }],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction
            },
        });
        sessionPromiseRef.current = sessionPromise;
    };
    
    const toggleAssistant = () => {
        if (!aiRef.current) {
            addToast('کلید API برای دستیار صوتی تنظیم نشده است.', 'error');
            return;
        }
        if (status === 'IDLE') {
            setIsAssistantOpen(true);
            startSession();
        } else {
            cleanup();
            setIsAssistantOpen(false);
        }
    };

    const statusMap = {
        IDLE: { text: 'برای شروع صحبت کنید', color: 'text-gray-500' },
        LISTENING: { text: 'در حال شنیدن...', color: 'text-blue-500' },
        THINKING: { text: 'در حال پردازش...', color: 'text-yellow-500' },
        SPEAKING: { text: 'در حال صحبت کردن...', color: 'text-green-500' },
    };

    return (
        <>
            <button
                onClick={toggleAssistant}
                className={`fixed bottom-6 left-6 z-[102] w-16 h-16 rounded-full text-white shadow-2xl flex items-center justify-center transition-all duration-300 ${status === 'IDLE' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-600 hover:bg-red-700'}`}
                aria-label={status === 'IDLE' ? 'فعال کردن دستیار صوتی' : 'غیرفعال کردن دستیار صوتی'}
            >
                {status !== 'IDLE' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                {status === 'IDLE' ? <MicrophoneIcon className="w-8 h-8"/> : <StopIcon className="w-8 h-8" />}
            </button>

            {isAssistantOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-30 z-[95] flex items-end justify-center p-4" onClick={() => { if (status === 'IDLE') setIsAssistantOpen(false); }}>
                    <div className="bg-white rounded-t-2xl w-full max-w-2xl max-h-[60vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <header className="p-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <SparklesIcon className="w-6 h-6 text-teal-500" />
                                <h3 className="text-lg font-bold">دستیار هوشمند حیات</h3>
                                <p className={`text-sm font-semibold ${statusMap[status].color}`}>{statusMap[status].text}</p>
                            </div>
                            <button onClick={() => { cleanup(); setIsAssistantOpen(false); }} className="p-1 rounded-full hover:bg-gray-100"><CloseIcon/></button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {transcript.length === 0 && <p className="text-center text-gray-500 py-8">برای شروع، دستور خود را بگویید...</p>}
                            {transcript.map((t, i) => (
                                <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <p className={`max-w-[80%] p-3 rounded-2xl ${t.speaker === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                        {t.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


//=========== MAIN APP COMPONENT ===========//
const App: React.FC = () => {
    // --- Remote Control View ---
    const urlParams = new URLSearchParams(window.location.search);
    const isRemoteView = urlParams.get('view') === 'remote';

    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: ToastType = 'info') => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    };
    
    // --- NEW: SERVICE WORKER UPDATE STATE ---
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);

    // --- NEW LICENSE STATE MANAGEMENT ---
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>('LOADING');
    const [licenseInfo, setLicenseInfo] = usePersistentState<LicenseInfo | null>('hayat_license_info', null);
    const [lastCheck, setLastCheck] = usePersistentState<string | null>('hayat_last_license_check', null);

    // --- NEW: UI ACTION QUEUE FOR VOICE ASSISTANT ---
    const [uiActionQueue, setUiActionQueue] = useState<any[]>([]);
    const dispatchUiAction = (action: any) => {
        setUiActionQueue(prev => [...prev, { ...action, id: Date.now() + Math.random() }]);
    };
    const consumeUiAction = (actionId: number) => {
        setUiActionQueue(prev => prev.filter(a => a.id !== actionId));
    };


    // --- NEW: SERVICE WORKER REGISTRATION & UPDATE HANDLING ---
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker) {
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // New update is available
                                    setNewWorker(installingWorker);
                                    setIsUpdateAvailable(true);
                                }
                            }
                        };
                    }
                };
            }).catch(error => {
                console.error('Error during service worker registration:', error);
            });
        }
    }, []);

    const handleUpdate = () => {
        if (newWorker) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            
            let reloading = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (reloading) return;
                window.location.reload();
                reloading = true;
            });
        }
    };
    
    const performOnlineValidation = async (): Promise<OnlineValidationResult> => {
        if (!licenseInfo) {
            return 'NOT_FOUND';
        }
        try {
            const { data: licenseData, error } = await supabase
                .from('licenses')
                .select('is_active, machine_id')
                .match({ id: licenseInfo.id, user_id: licenseInfo.user_id })
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // "Found 0 rows"
                    return 'NOT_FOUND';
                }
                throw new Error(error.message);
            }
            if (!licenseData) {
                return 'NOT_FOUND';
            }

            if (!licenseData.is_active) {
                 return 'INVALID_DEACTIVATED';
            }
            if (licenseData.machine_id !== getOrCreateMachineId()) {
                return 'INVALID_MACHINE_ID';
            }

            return 'VALID';

        } catch (error: any) {
            console.error("Online validation network error:", error.message);
            return 'NETWORK_ERROR';
        }
    };
    
    const validateLicense = async () => {
        addToast("در حال اعتبارسنجی آنلاین...", "info");
        const result = await performOnlineValidation();

        if (result === 'VALID') {
            setLastCheck(new Date().toISOString());
            setLicenseStatus('VALID');
            addToast("اعتبارسنجی با موفقیت انجام شد.", "success");
        } else if (result !== 'NETWORK_ERROR') {
            // Deactivated, machine ID mismatch, or not found
            setLastCheck(null); // Revoke offline access
            setLicenseStatus('INVALID');
            // Specific toast is shown within performOnlineValidation
        } else {
             addToast("خطا در اعتبارسنجی آنلاین. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.", 'error');
        }
    };


    useEffect(() => {
        if (isRemoteView) {
            setLicenseStatus('VALID'); // Bypass local license check for remote view
            return;
        }

        const checkLicenseOnStartup = async () => {
            if (!licenseInfo) {
                setLicenseStatus('NEEDS_ACTIVATION');
                return;
            }

            const validationResult = await performOnlineValidation();

            switch (validationResult) {
                case 'VALID':
                    setLastCheck(new Date().toISOString());
                    setLicenseStatus('VALID');
                    break;
                
                case 'INVALID_DEACTIVATED':
                    addToast("لایسنس شما توسط مدیر غیرفعال شده است.", 'error');
                    setLastCheck(null);
                    setLicenseStatus('INVALID');
                    break;

                case 'INVALID_MACHINE_ID':
                    addToast("این لایسنس به دستگاه دیگری منتقل شده است.", 'error');
                    setLastCheck(null);
                    setLicenseStatus('INVALID');
                    break;

                case 'NOT_FOUND':
                    addToast("لایسنس شما در سیستم یافت نشد.", 'error');
                    setLastCheck(null);
                    setLicenseStatus('INVALID');
                    break;

                case 'NETWORK_ERROR':
                    console.warn("Online license check failed, falling back to offline validation.");
                    const now = new Date();
                    const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);
                    const diffDays = Math.ceil((now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > 30) {
                        setLicenseStatus('NEEDS_VALIDATION');
                    } else {
                        setLicenseStatus('VALID');
                    }
                    break;
            }
        };

        checkLicenseOnStartup();
    }, [licenseInfo, isRemoteView]);

    const handleActivationSuccess = (newLicenseInfo: LicenseInfo) => {
        setLicenseInfo(newLicenseInfo);
        setLastCheck(new Date().toISOString());
        setLicenseStatus('VALID');
    };


    // --- ORIGINAL APP STATE ---
    const [activeItem, setActiveItem] = usePersistentState<string>('hayat_activeItem', 'dashboard');
    const [isQuickAddDrugModalOpen, setIsQuickAddDrugModalOpen] = useState(false);
    const [preselectedCustomerId, setPreselectedCustomerId] = useState<number | null>(null);
    const [lotNumberToTrace, setLotNumberToTrace] = useState<string | null>(null);

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
    const [checknehInvoices, setChecknehInvoices] = usePersistentState<ChecknehInvoice[]>('hayat_checkneh_invoices', initialMockChecknehInvoices);

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
    const [rolePermissions, setRolePermissions] = usePersistentState<RolePermissions>('hayat_rolePermissions', initialRolePermissions);
    const [isOnlineMode, setIsOnlineMode] = usePersistentState<boolean>('hayat_isOnlineMode', false);
    
    // --- NEW: OFFLINE SYNC QUEUE ---
    const [syncQueue, setSyncQueue] = usePersistentState<SyncAction[]>('hayat_syncQueue', []);
    const [isSyncing, setIsSyncing] = useState(false);


    // --- NEW AUTHENTICATION STATE ---
    const [currentUser, setCurrentUser] = usePersistentState<User | null>('hayat_currentUser', null);
    const [remoteUser, setRemoteUser] = useState<User | null>(null);
    const [remoteLicenseId, setRemoteLicenseId] = useState<number | null>(null);
    const [isSystemOnline, setIsSystemOnline] = useState<boolean | null>(null);

    
    // --- NEW CONFIRMATION MODAL STATE ---
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
    } | null>(null);

    const showConfirmation = (title: string, message: React.ReactNode, onConfirm: () => void) => {
        setConfirmationModal({ isOpen: true, title, message, onConfirm });
    };

    const handleConfirm = () => {
        if (confirmationModal) {
            confirmationModal.onConfirm();
            setConfirmationModal(null);
        }
    };

    const handleCloseConfirmation = () => {
        setConfirmationModal(null);
    };

    // --- NEW: SYNC QUEUE HELPER ---
    const addToSyncQueue = (action: Omit<SyncAction, 'id'>) => {
        const newAction: SyncAction = {
            ...action,
            id: `${action.table}-${Date.now()}-${Math.random()}`
        };
        setSyncQueue(prev => [...prev, newAction]);
    };
    
    // --- NEW AUTH & USER MANAGEMENT LOGIC ---
    const handleLogin = (username: string, password_raw: string) => {
        // In a real app, passwords would be hashed.
        const userToLogin = users.find(u => u.username === username && u.password === password_raw);

        if (userToLogin) {
            const now = new Date().toLocaleString('fa-IR');
            const updatedUser = { ...userToLogin, lastLogin: now };

            // Update the user's last login time in the main users list
            setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
            
            // Set the current user for the session
            setCurrentUser(updatedUser);
            addToast(`خوش آمدید، ${username}!`, 'success');
        } else {
            addToast('نام کاربری یا رمز عبور اشتباه است.', 'error');
        }
    };

    const handleLogout = () => {
        addToast("شما با موفقیت خارج شدید.", "success");
        setCurrentUser(null);
    };

    const handleRemoteLogout = () => {
        addToast("شما از ریموت کنترل خارج شدید.", "info");
        setRemoteUser(null);
        setRemoteLicenseId(null);
        setIsSystemOnline(null);
        // Turn off online mode for the remote client
        setIsOnlineMode(false);
    };
    
    const handleRemoteLogin = async (companyUsername: string, username: string, password_raw: string) => {
        addToast("در حال اتصال...", "info");
        try {
            const { data: licenseData, error: licenseError } = await supabase
                .from('licenses')
                .select('id, user_id, machine_id')
                .eq('username', companyUsername)
                .single();
            
            if (licenseError || !licenseData) {
                throw new Error("نام کاربری شرکت یافت نشد.");
            }
            
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .eq('license_id', licenseData.id);

            if (usersError) throw new Error("خطا در دریافت لیست کاربران.");

            const userToLogin = usersData.find(u => u.username === username && u.password === password_raw);

            if (!userToLogin) {
                throw new Error('نام کاربری یا رمز عبور کارمند اشتباه است.');
            }

            // Authentication successful
            setRemoteLicenseId(licenseData.id);
            setRemoteUser(userToLogin);
            
            // Set licenseInfo and trigger online mode, which will fetch all data
            // Session object is not critical here as Supabase RLS will use the anon key
            setLicenseInfo({ id: licenseData.id, user_id: licenseData.user_id, machine_id: licenseData.machine_id, session: null! });
            setIsOnlineMode(true);
            
            addToast(`خوش آمدید، ${userToLogin.username}! در حال همگام‌سازی...`, 'success');

        } catch (error: any) {
            addToast(error.message || 'خطا در ورود.', 'error');
        }
    };

    const handleSaveUser = (userToSave: Omit<User, 'lastLogin'>) => {
        let userToSaveWithPassword = { ...userToSave };
        setUsers(prev => {
            const exists = prev.some(u => u.id === userToSave.id);
            if (exists) {
                return prev.map(u => {
                    if (u.id === userToSave.id) {
                        const updatedUser = { ...u, username: userToSave.username, role: userToSave.role };
                        if (userToSave.password) {
                            updatedUser.password = userToSave.password;
                        }
                        userToSaveWithPassword = updatedUser;
                        return updatedUser;
                    }
                    return u;
                });
            } else {
                 const newUser = { ...userToSave, lastLogin: 'هرگز وارد نشده' };
                 userToSaveWithPassword = newUser;
                 return [newUser, ...prev];
            }
        });
        addToSyncQueue({ type: 'UPSERT', table: 'users', payload: userToSaveWithPassword });
        addToast(`کاربر ${userToSave.username} با موفقیت ذخیره شد.`, 'success');
    };

    const handlePasswordReset = (username: string, newPass: string) => {
         let updatedUser: User | null = null;
         setUsers(prev => prev.map(u => {
            if (u.username === username) {
                updatedUser = { ...u, password: newPass };
                return updatedUser;
            }
            return u;
        }));
        if(updatedUser) {
            addToSyncQueue({ type: 'UPSERT', table: 'users', payload: updatedUser });
        }
        addToast(`رمز عبور کاربر ${username} با موفقیت تغییر کرد.`, 'success');
    };
    
    // --- NEW: LOCAL BACKUP & RESTORE ---
    const handleBackupLocal = () => {
        addToast("در حال آماده‌سازی فایل پشتیبان...", 'info');
        try {
            const backupData = {
                drugs, mainWarehouseDrugs, customers, orders, expenses, suppliers,
                purchaseBills, stockRequisitions, inventoryWriteOffs, trash, users,
                companyInfo, documentSettings, alertSettings, rolePermissions,
                checknehInvoices,
                backupVersion: 1,
            };
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = `hayat-local-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
            addToast("فایل پشتیبان با موفقیت دانلود شد.", 'success');
        } catch (error) {
            console.error("Local backup failed:", error);
            addToast("خطا در ایجاد فایل پشتیبان محلی.", 'error');
        }
    };

    const handleRestoreLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        showConfirmation(
            'بازیابی اطلاعات از فایل محلی',
            <p>آیا مطمئنید؟ <strong className="text-red-600">تمام اطلاعات فعلی شما با اطلاعات فایل پشتیبان جایگزین خواهد شد.</strong> این عمل غیرقابل بازگشت است.</p>,
            () => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const text = e.target?.result;
                        if (typeof text !== 'string') {
                            throw new Error("File content is not readable.");
                        }
                        const restoredData = JSON.parse(text);
                        
                        setDrugs(restoredData.drugs || []);
                        setMainWarehouseDrugs(restoredData.mainWarehouseDrugs || []);
                        setCustomers(restoredData.customers || []);
                        setOrders(restoredData.orders || []);
                        setExpenses(restoredData.expenses || []);
                        setSuppliers(restoredData.suppliers || []);
                        setPurchaseBills(restoredData.purchaseBills || []);
                        setStockRequisitions(restoredData.stockRequisitions || []);
                        setInventoryWriteOffs(restoredData.inventoryWriteOffs || []);
                        setTrash(restoredData.trash || []);
                        setUsers(restoredData.users || initialMockUsers);
                        setCompanyInfo(restoredData.companyInfo || { name: 'شفاخانه حیات', address: 'کابل, افغانستان', phone: '+93 78 123 4567', logo: null });
                        setDocumentSettings(restoredData.documentSettings || { logoPosition: 'right', accentColor: '#0d9488', backgroundImage: null });
                        setAlertSettings(restoredData.alertSettings || { expiry: { enabled: true, months: 6 }, lowStock: { enabled: true, quantity: 50 }, customerDebt: { enabled: true, limits: {} }, totalDebt: { enabled: false, threshold: 1000000 } });
                        setRolePermissions(restoredData.rolePermissions || initialRolePermissions);
                        setChecknehInvoices(restoredData.checknehInvoices || []);

                        addToast("اطلاعات با موفقیت از فایل محلی بازیابی شد.", 'success');
                        setTimeout(() => window.location.reload(), 1000);

                    } catch (error) {
                        console.error("Local restore failed:", error);
                        addToast("خطا در خواندن یا پردازش فایل پشتیبان. لطفاً از معتبر بودن فایل اطمینان حاصل کنید.", 'error');
                    } finally {
                        if (event.target) {
                            event.target.value = '';
                        }
                    }
                };
                reader.readAsText(file);
            }
        );
    };

    // --- RECYCLE BIN LOGIC ---
    const handleSoftDelete = (itemType: TrashItem['itemType'], itemData: TrashableItem, dependencyCheck?: () => boolean, dependencyMessage?: string) => {
        if (dependencyCheck && dependencyCheck()) {
            addToast(dependencyMessage || "امکان حذف به دلیل وجود وابستگی وجود ندارد.", 'error');
            return;
        }

        const trashItem: TrashItem = {
            id: `${itemType}-${(itemData as any).id}`,
            deletedAt: new Date().toISOString(),
            deletedBy: currentUser!.username,
            itemType,
            data: itemData,
        };

        setTrash(prev => [trashItem, ...prev]);
        addToSyncQueue({ type: 'UPSERT', table: 'trash', payload: trashItem });

        const tableMap = {
            customer: 'customers', supplier: 'suppliers', order: 'orders',
            purchaseBill: 'purchase_bills', drug: 'drugs', expense: 'expenses', user: 'users'
        };

        switch (itemType) {
            case 'customer':
                setCustomers(prev => prev.filter(c => c.id !== (itemData as Customer).id));
                break;
            case 'supplier':
                setSuppliers(prev => prev.filter(s => s.id !== (itemData as Supplier).id));
                break;
            case 'order':
                 setOrders(prev => prev.filter(o => o.id !== (itemData as Order).id));
                break;
            case 'purchaseBill':
                 setPurchaseBills(prev => prev.filter(p => p.id !== (itemData as PurchaseBill).id));
                break;
            case 'drug':
                const drugId = (itemData as Drug).id;
                setDrugs(prev => prev.filter(d => d.id !== drugId));
                setMainWarehouseDrugs(prev => prev.filter(d => d.id !== drugId));
                break;
            case 'expense':
                setExpenses(prev => prev.filter(e => e.id !== (itemData as Expense).id));
                break;
            case 'user':
                 setUsers(prev => prev.filter(u => u.id !== (itemData as User).id));
                 break;
        }
        
        const tableName = tableMap[itemType];
        if (tableName) {
            addToSyncQueue({ type: 'DELETE', table: tableName, match: { id: (itemData as any).id } });
        }
        addToast("آیتم به سطل زباله منتقل شد.", "info");
    };
    
    const handleDeleteCustomer = (id: number) => {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;
        const hasOrders = orders.some(o => o.customerName === customer.name);
        handleSoftDelete('customer', customer, () => hasOrders, 'امکان حذف مشتری با فاکتورهای ثبت شده وجود ندارد.');
    };
    
    const handleDeleteOrder = (id: number) => {
        const order = orders.find(o => o.id === id);
        if (!order) return;

        let tempDrugs = JSON.parse(JSON.stringify(drugs));
        // If it's a sale, add stock back. If it's a return, deduct stock.
        const multiplier = order.type === 'sale' ? 1 : -1;
        let changedDrugs: Drug[] = [];

        for (const item of (order.items || [])) {
            if (!item.batchAllocations) continue;
            const drugToUpdate = tempDrugs.find(d => d.id === item.drugId);
            if (drugToUpdate) {
                for (const allocation of item.batchAllocations) {
                    const batchToUpdate = drugToUpdate.batches.find(b => b.lotNumber === allocation.lotNumber);
                    if (batchToUpdate) {
                        batchToUpdate.quantity += (allocation.quantity * multiplier);
                    } else if (multiplier === 1) { // Only re-create batch if adding stock
                        drugToUpdate.batches.push({
                            lotNumber: allocation.lotNumber,
                            quantity: allocation.quantity,
                            expiryDate: allocation.expiryDate,
                            purchasePrice: allocation.purchasePrice,
                        });
                    }
                }
                changedDrugs.push(drugToUpdate);
            }
        }
        setDrugs(tempDrugs);
        changedDrugs.forEach(d => addToSyncQueue({ type: 'UPSERT', table: 'drugs', payload: d }));
        handleSoftDelete('order', order);
    };

    const handleDeleteUser = (id: number) => {
        if (currentUser?.id === id) {
            addToast('شما نمی‌توانید حساب کاربری خود را حذف کنید.', 'error');
            return;
        }
        const user = users.find(u => u.id === id);
        if (user) {
            handleSoftDelete('user', user);
        }
    };
    
    const handleDeleteSupplier = (id: number) => {
        const supplier = suppliers.find(s => s.id === id);
        if (!supplier) return;
        const hasBills = purchaseBills.some(b => b.supplierName === supplier.name);
        handleSoftDelete('supplier', supplier, () => hasBills, 'امکان حذف تامین کننده با فاکتورهای ثبت شده وجود ندارد.');
    };
    
    const handleDeletePurchaseBill = (id: number) => {
        const billToDelete = purchaseBills.find(b => b.id === id);
        if (!billToDelete) return;

        // Revert stock changes before soft deleting
        if (billToDelete.status === 'دریافت شده') {
            let changedDrugs: Drug[] = [];
            setMainWarehouseDrugs(currentWarehouse => {
                let updatedWarehouse = JSON.parse(JSON.stringify(currentWarehouse));
                for (const item of billToDelete.items) {
                    const drug = updatedWarehouse.find(d => d.id === item.drugId);
                    if (!drug) continue;
                    const batch = drug.batches.find(b => b.lotNumber === item.lotNumber);
                    if (!batch) continue;

                    const totalUnits = item.quantity + (item.bonusQuantity || 0);
                    if (billToDelete.type === 'purchase') {
                        batch.quantity -= totalUnits; // Revert purchase: decrease stock
                    } else { // purchase_return
                        batch.quantity += totalUnits; // Revert return: increase stock
                    }
                    changedDrugs.push(drug);
                }
                return updatedWarehouse;
            });
            changedDrugs.forEach(d => addToSyncQueue({ type: 'UPSERT', table: 'main_warehouse_drugs', payload: d }));
        }
        handleSoftDelete('purchaseBill', billToDelete);
    };

    const handleDeleteExpense = (id: number) => {
        const expense = expenses.find(e => e.id === id);
        if (expense) {
            handleSoftDelete('expense', expense);
        }
    };

    const handleDeleteDrug = (id: number) => {
        const drug = [...drugs, ...mainWarehouseDrugs].find(d => d.id === id);
        if (!drug) return;
    
        const isInOrder = orders.some(o => o.items.some(i => i.drugId === id));
        const isInPurchaseBill = purchaseBills.some(p => p.items.some(i => i.drugId === id));
    
        const dependencyCheck = () => isInOrder || isInPurchaseBill;
        const dependencyMessage = `امکان حذف محصول "${drug.name}" وجود ندارد زیرا در فاکتورهای فروش یا خرید استفاده شده است.`;
        
        handleSoftDelete('drug', drug, dependencyCheck, dependencyMessage);
    };
    
    const handleRestoreItem = (item: TrashItem) => {
        const tableMap = {
            customer: 'customers', supplier: 'suppliers', order: 'orders',
            purchaseBill: 'purchase_bills', drug: 'drugs', expense: 'expenses', user: 'users'
        };
        const tableName = tableMap[item.itemType];
        
        if (tableName) {
             addToSyncQueue({ type: 'UPSERT', table: tableName, payload: item.data });
        }
        addToSyncQueue({ type: 'DELETE', table: 'trash', match: { id: item.id } });
        
        if (item.itemType === 'order') {
            const orderToRestore = item.data as Order;
            const multiplier = orderToRestore.type === 'sale' ? -1 : 1;
            let tempDrugs = JSON.parse(JSON.stringify(drugs));
            let changedDrugs: Drug[] = [];
            for (const orderItem of (orderToRestore.items || [])) {
                if (!orderItem.batchAllocations) continue;
                const drugToUpdate = tempDrugs.find(d => d.id === orderItem.drugId);
                if (drugToUpdate) {
                    for (const allocation of orderItem.batchAllocations) {
                        const batchToUpdate = drugToUpdate.batches.find(b => b.lotNumber === allocation.lotNumber);
                        if (batchToUpdate) {
                            batchToUpdate.quantity += (allocation.quantity * multiplier);
                        } else if (multiplier === 1) {
                            drugToUpdate.batches.push({ ...allocation });
                        }
                    }
                    changedDrugs.push(drugToUpdate);
                }
            }
            setDrugs(tempDrugs);
            changedDrugs.forEach(d => addToSyncQueue({ type: 'UPSERT', table: 'drugs', payload: d }));
            setOrders(prev => [...prev, orderToRestore].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
        } else {
             switch (item.itemType) {
                case 'customer': setCustomers(prev => [...prev, item.data as Customer].sort((a,b) => b.id - a.id)); break;
                case 'supplier': setSuppliers(prev => [...prev, item.data as Supplier].sort((a,b) => b.id - a.id)); break;
                case 'purchaseBill':
                    const billToRestore = item.data as PurchaseBill;
                    if (billToRestore.status === 'دریافت شده') {
                        let changedDrugs: Drug[] = [];
                        setMainWarehouseDrugs(currentWarehouse => {
                            let updatedWarehouse = JSON.parse(JSON.stringify(currentWarehouse));
                            if (billToRestore.type === 'purchase') {
                                billToRestore.items.forEach(billItem => {
                                    let drug = updatedWarehouse.find(d => d.id === billItem.drugId);
                                    const totalUnits = billItem.quantity + (billItem.bonusQuantity || 0);
                                    if (totalUnits <= 0) return;

                                    const costOfGoods = (billItem.quantity * billItem.purchasePrice) * (1 - (billItem.discountPercentage || 0) / 100) * (billToRestore.exchangeRate || 1);

                                    if (drug) {
                                        let batch = drug.batches.find(b => b.lotNumber === billItem.lotNumber);
                                        if (batch) {
                                            const oldTotalValue = batch.quantity * batch.purchasePrice;
                                            batch.quantity += totalUnits;
                                            batch.purchasePrice = (oldTotalValue + costOfGoods) / batch.quantity;
                                        } else {
                                            drug.batches.push({ lotNumber: billItem.lotNumber, quantity: totalUnits, expiryDate: billItem.expiryDate, productionDate: billItem.productionDate, purchasePrice: costOfGoods / totalUnits });
                                        }
                                        changedDrugs.push(drug);
                                    } else {
                                        const drugInfo = [...drugs, ...mainWarehouseDrugs].find(d => d.id === billItem.drugId);
                                        if (drugInfo) {
                                            const { batches, ...baseDrugInfo } = drugInfo;
                                            const newDrug = { ...baseDrugInfo, batches: [{ lotNumber: billItem.lotNumber, quantity: totalUnits, expiryDate: billItem.expiryDate, productionDate: billItem.productionDate, purchasePrice: costOfGoods / totalUnits }]};
                                            updatedWarehouse.push(newDrug);
                                            changedDrugs.push(newDrug);
                                        }
                                    }
                                });
                            } else { // purchase_return
                                billToRestore.items.forEach(billItem => {
                                    let drug = updatedWarehouse.find(d => d.id === billItem.drugId);
                                    if (drug) {
                                        let batch = drug.batches.find(b => b.lotNumber === billItem.lotNumber);
                                        if (batch) {
                                            batch.quantity -= billItem.quantity;
                                        }
                                        changedDrugs.push(drug);
                                    }
                                });
                            }
                            return updatedWarehouse;
                        });
                        changedDrugs.forEach(d => addToSyncQueue({ type: 'UPSERT', table: 'main_warehouse_drugs', payload: d }));
                    }
                    setPurchaseBills(prev => [...prev, billToRestore].sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()));
                    break;
                case 'drug': 
                    const restoredDrug = item.data as Drug;
                    // Restore to both, assuming it existed in both conceptually
                    setDrugs(prev => [...prev, restoredDrug]);
                    setMainWarehouseDrugs(prev => [...prev, restoredDrug]);
                    // Let's be more specific with sync
                    addToSyncQueue({ type: 'UPSERT', table: 'drugs', payload: restoredDrug });
                    addToSyncQueue({ type: 'UPSERT', table: 'main_warehouse_drugs', payload: restoredDrug });
                    break;
                case 'expense': setExpenses(prev => [...prev, item.data as Expense]); break;
                case 'user': setUsers(prev => [...prev, item.data as User]); break;
            }
        }

        setTrash(prev => prev.filter(t => t.id !== item.id));
        addToast('آیتم با موفقیت بازیابی شد.', 'success');
    };

    const handleDeletePermanently = (id: string) => {
        showConfirmation('حذف دائمی', 'آیا مطمئنید؟ این عمل غیرقابل بازگشت است.', () => {
            setTrash(prev => prev.filter(t => t.id !== id));
            addToSyncQueue({ type: 'DELETE', table: 'trash', match: { id } });
            addToast('آیتم برای همیشه حذف شد.', 'info');
        });
    };

    const handleEmptyTrash = () => {
        showConfirmation('خالی کردن سطل زباله', 'آیا مطمئنید؟ تمام آیتم‌های موجود در سطل زباله برای همیشه حذف خواهند شد.', () => {
            const idsToDelete = trash.map(item => item.id);
            setTrash([]);
            idsToDelete.forEach(id => addToSyncQueue({ type: 'DELETE', table: 'trash', match: { id } }));
            addToast('سطل زباله با موفقیت خالی شد.', 'success');
        });
    };

    
    // CORE LOGIC HANDLERS
    const handleWriteOff = (drugId: number, lotNumber: string, quantity: number, reason: WriteOffReason, notes: string) => {
        const drug = drugs.find(d => d.id === drugId);
        const batch = drug?.batches.find(b => b.lotNumber === lotNumber);
    
        if (!drug || !batch) {
            addToast("خطا: محصول یا بچ مورد نظر برای ضایعات یافت نشد.", "error");
            return;
        }
    
        const newWriteOff: InventoryWriteOff = {
            id: Date.now(),
            drugId: drugId,
            drugName: drug.name,
            lotNumber: lotNumber,
            quantity: quantity,
            reason: reason,
            notes: notes,
            date: new Date().toISOString(),
            adjustedBy: currentUser!.username,
            costAtTime: batch.purchasePrice,
            totalLossValue: batch.purchasePrice * quantity
        };
    
        setInventoryWriteOffs(prev => [newWriteOff, ...prev]);
        addToSyncQueue({ type: 'UPSERT', table: 'inventory_write_offs', payload: newWriteOff });
    
        let updatedDrug: Drug | null = null;
        setDrugs(prevDrugs => prevDrugs.map(d => {
            if (d.id === drugId) {
                updatedDrug = {
                    ...d,
                    batches: d.batches.map(b => {
                        if (b.lotNumber === lotNumber) {
                            return { ...b, quantity: b.quantity - quantity };
                        }
                        return b;
                    })
                };
                return updatedDrug;
            }
            return d;
        }));
        
        if (updatedDrug) {
            addToSyncQueue({ type: 'UPSERT', table: 'drugs', payload: updatedDrug });
        }
    
        addToast(`تعداد ${quantity} از محصول ${drug.name} به عنوان ضایعات ثبت شد.`, 'success');
    };

    const handleSavePurchaseBill = (bill: PurchaseBill) => {
        const originalBill = purchaseBills.find(b => b.id === bill.id);
        const changedDrugs: Drug[] = [];
    
        setMainWarehouseDrugs(currentWarehouse => {
            let updatedWarehouse = JSON.parse(JSON.stringify(currentWarehouse));
    
            // 1. REVERT: If it's an edit of a previously received bill, undo its effect.
            if (originalBill && originalBill.status === 'دریافت شده') {
                for (const item of originalBill.items) {
                    const drug = updatedWarehouse.find(d => d.id === item.drugId);
                    if (!drug) continue;
                    const batch = drug.batches.find(b => b.lotNumber === item.lotNumber);
                    if (!batch) continue;
    
                    const totalUnits = item.quantity + (item.bonusQuantity || 0);
                    
                    if (originalBill.type === 'purchase') {
                        batch.quantity -= totalUnits; // Revert purchase: decrease stock
                    } else { // purchase_return
                        batch.quantity += totalUnits; // Revert return: increase stock
                    }
                     if (!changedDrugs.some(d => d.id === drug.id)) changedDrugs.push(drug);
                }
            }
    
            // 2. APPLY: Apply the effect of the new bill if it's marked as received.
            if (bill.status === 'دریافت شده') {
                 if (bill.type === 'purchase') {
                    for (const item of bill.items) {
                        let drug = updatedWarehouse.find(d => d.id === item.drugId);
                        const totalUnits = item.quantity + (item.bonusQuantity || 0);
                        if (totalUnits <= 0) continue;
    
                        const costOfGoodsInBillCurrency = (item.quantity * item.purchasePrice) * (1 - (item.discountPercentage || 0) / 100);
                        const costOfGoodsInBaseCurrency = costOfGoodsInBillCurrency * (bill.exchangeRate || 1);
    
                        if (drug) {
                            let batch = drug.batches.find(b => b.lotNumber === item.lotNumber);
                            if (batch) {
                                const oldQty = batch.quantity;
                                const oldTotalValue = oldQty * batch.purchasePrice;
                                const newTotalQty = oldQty + totalUnits;
                                const newTotalValue = oldTotalValue + costOfGoodsInBaseCurrency;
                                batch.purchasePrice = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;
                                batch.quantity = newTotalQty;
                            } else {
                                const costPerUnitInBaseCurrency = costOfGoodsInBaseCurrency / totalUnits;
                                drug.batches.push({ lotNumber: item.lotNumber, quantity: totalUnits, expiryDate: item.expiryDate, productionDate: item.productionDate, purchasePrice: costPerUnitInBaseCurrency });
                            }
                            if (!changedDrugs.some(d => d.id === drug.id)) changedDrugs.push(drug);
                        } else {
                            const drugInfo = [...drugs, ...mainWarehouseDrugs].find(d => d.id === item.drugId);
                            if (drugInfo) {
                                const { batches, ...baseDrugInfo } = drugInfo;
                                const costPerUnitInBaseCurrency = costOfGoodsInBaseCurrency / totalUnits;
                                const newDrug = { ...baseDrugInfo, batches: [{ lotNumber: item.lotNumber, quantity: totalUnits, expiryDate: item.expiryDate, productionDate: item.productionDate, purchasePrice: costPerUnitInBaseCurrency }]};
                                updatedWarehouse.push(newDrug);
                                if (!changedDrugs.some(d => d.id === newDrug.id)) changedDrugs.push(newDrug);
                            }
                        }
                    }
                 } else { // purchase_return
                    for (const item of bill.items) {
                        const drug = updatedWarehouse.find(d => d.id === item.drugId);
                        if (!drug) continue;
                        const batch = drug.batches.find(b => b.lotNumber === item.lotNumber);
                        if (batch) {
                            batch.quantity -= item.quantity;
                        }
                         if (!changedDrugs.some(d => d.id === drug.id)) changedDrugs.push(drug);
                    }
                 }
            }
    
            return updatedWarehouse;
        });
        
        changedDrugs.forEach(d => addToSyncQueue({ type: 'UPSERT', table: 'main_warehouse_drugs', payload: d }));
    
        setPurchaseBills(prev => {
            const exists = prev.some(b => b.id === bill.id);
            if (exists) {
                return prev.map(b => (b.id === bill.id ? bill : b));
            }
            return [bill, ...prev];
        });
        addToSyncQueue({ type: 'UPSERT', table: 'purchase_bills', payload: bill });
        addToast(`فاکتور ${bill.billNumber} با موفقیت ذخیره شد.`, 'success');
    };

    const handleSaveRequisition = (requisition: Omit<StockRequisition, 'id' | 'status' | 'requestedBy' | 'date'>) => {
        const newRequisition: StockRequisition = {
            ...requisition,
            id: Date.now(),
            status: 'در انتظار',
            requestedBy: currentUser!.username,
            date: new Date().toISOString(),
        };
        setStockRequisitions(prev => [newRequisition, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToSyncQueue({ type: 'UPSERT', table: 'stock_requisitions', payload: newRequisition });
        addToast('درخواست جدید با موفقیت ثبت و به انبار اصلی ارسال شد.', 'success');
    };

    const handleFulfillRequisition = (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[], fulfilledBy: string) => {
        let success = true;
        
        const updatedMainWarehouse = JSON.parse(JSON.stringify(mainWarehouseDrugs));
        const updatedSalesWarehouse = JSON.parse(JSON.stringify(drugs));
        const changedDrugs: Drug[] = [];

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
            changedDrugs.push(mainDrug, salesDrug);
        }
        
        if (success) {
            setMainWarehouseDrugs(updatedMainWarehouse);
            setDrugs(updatedSalesWarehouse);
            const updatedRequisition = { ...requisition, status: 'تکمیل شده' as const, fulfilledBy, items: fulfilledItems };
            setStockRequisitions(prev => prev.map(r => r.id === requisition.id ? updatedRequisition : r) );
            
            changedDrugs.forEach(d => {
                addToSyncQueue({ type: 'UPSERT', table: updatedMainWarehouse.some(mwd => mwd.id === d.id) ? 'main_warehouse_drugs' : 'drugs', payload: d });
            });
            addToSyncQueue({ type: 'UPSERT', table: 'stock_requisitions', payload: updatedRequisition });
            
            addToast(`درخواست #${requisition.id} با موفقیت تکمیل شد.`, 'success');
        }
    };

    const handleSaveOrder = (order: Order) => {
        // Pre-flight check for sales returns
        if (order.type === 'sale_return') {
            for (const item of order.items) {
                if (!item.batchAllocations || item.batchAllocations.length === 0) {
                    addToast(`خطای بحرانی: اطلاعات بچ برای کالای مرجوعی '${item.drugName}' یافت نشد. عملیات لغو شد.`, 'error');
                    return; // Abort save
                }
            }
        }
    
        let tempDrugs = JSON.parse(JSON.stringify(drugs));
        const isEditMode = orders.some(o => o.id === order.id);
        const changedDrugs: Drug[] = [];

        if (isEditMode) {
            const originalOrder = orders.find(o => o.id === order.id);
            if (originalOrder && originalOrder.items) {
                for (const item of originalOrder.items) {
                    if (!item.batchAllocations) continue;
                    const drugToUpdate = tempDrugs.find(d => d.id === item.drugId);
                    if (drugToUpdate) {
                        for (const allocation of item.batchAllocations) {
                            const batchToUpdate = drugToUpdate.batches.find(b => b.lotNumber === allocation.lotNumber);
                            if (batchToUpdate) {
                                batchToUpdate.quantity += allocation.quantity;
                            } else {
                                drugToUpdate.batches.push({
                                    lotNumber: allocation.lotNumber,
                                    quantity: allocation.quantity,
                                    expiryDate: allocation.expiryDate,
                                    purchasePrice: allocation.purchasePrice,
                                });
                            }
                        }
                         if (!changedDrugs.some(d => d.id === drugToUpdate.id)) changedDrugs.push(drugToUpdate);
                    }
                }
            }
        }

        if (order.type === 'sale' && order.status !== 'لغو شده') {
            let stockSufficient = true;
    
            for (const item of order.items) {
                const drugIndex = tempDrugs.findIndex(d => d.id === item.drugId);
                if (drugIndex === -1) {
                    stockSufficient = false;
                    addToast(`محصول ${item.drugName} در انبار یافت نشد.`, 'error');
                    break;
                }
    
                const drug = tempDrugs[drugIndex];
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
                        purchasePrice: batch.purchasePrice,
                        expiryDate: batch.expiryDate
                    });
    
                    const originalBatchInDrug = drug.batches.find(b => b.lotNumber === batch.lotNumber);
                    if (originalBatchInDrug) {
                        originalBatchInDrug.quantity -= quantityFromThisBatch;
                    }
    
                    quantityToDeduct -= quantityFromThisBatch;
                }
                 if (!changedDrugs.some(d => d.id === drug.id)) changedDrugs.push(drug);
            }
    
            if (!stockSufficient) {
                return; 
            }
            setDrugs(tempDrugs);
        } else if (order.type === 'sale_return') {
            for (const item of order.items) {
                const drugToUpdate = tempDrugs.find(d => d.id === item.drugId);
                if (!drugToUpdate) {
                    addToast(`خطای بازگشت: محصول ${item.drugName} در انبار یافت نشد.`, 'error');
                    continue; 
                }
                if (item.batchAllocations) {
                    for (const allocation of item.batchAllocations) {
                         const batchToUpdate = drugToUpdate.batches.find(b => b.lotNumber === allocation.lotNumber);
                         if (batchToUpdate) {
                            batchToUpdate.quantity += allocation.quantity;
                         } else {
                             drugToUpdate.batches.push({
                                lotNumber: allocation.lotNumber,
                                quantity: allocation.quantity,
                                expiryDate: allocation.expiryDate,
                                purchasePrice: allocation.purchasePrice,
                             });
                         }
                    }
                     if (!changedDrugs.some(d => d.id === drugToUpdate.id)) changedDrugs.push(drugToUpdate);
                }
            }
             setDrugs(tempDrugs);
        }
        
        changedDrugs.forEach(d => addToSyncQueue({ type: 'UPSERT', table: 'drugs', payload: d }));

        const finalOrderData = isEditMode ? order : { ...order, orderNumber: `${order.type === 'sale_return' ? 'SR' : 'SO'}-${new Date().getFullYear()}-${(orders.length + 1).toString().padStart(4, '0')}` };

        setOrders(prev => {
            if (isEditMode) {
                return prev.map(o => o.id === order.id ? finalOrderData : o);
            }
            return [finalOrderData, ...prev];
        });
        
        addToSyncQueue({ type: 'UPSERT', table: 'orders', payload: finalOrderData });
        addToast(`سفارش ${finalOrderData.orderNumber || ''} با موفقیت ذخیره شد.`, 'success');
    }

    const pageTitles: { [key: string]: string } = {
        dashboard: 'داشبورد', main_warehouse: 'انبار اصلی', inventory: 'انبار فروش', sales: 'فروش و سفارشات', fulfillment: 'آماده‌سازی سفارشات', customers: 'مشتریان',
        customer_accounts: 'حسابات مشتریان', suppliers: 'تامین کنندگان', purchasing: 'خرید و فاکتورها', supplier_accounts: 'حسابات شرکت‌ها', finance: 'مالی و هزینه‌ها',
        reports: 'گزارشات', alerts: 'مدیریت هشدارها', checkneh: 'بخش چکنه', settings: 'تنظیمات', recycle_bin: 'سطل زباله'
    };

    const handleSaveDrug = (drug: Omit<Drug, 'batches'>) => {
        const newDrugData = { ...drug, batches: [] };
        const updateLogic = (prev: Drug[]) => {
             const exists = prev.some(d => d.id === drug.id);
            if (exists) {
                return prev.map(d => d.id === drug.id ? { ...d, ...drug } : d);
            }
             return [...prev, newDrugData];
        };
        setDrugs(updateLogic);
        setMainWarehouseDrugs(updateLogic);
        addToSyncQueue({ type: 'UPSERT', table: 'drugs', payload: newDrugData });
        addToSyncQueue({ type: 'UPSERT', table: 'main_warehouse_drugs', payload: newDrugData });
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
        setDrugs(prev => [...prev, newDrugEntry]);
        setMainWarehouseDrugs(prev => [...prev, newDrugEntry]);
        addToSyncQueue({ type: 'UPSERT', table: 'drugs', payload: newDrugEntry });
        addToSyncQueue({ type: 'UPSERT', table: 'main_warehouse_drugs', payload: newDrugEntry });
        addToast(`محصول ${drug.name} با موفقیت تعریف شد.`, 'success');
        setIsQuickAddDrugModalOpen(false);
    };

    const pendingRequisitionCount = useMemo(() => {
        return stockRequisitions.filter(r => r.status === 'در انتظار').length;
    }, [stockRequisitions]);
    
    const customerBalances = useMemo(() => {
        const balances = new Map<string, number>();
        orders.slice().sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()).forEach(o => {
            const currentBalance = balances.get(o.customerName) || 0;
            balances.set(o.customerName, currentBalance + o.totalAmount - o.amountPaid);
        });
        return balances;
    }, [orders]);
    
    const activeAlerts = useMemo<ActiveAlert[]>(() => {
        const alerts: ActiveAlert[] = [];
        const now = new Date();

        if (alertSettings.expiry.enabled) {
            const expiryLimitDate = new Date();
            expiryLimitDate.setMonth(now.getMonth() + alertSettings.expiry.months);
            const expiringDrugs = drugs.filter(d => d.batches.some(b => b.quantity > 0 && new Date(b.expiryDate) < expiryLimitDate));
            if(expiringDrugs.length > 0) {
                 alerts.push({ id: 'expiry-1', type: 'expiry', severity: 'warning', message: `${expiringDrugs.length} محصول در حال انقضا است.`, navigateTo: 'inventory' });
            }
        }
        
        if (alertSettings.lowStock.enabled) {
            const lowStockDrugs = drugs.filter(d => d.batches.reduce((sum,b) => sum + b.quantity, 0) < alertSettings.lowStock.quantity);
             if(lowStockDrugs.length > 0) {
                 alerts.push({ id: 'low-stock-1', type: 'low-stock', severity: 'warning', message: `${lowStockDrugs.length} محصول با کمبود موجودی مواجه است.`, navigateTo: 'inventory' });
            }
        }

        if (alertSettings.customerDebt.enabled) {
            for(const [name, balance] of customerBalances.entries()) {
                const customer = customers.find(c => c.name === name);
                const limit = alertSettings.customerDebt.limits[customer?.id];
                if(customer && limit && balance > limit) {
                    alerts.push({ id: `debt-${customer.id}`, type: 'customer-debt', severity: 'error', message: `بدهی ${customer.name} از سقف مجاز عبور کرده.`, navigateTo: 'customer_accounts' });
                }
            }
        }
        
        if (alertSettings.totalDebt.enabled) {
            const totalDebt = Array.from(customerBalances.values()).reduce((sum, bal) => sum + (bal > 0 ? bal : 0), 0);
            if (totalDebt > alertSettings.totalDebt.threshold) {
                alerts.push({ id: 'total-debt-1', type: 'total-debt', severity: 'error', message: `مجموع بدهی مشتریان از ${alertSettings.totalDebt.threshold.toLocaleString()} عبور کرد.`, navigateTo: 'customer_accounts' });
            }
        }

        return alerts;
    }, [drugs, alertSettings, orders, customers, customerBalances]);

    // --- NEW: Handler for customer ledger shortcut ---
    const handleViewLedger = (customerId: number) => {
        setPreselectedCustomerId(customerId);
        setActiveItem('customer_accounts');
    };

    // --- NEW: Handler for batch traceability shortcut ---
    const handleTraceLotNumber = (lotNumber: string) => {
        setLotNumberToTrace(lotNumber);
        setActiveItem('reports');
    };
    
    // --- NEW: Clear trace state when navigating away from reports ---
    useEffect(() => {
        if (activeItem !== 'reports') {
            setLotNumberToTrace(null);
        }
        if (activeItem !== 'customer_accounts') {
            setPreselectedCustomerId(null);
        }
    }, [activeItem]);

    // --- NEW: Heartbeat for Online Mode ---
    useEffect(() => {
        if (!isOnlineMode || !licenseInfo) {
            return;
        }

        let heartbeatInterval: number;

        const updateStatus = async () => {
            try {
                const { error } = await supabase.from('company_status').upsert({
                    license_id: licenseInfo.id,
                    last_seen_at: new Date().toISOString(),
                });
                if (error) {
                    console.error('Heartbeat error:', error);
                }
            } catch (error) {
                console.error('Heartbeat exception:', error);
            }
        };

        // Update status immediately on going online
        updateStatus();

        // Then update every minute
        heartbeatInterval = window.setInterval(updateStatus, 60000); // 60 seconds

        // Cleanup on component unmount or if dependencies change
        return () => {
            clearInterval(heartbeatInterval);
        };
    }, [isOnlineMode, licenseInfo]);

    // --- NEW: Heartbeat Check for Remote Users ---
    useEffect(() => {
        if (!isRemoteView || !remoteLicenseId) return;

        const checkStatus = async () => {
            const { data, error } = await supabase
                .from('company_status')
                .select('last_seen_at')
                .eq('license_id', remoteLicenseId)
                .single();

            if (error || !data) {
                console.error("Remote heartbeat check failed:", error);
                setIsSystemOnline(false);
                return;
            }
            
            const lastSeen = new Date(data.last_seen_at).getTime();
            const now = new Date().getTime();
            const minutesAgo = (now - lastSeen) / (1000 * 60);

            setIsSystemOnline(minutesAgo < 2); // Consider online if seen within the last 2 minutes
        };

        checkStatus(); // Check immediately
        const interval = setInterval(checkStatus, 30000); // And every 30 seconds
        
        return () => clearInterval(interval); // Cleanup interval
    }, [isRemoteView, remoteLicenseId]);


    const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

    // --- REFACTORED: Online Mode Real-time Sync Effect ---
    useEffect(() => {
        // If offline or no license, ensure we are disconnected.
        if (!isOnlineMode || !licenseInfo) {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current)
                    .then(() => addToast("ارتباط با سرور قطع شد. شما در حالت آفلاین هستید.", "info"));
                realtimeChannelRef.current = null;
            }
            return;
        }

        const processSyncQueue = async () => {
            if (isSyncing || syncQueue.length === 0) return;
        
            setIsSyncing(true);
            addToast(`در حال همگام‌سازی ${syncQueue.length} عملیات آفلاین...`, 'info');
        
            const queueToProcess = [...syncQueue];
            const remainingActions: SyncAction[] = [];
        
            for (const action of queueToProcess) {
                try {
                    const payloadWithLicense = action.payload ? { ...action.payload, license_id: licenseInfo.id } : undefined;
                    let query;
                    switch (action.type) {
                        case 'UPSERT':
                            query = supabase.from(action.table).upsert(payloadWithLicense);
                            break;
                        case 'DELETE':
                            query = supabase.from(action.table).delete().match(action.match);
                            break;
                    }
                    const { error } = await query;
                    if (error) throw error;
                } catch (error) {
                    addToast(`همگام‌سازی عملیات برای جدول ${action.table} با خطا مواجه شد.`, 'error');
                    console.error("Sync error:", error);
                    remainingActions.push(action); // Keep failed action for retry
                }
            }
            
            setSyncQueue(remainingActions); // Update queue with only failed/remaining actions
            if (remainingActions.length === 0 && queueToProcess.length > 0) {
                 addToast('همگام‌سازی عملیات آفلاین با موفقیت انجام شد.', 'success');
            }
            setIsSyncing(false);
        };
    
        const setupOnlineMode = async () => {
            if (realtimeChannelRef.current) return;
    
            try {
                // --- 1. PUSH: Process local changes first ---
                await processSyncQueue();

                // --- 2. PULL: Fetch initial data after pushing ---
                addToast("در حال دریافت آخرین اطلاعات از سرور...", "info");
                const licenseFilter = { column: 'license_id', value: licenseInfo.id };
    
                const fetchTable = async (tableName, setState) => {
                    const { data, error } = await supabase.from(tableName).select('*').eq(licenseFilter.column, licenseFilter.value);
                    if (error) throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
                    setState(data || []);
                };
                
                const fetchSingleton = async (tableName, setState, defaultValue) => {
                    const { data, error } = await supabase.from(tableName).select('*').eq(licenseFilter.column, licenseFilter.value).maybeSingle();
                    if (error) throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
                    if (data) {
                        const { id, license_id, ...actualData } = data;
                        setState(actualData);
                    } else {
                        setState(defaultValue);
                    }
                };
    
                await Promise.all([
                    fetchTable('drugs', setDrugs),
                    fetchTable('main_warehouse_drugs', setMainWarehouseDrugs),
                    fetchTable('customers', setCustomers),
                    fetchTable('orders', setOrders),
                    fetchTable('expenses', setExpenses),
                    fetchTable('suppliers', setSuppliers),
                    fetchTable('purchase_bills', setPurchaseBills),
                    fetchTable('stock_requisitions', setStockRequisitions),
                    fetchTable('inventory_write_offs', setInventoryWriteOffs),
                    fetchTable('trash', setTrash),
                    fetchTable('checkneh_invoices', setChecknehInvoices),
                    fetchTable('users', setUsers),
                    fetchSingleton('company_info', setCompanyInfo, { name: 'شفاخانه حیات', address: 'کابل, افغانستان', phone: '+93 78 123 4567', logo: null }),
                    fetchSingleton('document_settings', setDocumentSettings, { logoPosition: 'right', accentColor: '#0d9488', backgroundImage: null }),
                    fetchSingleton('alert_settings', setAlertSettings, { expiry: { enabled: true, months: 6 }, lowStock: { enabled: true, quantity: 50 }, customerDebt: { enabled: true, limits: {} }, totalDebt: { enabled: false, threshold: 1000000 } }),
                    fetchSingleton('role_permissions', setRolePermissions, initialRolePermissions),
                ]);
    
                addToast("همگام‌سازی اولیه با موفقیت انجام شد.", "success");
    
                // --- 3. SUBSCRIBE: Setup real-time listeners ---
                const handleArrayUpdate = (payload: any, setState: React.Dispatch<React.SetStateAction<any[]>>) => {
                    if (payload.eventType === 'INSERT') {
                        setState(prev => [...prev.filter(item => item.id !== payload.new.id), payload.new]);
                    } else if (payload.eventType === 'UPDATE') {
                        setState(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
                    } else if (payload.eventType === 'DELETE') {
                        setState(prev => prev.filter(item => item.id !== payload.old.id));
                    }
                };
        
                const handleSingletonUpdate = (payload: any, setState: React.Dispatch<React.SetStateAction<any>>) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                         const { id, license_id, ...actualData } = payload.new;
                         setState(actualData);
                    }
                };
        
                const channel = supabase.channel(`public-tables-license-${licenseInfo.id}`);
                channel
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'drugs', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setDrugs))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'main_warehouse_drugs', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setMainWarehouseDrugs))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setCustomers))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setOrders))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setExpenses))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setSuppliers))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_bills', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setPurchaseBills))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_requisitions', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setStockRequisitions))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_write_offs', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setInventoryWriteOffs))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'trash', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setTrash))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'checkneh_invoices', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setChecknehInvoices))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleArrayUpdate(payload, setUsers))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'company_info', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleSingletonUpdate(payload, setCompanyInfo))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'document_settings', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleSingletonUpdate(payload, setDocumentSettings))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'alert_settings', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleSingletonUpdate(payload, setAlertSettings))
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions', filter: `license_id=eq.${licenseInfo.id}` }, payload => handleSingletonUpdate(payload, setRolePermissions))
                    .subscribe((status, err) => {
                        if (status === 'SUBSCRIBED') {
                            addToast("اتصال لحظه‌ای با سرور برقرار شد.", "info");
                        }
                        if (err) {
                            addToast(`خطای اتصال لحظه‌ای: ${err.message}`, 'error');
                        }
                    });
        
                realtimeChannelRef.current = channel;

            } catch (error) {
                console.error("Online mode setup failed:", error);
                addToast(`خطا در همگام‌سازی: ${error.message}. بازگشت به حالت آفلاین.`, 'error');
                setIsOnlineMode(false);
            }
        };
    
        setupOnlineMode();
    
        return () => {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
                realtimeChannelRef.current = null;
            }
        };
    }, [isOnlineMode, licenseInfo]);

    // --- NEW: OFFLINE QUEUE PROCESSOR (Runs whenever online and queue has items) ---
    useEffect(() => {
        const processQueue = async () => {
            if (!isOnlineMode || isSyncing || syncQueue.length === 0 || !licenseInfo) {
                return;
            }
    
            setIsSyncing(true);
            addToast(`در حال همگام‌سازی ${syncQueue.length} عملیات جدید...`, 'info');
    
            const queueToProcess = [...syncQueue]; // Create a copy to process
            const remainingActions: SyncAction[] = [];
    
            for (const action of queueToProcess) {
                try {
                    // Add license_id to payload for upsert/insert
                    const payloadWithLicense = action.payload ? (
                        Array.isArray(action.payload)
                            ? action.payload.map(p => ({ ...p, license_id: licenseInfo.id }))
                            : { ...action.payload, license_id: licenseInfo.id }
                    ) : undefined;
    
                    let query;
                    switch (action.type) {
                        case 'UPSERT':
                            query = supabase.from(action.table).upsert(payloadWithLicense);
                            break;
                        case 'DELETE':
                            query = supabase.from(action.table).delete().match(action.match);
                            break;
                    }
                    
                    const { error } = await query;
                    if (error) throw error;
                } catch (error) {
                    addToast(`همگام‌سازی عملیات برای جدول ${action.table} با خطا مواجه شد.`, 'error');
                    console.error("Sync error:", error);
                    remainingActions.push(action);
                    break; 
                }
            }
    
            setSyncQueue(remainingActions);
            if (remainingActions.length === 0 && queueToProcess.length > 0) {
                 addToast('همگام‌سازی با موفقیت انجام شد.', 'success');
            }
            setIsSyncing(false);
        };
    
        processQueue();
    }, [isOnlineMode, syncQueue]);


    // RENDER LOGIC
    // ==========================================================

    // Loading Screen
    if (licenseStatus === 'LOADING' && !isRemoteView) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p>در حال بارگذاری...</p>
            </div>
        );
    }
    
    // License Screens
    if (licenseStatus === 'NEEDS_ACTIVATION' && !isRemoteView) {
        return (
            <>
                <LicenseAuthScreen onActivationSuccess={handleActivationSuccess} addToast={addToast} showConfirmation={showConfirmation} />
                <ToastContainer toasts={toasts} setToasts={setToasts} />
                 <ConfirmationModal
                    isOpen={!!confirmationModal?.isOpen}
                    onClose={handleCloseConfirmation}
                    onConfirm={handleConfirm}
                    title={confirmationModal?.title || ''}
                >
                    {confirmationModal?.message}
                </ConfirmationModal>
            </>
        );
    }

     if (licenseStatus === 'NEEDS_VALIDATION' && !isRemoteView) {
        return (
             <>
                <UpdateRequiredScreen onValidate={validateLicense} />
                <ToastContainer toasts={toasts} setToasts={setToasts} />
             </>
        );
    }
    
    if (licenseStatus === 'INVALID' && !isRemoteView) {
        return <InvalidLicenseScreen />;
    }

    // Main App Screens (License is VALID)
    const renderActiveComponent = () => {
        const effectiveUser = isRemoteView ? remoteUser : currentUser;
        if (!effectiveUser) return null;
        const commonProps = {
            currentUser: effectiveUser,
            addToast: addToast,
            companyInfo: companyInfo,
            documentSettings: documentSettings,
            isRemoteView: isRemoteView,
            isSystemOnline: isSystemOnline,
        };

        if (isRemoteView && ['settings', 'recycle_bin', 'checkneh', 'main_warehouse', 'purchasing', 'supplier_accounts', 'finance', 'fulfillment', 'alerts'].includes(activeItem)) {
            return <Dashboard orders={orders} drugs={drugs} customers={customers} onNavigate={setActiveItem} activeAlerts={activeAlerts} />;
        }

        switch(activeItem) {
            case 'dashboard': return <Dashboard orders={orders} drugs={drugs} customers={customers} onNavigate={setActiveItem} activeAlerts={activeAlerts} />;
            case 'inventory': return <Inventory drugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} stockRequisitions={stockRequisitions} onSaveDrug={handleSaveDrug} onDelete={handleDeleteDrug} onWriteOff={handleWriteOff} onSaveRequisition={handleSaveRequisition} rolePermissions={rolePermissions} onTraceLotNumber={handleTraceLotNumber} {...commonProps} />;
            case 'sales': return <Sales orders={orders} drugs={drugs} customers={customers} onSave={handleSaveOrder} onDelete={handleDeleteOrder} rolePermissions={rolePermissions} onOpenQuickAddModal={() => setIsQuickAddDrugModalOpen(true)} uiActionQueue={uiActionQueue} consumeUiAction={consumeUiAction} {...commonProps} />;
            case 'customers': return <Customers customers={customers} onSave={(c) => { setCustomers(prev => prev.find(i => i.id === c.id) ? prev.map(i => i.id === c.id ? c : i) : [{...c, registrationDate: new Date().toISOString()}, ...prev]); addToSyncQueue({ type: 'UPSERT', table: 'customers', payload: c }); }} onDelete={handleDeleteCustomer} rolePermissions={rolePermissions} onViewLedger={handleViewLedger} {...commonProps} />;
            case 'suppliers': return <Suppliers suppliers={suppliers} onSave={(s) => { setSuppliers(prev => prev.find(i => i.id === s.id) ? prev.map(i => i.id === s.id ? s : i) : [s, ...prev]); addToSyncQueue({ type: 'UPSERT', table: 'suppliers', payload: s }); }} onDelete={handleDeleteSupplier} {...commonProps} />;
            case 'purchasing': return <Purchasing purchaseBills={purchaseBills} suppliers={suppliers} drugs={[...mainWarehouseDrugs, ...drugs]} onSave={handleSavePurchaseBill} onDelete={handleDeletePurchaseBill} onOpenQuickAddModal={() => setIsQuickAddDrugModalOpen(true)} uiActionQueue={uiActionQueue} consumeUiAction={consumeUiAction} {...commonProps} />;
            case 'finance': return <Accounting orders={orders} expenses={expenses} onSave={(e) => { setExpenses(prev => prev.find(i => i.id === e.id) ? prev.map(i => i.id === e.id ? e : i) : [e, ...prev]); addToSyncQueue({ type: 'UPSERT', table: 'expenses', payload: e }); }} onDelete={handleDeleteExpense} {...commonProps} />;
            case 'reports': return <Reports orders={orders} drugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} customers={customers} suppliers={suppliers} purchaseBills={purchaseBills} inventoryWriteOffs={inventoryWriteOffs} lotNumberToTrace={lotNumberToTrace} {...commonProps} />;
            case 'fulfillment': return <Fulfillment orders={orders} drugs={drugs} onUpdateOrder={handleSaveOrder} {...commonProps} />;
            case 'customer_accounts': return <CustomerAccounts customers={customers} orders={orders} preselectedCustomerId={preselectedCustomerId} {...commonProps} />;
            case 'supplier_accounts': return <SupplierAccounts suppliers={suppliers} purchaseBills={purchaseBills} {...commonProps} />;
            case 'main_warehouse': return <MainWarehouse mainWarehouseDrugs={mainWarehouseDrugs} stockRequisitions={stockRequisitions} onFulfillRequisition={(req, items, user) => handleFulfillRequisition(req, items, user)} onTraceLotNumber={handleTraceLotNumber} {...commonProps} />;
            case 'recycle_bin': return <RecycleBin trashItems={trash} onRestore={handleRestoreItem} onDelete={handleDeletePermanently} onEmptyTrash={handleEmptyTrash} {...commonProps} />;
            case 'checkneh': return <Checkneh customers={customers} showConfirmation={showConfirmation} invoices={checknehInvoices} setInvoices={setChecknehInvoices} {...commonProps} />;
            case 'alerts': return <Alerts settings={alertSettings} setSettings={(setter) => { const newSettings = typeof setter === 'function' ? setter(alertSettings) : setter; setAlertSettings(newSettings); addToSyncQueue({ type: 'UPSERT', table: 'alert_settings', payload: newSettings }); }} customers={customers} />;
            case 'settings': return <Settings 
                users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} onPasswordReset={handlePasswordReset}
                onSetCompanyInfo={(info) => { setCompanyInfo(info); addToSyncQueue({ type: 'UPSERT', table: 'company_info', payload: info }); }}
                onSetDocumentSettings={(settings) => { setDocumentSettings(settings); addToSyncQueue({ type: 'UPSERT', table: 'document_settings', payload: settings }); }}
                onSetRolePermissions={(permissions) => { setRolePermissions(permissions); addToSyncQueue({ type: 'UPSERT', table: 'role_permissions', payload: permissions }); }}
                backupKey={null} onBackupKeyChange={()=>{}} 
                onBackupLocal={handleBackupLocal} 
                onRestoreLocal={handleRestoreLocal} 
                onPurgeData={()=>{}}
                isOnlineMode={isOnlineMode}
                onSetIsOnlineMode={setIsOnlineMode}
                hasUnsavedChanges={false} showConfirmation={showConfirmation} 
                {...commonProps} rolePermissions={rolePermissions} 
                />;
            default: return <Dashboard orders={orders} drugs={drugs} customers={customers} onNavigate={setActiveItem} activeAlerts={[]} />;
        }
    };

    if (!isRemoteView && !currentUser) {
        return (
            <>
                <Login onLogin={handleLogin} />
                <ToastContainer toasts={toasts} setToasts={setToasts} />
            </>
        );
    }
    
     if (isRemoteView && !remoteUser) {
        return (
            <>
                <RemoteLogin onLogin={handleRemoteLogin} addToast={addToast} />
                <ToastContainer toasts={toasts} setToasts={setToasts} />
            </>
        )
    }

    const effectiveUser = isRemoteView ? remoteUser : currentUser;
    if (!effectiveUser) {
         return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p>در حال بارگذاری کاربر...</p>
            </div>
        );
    }


    return (
        <div className="flex h-screen bg-gray-100" dir="rtl">
            {isRemoteView ? (
                 <BottomNav 
                    activeItem={activeItem} 
                    setActiveItem={setActiveItem} 
                    userRole={effectiveUser.role} 
                />
            ) : (
                <Sidebar 
                    activeItem={activeItem} 
                    setActiveItem={setActiveItem} 
                    userRole={effectiveUser.role} 
                    onLogout={isRemoteView ? handleRemoteLogout : handleLogout} 
                    pendingRequisitionCount={pendingRequisitionCount}
                />
            )}
            <main className="flex-1 flex flex-col overflow-hidden">
                {!isRemoteView && <Header title={pageTitles[activeItem] || 'داشبورد'} currentUser={effectiveUser} alerts={activeAlerts} onNavigate={setActiveItem}/>}
                 {isRemoteView && isSystemOnline === false && <SystemOfflineBanner />}
                <div className={`flex-1 overflow-y-auto ${isRemoteView ? 'pb-16' : ''}`}>
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
             <ConfirmationModal
                isOpen={!!confirmationModal?.isOpen}
                onClose={handleCloseConfirmation}
                onConfirm={handleConfirm}
                title={confirmationModal?.title || ''}
            >
                {confirmationModal?.message}
            </ConfirmationModal>
            <VoiceAssistant 
                onNavigate={setActiveItem} 
                currentUser={effectiveUser} 
                addToast={addToast} 
                activeItem={activeItem} 
                dispatchUiAction={dispatchUiAction} 
                drugs={drugs}
                customers={customers}
                customerBalances={customerBalances}
                orders={orders}
                onSaveRequisition={handleSaveRequisition}
                alertSettings={alertSettings}
                mainWarehouseDrugs={mainWarehouseDrugs}
            />
        </div>
    );
};
//=========== NEW LICENSE COMPONENTS ===========//
const LicenseAuthScreen = ({ onActivationSuccess, addToast, showConfirmation }) => {
    const [view, setView] = useState<'activate' | 'login'>('activate');

    if (view === 'login') {
        return <TransferLoginScreen onSwitchToActivate={() => setView('activate')} onTransferSuccess={onActivationSuccess} addToast={addToast} showConfirmation={showConfirmation} />;
    }
    return <ActivationScreen onSwitchToLogin={() => setView('login')} onActivationSuccess={onActivationSuccess} addToast={addToast} />;
};
const ActivationScreen = ({ onSwitchToLogin, onActivationSuccess, addToast }) => {
    const machineId = useMemo(() => getOrCreateMachineId(), []);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [activationKey, setActivationKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(machineId);
        addToast('شناسه دستگاه کپی شد!', 'success');
    };

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addToast('رمزهای عبور مطابقت ندارند.', 'error');
            return;
        }
        if (password.length < 6) {
             addToast('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
            return;
        }
        setIsLoading(true);
        let createdAuthUser: any = null;

        try {
            // 1. Create Supabase User
            // FIX: Corrected Supabase user creation method from `signUpWithPassword` to `signUp` as per Supabase JS v2 API.
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: `${username}@example.com`,
                password: password,
            });

            if (signUpError) {
                if (signUpError.message.includes('User already registered')) {
                    addToast('این نام کاربری قبلاً استفاده شده است. لطفاً نام دیگری انتخاب کنید.', 'error');
                    setIsLoading(false);
                    return;
                }
                throw new Error(signUpError.message || "خطا در ایجاد حساب کاربری.");
            }
            if (!authData.user) {
                 throw new Error("خطا در ایجاد حساب کاربری.");
            }
            createdAuthUser = authData.user;

            // 2. Insert new license record with user_id to satisfy RLS
            const { data: licenseData, error: insertError } = await supabase
                .from('licenses')
                .insert({
                    activation_key: activationKey,
                    machine_id: machineId,
                    username: username,
                    is_active: true,
                    user_id: createdAuthUser.id
                })
                .select('id')
                .single();

            if (insertError) {
                if (insertError.code === '23505') { // Postgres code for unique violation
                    throw new Error("این کلید فعال‌سازی قبلاً استفاده شده است.");
                }
                throw new Error(insertError.message);
            }
            
            addToast('برنامه با موفقیت فعال شد!', 'success');
            onActivationSuccess({ id: licenseData.id, user_id: createdAuthUser.id, machine_id: machineId, session: authData.session! });

        } catch (error) {
            console.error("Activation failed:", error);
            // Cleanup on failure (manual step needed if this fails often)
            // It's complex to automate user deletion from client-side on failure.
            let errorMessage = "یک خطای ناشناخته در هنگام فعال‌سازی رخ داد.";
            if (error instanceof Error) {
                errorMessage = error.message.includes('security policy') 
                    ? "خطا در سیاست‌های امنیتی پایگاه داده. لطفاً با مدیر تماس بگیرید."
                    : error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            addToast(`خطا در فعال‌سازی: ${errorMessage}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">فعال‌سازی پلتفرم حیات</h1>
                    <p className="mt-2 text-gray-600">برای استفاده از برنامه، لطفاً آن را فعال کنید.</p>
                </div>
                <form className="space-y-4" onSubmit={handleActivate}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">۱. شناسه دستگاه شما:</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input type="text" readOnly value={machineId} className="flex-1 block w-full rounded-none rounded-r-md p-2 bg-gray-200 border-gray-300 text-gray-700 font-mono text-sm" />
                            <button type="button" onClick={handleCopyToClipboard} className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-700 text-sm hover:bg-gray-100">
                                کپی کردن شناسه
                            </button>
                        </div>
                         <p className="mt-1 text-xs text-gray-500">این شناسه را برای توسعه‌دهنده ارسال کنید تا کلید فعال‌سازی را دریافت نمایید.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">۲. نام کاربری (برای پشتیبان‌گیری آنلاین)</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="یک نام کاربری به انگلیسی انتخاب کنید" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">رمز عبور</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="حداقل ۶ کاراکتر" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">تکرار رمز عبور</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">۳. کلید فعال‌سازی:</label>
                        <input type="text" value={activationKey} onChange={e => setActivationKey(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="کلید دریافت شده را اینجا وارد کنید" />
                    </div>
                    
                    <div className="pt-2 space-y-2">
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400">
                            {isLoading ? 'در حال بررسی...' : 'فعال‌سازی برنامه'}
                        </button>
                         <button type="button" onClick={onSwitchToLogin} className="w-full text-center py-2 text-sm text-gray-600 hover:text-teal-600">
                            حساب کاربری دارید؟ وارد شوید
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const TransferLoginScreen = ({ onSwitchToActivate, onTransferSuccess, addToast, showConfirmation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // 1. Sign in to validate credentials
            // FIX: Corrected Supabase sign-in method from `signIn` to `signInWithPassword` as per Supabase JS v2 API.
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email: `${username}@example.com`,
                password: password,
            });
            if (signInError || !authData.user) {
                throw new Error("نام کاربری یا رمز عبور اشتباه است.");
            }

            // 2. Fetch license data using the secure user_id
            const { data: license, error: fetchError } = await supabase
                .from('licenses')
                .select('id, machine_id')
                .eq('user_id', authData.user.id)
                .single();
            if (fetchError || !license) {
                throw new Error("اطلاعات لایسنس برای این کاربر یافت نشد.");
            }

            // 3. Check for device transfer
            const newMachineId = getOrCreateMachineId();
            if (license.machine_id !== newMachineId) {
                showConfirmation(
                    'انتقال لایسنس به دستگاه جدید',
                    <p>به نظر می‌رسد شما از یک دستگاه جدید وارد شده‌اید. آیا می‌خواهید لایسنس خود را به این دستگاه منتقل کنید؟ <strong className="text-red-600">با این کار، دسترسی از دستگاه قبلی مسدود خواهد شد.</strong></p>,
                    async () => {
                        setIsLoading(true); // Re-enable loading for the transfer process
                        addToast("در حال انتقال لایسنس...", "info");
                        const { error: updateError } = await supabase
                            .from('licenses')
                            .update({ machine_id: newMachineId })
                            .eq('id', license.id);
                        
                        if (updateError) {
                            addToast(`خطا در انتقال لایسنس: ${updateError.message}`, 'error');
                            setIsLoading(false); // Stop loading on error
                            return;
                        }
                        addToast('لایسنس با موفقیت به این دستگاه منتقل شد.', 'success');
                        onTransferSuccess({ id: license.id, user_id: authData.user!.id, machine_id: newMachineId, session: authData.session! });
                    }
                );
                setIsLoading(false); // Stop loading to show the modal
                return; // Exit function, let modal handle the next step
            } else {
                 addToast('شما با موفقیت وارد شدید.', 'success');
                 onTransferSuccess({ id: license.id, user_id: authData.user!.id, machine_id: newMachineId, session: authData.session! });
            }

        } catch (error) {
            console.error("Login/Transfer failed:", error);
            let errorMessage = "یک خطای ناشناخته در هنگام ورود رخ داد.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            addToast(errorMessage, 'error');
            setIsLoading(false);
        }
    };
    
    return (
         <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-teal-800 rounded-full mb-4">
                        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">ورود به پلتفرم حیات</h1>
                    <p className="mt-2 text-gray-600">برای بازیابی اطلاعات، وارد حساب کاربری خود شوید</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">نام کاربری</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">رمز عبور</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                    <div className="pt-2 space-y-2">
                         <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400">
                             {isLoading ? 'در حال ورود...' : 'ورود به سیستم'}
                        </button>
                         <button type="button" onClick={onSwitchToActivate} className="w-full text-center py-2 text-sm text-gray-600 hover:text-teal-600">
                            حساب کاربری ندارید؟ فعال‌سازی کنید
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const UpdateRequiredScreen = ({ onValidate }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-lg border">
            <CloudSyncIcon className="w-16 h-16 text-teal-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-gray-800">نیاز به اعتبارسنجی لایسنس</h2>
            <p className="mt-2 text-gray-600 max-w-sm">
                بیش از ۳۰ روز از آخرین بررسی آنلاین لایسنس شما گذشته است. لطفاً به اینترنت متصل شده و دکمه زیر را برای ادامه استفاده از برنامه فشار دهید.
            </p>
            <button onClick={onValidate} className="mt-6 px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700">
                اعتبارسنجی آنلاین
            </button>
        </div>
    </div>
);
const InvalidLicenseScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-lg border-2 border-red-200">
            <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-red-800">دسترسی مسدود شد</h2>
            <p className="mt-2 text-gray-600 max-w-sm">
                لایسنس شما نامعتبر است یا به دستگاه دیگری منتقل شده است. لطفاً با پشتیبانی تماس بگیرید.
            </p>
        </div>
    </div>
);

// FIX: Moved RemoteLogin component here from RemoteControl.tsx to be accessible by App.tsx
export const RemoteLogin = ({ onLogin, addToast }: { onLogin: (companyUsername: string, username: string, password_raw: string) => void; addToast: (message: string, type?: 'success' | 'error' | 'info') => void; }) => {
    const [companyUsername, setCompanyUsername] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyUsername || !username || !password) return;
        setIsLoading(true);
        await onLogin(companyUsername, username, password);
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-teal-800">ورود به ریموت کنترل</h1>
                    <p className="mt-2 text-sm text-gray-500">اطلاعات شرکت و کاربر را وارد کنید</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input type="text" value={companyUsername} onChange={(e) => setCompanyUsername(e.target.value)}
                            placeholder="نام کاربری شرکت" required autoFocus
                            className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                            placeholder="نام کاربری شما" required
                            className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="رمز عبور شما" required
                            className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:bg-teal-400">
                        {isLoading ? 'در حال بررسی...' : 'ورود'}
                    </button>
                </form>
            </div>
        </div>
    );
};


export default App;