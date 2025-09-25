import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from './Sales';
import { Customer } from './Customers';
import { User } from './Settings';

// Declare global libraries
declare var Chart: any;


//=========== SUPABASE CLIENT ===========//
const supabaseUrl = 'https://uqokruakwmqfynszaine.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxb2tydWFrd21xZnluc3phaW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODg5ODYsImV4cCI6MjA3MzA2NDk4Nn0.6hAotsw9GStdteP4NWcqvFmjCq8_81Y9IpGVkJx2dT0';
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

//=========== ICONS ===========//
const Icon = ({ path, className = "w-6 h-6" }: { path: string, className?: string | null }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
  </svg>
);

const navIcons = {
    dashboard: <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
    inventory: <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
    sales: <Icon path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    customers: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    // FIX: Add missing customer_accounts icon definition
    customer_accounts: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    menu: <Icon path="M4 6h16M4 12h16M4 18h16" />,
    logout: <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    reports: <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
};

//=========== VIEWS / SCREENS ===========//

// --- Placeholder for other views ---
const PlaceholderView = ({ view, onNavigate }) => (
    <div className="text-center p-8">
        <div className="text-teal-500 opacity-20">{view?.icon && React.cloneElement(view.icon, { className: "w-32 h-32 mx-auto" })}</div>
        <h2 className="mt-4 text-2xl font-bold text-gray-400">صفحه {view?.label}</h2>
        <p className="text-gray-400">قابلیت‌های این بخش در موبایل پیاده‌سازی خواهد شد.</p>
    </div>
);

// --- Dashboard View ---
const KPICard = ({ title, value, icon, color }) => (
    <div className={`bg-white p-4 rounded-xl shadow flex items-center justify-between`}>
        <div>
            <p className="text-xs font-medium text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            {React.cloneElement(icon, { className: "w-6 h-6" })}
        </div>
    </div>
);

const DashboardView = ({ orders, customers }: { orders: Order[], customers: Customer[] }) => {
    const salesChartRef = useRef<HTMLCanvasElement>(null);

    const { salesToday, totalReceivables, activeCustomersCount, pendingFulfillmentCount } = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const salesToday = orders
            .filter(o => o.orderDate === today && o.status !== 'لغو شده')
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const totalReceivables = orders
            .filter(o => o.status !== 'لغو شده')
            .reduce((sum, order) => sum + (order.totalAmount - order.amountPaid), 0);

        const activeCustomersCount = customers.filter(c => c.status === 'فعال').length;
        const pendingFulfillmentCount = orders.filter(o => o.status === 'در حال پردازش').length;

        return { salesToday, totalReceivables, activeCustomersCount, pendingFulfillmentCount };
    }, [orders, customers]);

    const salesTrendData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const salesByDay = orders
            .filter(o => o.status !== 'لغو شده' && last7Days.includes(o.orderDate))
            .reduce<{ [key: string]: number }>((acc, order) => {
                acc[order.orderDate] = (acc[order.orderDate] || 0) + order.totalAmount;
                return acc;
            }, {});

        return {
            labels: last7Days.map(d => new Date(d).toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' })),
            data: last7Days.map(d => salesByDay[d] || 0),
        };
    }, [orders]);
    
    useEffect(() => {
        let chartInstance: any;
        if (salesChartRef.current) {
            const ctx = salesChartRef.current.getContext('2d');
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: salesTrendData.labels,
                    datasets: [{
                        label: 'فروش روزانه',
                        data: salesTrendData.data,
                        backgroundColor: '#14b8a6',
                        borderRadius: 4,
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }
        return () => {
            if (chartInstance) chartInstance.destroy();
        };
    }, [salesTrendData]);

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <KPICard title="فروش امروز" value={`${Math.round(salesToday).toLocaleString()}`} icon={navIcons.sales} color="bg-green-100 text-green-600" />
                <KPICard title="مجموع طلبات" value={`${Math.round(totalReceivables).toLocaleString()}`} icon={navIcons.customer_accounts} color="bg-red-100 text-red-600" />
                <KPICard title="مشتریان فعال" value={activeCustomersCount.toString()} icon={navIcons.customers} color="bg-yellow-100 text-yellow-600" />
                <KPICard title="سفارشات در انتظار" value={`${pendingFulfillmentCount}`} icon={navIcons.inventory} color="bg-blue-100 text-blue-600" />
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="font-bold text-gray-800 mb-2">روند فروش (۷ روز گذشته)</h3>
                <div className="relative h-48">
                    <canvas ref={salesChartRef}></canvas>
                </div>
            </div>
        </div>
    );
};

//=========== MOBILE SHELL COMPONENTS ===========//
const allViews = [
    { id: 'dashboard', label: 'داشبورد', icon: navIcons.dashboard },
    { id: 'sales', label: 'فروش', icon: navIcons.sales },
    { id: 'inventory', label: 'انبار', icon: navIcons.inventory },
    { id: 'customers', label: 'مشتریان', icon: navIcons.customers },
    { id: 'reports', label: 'گزارشات', icon: navIcons.reports },
];
const mainTabs = allViews.slice(0, 4);

const MobileShell = ({ currentUser, onLogout, orders, customers }: { currentUser: User, onLogout: () => void, orders: Order[], customers: Customer[] }) => {
    const [activeView, setActiveView] = useState('dashboard');
    
    const activeViewDetails = allViews.find(v => v.id === activeView);

    const handleNavClick = (viewId: string) => setActiveView(viewId);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white shadow-md p-4 flex justify-between items-center flex-shrink-0 z-10">
                <h1 className="font-bold text-lg text-teal-700">{activeViewDetails?.label || 'ریموت کنترل'}</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{currentUser.username}</span>
                    <button onClick={onLogout} title="خروج">{navIcons.logout}</button>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto">
                {activeView === 'dashboard' && <DashboardView orders={orders} customers={customers} />}
                {activeView !== 'dashboard' && <PlaceholderView view={activeViewDetails} onNavigate={handleNavClick} />}
            </main>

            <footer className="bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex-shrink-0 z-50">
                <nav className="flex justify-around items-center h-16">
                    {mainTabs.map(tab => (
                        <button key={tab.id} onClick={() => handleNavClick(tab.id)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeView === tab.id ? 'text-teal-600' : 'text-gray-500'}`}>
                            {tab.icon}
                            <span className="text-xs font-semibold">{tab.label}</span>
                        </button>
                    ))}
                    <button onClick={() => handleNavClick('reports')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeView === 'reports' ? 'text-teal-600' : 'text-gray-500'}`}>
                        {navIcons.reports}
                        <span className="text-xs font-semibold">گزارشات</span>
                    </button>
                </nav>
            </footer>
        </div>
    );
};


//=========== MAIN COMPONENT (Entry Point) ===========//
const RemoteControl = ({ addToast, currentUser, orders, customers }: { 
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    currentUser: User | null;
    orders: Order[];
    customers: Customer[];
}) => {
    // The remote control view should only be rendered if there is a logged-in user.
    // The logout function is a placeholder as the session is managed by the main App.
    const handleLogout = () => {
        addToast("برای خروج، لطفاً از برنامه اصلی خارج شوید.", "info");
    };

    if (!currentUser) {
        // This state should ideally not be reached if App.tsx handles rendering correctly,
        // but it's a good fallback.
        return (
            <div className="flex items-center justify-center h-screen">
                <p>لطفاً ابتدا به برنامه اصلی وارد شوید.</p>
            </div>
        );
    }

    return <MobileShell currentUser={currentUser} onLogout={handleLogout} orders={orders} customers={customers} />;
};

export default RemoteControl;