

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
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
const SettingsIcon = ({ className }: { className?: string }) => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" className={className} />;
const LogoutIcon = ({ className }: { className?: string }) => <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className={className} />;
const SuppliersIcon = ({ className }: { className?: string }) => <Icon path="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V6a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-1m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className={className} />;
const PurchasingIcon = ({ className }: { className?: string }) => <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className={className} />;
const SupplierAccountsIcon = ({ className }: { className?: string }) => <Icon path="M4 4h16v16H4z M4 9h16v2H4z M9 13h2v4H9z M13 13h2v4h-2z" className={className} />;
const RecycleBinIcon = ({ className }: { className?: string }) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className} />;
const ChecknehIcon = ({ className }: { className?: string }) => <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m2 14h-2m2-4h-4m-2-4h6" className={className} />;
const CloudSyncIcon = ({ className }: { className?: string }) => <Icon path="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a4 4 0 01-4-4V9a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V16a4 4 0 01-4 4z" className={className} />;
const AlertIcon = ({ className }: { className?: string }) => <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className={className} />;
const LockIcon = ({ className }: { className?: string }) => <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className={className} />;


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
const MicIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
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
    'فروشنده': ['dashboard', 'sales', 'customers', 'customer_accounts'],
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
    const allowedNavItems = navItems.filter(item => basePermissions[userRole].includes(item.id));
    const canAccessSettings = basePermissions[userRole].includes('settings');
    const canAccessRecycleBin = basePermissions[userRole].includes('recycle_bin');

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
type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking';

type HayatAssistantProps = {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
    status: AssistantStatus;
    onMicClick: () => void;
};

