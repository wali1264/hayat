import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Order, OrderStatus, PaymentStatus, OrderItem } from './Sales';
import { Customer } from './Customers';
import { User } from './Settings';
import { Drug } from './Inventory';


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
    customer_accounts: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    menu: <Icon path="M4 6h16M4 12h16M4 18h16" />,
    logout: <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    reports: <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
};
const SearchIcon = ({ className = "w-5 h-5 text-gray-400" }) => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className={className} />;
const PlusIcon = () => <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" />;
const MinusIcon = ({ className = "w-5 h-5" }) => <Icon path="M20 12H4" className={className} />;
const TrashIcon = ({ className = "w-5 h-5" }) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className}/>;
const ShoppingCartIcon = ({ className = "w-6 h-6" }) => <Icon path="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" className={className}/>;


//=========== HELPERS ===========//
const getOrderStatusStyle = (status: OrderStatus) => {
    switch (status) {
        case 'تکمیل شده': return { text: 'text-green-700', bg: 'bg-green-100' };
        case 'ارسال شده': return { text: 'text-blue-700', bg: 'bg-blue-100' };
        case 'در حال پردازش': return { text: 'text-yellow-700', bg: 'bg-yellow-100' };
        case 'لغو شده': return { text: 'text-gray-700', bg: 'bg-gray-100' };
        default: return { text: 'text-gray-700', bg: 'bg-gray-100' };
    }
};

