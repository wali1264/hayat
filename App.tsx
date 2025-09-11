
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import Inventory, { Drug } from './Inventory';
import Sales, { Order, OrderItem } from './Sales';
import Customers, { Customer } from './Customers';
import Accounting, { Expense, Income } from './Accounting';
import Reports from './Reports';
import Settings, { CompanyInfo as CompanyInfoType, User, UserRole, mockUsers as initialMockUsers } from './Settings';
import Fulfillment from './Fulfillment';
import Dashboard from './Dashboard';
import CustomerAccounts from './CustomerAccounts';
import Suppliers, { Supplier } from './Suppliers';
import Purchasing, { PurchaseBill, PurchaseItem } from './Purchasing';
import SupplierAccounts from './SupplierAccounts';
import RecycleBin, { TrashItem, TrashableItem } from './RecycleBin';


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
    'مدیر کل': ['dashboard', 'inventory', 'sales', 'fulfillment', 'customers', 'customer_accounts', 'suppliers', 'purchasing', 'supplier_accounts', 'finance', 'reports', 'settings', 'recycle_bin'],
    'فروشنده': ['dashboard', 'sales', 'customers', 'customer_accounts'],
    'انباردار': ['dashboard', 'inventory', 'fulfillment', 'suppliers', 'purchasing'],
    'حسابدار': ['dashboard', 'customer_accounts', 'supplier_accounts', 'finance', 'reports'],
};

//=========== MOCK DATA FOR DEMO ===========//
const initialMockDrugs: Drug[] = [
    { id: 1, name: 'Amoxicillin 500mg', barcode: '8901234567890', code: 'AMX500', manufacturer: 'Kabul Pharma', quantity: 1500, productionDate: '2023-12-01', expiryDate: '2025-12-31', price: 120, discountPercentage: 5, category: 'آنتی‌بیوتیک' },
    { id: 2, name: 'Panadol Extra', barcode: '8901234567891', code: 'PAN-EX', manufacturer: 'GSK', quantity: 2500, productionDate: '2024-01-01', expiryDate: '2026-06-30', price: 80, discountPercentage: 0, category: 'مسکن' },
    { id: 3, name: 'Vitamin C 1000mg', barcode: '8901234567892', code: 'VITC1000', manufacturer: 'Bayer', quantity: 800, productionDate: '2023-05-01', expiryDate: '2024-11-30', price: 250, discountPercentage: 10, category: 'ویتامین و مکمل' },
    { id: 4, name: 'Metformin 850mg', barcode: '8901234567893', code: 'MET850', manufacturer: 'Merck', quantity: 45, expiryDate: '2025-02-28', price: 180, discountPercentage: 0, category: 'دیابت' }, // Low stock
    { id: 5, name: 'Aspirin 81mg', barcode: '8901234567894', code: 'ASP81', manufacturer: 'Bayer', quantity: 1200, expiryDate: '2027-01-31', price: 90, discountPercentage: 0, category: 'بیماری‌های قلبی' },
    { id: 6, name: 'Ciprofloxacin 500mg', barcode: '8901234567895', code: 'CIP500', manufacturer: 'Kabul Pharma', quantity: 600, expiryDate: '2024-09-30', price: 300, discountPercentage: 15, category: 'آنتی‌بیوتیک' }, // Near expiry
    { id: 7, name: 'Salbutamol Inhaler', barcode: '8901234567896', code: 'SAL-INH', manufacturer: 'GSK', quantity: 300, expiryDate: '2025-08-31', price: 450, discountPercentage: 0, category: 'تنفسی' },
    { id: 8, name: 'Paracetamol Syrup', barcode: '8901234567897', code: 'PARA-SYP', manufacturer: 'Herat Medica', quantity: 950, expiryDate: '2025-10-31', price: 60, discountPercentage: 0, category: 'مسکن' },
    { id: 9, name: 'Loratadine 10mg', barcode: '8901234567898', code: 'LOR10', manufacturer: 'Bayer', quantity: 0, expiryDate: '2024-05-31', price: 150, discountPercentage: 0, category: 'ضد حساسیت' }, // Out of stock & expired
    { id: 10, name: 'Omeprazole 20mg', barcode: '8901234567899', code: 'OME20', manufacturer: 'Herat Medica', quantity: 700, expiryDate: '2026-04-30', price: 220, discountPercentage: 5, category: 'گوارشی' },
];