const HayatAssistant: React.FC<HayatAssistantProps> = ({ isOpen, onClose, messages, status, onMicClick }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    const getStatusInfo = () => {
        switch (status) {
            case 'listening':
                return { text: 'در حال شنیدن...', color: 'text-blue-500', pulse: true };
            case 'processing':
                return { text: 'در حال پردازش دستور...', color: 'text-yellow-600', pulse: true };
            case 'speaking':
                return { text: 'در حال پاسخگویی...', color: 'text-green-500', pulse: true };
            case 'idle':
            default:
                return { text: 'برای شروع، روی میکروفون کلیک کنید', color: 'text-gray-500', pulse: false };
        }
    };
    const statusInfo = getStatusInfo();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[95]" onClick={onClose}>
            <div className="fixed bottom-24 right-8 z-[100] w-96 bg-white rounded-xl shadow-2xl flex flex-col border animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-teal-500" />
                        <h3 className="font-bold text-gray-800">معاون اجرایی هوشمند</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <CloseIcon className="w-5 h-5 text-gray-500"/>
                    </button>
                </header>
                <main className="p-4 h-80 overflow-y-auto bg-gray-50 flex flex-col">
                    {messages.length === 0 && (
                        <div className="m-auto text-center text-gray-400">
                            <p>سلام! چطور می‌توانم امروز به شما کمک کنم؟</p>
                            <p className="text-xs mt-2">مثال: «برای شرکت کابل فارما یک فاکتور جدید بساز و ۱۰۰ عدد پنی‌سیلین اضافه کن»</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`my-2 p-3 rounded-xl max-w-[85%] ${msg.sender === 'user' ? 'bg-teal-500 text-white self-end' : 'bg-gray-200 text-gray-800 self-start'}`}>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t flex flex-col items-center justify-center">
                    <button 
                        onClick={onMicClick} 
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${status === 'listening' ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'}`}
                        disabled={status === 'processing' || status === 'speaking'}
                    >
                        <MicIcon className="w-8 h-8 text-white"/>
                    </button>
                    <p className={`mt-2 text-sm font-semibold ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
                        {statusInfo.text}
                    </p>
                </footer>
            </div>
        </div>
    );
};

//=========== LICENSE SYSTEM TYPES AND HELPERS ===========//
type LicenseStatus = 'LOADING' | 'NEEDS_ACTIVATION' | 'NEEDS_VALIDATION' | 'INVALID' | 'VALID';
type OnlineValidationResult = 'VALID' | 'INVALID_DEACTIVATED' | 'INVALID_MACHINE_ID' | 'NOT_FOUND' | 'NETWORK_ERROR';

type LicenseInfo = {
    id: string; // This is the license table row UUID
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


//=========== MAIN APP COMPONENT ===========//
const App: React.FC = () => {
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
    }, [licenseInfo]);

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

    // --- NEW AUTHENTICATION STATE ---
    const [currentUser, setCurrentUser] = usePersistentState<User | null>('hayat_currentUser', null);
    
    // --- NEW CONFIRMATION MODAL STATE ---
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
    } | null>(null);

    // --- NEW: AI ASSISTANT STATE ---
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantStatus, setAssistantStatus] = useState<AssistantStatus>('idle');
    const [assistantMessages, setAssistantMessages] = useState<Message[]>([]);
    const recognitionRef = useRef<any>(null); // To hold SpeechRecognition instance
    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);


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

    const handleSaveUser = (userToSave: Omit<User, 'lastLogin'>) => {
        setUsers(prev => {
            const exists = prev.some(u => u.id === userToSave.id);
            if (exists) {
                return prev.map(u => {
                    if (u.id === userToSave.id) {
                        const updatedUser = { ...u, username: userToSave.username, role: userToSave.role };
                        if (userToSave.password) {
                            updatedUser.password = userToSave.password;
                        }
                        return updatedUser;
                    }
                    return u;
                });
            } else {
                return [{ ...userToSave, lastLogin: 'هرگز وارد نشده' }, ...prev];
            }
        });
        addToast(`کاربر ${userToSave.username} با موفقیت ذخیره شد.`, 'success');
    };

    const handlePasswordReset = (username: string, newPass: string) => {
         setUsers(prev => prev.map(u => {
            if (u.username === username) {
                return { ...u, password: newPass };
            }
            return u;
        }));
        addToast(`رمز عبور کاربر ${username} با موفقیت تغییر کرد.`, 'success');
    };
    
    // --- NEW: ONLINE BACKUP & RESTORE ---
    const handleBackupOnline = async () => {
        if (!licenseInfo) {
            addToast("برای پشتیبان‌گیری آنلاین ابتدا باید برنامه را فعال کنید.", 'error');
            return false;
        }

        addToast("در حال آماده‌سازی و آپلود نسخه پشتیبان...", 'info');

        const backupData = {
            drugs, mainWarehouseDrugs, customers, orders, expenses, suppliers,
            purchaseBills, stockRequisitions, inventoryWriteOffs, trash, users,
            companyInfo, documentSettings, alertSettings, rolePermissions,
            checknehInvoices,
            backupVersion: 1, 
        };

        try {
            // FIX: Replace upsert with a more robust select-then-update/insert logic
            const { data: existingBackup, error: selectError } = await supabase
                .from('backups')
                .select('license_id')
                .eq('license_id', licenseInfo.id)
                .maybeSingle();

            if (selectError) throw selectError;

            let RpcError;

            if (existingBackup) {
                // If backup exists, update it
                const { error: updateError } = await supabase
                    .from('backups')
                    .update({
                        backup_data: backupData,
                        created_at: new Date().toISOString(),
                    })
                    .eq('license_id', licenseInfo.id);
                RpcError = updateError;
            } else {
                // If it doesn't exist, insert a new one
                const { error: insertError } = await supabase
                    .from('backups')
                    .insert({
                        license_id: licenseInfo.id,
                        backup_data: backupData,
                    });
                RpcError = insertError;
            }
            
            if (RpcError) throw RpcError;

            addToast("نسخه پشتیبان با موفقیت در فضای ابری ذخیره شد.", 'success');
            return true;
        } catch (error: any) {
            console.error("Online backup failed:", error);

            let errorMessage = "یک خطای ناشناخته رخ داد.";
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (error && typeof error === 'object') {
                if (typeof error.message === 'string' && error.message) {
                    errorMessage = error.message;
                } else if (typeof error.details === 'string' && error.details) {
                    errorMessage = error.details;
                } else {
                    errorMessage = "پاسخ نامعتبر از سرور دریافت شد.";
                }
            } else if (typeof error === 'string' && error) {
                errorMessage = error;
            }

            if (errorMessage.toLowerCase().includes('fetch')) {
                 errorMessage = "خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.";
            } else if (errorMessage.includes('security policy')) {
                errorMessage = "خطای دسترسی امنیتی. لطفا با پشتیبانی تماس بگیرید.";
            }

            addToast(`خطا در پشتیبان‌گیری آنلاین: ${errorMessage}`, 'error');
            return false;
        }
    };

    const handleRestoreOnline = () => {
        showConfirmation(
            'بازیابی اطلاعات از فضای ابری',
            <p>آیا مطمئنید؟ <strong className="text-red-600">تمام اطلاعات فعلی شما با آخرین نسخه پشتیبان آنلاین جایگزین خواهد شد.</strong> این عمل غیرقابل بازگشت است.</p>,
            async () => {
                if (!licenseInfo) {
                    addToast("اطلاعات لایسنس برای بازیابی یافت نشد.", 'error');
                    return;
                }
                
                addToast("در حال دریافت و بازیابی اطلاعات...", 'info');

                try {
                    const { data, error } = await supabase
                        .from('backups')
                        .select('backup_data')
                        .eq('license_id', licenseInfo.id)
                        .single();

                    if (error) throw error;
                    if (!data || !data.backup_data) throw new Error("هیچ نسخه پشتیبانی برای این لایسنس یافت نشد.");
                    
                    const restoredData = data.backup_data;
                    
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

                    addToast("اطلاعات با موفقیت از فضای ابری بازیابی شد.", 'success');
                    setTimeout(() => window.location.reload(), 1000);

                } catch (error: any) {
                     console.error("Online restore failed:", error);

                     let errorMessage = "یک خطای ناشناخته رخ داد.";
            
                     if (error instanceof Error) {
                         errorMessage = error.message;
                     } else if (error && typeof error === 'object') {
                         if (typeof error.message === 'string' && error.message) {
                             errorMessage = error.message;
                         } else if (typeof error.details === 'string' && error.details) {
                             errorMessage = error.details;
                         } else {
                             errorMessage = "پاسخ نامعتبر از سرور دریافت شد.";
                         }
                     } else if (typeof error === 'string' && error) {
                         errorMessage = error;
                     }
         
                     if (errorMessage.toLowerCase().includes('fetch')) {
                          errorMessage = "خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.";
                     } else if (errorMessage.includes('PGRST116') || errorMessage.includes(' یافت نشد')) { 
                          errorMessage = "هیچ نسخه پشتیبانی برای این لایسنس یافت نشد.";
                     }

                     addToast(`خطا در بازیابی اطلاعات: ${errorMessage}`, 'error');
                }
            }
        );
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
            }
        }
        setDrugs(tempDrugs);
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
                }
                return updatedWarehouse;
            });
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
        if (item.itemType === 'order') {
            const orderToRestore = item.data as Order;
            const multiplier = orderToRestore.type === 'sale' ? -1 : 1;
            let tempDrugs = JSON.parse(JSON.stringify(drugs));
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
                }
            }
            setDrugs(tempDrugs);
            setOrders(prev => [...prev, orderToRestore].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
        } else {
             switch (item.itemType) {
                case 'customer': setCustomers(prev => [...prev, item.data as Customer].sort((a,b) => b.id - a.id)); break;
                case 'supplier': setSuppliers(prev => [...prev, item.data as Supplier].sort((a,b) => b.id - a.id)); break;
                case 'purchaseBill':
                    const billToRestore = item.data as PurchaseBill;
                    if (billToRestore.status === 'دریافت شده') {
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
                                    } else {
                                        const drugInfo = [...drugs, ...mainWarehouseDrugs].find(d => d.id === billItem.drugId);
                                        if (drugInfo) {
                                            const { batches, ...baseDrugInfo } = drugInfo;
                                            updatedWarehouse.push({ ...baseDrugInfo, batches: [{ lotNumber: billItem.lotNumber, quantity: totalUnits, expiryDate: billItem.expiryDate, productionDate: billItem.productionDate, purchasePrice: costOfGoods / totalUnits }]});
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
                                    }
                                });
                            }
                            return updatedWarehouse;
                        });
                    }
                    setPurchaseBills(prev => [...prev, billToRestore].sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()));
                    break;
                case 'drug': 
                    setDrugs(prev => [...prev, item.data as Drug]);
                    setMainWarehouseDrugs(prev => [...prev, item.data as Drug]);
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
            addToast('آیتم برای همیشه حذف شد.', 'info');
        });
    };

    const handleEmptyTrash = () => {
        showConfirmation('خالی کردن سطل زباله', 'آیا مطمئنید؟ تمام آیتم‌های موجود در سطل زباله برای همیشه حذف خواهند شد.', () => {
            setTrash([]);
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
    
        setDrugs(prevDrugs => prevDrugs.map(d => {
            if (d.id === drugId) {
                return {
                    ...d,
                    batches: d.batches.map(b => {
                        if (b.lotNumber === lotNumber) {
                            return { ...b, quantity: b.quantity - quantity };
                        }
                        return b;
                    })
                };
            }
            return d;
        }));
    
        addToast(`تعداد ${quantity} از محصول ${drug.name} به عنوان ضایعات ثبت شد.`, 'success');
    };

    const handleSavePurchaseBill = (bill: PurchaseBill) => {
        const originalBill = purchaseBills.find(b => b.id === bill.id);
    
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
                        } else {
                            const drugInfo = [...drugs, ...mainWarehouseDrugs].find(d => d.id === item.drugId);
                            if (drugInfo) {
                                const { batches, ...baseDrugInfo } = drugInfo;
                                const costPerUnitInBaseCurrency = costOfGoodsInBaseCurrency / totalUnits;
                                updatedWarehouse.push({ ...baseDrugInfo, batches: [{ lotNumber: item.lotNumber, quantity: totalUnits, expiryDate: item.expiryDate, productionDate: item.productionDate, purchasePrice: costPerUnitInBaseCurrency }]});
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
                    }
                 }
            }
    
            return updatedWarehouse;
        });
    
        setPurchaseBills(prev => {
            const exists = prev.some(b => b.id === bill.id);
            if (exists) {
                return prev.map(b => (b.id === bill.id ? bill : b));
            }
            return [bill, ...prev];
        });
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
        addToast('درخواست جدید با موفقیت ثبت و به انبار اصلی ارسال شد.', 'success');
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
                }
            }
             setDrugs(tempDrugs);
        }

        setOrders(prev => {
            if (isEditMode) {
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
        setDrugs(prev => [...prev, newDrugEntry]);
        setMainWarehouseDrugs(prev => [...prev, newDrugEntry]);
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
    
    // --- AI ASSISTANT LOGIC ---
    const speak = (text: string) => {
        if (!('speechSynthesis' in window)) {
            console.warn("Speech Synthesis not supported.");
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fa-IR';
        utterance.onstart = () => setAssistantStatus('speaking');
        utterance.onend = () => setAssistantStatus('idle');
        speechSynthesis.speak(utterance);
    };

    const executeAiAction = (action: any) => {
        const { formatQuantity } = require('./Inventory');
        switch (action.action) {
            case 'CREATE_INVOICE': {
                const { customerName, items: requestedItems } = action.parameters;
                const customer = customers.find(c => c.name.trim() === customerName.trim());
                if (!customer) return `مشتری با نام «${customerName}» یافت نشد.`;

                const newOrderItems: OrderItem[] = [];
                for (const requestedItem of requestedItems) {
                    const drug = drugs.find(d => d.name.toLowerCase().includes(requestedItem.drugName.toLowerCase()));
                    if (!drug) return `داروی «${requestedItem.drugName}» در انبار یافت نشد.`;
                    
                    const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
                    if (totalStock < requestedItem.quantity) return `موجودی داروی «${drug.name}» (${totalStock} عدد) برای فروش (${requestedItem.quantity} عدد) کافی نیست.`;
                    
                    const finalPrice = drug.price * (1 - drug.discountPercentage / 100);
                    newOrderItems.push({ drugId: drug.id, drugName: drug.name, manufacturer: drug.manufacturer, code: drug.code, quantity: requestedItem.quantity, bonusQuantity: 0, originalPrice: drug.price, discountPercentage: drug.discountPercentage, finalPrice: finalPrice });
                }

                const totalAmount = newOrderItems.reduce((sum, item) => sum + (item.quantity * item.finalPrice), 0);
                const newOrder: Order = { id: Date.now(), type: 'sale', orderNumber: '', customerName: customer.name, orderDate: new Date().toISOString().split('T')[0], items: newOrderItems, extraCharges: [], totalAmount: totalAmount, amountPaid: 0, status: 'در حال پردازش', paymentStatus: 'پرداخت نشده' };
                
                handleSaveOrder(newOrder);
                return `سفارش برای ${customer.name} با ${newOrderItems.length} قلم با موفقیت ثبت شد.`;
            }
            case 'QUERY_STOCK': {
                const { drugName } = action.parameters;
                const drug = drugs.find(d => d.name.toLowerCase().includes(drugName.toLowerCase()));
                if (!drug) return `داروی «${drugName}» یافت نشد.`;
                const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
                const formattedStock = formatQuantity(totalStock, drug.unitsPerCarton, drug.cartonSize);
                return `موجودی ${drug.name} برابر با ${formattedStock} است.`;
            }
            case 'QUERY_CUSTOMER_BALANCE': {
                const { customerName } = action.parameters;
                const balance = customerBalances.get(customerName);
                if (balance === undefined) return `مشتری با نام «${customerName}» یافت نشد.`;
                if (balance > 0) return `مانده حساب ${customerName}، مبلغ ${Math.round(balance).toLocaleString()} افغانی بدهکار است.`;
                if (balance < 0) return `مانده حساب ${customerName}، مبلغ ${Math.round(Math.abs(balance)).toLocaleString()} افغانی بستانکار است.`;
                return `حساب مشتری ${customerName} تسویه است.`;
            }
            case 'QUERY_DAILY_SALES': {
                const today = new Date().toISOString().split('T')[0];
                const salesToday = orders.filter(o => o.orderDate === today && o.status !== 'لغو شده' && o.type === 'sale').reduce((sum, order) => sum + order.totalAmount, 0);
                return `مجموع فروش امروز ${Math.round(salesToday).toLocaleString()} افغانی بوده است.`;
            }
            case 'CREATE_CUSTOMER': {
                const { customerName, customerPhone } = action.parameters;
                if (!customerName || !customerPhone) return "لطفاً نام و شماره تماس مشتری را به طور کامل بیان کنید.";
                if (customers.some(c => c.name.trim() === customerName.trim())) return `مشتری با نام «${customerName}» از قبل وجود دارد.`;

                const newCustomer: Customer = {
                    id: Date.now(),
                    name: customerName,
                    phone: customerPhone,
                    manager: '',
                    address: '',
                    status: 'فعال',
                    registrationDate: new Date().toISOString(),
                };
                setCustomers(prev => [newCustomer, ...prev]);
                return `مشتری جدید «${customerName}» با موفقیت ثبت شد.`;
            }
             case 'CREATE_EXPENSE': {
                const { expenseDescription, expenseAmount, expenseCategory } = action.parameters;
                if (!expenseDescription || !expenseAmount) return "لطفاً شرح و مبلغ هزینه را به طور کامل بیان کنید.";

                const newExpense: Expense = {
                    id: Date.now(),
                    description: expenseDescription,
                    amount: Number(expenseAmount),
                    category: expenseCategory || 'سایر',
                    date: new Date().toISOString().split('T')[0],
                };
                setExpenses(prev => [newExpense, ...prev]);
                return `هزینه «${expenseDescription}» به مبلغ ${Number(expenseAmount).toLocaleString()} افغانی با موفقیت ثبت شد.`;
            }
            case 'WRITE_OFF_STOCK': {
                const { drugName, lotNumber, quantity, reason } = action.parameters;
                if (!drugName || !lotNumber || !quantity || !reason) return "لطفاً نام دارو، شماره لات، تعداد و دلیل ضایعات را به طور کامل بیان کنید.";

                const drug = drugs.find(d => d.name.toLowerCase().includes(drugName.toLowerCase()));
                if (!drug) return `داروی «${drugName}» یافت نشد.`;
                const batch = drug.batches.find(b => b.lotNumber === lotNumber);
                if (!batch) return `لات نامبر «${lotNumber}» برای این دارو یافت نشد.`;
                if (batch.quantity < quantity) return `موجودی لات «${lotNumber}» (${batch.quantity} عدد) برای ضایع کردن (${quantity} عدد) کافی نیست.`;

                const validReasons: WriteOffReason[] = ['تاریخ گذشته', 'آسیب دیده', 'مفقود شده', 'سایر'];
                const writeOffReason = validReasons.find(r => reason.includes(r)) || 'سایر';
                
                handleWriteOff(drug.id, lotNumber, Number(quantity), writeOffReason, `ثبت شده توسط دستیار هوشمند: ${reason}`);
                return `تعداد ${quantity} از داروی ${drugName} از لات ${lotNumber} با موفقیت ضایع شد.`;
            }
            case 'TRACE_LOT_NUMBER': {
                const { lotNumber } = action.parameters;
                if (!lotNumber) return "لطفاً شماره لات را برای ردیابی مشخص کنید.";
                handleTraceLotNumber(lotNumber);
                return `در حال نمایش گزارش ردیابی برای لات نامبر ${lotNumber}.`;
            }
            default:
                return "متاسفانه دستوری با این عنوان پیدا نکردم.";
        }
    };
    
    const processUserCommand = async (command: string) => {
        setAssistantStatus('processing');
        let responseText = "متاسفانه در پردازش دستور شما خطایی رخ داد.";
        
        const aiSchema = {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, enum: ["CREATE_INVOICE", "QUERY_STOCK", "QUERY_CUSTOMER_BALANCE", "QUERY_DAILY_SALES", "CREATE_CUSTOMER", "CREATE_EXPENSE", "WRITE_OFF_STOCK", "TRACE_LOT_NUMBER"] },
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        customerName: { type: Type.STRING },
                        customerPhone: { type: Type.STRING },
                        drugName: { type: Type.STRING },
                        lotNumber: { type: Type.STRING },
                        quantity: { type: Type.INTEGER },
                        reason: { type: Type.STRING },
                        expenseDescription: { type: Type.STRING },
                        expenseAmount: { type: Type.INTEGER },
                        expenseCategory: { type: Type.STRING, enum: ['حقوق', 'کرایه', 'حمل و نقل', 'بازاریابی', 'سایر'] },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    drugName: { type: Type.STRING },
                                    quantity: { type: Type.INTEGER },
                                },
                                required: ["drugName", "quantity"],
                            },
                        },
                    },
                },
            },
            required: ["action"],
        };

        try {
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: command,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: aiSchema,
                    systemInstruction: "You are an expert AI assistant for a pharmacy management system in Persian. Your task is to understand user commands and questions, and convert them into a structured JSON format based on the provided schema. You can create invoices, answer questions (stock, balance, daily sales), create new customers, record expenses, write-off stock, and trace lot numbers. Infer the correct action and parameters from the user's natural language command. Only respond with the JSON object."
                }
            });
            
            const jsonText = result.text.trim();
            const action = JSON.parse(jsonText);
            responseText = executeAiAction(action);
            
        } catch (error) {
            console.error("AI processing error:", error);
            responseText = "خطایی در ارتباط با دستیار هوشمند به وجود آمد. لطفاً دوباره تلاش کنید.";
        }

        setAssistantMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
        speak(responseText);
    };


    const handleMicClick = () => {
        if (assistantStatus === 'listening') {
            recognitionRef.current?.stop();
            setAssistantStatus('idle');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            const errorMsg = "مرورگر شما از قابلیت تشخیص گفتار پشتیبانی نمی‌کند.";
            setAssistantMessages(prev => [...prev, { sender: 'ai', text: errorMsg }]);
            speak(errorMsg);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fa-IR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.start();

        recognition.onstart = () => {
            setAssistantStatus('listening');
        };

        recognition.onresult = (event: any) => {
            const command = event.results[0][0].transcript;
            setAssistantMessages(prev => [...prev, { sender: 'user', text: command }]);
            processUserCommand(command);
        };

        recognition.onspeechend = () => {
            recognition.stop();
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            let errorMsg = "خطایی در تشخیص گفتار رخ داد. لطفاً دوباره تلاش کنید.";
            if (event.error === 'network') {
                errorMsg = "خطا در اتصال به سرویس تشخیص گفتار. لطفاً اتصال اینترنت خود را بررسی کنید. ممکن است این قابلیت در محیط پیش‌نمایش فعلی محدود شده باشد.";
            } else if (event.error === 'no-speech') {
                errorMsg = "صدایی تشخیص داده نشد. لطفاً نزدیک‌تر به میکروفون صحبت کنید.";
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMsg = "دسترسی به میکروفون مجاز نیست. لطفاً دسترسی را در تنظیمات مرورگر خود فعال کنید.";
            }
            
            setAssistantMessages(prev => [...prev, { sender: 'ai', text: errorMsg }]);
            setAssistantStatus('idle');
        };

        recognition.onend = () => {
             setAssistantStatus(prevStatus => {
                if (prevStatus === 'listening') {
                    return 'idle';
                }
                return prevStatus;
             });
        };
    };

    // RENDER LOGIC
    // ==========================================================

    // Loading Screen
    if (licenseStatus === 'LOADING') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p>در حال بارگذاری...</p>
            </div>
        );
    }
    
    // License Screens
    if (licenseStatus === 'NEEDS_ACTIVATION') {
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

     if (licenseStatus === 'NEEDS_VALIDATION') {
        return (
             <>
                <UpdateRequiredScreen onValidate={validateLicense} />
                <ToastContainer toasts={toasts} setToasts={setToasts} />
             </>
        );
    }
    
    if (licenseStatus === 'INVALID') {
        return <InvalidLicenseScreen />;
    }

    // Main App Screens (License is VALID)
    const renderActiveComponent = () => {
        if (!currentUser) return null;
        switch(activeItem) {
            case 'dashboard': return <Dashboard orders={orders} drugs={drugs} customers={customers} onNavigate={setActiveItem} activeAlerts={activeAlerts} />;
            case 'inventory': return <Inventory drugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} stockRequisitions={stockRequisitions} onSaveDrug={handleSaveDrug} onDelete={handleDeleteDrug} onWriteOff={handleWriteOff} onSaveRequisition={handleSaveRequisition} currentUser={currentUser} rolePermissions={rolePermissions} addToast={addToast} onTraceLotNumber={handleTraceLotNumber} />;
            case 'sales': return <Sales orders={orders} drugs={drugs} customers={customers} companyInfo={companyInfo} onSave={handleSaveOrder} onDelete={handleDeleteOrder} currentUser={currentUser} rolePermissions={rolePermissions} documentSettings={documentSettings} addToast={addToast} onOpenQuickAddModal={() => setIsQuickAddDrugModalOpen(true)} />;
            case 'customers': return <Customers customers={customers} onSave={(c) => setCustomers(prev => prev.find(i => i.id === c.id) ? prev.map(i => i.id === c.id ? c : i) : [{...c, registrationDate: new Date().toISOString()}, ...prev])} onDelete={handleDeleteCustomer} currentUser={currentUser} rolePermissions={rolePermissions} addToast={addToast} onViewLedger={handleViewLedger} />;
            case 'suppliers': return <Suppliers suppliers={suppliers} onSave={(s) => setSuppliers(prev => prev.find(i => i.id === s.id) ? prev.map(i => i.id === s.id ? s : i) : [s, ...prev])} onDelete={handleDeleteSupplier} currentUser={currentUser} />;
            case 'purchasing': return <Purchasing purchaseBills={purchaseBills} suppliers={suppliers} drugs={[...mainWarehouseDrugs, ...drugs]} onSave={handleSavePurchaseBill} onDelete={handleDeletePurchaseBill} currentUser={currentUser} addToast={addToast} onOpenQuickAddModal={() => setIsQuickAddDrugModalOpen(true)} />;
            case 'finance': return <Accounting orders={orders} expenses={expenses} onSave={(e) => setExpenses(prev => prev.find(i => i.id === e.id) ? prev.map(i => i.id === e.id ? e : i) : [e, ...prev])} onDelete={handleDeleteExpense} currentUser={currentUser} />;
            case 'reports': return <Reports orders={orders} drugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} customers={customers} suppliers={suppliers} purchaseBills={purchaseBills} inventoryWriteOffs={inventoryWriteOffs} companyInfo={companyInfo} documentSettings={documentSettings} lotNumberToTrace={lotNumberToTrace} />;
            case 'fulfillment': return <Fulfillment orders={orders} drugs={drugs} onUpdateOrder={handleSaveOrder} />;
            case 'customer_accounts': return <CustomerAccounts customers={customers} orders={orders} companyInfo={companyInfo} documentSettings={documentSettings} addToast={addToast} preselectedCustomerId={preselectedCustomerId} />;
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
            case 'recycle_bin': return <RecycleBin trashItems={trash} onRestore={handleRestoreItem} onDelete={handleDeletePermanently} onEmptyTrash={handleEmptyTrash} />;
            case 'checkneh': return <Checkneh customers={customers} companyInfo={companyInfo} documentSettings={documentSettings} addToast={addToast} showConfirmation={showConfirmation} invoices={checknehInvoices} setInvoices={setChecknehInvoices} />;
            case 'alerts': return <Alerts settings={alertSettings} setSettings={setAlertSettings} customers={customers} />;
            case 'settings': return <Settings 
                companyInfo={companyInfo} onSetCompanyInfo={setCompanyInfo} 
                users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} onPasswordReset={handlePasswordReset}
                backupKey={null} onBackupKeyChange={()=>{}} 
                supabase={supabase} licenseId={licenseInfo?.id || null}
                onBackupLocal={handleBackupLocal} 
                onRestoreLocal={handleRestoreLocal} 
                onBackupOnline={handleBackupOnline} 
                onRestoreOnline={handleRestoreOnline} 
                onPurgeData={()=>{}}
                documentSettings={documentSettings} onSetDocumentSettings={setDocumentSettings}
                rolePermissions={rolePermissions} onSetRolePermissions={setRolePermissions}
                hasUnsavedChanges={false} addToast={addToast} showConfirmation={showConfirmation} currentUser={currentUser}
                />;
            default: return <Dashboard orders={orders} drugs={drugs} customers={customers} onNavigate={setActiveItem} activeAlerts={[]} />;
        }
    };

    if (!currentUser) {
        return (
            <>
                <Login onLogin={handleLogin} />
                <ToastContainer toasts={toasts} setToasts={setToasts} />
            </>
        );
    }

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
                <Header title={pageTitles[activeItem] || 'داشبورد'} currentUser={currentUser} alerts={activeAlerts} onNavigate={setActiveItem}/>
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
             <ConfirmationModal
                isOpen={!!confirmationModal?.isOpen}
                onClose={handleCloseConfirmation}
                onConfirm={handleConfirm}
                title={confirmationModal?.title || ''}
            >
                {confirmationModal?.message}
            </ConfirmationModal>
            
            {/* AI Assistant FAB and Modal */}
            <button
                onClick={() => {
                    setIsAssistantOpen(true);
                    setAssistantMessages([]);
                }}
                className="fixed bottom-8 right-8 z-[98] w-16 h-16 bg-teal-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-teal-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-teal-300"
                aria-label="دستیار هوشمند"
            >
                <SparklesIcon className="w-8 h-8" />
            </button>
            <HayatAssistant
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                messages={assistantMessages}
                status={assistantStatus}
                onMicClick={handleMicClick}
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

export default App;