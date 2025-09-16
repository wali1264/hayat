

import React, { useMemo, useEffect, useRef } from 'react';
import { Drug } from './Inventory';
import { Order } from './Sales';
import { Customer } from './Customers';
import { ActiveAlert } from './App'; // Import ActiveAlert type

// Declare global Chart object
declare var Chart: any;

//=========== ICONS (Copied locally for simplicity) ===========//
const Icon = ({ path, className = "w-6 h-6" }: { path: string, className?: string | null }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
  </svg>
);
const SalesIcon = ({ className }: { className?: string }) => <Icon path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" className={className} />;
const CustomersIcon = ({ className }: { className?: string }) => <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" className={className} />;
const MoneyIcon = ({ className }: { className?: string }) => <Icon path="M12 8c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1-5h2v2h-2v-2z" className={className} />;
const FulfillmentIcon = ({ className }: { className?: string }) => <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className={className} />;
const AlertIcon = ({ className }: { className?: string }) => <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className={className} />;

//=========== COMPONENTS ===========//
const DashboardCard = ({ title, value, change, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between transition-transform transform hover:-translate-y-1">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            <p className={`text-sm text-gray-500`}>{change}</p>
        </div>
        <div className={`p-4 rounded-full ${color}`}>
            {icon}
        </div>
    </div>
);

//=========== MAIN COMPONENT ===========//
type DashboardProps = {
    drugs: Drug[];
    orders: Order[];
    customers: Customer[];
    onNavigate: (page: string) => void;
    activeAlerts: ActiveAlert[];
};

const Dashboard: React.FC<DashboardProps> = ({ drugs, orders, customers, onNavigate, activeAlerts }) => {
    const salesChartRef = useRef<HTMLCanvasElement>(null);
    const topProductsChartRef = useRef<HTMLCanvasElement>(null);

    // --- KPI Calculations ---
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

    // --- Panel Data ---
    const lowStockItems = useMemo(() => {
        return drugs.filter(d => d.quantity > 0 && d.quantity < 50)
            .sort((a, b) => a.quantity - b.quantity)
            .slice(0, 5); // show top 5
    }, [drugs]);

    // --- Chart Data ---
    const salesTrendData = useMemo(() => {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const salesByDay = orders
            .filter(o => o.status !== 'لغو شده' && last30Days.includes(o.orderDate))
            .reduce<{ [key: string]: number }>((acc, order) => {
                acc[order.orderDate] = (acc[order.orderDate] || 0) + order.totalAmount;
                return acc;
            }, {});

        return {
            labels: last30Days.map(d => new Date(d).toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' })),
            data: last30Days.map(d => salesByDay[d] || 0),
        };
    }, [orders]);

    const topSellingDrugsData = useMemo(() => {
        const salesByDrug = orders
             .filter(o => o.status !== 'لغو شده')
             .flatMap(o => o.items)
             .reduce<{ [key: string]: number }>((acc, item) => {
                 acc[item.drugName] = (acc[item.drugName] || 0) + (item.finalPrice * item.quantity);
                 return acc;
             }, {});
        
        const sortedDrugs = Object.entries(salesByDrug)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        
        return {
            labels: sortedDrugs.map(([name]) => name),
            data: sortedDrugs.map(([, total]) => total),
        };
    }, [orders]);


    // --- Chart Rendering ---
    useEffect(() => {
        let salesChartInstance: any;
        let topProductsChartInstance: any;

        if (salesChartRef.current) {
            const salesCtx = salesChartRef.current.getContext('2d');
            salesChartInstance = new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: salesTrendData.labels,
                    datasets: [{
                        label: 'فروش روزانه',
                        data: salesTrendData.data,
                        borderColor: '#14b8a6',
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        fill: true,
                        tension: 0.4,
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }
        
        if (topProductsChartRef.current) {
            const topProductsCtx = topProductsChartRef.current.getContext('2d');
            topProductsChartInstance = new Chart(topProductsCtx, {
                type: 'doughnut',
                data: {
                    labels: topSellingDrugsData.labels,
                    datasets: [{
                        label: 'درآمد',
                        data: topSellingDrugsData.data,
                        backgroundColor: ['#14b8a6', '#0891b2', '#0ea5e9', '#6366f1', '#8b5cf6'],
                        hoverOffset: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        return () => {
            if (salesChartInstance) salesChartInstance.destroy();
            if (topProductsChartInstance) topProductsChartInstance.destroy();
        };
    }, [salesTrendData, topSellingDrugsData]);

    return (
        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                <DashboardCard title="فروش امروز" value={`${salesToday.toLocaleString()} افغانی`} change="مجموع فروشات امروز" icon={<SalesIcon className="w-8 h-8"/>} color="bg-green-100 text-green-600" />
                <DashboardCard title="مجموع طلب از مشتریان" value={`${totalReceivables.toLocaleString()} افغانی`} change="موجودی قابل وصول" icon={<MoneyIcon className="w-8 h-8"/>} color="bg-red-100 text-red-600" />
                <DashboardCard title="مشتریان فعال" value={activeCustomersCount.toString()} change="مجموع مشتریان فعال" icon={<CustomersIcon className="w-8 h-8"/>} color="bg-yellow-100 text-yellow-600" />
                <DashboardCard title="سفارشات در انتظار" value={`${pendingFulfillmentCount} سفارش`} change="جهت آماده سازی" icon={<FulfillmentIcon className="w-8 h-8"/>} color="bg-blue-100 text-blue-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                     <h3 className="text-lg font-bold text-gray-800 mb-4">روند فروش (۳۰ روز گذشته)</h3>
                     <div className="relative h-80">
                         <canvas ref={salesChartRef}></canvas>
                     </div>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                     <h3 className="text-lg font-bold text-gray-800 mb-4">۵ داروی پرفروش</h3>
                      <div className="relative h-80">
                         <canvas ref={topProductsChartRef}></canvas>
                     </div>
                </div>
            </div>

             <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">هشدارهای فعال</h3>
                    {activeAlerts.length > 0 ? (
                        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                            {activeAlerts.map(alert => (
                                <li key={alert.id} className="py-3 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className={`w-3 h-3 rounded-full mr-3 ${alert.severity === 'error' ? 'bg-red-500' : 'bg-yellow-400'}`}></span>
                                        <span className="text-gray-700 font-medium">{alert.message}</span>
                                    </div>
                                    <button onClick={() => onNavigate(alert.navigateTo)} className="text-teal-600 font-semibold bg-teal-50 px-3 py-1 rounded-full text-sm hover:bg-teal-100 transition-colors">
                                        بررسی
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">هیچ هشدار فعالی برای نمایش وجود ندارد.</p>
                    )}
                     <button onClick={() => onNavigate('alerts')} className="mt-4 w-full py-2 text-center text-teal-600 font-semibold bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                        تنظیمات هشدارها
                    </button>
                </div>
             </div>
        </div>
    );
};

export default Dashboard;