const initialMockCustomers: Customer[] = [
    { id: 1, name: 'داروخانه مرکزی کابل', manager: 'احمد ولی', phone: '0788112233', address: 'چهارراهی انصاری، کابل', registrationDate: '2023-01-15', status: 'فعال' },
    { id: 2, name: 'شفاخانه صحت', manager: 'دکتر فریبا', phone: '0799445566', address: 'کارته سه، کابل', registrationDate: '2023-03-20', status: 'فعال' },
    { id: 3, name: 'کلینیک آریانا', manager: 'محمد نادر', phone: '0777889900', address: 'شهرنو، مزار شریف', registrationDate: '2023-05-10', status: 'فعال' },
    { id: 4, name: 'داروخانه امید', manager: 'زهرا حسینی', phone: '0766123456', address: 'چوک گلها، هرات', registrationDate: '2023-08-01', status: 'غیرفعال' },
    { id: 5, name: 'شفاخانه امیری', manager: 'علی رضا', phone: '0789987654', address: 'وزیر اکبر خان، کابل', registrationDate: '2024-02-18', status: 'فعال' },
];

const initialMockOrders: Order[] = [
    {
        id: 1, orderNumber: 'ORD-2407-001', customerName: 'داروخانه مرکزی کابل', orderDate: '2024-07-25',
        items: [
            { drugId: 1, drugName: 'Amoxicillin 500mg', quantity: 50, originalPrice: 120, discountPercentage: 5, finalPrice: 114 },
            { drugId: 2, drugName: 'Panadol Extra', quantity: 100, originalPrice: 80, discountPercentage: 0, finalPrice: 80 },
        ],
        totalAmount: 13700,
        amountPaid: 13700, status: 'تکمیل شده', paymentStatus: 'پرداخت شده'
    },
    {
        id: 2, orderNumber: 'ORD-2407-002', customerName: 'شفاخانه صحت', orderDate: '2024-07-26',
        items: [
            { drugId: 3, drugName: 'Vitamin C 1000mg', quantity: 20, originalPrice: 250, discountPercentage: 10, finalPrice: 225 },
        ],
        totalAmount: 4500,
        amountPaid: 2000, status: 'ارسال شده', paymentStatus: 'قسمتی پرداخت شده'
    },
    {
        id: 3, orderNumber: 'ORD-2407-003', customerName: 'کلینیک آریانا', orderDate: '2024-07-28',
        items: [
            { drugId: 7, drugName: 'Salbutamol Inhaler', quantity: 10, originalPrice: 450, discountPercentage: 0, finalPrice: 450 },
            { drugId: 5, drugName: 'Aspirin 81mg', quantity: 200, originalPrice: 90, discountPercentage: 0, finalPrice: 90 },
        ],
        totalAmount: 22500,
        amountPaid: 0, status: 'ارسال شده', paymentStatus: 'پرداخت نشده'
    },
    {
        id: 4, orderNumber: 'ORD-2407-004', customerName: 'شفاخانه امیری', orderDate: new Date().toISOString().split('T')[0], // Today's order
        items: [
            { drugId: 8, drugName: 'Paracetamol Syrup', quantity: 60, originalPrice: 60, discountPercentage: 0, finalPrice: 60 },
        ],
        totalAmount: 3600,
        amountPaid: 0, status: 'در حال پردازش', paymentStatus: 'پرداخت نشده'
    },
     {
        id: 5, orderNumber: 'ORD-2407-005', customerName: 'داروخانه مرکزی کابل', orderDate: new Date().toISOString().split('T')[0], // Today's order
        items: [
            { drugId: 4, drugName: 'Metformin 850mg', quantity: 15, originalPrice: 180, discountPercentage: 0, finalPrice: 180 },
            { drugId: 10, drugName: 'Omeprazole 20mg', quantity: 30, originalPrice: 220, discountPercentage: 5, finalPrice: 209 },
        ],
        totalAmount: 8970,
        amountPaid: 0, status: 'در حال پردازش', paymentStatus: 'پرداخت نشده'
    },
    {
        id: 6, orderNumber: 'ORD-2406-015', customerName: 'شفاخانه صحت', orderDate: '2024-06-20',
        items: [
            { drugId: 2, drugName: 'Panadol Extra', quantity: 200, originalPrice: 80, discountPercentage: 0, finalPrice: 80 },
        ],
        totalAmount: 16000,
        amountPaid: 16000, status: 'تکمیل شده', paymentStatus: 'پرداخت شده'
    }
];

