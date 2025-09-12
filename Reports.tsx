import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from './Sales';
import { Expense } from './Accounting';
import { Drug } from './Inventory';
import { CompanyInfo, DocumentSettings } from './Settings';

//=========== ICONS ===========//
const Icon = ({ path, className = "w-8 h-8" }: { path: string, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);
const SalesIcon = () => <Icon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
const ExpenseIcon = () => <Icon path="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />;
const ProfitIcon = () => <Icon path="M12 8c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1-5h2v2h-2v-2z" />;
const PrintIcon = () => <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v4H9v-4m4 0h-2" className="w-5 h-5" />;
const CloseIcon = ({ className = "w-6 h-6" }: { className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const InventoryValueIcon = () => <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />;


//=========== TYPES ===========//
type ReportData = {
    filters: { startDate: string; endDate: string; };
    summary: {
        totalSales: number;
        totalExpenses: number;
        totalCOGS: number;
        inventoryValue: number;
        netProfit: number;
        totalOrders: number;
    };
    sales: Order[];
    expenses: Expense[];
    topProducts: { name: string; quantity: number; revenue: number; }[];
};

//=========== COMPONENTS ===========//
const SummaryCard = ({ title, value, icon, colorClass, isCurrency = true }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
                {value.toLocaleString()} {isCurrency && <span className="text-lg font-normal text-gray-600">افغانی</span>}
            </p>
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
        </div>
    </div>
);


const ReportPrintView = ({ reportData, companyInfo, onClose, documentSettings }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    if (!reportData) return null;

    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const { summary, filters, sales, expenses, topProducts } = reportData;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8" onClick={e => e.stopPropagation()}>
                <div 
                    id="print-section"
                    className={`p-10 ${'template-' + selectedTemplate} ${'layout-logo-' + documentSettings.logoPosition} ${documentSettings.documentBackground !== 'none' ? 'bg-' + documentSettings.documentBackground : ''}`}
                    style={{ '--accent-color': documentSettings.accentColor } as React.CSSProperties}
                >
                    <header className="print-header">
                        <div className="print-company-info">
                            <h1 className="text-2xl font-bold text-gray-800 print-title">{companyInfo.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">{companyInfo.address}</p>
                            <p className="text-sm text-gray-500">{companyInfo.phone}</p>
                        </div>
                        {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="print-logo" />}
                    </header>
                    
                    <div className='text-center my-6'>
                        <h2 className='text-xl font-bold print-title'>گزارش مالی جامع</h2>
                         <p className="text-sm text-gray-500">
                            از {new Date(filters.startDate).toLocaleDateString('fa-IR')} تا {new Date(filters.endDate).toLocaleDateString('fa-IR')}
                        </p>
                    </div>
                    
                    <section className="my-8 page-break-inside-avoid">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">خلاصه وضعیت مالی</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                             <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-sm text-green-800">مجموع فروش</p>
                                <p className="font-bold text-lg text-green-900">{summary.totalSales.toLocaleString()} افغانی</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-sm text-orange-800">بهای تمام شده کالا</p>
                                <p className="font-bold text-lg text-orange-900">{summary.totalCOGS.toLocaleString()} افغانی</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <p className="text-sm text-red-800">مجموع مصارف</p>
                                <p className="font-bold text-lg text-red-900">{summary.totalExpenses.toLocaleString()} افغانی</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">سود خالص</p>
                                <p className="font-bold text-lg text-blue-900">{summary.netProfit.toLocaleString()} افغانی</p>
                            </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4 text-center">
                            <p className="text-sm text-purple-800">ارزش فعلی انبار (بر اساس قیمت خرید)</p>
                            <p className="font-bold text-lg text-purple-900">{summary.inventoryValue.toLocaleString()} افغانی</p>
                        </div>
                    </section>

                    <section className="my-8 page-break-inside-avoid">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">فروشات تفصیلی</h3>
                        <div className="border rounded-lg overflow-hidden">
                           <table className="w-full text-sm text-right">
                                <thead><tr><th className="p-2 font-semibold">تاریخ</th><th className="p-2 font-semibold">مشتری</th><th className="p-2 font-semibold">شماره سفارش</th><th className="p-2 font-semibold">مبلغ</th></tr></thead>
                                <tbody>
                                    {sales.map(order => <tr key={order.id} className="border-t"><td className="p-2">{new Date(order.orderDate).toLocaleDateString('fa-IR')}</td><td className="p-2">{order.customerName}</td><td className="p-2">{order.orderNumber}</td><td className="p-2 font-semibold">{order.totalAmount.toLocaleString()}</td></tr>)}
                                </tbody>
                           </table>
                        </div>
                    </section>

                     <section className="my-8 page-break-inside-avoid">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">مصارف تفصیلی</h3>
                        <div className="border rounded-lg overflow-hidden">
                           <table className="w-full text-sm text-right">
                                <thead><tr><th className="p-2 font-semibold">تاریخ</th><th className="p-2 font-semibold">شرح</th><th className="p-2 font-semibold">دسته‌بندی</th><th className="p-2 font-semibold">مبلغ</th></tr></thead>
                                <tbody>
                                    {expenses.map(exp => <tr key={exp.id} className="border-t"><td className="p-2">{new Date(exp.date).toLocaleDateString('fa-IR')}</td><td className="p-2">{exp.description}</td><td className="p-2">{exp.category}</td><td className="p-2 font-semibold">{exp.amount.toLocaleString()}</td></tr>)}
                                </tbody>
                           </table>
                        </div>
                    </section>

                    <section className="my-8 page-break-inside-avoid">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">پرفروش‌ترین داروها</h3>
                         <div className="border rounded-lg overflow-hidden">
                           <table className="w-full text-sm text-right">
                                <thead><tr><th className="p-2 font-semibold">نام دارو</th><th className="p-2 font-semibold">تعداد فروش</th><th className="p-2 font-semibold">درآمد حاصله</th></tr></thead>
                                <tbody>
                                    {topProducts.map(prod => <tr key={prod.name} className="border-t"><td className="p-2">{prod.name}</td><td className="p-2">{prod.quantity.toLocaleString()}</td><td className="p-2 font-semibold">{prod.revenue.toLocaleString()}</td></tr>)}
                                </tbody>
                           </table>
                        </div>
                    </section>

                </div>
                 <div className="flex justify-between items-center space-x-2 space-x-reverse p-4 bg-gray-50 rounded-b-xl border-t print:hidden">
                    <div>
                        <label className="text-sm font-semibold mr-2">قالب:</label>
                        <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="bg-white border border-gray-300 rounded-md px-2 py-1">
                            <option value="modern">مدرن</option>
                            <option value="classic">کلاسیک</option>
                            <option value="minimalist">ساده</option>
                            <option value="compact">فشرده</option>
                        </select>
                    </div>
                    <div className='flex gap-2'>
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">بستن</button>
                        <button type="button" onClick={handlePrint} className="flex items-center px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold">
                            <PrintIcon /> <span className="mr-2">چاپ</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


type ReportsProps = {
    orders: Order[];
    expenses: Expense[];
    drugs: Drug[];
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
}

const Reports: React.FC<ReportsProps> = ({ orders, expenses, drugs, companyInfo, documentSettings }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [filters, setFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerateReport = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const { startDate, endDate } = filters;
        if (!startDate || !endDate) {
            alert("لطفا تاریخ شروع و پایان را مشخص کنید.");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const filteredSales = orders.filter(o => {
            const orderDate = new Date(o.orderDate);
            return orderDate >= start && orderDate <= end && o.status !== 'لغو شده';
        });

        const filteredExpenses = expenses.filter(exp => {
            const expenseDate = new Date(exp.date);
            return expenseDate >= start && expenseDate <= end;
        });

        const totalSales = filteredSales.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const totalCOGS = filteredSales.reduce((cogsSum, order) => {
            const orderCost = order.items.reduce((itemSum, item) => {
                const drugInfo = drugs.find(d => d.id === item.drugId);
                const purchasePrice = drugInfo ? drugInfo.purchasePrice : item.originalPrice;
                const totalQuantity = item.quantity + (item.bonusQuantity || 0);
                return itemSum + (totalQuantity * purchasePrice);
            }, 0);
            return cogsSum + orderCost;
        }, 0);

        const inventoryValue = drugs.reduce((sum, drug) => sum + (drug.quantity * drug.purchasePrice), 0);
        
        const productsSold: { [key: string]: { quantity: number, revenue: number } } = {};
        filteredSales.forEach(order => {
            order.items.forEach(item => {
                if (!productsSold[item.drugName]) {
                    productsSold[item.drugName] = { quantity: 0, revenue: 0 };
                }
                const pricePerUnit = item.bonusQuantity > 0 ? item.originalPrice : item.finalPrice;
                productsSold[item.drugName].quantity += item.quantity;
                productsSold[item.drugName].revenue += item.quantity * pricePerUnit;
            });
        });
        
        const topProducts = Object.entries(productsSold)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a,b) => b.revenue - a.revenue)
            .slice(0, 10);

        setReportData({
            filters,
            summary: {
                totalSales,
                totalExpenses,
                totalCOGS,
                inventoryValue,
                netProfit: totalSales - totalCOGS - totalExpenses,
                totalOrders: filteredSales.length,
            },
            sales: filteredSales.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
            expenses: filteredExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            topProducts,
        });
    };
    
    // Auto-generate report on initial load for the default period
    useEffect(() => {
        if(orders.length > 0 || expenses.length > 0 || drugs.length > 0) {
            handleGenerateReport();
        }
    }, [orders, expenses, drugs]);

    return (
        <div className="p-8 space-y-8">
             {isPrintModalOpen && (
                <ReportPrintView 
                    reportData={reportData}
                    companyInfo={companyInfo}
                    onClose={() => setIsPrintModalOpen(false)}
                    documentSettings={documentSettings}
                />
            )}
            <div>
                <h2 className="text-3xl font-bold text-gray-800">مرکز گزارشات</h2>
                <p className="text-gray-500 mt-2">تحلیل کسب‌وکار و تصمیم‌گیری هوشمندانه بر اساس داده‌های دقیق</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
                <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-gray-50 px-3 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-gray-50 px-3 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <button type="submit" className="w-full py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md">
                        ایجاد گزارش
                    </button>
                </form>
            </div>
            
            {reportData ? (
                <div className="space-y-8">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-700">
                            نمایش گزارش برای دوره: {new Date(filters.startDate).toLocaleDateString('fa-IR')} الی {new Date(filters.endDate).toLocaleDateString('fa-IR')}
                        </h3>
                        <button onClick={() => setIsPrintModalOpen(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                            <PrintIcon/>
                            <span className="mr-2">چاپ گزارش تفصیلی</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                        <SummaryCard title="مجموع فروش" value={reportData.summary.totalSales} icon={<SalesIcon/>} colorClass="bg-green-100 text-green-600" />
                        <SummaryCard title="بهای تمام شده کالا" value={reportData.summary.totalCOGS} icon={<ExpenseIcon/>} colorClass="bg-orange-100 text-orange-600" />
                        <SummaryCard title="مجموع مصارف" value={reportData.summary.totalExpenses} icon={<ExpenseIcon/>} colorClass="bg-red-100 text-red-600" />
                        <SummaryCard title="سود خالص" value={reportData.summary.netProfit} icon={<ProfitIcon/>} colorClass="bg-blue-100 text-blue-600" />
                        <SummaryCard title="ارزش موجودی انبار" value={reportData.summary.inventoryValue} icon={<InventoryValueIcon/>} colorClass="bg-purple-100 text-purple-600" />
                    </div>
                </div>
            ) : (
                <div className="text-center bg-white rounded-xl shadow-lg p-12">
                    <p className="text-gray-600 text-lg">برای مشاهده وضعیت مالی، لطفاً بازه زمانی مورد نظر خود را انتخاب کرده و دکمه "ایجاد گزارش" را بزنید.</p>
                </div>
            )}

        </div>
    );
};

export default Reports;