const getPaymentStatusStyle = (status: PaymentStatus) => {
    switch (status) {
        case 'پرداخت شده': return { text: 'text-green-700', bg: 'bg-green-100' };
        case 'قسمتی پرداخت شده': return { text: 'text-yellow-700', bg: 'bg-yellow-100' };
        case 'پرداخت نشده': return { text: 'text-red-700', bg: 'bg-red-100' };
        default: return { text: 'text-gray-700', bg: 'bg-gray-100' };
    }
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

// --- Sales View ---
const SalesView = ({ orders, onStartNewOrder }: { orders: Order[], onStartNewOrder: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = useMemo(() => {
        return orders
            .filter(o =>
                o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }, [orders, searchTerm]);

    return (
        <div className="flex flex-col h-full relative">
            <div className="p-4 bg-white border-b sticky top-0 z-10">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="جستجو بر اساس نام مشتری یا شماره فاکتور..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => {
                        const orderStatusStyle = getOrderStatusStyle(order.status);
                        const paymentStatusStyle = getPaymentStatusStyle(order.paymentStatus);
                        const isReturn = order.type === 'sale_return';
                        return (
                            <div key={order.id} className={`bg-white rounded-xl shadow p-4 space-y-3 border-r-4 ${isReturn ? 'border-orange-400' : 'border-teal-500'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{order.customerName}</h3>
                                        <p className="text-sm text-gray-500 font-mono">{order.orderNumber}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-bold text-lg ${isReturn ? 'text-orange-600' : 'text-teal-600'}`}>
                                            {isReturn && '- '}
                                            {Math.round(Math.abs(order.totalAmount)).toLocaleString()} 
                                            <span className="text-sm font-normal"> افغانی</span>
                                        </p>
                                        <p className="text-xs text-gray-400">{new Date(order.orderDate).toLocaleDateString('fa-IR')}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold pt-2 border-t border-dashed">
                                    <span className={`px-2 py-1 rounded-full ${paymentStatusStyle.bg} ${paymentStatusStyle.text}`}>
                                        {order.paymentStatus}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full ${orderStatusStyle.bg} ${orderStatusStyle.text}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-16">
                        <p className="text-gray-500">هیچ فاکتوری با این مشخصات یافت نشد.</p>
                    </div>
                )}
            </div>
            <button
              onClick={onStartNewOrder}
              className="absolute bottom-20 right-6 bg-teal-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 z-20"
              aria-label="سفارش جدید"
            >
              <PlusIcon />
            </button>
        </div>
    );
};


// --- NEW: Order Creation Wizard Components ---
const CustomerSelectionStep = ({ customers, onSelect, onCancel }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [customers, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-bold text-lg">مرحله ۱: انتخاب مشتری</h2>
                <button onClick={onCancel} className="text-gray-600 font-semibold">انصراف</button>
            </header>
            <div className="p-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="جستجوی مشتری..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        autoFocus
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {filteredCustomers.map(customer => (
                    <button key={customer.id} onClick={() => onSelect(customer)} className="w-full text-right bg-white p-4 rounded-lg shadow-sm border hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ItemSelectionStep = ({ drugs, order, onOrderChange, onBack, onProceed }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCartVisible, setIsCartVisible] = useState(false);

    const availableDrugs = useMemo(() => {
        return drugs
            .map(d => ({ ...d, totalStock: d.batches.reduce((sum, b) => sum + b.quantity, 0) }))
            .filter(d => d.totalStock > 0)
            .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [drugs, searchTerm]);

    const handleItemChange = (drugId: number, change: number) => {
        const existingItem = order.items.find(i => i.drugId === drugId);
        if (existingItem) {
            const newQuantity = existingItem.quantity + change;
            if (newQuantity <= 0) {
                onOrderChange({ ...order, items: order.items.filter(i => i.drugId !== drugId) });
            } else {
                onOrderChange({ ...order, items: order.items.map(i => i.drugId === drugId ? { ...i, quantity: newQuantity } : i) });
            }
        } else if (change > 0) {
            const drug = drugs.find(d => d.id === drugId);
            if (!drug) return;
            const newItem: OrderItem = {
                drugId: drug.id,
                drugName: drug.name,
                quantity: 1,
                bonusQuantity: 0,
                originalPrice: drug.price,
                discountPercentage: drug.discountPercentage,
                finalPrice: drug.price * (1 - drug.discountPercentage / 100),
            };
            onOrderChange({ ...order, items: [...order.items, newItem] });
        }
    };
    
    const handleRemoveItem = (drugId: number) => {
        onOrderChange({ ...order, items: order.items.filter(i => i.drugId !== drugId) });
    };

    const totalAmount = useMemo(() => order.items.reduce((sum, item) => sum + (item.quantity * item.finalPrice), 0), [order.items]);

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
            <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-bold text-lg">مرحله ۲: افزودن کالا</h2>
                <button onClick={onBack} className="text-gray-600 font-semibold">بازگشت</button>
            </header>
            
            <div className="p-4 bg-white border-b">
                 <div className="relative">
                    <input type="text" placeholder="جستجوی محصول..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
                {availableDrugs.map(drug => {
                    const itemInCart = order.items.find(i => i.drugId === drug.id);
                    return (
                        <div key={drug.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{drug.name}</p>
                                <p className="text-sm text-gray-500">{drug.manufacturer}</p>
                                <p className="text-xs font-mono">موجودی: {drug.totalStock} | قیمت: {drug.price.toLocaleString()}</p>
                            </div>
                            {itemInCart ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleItemChange(drug.id, -1)} className="p-2 bg-gray-200 rounded-full"><MinusIcon /></button>
                                    <span className="font-bold w-8 text-center">{itemInCart.quantity}</span>
                                    <button onClick={() => handleItemChange(drug.id, 1)} className="p-2 bg-gray-200 rounded-full"><PlusIcon /></button>
                                </div>
                            ) : (
                                <button onClick={() => handleItemChange(drug.id, 1)} className="p-2 bg-teal-100 text-teal-700 rounded-lg font-semibold text-sm">افزودن</button>
                            )}
                        </div>
                    );
                })}
            </div>

            {order.items.length > 0 && (
                <footer className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-4 space-y-3">
                    <button onClick={() => setIsCartVisible(!isCartVisible)} className="w-full flex justify-between items-center text-left">
                        <div className="flex items-center gap-3">
                            <ShoppingCartIcon />
                            <div>
                                <p className="font-semibold">{order.items.length} قلم در سبد خرید</p>
                                <p className="text-sm text-gray-600">جمع کل: {totalAmount.toLocaleString()} افغانی</p>
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-teal-600">{isCartVisible ? 'بستن' : 'مشاهده'}</span>
                    </button>

                    {isCartVisible && (
                        <div className="pt-3 border-t max-h-40 overflow-y-auto space-y-2">
                            {order.items.map(item => (
                                <div key={item.drugId} className="flex justify-between items-center">
                                    <p className="text-sm">{item.drugName} <span className="font-mono text-xs">x{item.quantity}</span></p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold">{(item.quantity * item.finalPrice).toLocaleString()}</p>
                                        <button onClick={() => handleRemoveItem(item.drugId)} className="text-red-500 p-1"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <button onClick={onProceed} className="w-full bg-teal-600 text-white p-3 rounded-lg font-bold">بررسی نهایی</button>
                </footer>
            )}
        </div>
    );
};

const FinalReviewStep = ({ order, onBack, onSave }) => {
    const [amountPaid, setAmountPaid] = useState('');
    const totalAmount = useMemo(() => order.items.reduce((sum, item) => sum + (item.quantity * item.finalPrice), 0), [order.items]);

    const handleSaveClick = () => {
        onSave(Number(amountPaid) || 0);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0">
                <h2 className="font-bold text-lg">مرحله ۳: بررسی نهایی</h2>
                <button onClick={onBack} className="text-gray-600 font-semibold">بازگشت</button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">فاکتور برای:</p>
                    <p className="font-bold text-lg">{order.customerName}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
                    <h3 className="font-bold">خلاصه اقلام:</h3>
                    {order.items.map(item => (
                        <div key={item.drugId} className="flex justify-between text-sm">
                            <span>{item.drugName} <span className="font-mono text-xs">x{item.quantity}</span></span>
                            <span className="font-semibold">{(item.quantity * item.finalPrice).toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2 border-t">
                        <span>جمع کل</span>
                        <span>{totalAmount.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <label htmlFor="amountPaid" className="block text-sm font-bold mb-2">مبلغ پرداخت شده (افغانی)</label>
                    <input
                        type="number"
                        id="amountPaid"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0"
                        className="w-full p-3 border rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>
            </div>
            <footer className="bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                <button onClick={handleSaveClick} className="w-full bg-teal-600 text-white p-3 rounded-lg font-bold text-lg">
                    ذخیره و ثبت فاکتور
                </button>
            </footer>
        </div>
    );
};


const OrderCreationWizard = ({ customers, drugs, onCancel, currentUser, addToast, setWaitingForCommandId }) => {
    const [step, setStep] = useState(1);
    const [newOrder, setNewOrder] = useState<Partial<Order>>({ items: [] });
    
    const handleCustomerSelect = (customer: Customer) => {
        setNewOrder(prev => ({ ...prev, customerName: customer.name, items: [] }));
        setStep(2);
    };

    const handleSaveQuickSale = async (amountPaid: number) => {
        if (!newOrder.customerName || !newOrder.items || newOrder.items.length === 0) {
            addToast("خطا: اطلاعات فاکتور ناقص است.", 'error');
            return;
        }

        const payload = {
            customerName: newOrder.customerName,
            amountPaid: amountPaid,
            items: newOrder.items.map(item => ({
                drugId: item.drugId,
                quantity: item.quantity,
                bonusQuantity: item.bonusQuantity || 0
            }))
        };
        
        addToast("در حال ارسال فرمان به سیستم اصلی...", "info");
        try {
            const { data, error } = await supabase.from('commands').insert({
                type: 'CREATE_QUICK_SALE',
                payload: payload,
                sent_by: currentUser.username
            }).select('id').single();

            if (error) throw error;
            
            if (data && data.id) {
                setWaitingForCommandId(data.id);
            } else {
                throw new Error("پاسخی از پایگاه داده برای شناسه فرمان دریافت نشد.");
            }

        } catch (error) {
            console.error("Error sending quick sale command:", error);
            addToast("خطا در ارسال فرمان به سیستم اصلی.", 'error');
        }
    };

    if (step === 1) {
        return <CustomerSelectionStep customers={customers} onSelect={handleCustomerSelect} onCancel={onCancel} />;
    }

    if (step === 2) {
        return <ItemSelectionStep drugs={drugs} order={newOrder} onOrderChange={setNewOrder} onBack={() => setStep(1)} onProceed={() => setStep(3)} />;
    }

    if (step === 3) {
        return <FinalReviewStep order={newOrder} onBack={() => setStep(2)} onSave={handleSaveQuickSale} />;
    }
    
    return null;
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

const MobileShell = ({ currentUser, onLogout, activeView, setActiveView, children }) => {
    const activeViewDetails = allViews.find(v => v.id === activeView);

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
                {children}
            </main>

            <footer className="bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex-shrink-0 z-50">
                <nav className="flex justify-around items-center h-16">
                    {mainTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveView(tab.id)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeView === tab.id ? 'text-teal-600' : 'text-gray-500'}`}>
                            {tab.icon}
                            <span className="text-xs font-semibold">{tab.label}</span>
                        </button>
                    ))}
                    <button onClick={() => setActiveView('reports')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeView === 'reports' ? 'text-teal-600' : 'text-gray-500'}`}>
                        {navIcons.reports}
                        <span className="text-xs font-semibold">گزارشات</span>
                    </button>
                </nav>
            </footer>
        </div>
    );
};


//=========== MAIN COMPONENT (Entry Point) ===========//
const RemoteControl = ({ addToast, currentUser, orders, customers, drugs }: { 
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    currentUser: User | null;
    orders: Order[];
    customers: Customer[];
    drugs: Drug[];
}) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [waitingForCommandId, setWaitingForCommandId] = useState<string | null>(null);

    const handleLogout = () => {
        addToast("برای خروج، لطفاً از برنامه اصلی خارج شوید.", "info");
    };

    // If user navigates away from sales tab, exit order creation mode
    useEffect(() => {
        if (activeView !== 'sales') {
            setIsCreatingOrder(false);
        }
    }, [activeView]);

    // Listener for command results
    useEffect(() => {
        if (!currentUser || !waitingForCommandId) return;

        const handleNewResult = (payload: any) => {
            const result = payload.new;
            
            // The subscription filter should handle this, but double-check
            if (result.command_id === waitingForCommandId) {
                const toastType = result.status === 'SUCCESS' ? 'success' : 'error';
                addToast(result.message, toastType);
                
                if (result.status === 'SUCCESS') {
                    setIsCreatingOrder(false); // Close the wizard on success
                }
                
                setWaitingForCommandId(null); // Stop waiting
            }
        };

        const channel: RealtimeChannel = supabase
            .channel(`command_results_channel_${waitingForCommandId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'command_results', 
                filter: `command_id=eq.${waitingForCommandId}` 
            }, handleNewResult)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to command_results channel for command:', waitingForCommandId);
                }
                if (err) {
                    console.error('Command_results channel error:', err);
                    addToast('خطا در اتصال به کانال بازخورد.', 'error');
                    setWaitingForCommandId(null); // Reset on error
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [waitingForCommandId, currentUser, addToast]);


    const renderActiveView = () => {
        const activeViewDetails = allViews.find(v => v.id === activeView);
        if (activeView === 'sales' && isCreatingOrder) {
            return <OrderCreationWizard 
                customers={customers} 
                drugs={drugs} 
                onCancel={() => setIsCreatingOrder(false)} 
                currentUser={currentUser!} 
                addToast={addToast}
                setWaitingForCommandId={setWaitingForCommandId}
            />;
        }
        switch (activeView) {
            case 'dashboard':
                return <DashboardView orders={orders} customers={customers} />;
            case 'sales':
                return <SalesView orders={orders} onStartNewOrder={() => setIsCreatingOrder(true)} />;
            default:
                return <PlaceholderView view={activeViewDetails} onNavigate={setActiveView} />;
        }
    };


    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>لطفاً ابتدا به برنامه اصلی وارد شوید.</p>
            </div>
        );
    }

    return (
        <MobileShell 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            activeView={activeView}
            setActiveView={setActiveView}
        >
            {renderActiveView()}
        </MobileShell>
    );
};

export default RemoteControl;