const initialMockExpenses: Expense[] = [
    { id: 1, description: 'پرداخت حقوق کارمندان ماه جولای', amount: 150000, date: '2024-07-30', category: 'حقوق' },
    { id: 2, description: 'کرایه دفتر مرکزی ماه جولای', amount: 45000, date: '2024-07-28', category: 'کرایه' },
    { id: 3, description: 'هزینه حمل و نقل سفارشات', amount: 12000, date: '2024-07-25', category: 'حمل و نقل' },
    { id: 4, description: 'خرید لوازم اداری', amount: 5000, date: '2024-07-15', category: 'سایر' },
];

const initialMockSuppliers: Supplier[] = [
    { id: 1, name: 'Kabul Pharma', representative: 'نوراحمد شاه', phone: '0788123123', email: 'info@kabulpharma.af', address: 'پارک صنعتی، کابل', status: 'فعال' },
    { id: 2, name: 'Herat Medica', representative: 'فاطمه اکبری', phone: '0799456456', email: 'sales@hmedica.af', address: 'شهرک صنعتی، هرات', status: 'فعال' },
    { id: 3, name: 'Global Impex', representative: 'John Doe', phone: '+97141234567', email: 'contact@globalimpex.ae', address: 'دبی، امارات', status: 'غیرفعال' },
];

const initialMockPurchaseBills: PurchaseBill[] = [
    {
        id: 1, billNumber: 'KP-2024-101', supplierName: 'Kabul Pharma', purchaseDate: '2024-07-15',
        items: [
            { drugId: 1, drugName: 'Amoxicillin 500mg', quantity: 1000, purchasePrice: 90 },
            { drugId: 6, drugName: 'Ciprofloxacin 500mg', quantity: 500, purchasePrice: 240 },
        ],
        totalAmount: 210000,
        amountPaid: 210000,
        status: 'دریافت شده',
    },
    {
        id: 2, billNumber: 'HM-2024-58', supplierName: 'Herat Medica', purchaseDate: '2024-07-20',
        items: [
            { drugId: 8, drugName: 'Paracetamol Syrup', quantity: 1000, purchasePrice: 45 },
            { drugId: 10, drugName: 'Omeprazole 20mg', quantity: 500, purchasePrice: 180 },
        ],
        totalAmount: 135000,
        amountPaid: 50000,
        status: 'دریافت شده',
    }
];

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
    { id: 'inventory', label: 'انبار و موجودی', icon: <InventoryIcon /> },
    { id: 'sales', label: 'فروش و سفارشات', icon: <SalesIcon /> },
    { id: 'fulfillment', label: 'آماده‌سازی سفارشات', icon: <FulfillmentIcon /> },
    { id: 'customers', label: 'مشتریان', icon: <CustomersIcon /> },
    { id: 'customer_accounts', label: 'حسابات مشتریان', icon: <CustomerAccountsIcon /> },
    { id: 'suppliers', label: 'تامین کنندگان', icon: <SuppliersIcon /> },
    { id: 'purchasing', label: 'خرید و فاکتورها', icon: <PurchasingIcon /> },
    { id: 'supplier_accounts', label: 'حسابات شرکت‌ها', icon: <SupplierAccountsIcon /> },
    { id: 'finance', label: 'مالی و هزینه‌ها', icon: <AccountingIcon /> },
    { id: 'reports', label: 'گزارشات', icon: <ReportsIcon /> },
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
            <nav className="flex-1 p-4">
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
            </div>
        </aside>
    );
};


const Header = ({ title, currentUser }) => (
    <header className="bg-white shadow-md p-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-700">{title}</h2>
        <div className="flex items-center">
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
            const { data: existingUser } = await supabase.from('licenses').select('username').eq('username', username.trim()).single();
            if (existingUser) {
                setError('این نام کاربری قبلاً استفاده شده است. لطفاً نام دیگری انتخاب کنید.');
                setIsLoading(false);
                return;
            }

            const email = `${username.trim().toLowerCase()}@example.com`;
            const { data: { user, session }, error: signUpError } = await supabase.auth.signUp({ email, password });

            if (signUpError) throw new Error(`خطا در ایجاد حساب کاربری: ${signUpError.message}`);
            if (!user || !session) throw new Error('ایجاد حساب کاربری با شکست مواجه شد.');

            const { data: newLicense, error: insertError } = await supabase.from('licenses').insert({ username: username.trim(), machine_id: machineId, user_id: user.id }).select().single();
            
            if (insertError) throw new Error(`خطا در ثبت لایسنس: ${insertError.message}`);
            if (!newLicense) throw new Error('ثبت لایسنس با شکست مواجه شد.');

            window.localStorage.setItem('hayat_isDeviceActivated', JSON.stringify(true));
            window.localStorage.setItem('hayat_licenseId', JSON.stringify(newLicense.id));
            window.localStorage.setItem('hayat_session', JSON.stringify(session));

            alert("برنامه با موفقیت فعال شد!");
            onActivate();

        } catch (error: any) {
            setError(error.message || "یک خطای ناشناخته رخ داد. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.");
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

//=========== LOGIN SCREEN ===========//
const LoginScreen = ({ onLoginSuccess, onSwitchToActivation }: { onLoginSuccess: () => void, onSwitchToActivation: () => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const email = `${username.trim().toLowerCase()}@example.com`;
            const { data: { session, user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

            if (signInError) throw new Error("نام کاربری یا رمز عبور اشتباه است.");
            if (!session || !user) throw new Error("ورود با شکست مواجه شد.");

            const { data: license, error: licenseError } = await supabase.from('licenses').select('id').eq('user_id', user.id).single();
            if (licenseError || !license) throw new Error("لایسنس مرتبط با این کاربر یافت نشد.");
            
            const newMachineId = getOrCreateMachineId();
            const { error: updateError } = await supabase.from('licenses').update({ machine_id: newMachineId }).eq('id', license.id);
            if (updateError) console.warn("Could not update machine_id, but proceeding:", updateError.message);

            window.localStorage.setItem('hayat_isDeviceActivated', JSON.stringify(true));
            window.localStorage.setItem('hayat_licenseId', JSON.stringify(license.id));
            window.localStorage.setItem('hayat_session', JSON.stringify(session));
            
            alert("با موفقیت وارد شدید. برای بازیابی اطلاعات، به بخش تنظیمات بروید.");
            onLoginSuccess();

        } catch (error: any) {
            setError(error.message || "یک خطای ناشناخته رخ داد. اتصال اینترنت خود را بررسی کنید.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
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


//=========== MAIN APP ===========//
const App: React.FC = () => {
    // Auth State
    const [isDeviceActivated, setIsDeviceActivated] = usePersistentState<boolean>('hayat_isDeviceActivated', false);
    const [licenseId, setLicenseId] = usePersistentState<string | null>('hayat_licenseId', null);
    const [session, setSession] = usePersistentState<Session | null>('hayat_session', null);
    const [authMode, setAuthMode] = useState<'activation' | 'login'>('login');
    const [isLicenseDeactivated, setIsLicenseDeactivated] = useState(false);
    
    // State
    const [currentUser, setCurrentUser] = usePersistentState<User | null>('hayat_currentUser', null);
    const [activeItem, setActiveItem] = usePersistentState('activeItem', 'dashboard');
    
    // Centralized, Persistent State
    const [users, setUsers] = usePersistentState<User[]>('hayat_users', initialMockUsers);
    const [drugs, setDrugs] = usePersistentState<Drug[]>('hayat_drugs', initialMockDrugs);
    const [orders, setOrders] = usePersistentState<Order[]>('hayat_orders', initialMockOrders);
    const [customers, setCustomers] = usePersistentState<Customer[]>('hayat_customers', initialMockCustomers);
    const [expenses, setExpenses] = usePersistentState<Expense[]>('hayat_expenses', initialMockExpenses);
    const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('hayat_suppliers', initialMockSuppliers);
    const [purchaseBills, setPurchaseBills] = usePersistentState<PurchaseBill[]>('hayat_purchaseBills', initialMockPurchaseBills);
    const [trash, setTrash] = usePersistentState<TrashItem[]>('hayat_trash', []);


    const [companyInfo, setCompanyInfo] = usePersistentState<CompanyInfoType>('hayat_companyInfo', {
        name: 'شرکت پخش دارویی حیات',
        address: 'کابل، افغانستان',
        phone: '0788123456',
        logo: null
    });

    // AI Assistant State
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState<Message[]>([]);
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);

    // --- Auth Handlers ---
    const handleLogout = () => {
        console.log("Logging out and clearing local session.");
        setIsDeviceActivated(false);
        setLicenseId(null);
        setSession(null);
        setCurrentUser(null);
        setIsLicenseDeactivated(false);
    };

    // Background license verifier for offline-first functionality
    useEffect(() => {
        if (!isDeviceActivated || !licenseId || !session) {
            return;
        }

        const verifyLicense = async () => {
            try {
                const { error: sessionError } = await supabase.auth.setSession(session);
                if (sessionError) {
                    console.error("Local session is invalid. Logging out.", sessionError.message);
                    handleLogout();
                    return;
                }

                const { data, error: licenseError } = await supabase.from('licenses').select('is_active').eq('id', licenseId).single();

                if (licenseError) {
                    if (licenseError.code === 'PGRST116') { // Not found on server
                        console.error('License ID not found on server. Session is invalid.');
                        handleLogout();
                    } else {
                        console.warn('Could not verify license status (maybe offline):', licenseError.message);
                    }
                    return;
                }
                
                if (data && !data.is_active) {
                    console.log("License is inactive. Blocking access.");
                    setIsLicenseDeactivated(true);
                } else {
                    setIsLicenseDeactivated(false);
                }

            } catch (e) {
                console.error("An unexpected error occurred during license verification:", e);
            }
        };

        if (navigator.onLine) {
            verifyLicense();
        }
        
        const intervalId = setInterval(() => {
            if (navigator.onLine) {
                verifyLicense();
            }
        }, 1000 * 60 * 15);

        return () => clearInterval(intervalId);

    }, [isDeviceActivated, licenseId, session]);


    // Auto-login/user setup effect after activation
    useEffect(() => {
        if (isDeviceActivated && !currentUser) {
            const adminUser = users.find(u => u.role === 'مدیر کل') || users[0];
            if (adminUser) {
                const updatedUser = { ...adminUser, lastLogin: new Date().toLocaleString('fa-IR') };
                setCurrentUser(updatedUser);
                setUsers(prevUsers => prevUsers.map(u => u.id === adminUser.id ? updatedUser : u));
            }
        }
    }, [isDeviceActivated, currentUser, users, setCurrentUser, setUsers]);


    // Derived State for Incomes
    const incomes: Income[] = useMemo(() => {
        return orders
            .filter(order => order.amountPaid > 0)
            .map(order => ({
                id: order.id,
                description: `فروش - سفارش ${order.orderNumber}`,
                amount: order.amountPaid,
                date: order.orderDate,
            }));
    }, [orders]);

    // --- Backup & Restore Handlers ---
    const getAllData = () => ({
        users, drugs, orders, customers, expenses, suppliers, purchaseBills, trash, companyInfo,
    });

    const setAllData = (data: any) => {
        if (!data || typeof data !== 'object') {
            alert('فایل پشتیبان نامعتبر است.');
            return;
        }
        if (data.users) setUsers(data.users);
        if (data.drugs) setDrugs(data.drugs);
        if (data.orders) setOrders(data.orders);
        if (data.customers) setCustomers(data.customers);
        if (data.expenses) setExpenses(data.expenses);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.purchaseBills) setPurchaseBills(data.purchaseBills);
        if (data.trash) setTrash(data.trash);
        if (data.companyInfo) setCompanyInfo(data.companyInfo);
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
            alert('نسخه پشتیبان با موفقیت ایجاد شد.');
        } catch (error) {
            console.error('Error creating local backup:', error);
            alert('خطا در ایجاد نسخه پشتیبان.');
        }
    };

    const handleRestoreLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("آیا مطمئن هستید؟ با بازیابی اطلاعات، تمام داده‌های فعلی شما بازنویسی خواهد شد.")) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable.");
                const data = JSON.parse(text);
                setAllData(data);
                alert('اطلاعات با موفقیت بازیابی شد.');
            } catch (error) {
                console.error('Error restoring from local backup:', error);
                alert('خطا در بازیابی اطلاعات. ممکن است فایل پشتیبان شما خراب باشد.');
            }
        };
        reader.readAsText(file);
    };
    
    const handleBackupOnline = async () => {
        if (!licenseId) {
            alert("برای پشتیبان‌گیری آنلاین، ابتدا باید برنامه را فعال کنید.");
            return false;
        }
        if (!window.confirm("آیا می‌خواهید یک نسخه پشتیبان آنلاین جدید ایجاد کنید؟")) return false;
        
        try {
            const backup_data = getAllData();
            const { error } = await supabase.from('backups').insert({ license_id: licenseId, backup_data });
            if (error) throw error;
            alert('نسخه پشتیبان آنلاین با موفقیت ایجاد شد.');
            return true;
        } catch (error: any) {
            console.error("Error creating online backup:", error);
            alert(`خطا در ایجاد نسخه پشتیبان آنلاین: ${error.message}`);
            return false;
        }
    };

    const handleRestoreOnline = async (backupId: string) => {
         if (!window.confirm("آیا مطمئن هستید؟ با بازیابی اطلاعات، تمام داده‌های فعلی شما بازنویسی خواهد شد.")) {
            return;
        }
        try {
            const { data, error } = await supabase.from('backups').select('backup_data').eq('id', backupId).single();
            if (error) throw error;
            if (data && data.backup_data) {
                setAllData(data.backup_data);
                alert('اطلاعات با موفقیت از نسخه پشتیبان آنلاین بازیابی شد.');
            } else {
                throw new Error("فایل پشتیبان یافت نشد یا خالی است.");
            }
        } catch (error: any) {
            console.error("Error restoring from online backup:", error);
            alert(`خطا در بازیابی اطلاعات: ${error.message}`);
        }
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
    };

    // --- Inventory Adjustment ---
    const adjustInventory = (items: (OrderItem[] | PurchaseItem[]), operation: 'add' | 'subtract') => {
        setDrugs(currentDrugs => {
            const drugsMap = new Map(currentDrugs.map(d => [d.id, { ...d }]));
            
            for (const item of items) {
                const drugId = 'drugId' in item ? item.drugId : 0;
                const drug = drugsMap.get(drugId);
                if (drug) {
                    if (operation === 'subtract') {
                        drug.quantity -= item.quantity;
                    } else {
                        drug.quantity += item.quantity;
                    }
                    drugsMap.set(drugId, drug);
                }
            }
            return Array.from(drugsMap.values());
        });
    };
    
    // --- Drug Handlers ---
    const handleSaveDrug = (drugData: Drug) => {
        const exists = drugs.some(d => d.id === drugData.id);
        if (exists) {
            setDrugs(prev => prev.map(d => d.id === drugData.id ? drugData : d));
        } else {
            setDrugs(prev => [drugData, ...prev]);
        }
    };
    const handleDeleteDrug = (id: number) => {
        const itemToDelete = drugs.find(d => d.id === id);
        if (itemToDelete) {
            softDeleteItem(itemToDelete, 'drug');
            setDrugs(prev => prev.filter(d => d.id !== id));
        }
    };
    
    // --- Order Handlers ---
    const handleSaveOrder = (orderData: Order) => {
        const existingOrder = orders.find(o => o.id === orderData.id);
        
        if (existingOrder) { // It's an update
            const wasShipped = existingOrder.status === 'ارسال شده';
            const isShipped = orderData.status === 'ارسال شده';

            if (!wasShipped && isShipped) {
                adjustInventory(orderData.items, 'subtract');
            } else if (wasShipped && !isShipped) {
                adjustInventory(orderData.items, 'add');
            }
            setOrders(prev => prev.map(o => o.id === orderData.id ? orderData : o));

        } else { // It's a new order
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const dailyCount = orders.filter(o => o.orderDate === new Date().toISOString().split('T')[0]).length + 1;
            const newOrder: Order = {
                ...orderData,
                orderDate: new Date().toISOString().split('T')[0],
                orderNumber: `ORD-${year}${month}-${dailyCount.toString().padStart(3, '0')}`,
            };
             if (newOrder.status === 'ارسال شده') {
                adjustInventory(newOrder.items, 'subtract');
            }
            setOrders(prev => [newOrder, ...prev]);
        }
    };

    const handleDeleteOrder = (id: number) => {
        const itemToDelete = orders.find(o => o.id === id);
        if (itemToDelete) {
            if (itemToDelete.status === 'ارسال شده') {
                adjustInventory(itemToDelete.items, 'add'); // Return stock to inventory
            }
            softDeleteItem(itemToDelete, 'order');
            setOrders(prev => prev.filter(o => o.id !== id));
        }
    };

    // --- Customer Handlers ---
    const handleSaveCustomer = (customerData: Customer) => {
        const exists = customers.some(c => c.id === customerData.id);
        if (exists) {
            setCustomers(prev => prev.map(c => c.id === customerData.id ? customerData : c));
        } else {
             setCustomers(prev => [{...customerData, registrationDate: new Date().toISOString().split('T')[0]}, ...prev]);
        }
    };
    const handleDeleteCustomer = (id: number) => {
        const itemToDelete = customers.find(c => c.id === id);
        if (itemToDelete) {
            softDeleteItem(itemToDelete, 'customer');
            setCustomers(prev => prev.filter(c => c.id !== id));
        }
    };
    
    // --- Supplier Handlers ---
    const handleSaveSupplier = (supplierData: Supplier) => {
        const exists = suppliers.some(s => s.id === supplierData.id);
        if (exists) {
            setSuppliers(prev => prev.map(s => s.id === supplierData.id ? supplierData : s));
        } else {
             setSuppliers(prev => [supplierData, ...prev]);
        }
    };
    const handleDeleteSupplier = (id: number) => {
        const itemToDelete = suppliers.find(s => s.id === id);
        if (itemToDelete) {
            softDeleteItem(itemToDelete, 'supplier');
            setSuppliers(prev => prev.filter(s => s.id !== id));
        }
    };
    
    // --- Purchase Bill Handlers ---
    const handleSavePurchaseBill = (billData: PurchaseBill) => {
        const exists = purchaseBills.some(b => b.id === billData.id);
        if (exists) {
            setPurchaseBills(prev => prev.map(b => b.id === billData.id ? billData : b));
        } else {
            adjustInventory(billData.items, 'add');
            setPurchaseBills(prev => [billData, ...prev]);
        }
    };
    
    const handleDeletePurchaseBill = (id: number) => {
        const itemToDelete = purchaseBills.find(b => b.id === id);
        if(itemToDelete) {
             adjustInventory(itemToDelete.items, 'subtract'); // Deduct stock from inventory
             softDeleteItem(itemToDelete, 'purchaseBill');
             setPurchaseBills(prev => prev.filter(b => b.id !== id));
        }
    };


    // --- Expense Handlers ---
    const handleSaveExpense = (expenseData: Expense) => {
        const exists = expenses.some(e => e.id === expenseData.id);
        if (exists) {
            setExpenses(prev => prev.map(e => e.id === expenseData.id ? expenseData : e));
        } else {
            setExpenses(prev => [expenseData, ...prev]);
        }
    };
    const handleDeleteExpense = (id: number) => {
        const itemToDelete = expenses.find(e => e.id === id);
        if (itemToDelete) {
            softDeleteItem(itemToDelete, 'expense');
            setExpenses(prev => prev.filter(e => e.id !== id));
        }
    };
    
    // --- User Handlers (from Settings) ---
    const handleSaveUser = (userData: Omit<User, 'lastLogin'>) => {
        const isEditing = users.some(u => u.id === userData.id);
        if (isEditing) {
            setUsers(prev => prev.map(u => u.id === userData.id ? { ...u, ...userData } : u));
        } else {
            const newUser: User = {
                ...userData,
                lastLogin: 'هرگز وارد نشده'
            };
            setUsers(prev => [newUser, ...prev]);
        }
    };

    const handleDeleteUser = (id: number) => {
        if (id === 1) { 
            alert("کاربر مدیر کل قابل حذف نیست.");
            return;
        }
        const itemToDelete = users.find(u => u.id === id);
        if(itemToDelete) {
            softDeleteItem(itemToDelete, 'user');
            setUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    // --- Recycle Bin Handlers ---
    const handleRestoreItem = (itemToRestore: TrashItem) => {
        switch (itemToRestore.itemType) {
            case 'drug': setDrugs(prev => [itemToRestore.data as Drug, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'customer': setCustomers(prev => [itemToRestore.data as Customer, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'supplier': setSuppliers(prev => [itemToRestore.data as Supplier, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'expense': setExpenses(prev => [itemToRestore.data as Expense, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'user': setUsers(prev => [itemToRestore.data as User, ...prev].sort((a,b) => a.id - b.id)); break;
            case 'order':
                const restoredOrder = itemToRestore.data as Order;
                if (restoredOrder.status === 'ارسال شده') {
                    adjustInventory(restoredOrder.items, 'subtract'); // Re-deduct stock
                }
                setOrders(prev => [restoredOrder, ...prev].sort((a,b) => a.id - b.id));
                break;
            case 'purchaseBill':
                const restoredBill = itemToRestore.data as PurchaseBill;
                adjustInventory(restoredBill.items, 'add'); // Re-add stock
                setPurchaseBills(prev => [restoredBill, ...prev].sort((a,b) => a.id - b.id));
                break;
        }
        setTrash(prev => prev.filter(t => t.id !== itemToRestore.id));
    };

    const handlePermanentlyDeleteItem = (id: string) => {
        if (window.confirm("آیا از حذف دائمی این آیتم اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) {
            setTrash(prev => prev.filter(t => t.id !== id));
        }
    };
    
    const handleEmptyTrash = () => {
        if (window.confirm("آیا از خالی کردن کامل سطل زباله اطمینان دارید؟ تمام آیتم‌های موجود در آن به صورت دائمی حذف خواهند شد.")) {
            setTrash([]);
        }
    }


    // --- AI Assistant Handler ---
    const handleSendToAssistant = async (message: string) => {
        setAssistantMessages(prev => [...prev, { sender: 'user', text: message }]);
        setIsAssistantLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const systemInstruction = `You are 'Hayat Assistant', an expert business analyst for a pharmaceutical distribution company in Afghanistan. Your responses must be in Farsi. Analyze the provided JSON data to answer the user's question. Today's date is ${new Date().toISOString().split('T')[0]}.`;
            
            const prompt = `${systemInstruction}\n\n## Data:\n\n### Drugs:\n${JSON.stringify(drugs, null, 2)}\n\n### Customers:\n${JSON.stringify(customers, null, 2)}\n\n### Orders:\n${JSON.stringify(orders, null, 2)}\n\n## User Question:\n${message}`;

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
                 <p className="text-gray-600">ممکن است لایسنس شما توسط مدیر سیستم غیرفعال شده باشد یا مشکلی در اعتبار آن وجود داشته باشد. لطفاً برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.</p>
            </div>
        </div>
    );
    
    // --- Render Logic ---
    if (isLicenseDeactivated) {
        return <DeactivatedScreen />;
    }

    const isAppReady = isDeviceActivated && currentUser;
    
    if (!isAppReady) {
        if (authMode === 'activation') {
            return <ActivationScreen onActivate={handleAuthSuccess} onSwitchToLogin={() => setAuthMode('login')} />;
        }
        
        return <LoginScreen onLoginSuccess={handleAuthSuccess} onSwitchToActivation={() => {
            if (isDeviceActivated) {
                alert("این دستگاه قبلا فعال‌سازی شده است. اگر اطلاعات خود را فراموش کرده‌اید با پشتیبانی تماس بگیرید.");
            } else {
                setAuthMode('activation');
            }
        }} />;
    }


    const getPageTitle = () => {
        if (activeItem === 'settings') return 'تنظیمات';
        if (activeItem === 'recycle_bin') return 'سطل زباله';
        return navItems.find(item => item.id === activeItem)?.label || 'داشبورد';
    };

    const renderContent = () => {
        switch (activeItem) {
            case 'dashboard':
                return <Dashboard drugs={drugs} orders={orders} customers={customers} onNavigate={setActiveItem} />;
            case 'inventory':
                return <Inventory drugs={drugs} onSave={handleSaveDrug} onDelete={handleDeleteDrug} currentUser={currentUser} />;
            case 'sales':
                return <Sales orders={orders} drugs={drugs} customers={customers} companyInfo={companyInfo} onSave={handleSaveOrder} onDelete={handleDeleteOrder} currentUser={currentUser}/>;
            case 'fulfillment':
                return <Fulfillment orders={orders} onUpdateOrder={handleSaveOrder} />;
            case 'customers':
                return <Customers customers={customers} onSave={handleSaveCustomer} onDelete={handleDeleteCustomer} currentUser={currentUser} />;
            case 'customer_accounts':
                return <CustomerAccounts customers={customers} orders={orders} companyInfo={companyInfo} />;
            case 'suppliers':
                return <Suppliers suppliers={suppliers} onSave={handleSaveSupplier} onDelete={handleDeleteSupplier} currentUser={currentUser} />;
            case 'purchasing':
                return <Purchasing purchaseBills={purchaseBills} suppliers={suppliers} drugs={drugs} onSave={handleSavePurchaseBill} onDelete={handleDeletePurchaseBill} currentUser={currentUser} />;
            case 'supplier_accounts':
                return <SupplierAccounts suppliers={suppliers} purchaseBills={purchaseBills} companyInfo={companyInfo} />;
            case 'finance':
                return <Accounting incomes={incomes} expenses={expenses} onSave={handleSaveExpense} onDelete={handleDeleteExpense} currentUser={currentUser} />;
            case 'reports':
                return <Reports orders={orders} expenses={expenses} drugs={drugs} companyInfo={companyInfo} />;
            case 'settings':
                return <Settings 
                    companyInfo={companyInfo} 
                    setCompanyInfo={setCompanyInfo} 
                    users={users} 
                    onSaveUser={handleSaveUser} 
                    onDeleteUser={handleDeleteUser} 
                    supabase={supabase}
                    licenseId={licenseId}
                    onBackupLocal={handleBackupLocal}
                    onRestoreLocal={handleRestoreLocal}
                    onBackupOnline={handleBackupOnline}
                    onRestoreOnline={handleRestoreOnline}
                />;
            case 'recycle_bin':
                 return <RecycleBin 
                    trashItems={trash} 
                    onRestore={handleRestoreItem} 
                    onDelete={handlePermanentlyDeleteItem} 
                    onEmptyTrash={handleEmptyTrash} 
                />;
            default:
                return <Dashboard drugs={drugs} orders={orders} customers={customers} onNavigate={setActiveItem} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100" dir="rtl">
            <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} userRole={currentUser.role} onLogout={() => {}} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={getPageTitle()} currentUser={currentUser} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
            
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
        </div>
    );
};

export default App;
