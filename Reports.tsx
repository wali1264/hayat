import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderItem } from './Sales';
import { PurchaseBill, PurchaseItem } from './Purchasing';
import { Customer } from './Customers';
import { Supplier } from './Suppliers';
import { CompanyInfo, DocumentSettings } from './Settings';
import { Drug } from './Inventory';
import { InventoryWriteOff } from './App';

// Declare global Chart object
declare var Chart: any;

//=========== ICONS ===========//
const Icon = ({ path, className = "w-6 h-6" }: { path: string, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);
const SalesIcon = () => <Icon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
const PurchaseIcon = () => <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />;
const ProfitIcon = () => <Icon path="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />;
const GiftIcon = () => <Icon path="M12 4v16m8-8H4" />;
const WasteIcon = () => <Icon path="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />;


//=========== TYPES ===========//
type ReportTab = 'profitability' | 'sales' | 'purchases' | 'bonuses' | 'wasted_stock';

//=========== SUB-COMPONENTS ===========//

const DataTable = ({ headers, rows, isNumeric = [] }: { headers: string[], rows: (string | number)[][], isNumeric?: boolean[] }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-right">
            <thead className="bg-gray-50 border-b-2">
                <tr>{headers.map(h => <th key={h} className="p-4 text-sm font-semibold text-gray-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
                {rows.length === 0 ? (
                    <tr><td colSpan={headers.length} className="text-center p-8 text-gray-500">هیچ موردی برای نمایش یافت نشد.</td></tr>
                ) : (
                    rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-teal-50 transition-colors">
                            {row.map((cell, cellIndex) => 
                                <td key={cellIndex} className={`p-4 whitespace-nowrap ${isNumeric[cellIndex] ? 'font-mono' : ''}`}>
                                    {typeof cell === 'number' ? cell.toLocaleString() : cell}
                                </td>
                            )}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const KPICard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
        </div>
    </div>
);

const ProfitabilityView = ({ filteredSales, drugs, filteredWastedStock }: { filteredSales: Order[], drugs: Drug[], filteredWastedStock: InventoryWriteOff[] }) => {
    const topProductsChartRef = useRef<HTMLCanvasElement>(null);
    const topCustomersChartRef = useRef<HTMLCanvasElement>(null);

    const drugsMap = useMemo(() => new Map(drugs.map(d => [d.id, d])), [drugs]);

    const profitData = useMemo(() => {
        let totalRevenue = 0;
        let totalCogs = 0;
        const profitByProduct: { [key: string]: number } = {};
        const profitByCustomer: { [key: string]: number } = {};
        const allItems: { name: string, qty: number, revenue: number, cogs: number, profit: number }[] = [];

        for (const order of filteredSales) {
            if (order.type !== 'sale') continue;
            totalRevenue += order.totalAmount;
            
            for (const item of order.items) {
                const drug = drugsMap.get(item.drugId);
                const purchasePrice = drug ? drug.purchasePrice : 0;
                
                const itemRevenue = item.finalPrice * item.quantity;
                const itemCogs = purchasePrice * (item.quantity + item.bonusQuantity);
                const itemProfit = itemRevenue - itemCogs;
                
                totalCogs += itemCogs;

                profitByProduct[item.drugName] = (profitByProduct[item.drugName] || 0) + itemProfit;
                profitByCustomer[order.customerName] = (profitByCustomer[order.customerName] || 0) + itemProfit;
                
                const existingItem = allItems.find(i => i.name === item.drugName);
                if(existingItem) {
                    existingItem.qty += item.quantity;
                    existingItem.revenue += itemRevenue;
                    existingItem.cogs += itemCogs;
                    existingItem.profit += itemProfit;
                } else {
                     allItems.push({ name: item.drugName, qty: item.quantity, revenue: itemRevenue, cogs: itemCogs, profit: itemProfit });
                }
            }
        }
        
        const totalWastedCost = filteredWastedStock.reduce((sum, item) => sum + item.totalLossValue, 0);
        const grossProfit = totalRevenue - totalCogs - totalWastedCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        
        const top5Products = Object.entries(profitByProduct).sort(([,a], [,b]) => b - a).slice(0, 5);
        const top5Customers = Object.entries(profitByCustomer).sort(([,a], [,b]) => b - a).slice(0, 5);
        
        return {
            totalRevenue, totalCogs, totalWastedCost, grossProfit, profitMargin, top5Products, top5Customers, allItems: allItems.sort((a,b) => b.profit - a.profit)
        };
    }, [filteredSales, drugsMap, filteredWastedStock]);

    useEffect(() => {
        const charts: any[] = [];
        if (topProductsChartRef.current && profitData.top5Products.length > 0) {
            charts.push(new Chart(topProductsChartRef.current, {
                type: 'bar',
                data: {
                    labels: profitData.top5Products.map(p => p[0]),
                    datasets: [{ label: 'سود', data: profitData.top5Products.map(p => p[1]), backgroundColor: '#14b8a6' }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
            }));
        }
         if (topCustomersChartRef.current && profitData.top5Customers.length > 0) {
            charts.push(new Chart(topCustomersChartRef.current, {
                type: 'bar',
                data: {
                    labels: profitData.top5Customers.map(p => p[0]),
                    datasets: [{ label: 'سود', data: profitData.top5Customers.map(p => p[1]), backgroundColor: '#0ea5e9' }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
            }));
        }
        return () => charts.forEach(c => c.destroy());
    }, [profitData.top5Products, profitData.top5Customers]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="مجموع درآمد" value={`${profitData.totalRevenue.toLocaleString()} افغانی`} icon={<SalesIcon />} colorClass="bg-green-100 text-green-600" />
                <KPICard title="هزینه کالای فروخته شده" value={`${profitData.totalCogs.toLocaleString()} افغانی`} icon={<PurchaseIcon />} colorClass="bg-red-100 text-red-600" />
                <KPICard title="هزینه کالاهای ضایع شده" value={`${profitData.totalWastedCost.toLocaleString()} افغانی`} icon={<WasteIcon />} colorClass="bg-yellow-100 text-yellow-600" />
                <KPICard title="سود ناخالص" value={`${profitData.grossProfit.toLocaleString()} افغانی`} icon={<ProfitIcon />} colorClass="bg-blue-100 text-blue-600" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-md"><h3 className="font-bold mb-2">۵ محصول سودآور برتر</h3><div className="relative h-64"><canvas ref={topProductsChartRef}></canvas></div></div>
                <div className="bg-white p-4 rounded-xl shadow-md"><h3 className="font-bold mb-2">۵ مشتری سودآور برتر</h3><div className="relative h-64"><canvas ref={topCustomersChartRef}></canvas></div></div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-bold mb-2">گزارش سودآوری بر اساس محصول</h3>
                <DataTable 
                    headers={['نام محصول', 'تعداد فروش', 'مجموع درآمد', 'مجموع هزینه', 'سود کل']} 
                    rows={profitData.allItems.map(i => [i.name, i.qty, i.revenue, i.cogs, i.profit])}
                    isNumeric={[false, true, true, true, true]}
                />
            </div>
        </div>
    );
};

const SalesSummaryView = ({ filteredSales }: { filteredSales: Order[] }) => {
     const summary = useMemo(() => {
        const grouped = filteredSales.reduce((acc, order) => {
            if (!acc[order.customerName]) acc[order.customerName] = { totalAmount: 0, amountPaid: 0 };
            acc[order.customerName].totalAmount += Number(order.totalAmount);
            acc[order.customerName].amountPaid += Number(order.amountPaid);
            return acc;
        }, {} as { [key: string]: { totalAmount: number; amountPaid: number } });

        return Object.entries(grouped).map(([name, values]) => ({
            name, ...values, balance: values.totalAmount - values.amountPaid
        })).sort((a,b) => b.totalAmount - a.totalAmount);
    }, [filteredSales]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="font-bold mb-2">خلاصه فروش بر اساس مشتری</h3>
            <DataTable 
                headers={['نام مشتری', 'مجموع فروش', 'مجموع دریافتی', 'مانده حساب']} 
                rows={summary.map(s => [s.name, s.totalAmount, s.amountPaid, s.balance])}
                isNumeric={[false, true, true, true]}
            />
        </div>
    );
};

const PurchaseSummaryView = ({ filteredPurchases }: { filteredPurchases: PurchaseBill[] }) => {
    const summary = useMemo(() => {
        const grouped = filteredPurchases.reduce((acc, bill) => {
            if (!acc[bill.supplierName]) acc[bill.supplierName] = { totalAmount: 0, amountPaid: 0 };
            acc[bill.supplierName].totalAmount += Number(bill.totalAmount);
            acc[bill.supplierName].amountPaid += Number(bill.amountPaid);
            return acc;
        }, {} as { [key: string]: { totalAmount: number; amountPaid: number } });

        return Object.entries(grouped).map(([name, values]) => ({
            name, ...values, balance: values.totalAmount - values.amountPaid
        })).sort((a,b) => b.totalAmount - a.totalAmount);
    }, [filteredPurchases]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="font-bold mb-2">خلاصه خرید بر اساس تامین کننده</h3>
            <DataTable 
                headers={['نام شرکت', 'مجموع خرید', 'مجموع پرداختی', 'مانده حساب']} 
                rows={summary.map(s => [s.name, s.totalAmount, s.amountPaid, s.balance])}
                isNumeric={[false, true, true, true]}
            />
        </div>
    );
};

const BonusSummaryView = ({ filteredSales, drugs }: { filteredSales: Order[], drugs: Drug[] }) => {
    const drugsMap = useMemo(() => new Map(drugs.map(d => [d.id, d])), [drugs]);

    const bonusData = useMemo(() => {
        const bonusItems = filteredSales
            .flatMap(order => order.items.map(item => ({ ...item, orderDate: order.orderDate, orderNumber: order.orderNumber, customerName: order.customerName })))
            .filter(item => item.bonusQuantity > 0);

        let totalBonusUnits = 0;
        let totalBonusValue = 0;

        const tableRows = bonusItems.map(item => {
            const drug = drugsMap.get(item.drugId);
            const cost = drug ? drug.purchasePrice * item.bonusQuantity : 0;
            totalBonusUnits += item.bonusQuantity;
            totalBonusValue += cost;
            return [
                new Date(item.orderDate).toLocaleDateString('fa-IR'),
                item.orderNumber,
                item.customerName,
                item.drugName,
                item.bonusQuantity,
                cost
            ];
        });

        return { totalBonusUnits, totalBonusValue, tableRows };
    }, [filteredSales, drugsMap]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KPICard title="تعداد کل بونس داده شده" value={`${bonusData.totalBonusUnits.toLocaleString()} عدد`} icon={<GiftIcon />} colorClass="bg-purple-100 text-purple-600" />
                <KPICard title="ارزش کل بونس‌ها (هزینه)" value={`${bonusData.totalBonusValue.toLocaleString()} افغانی`} icon={<PurchaseIcon />} colorClass="bg-red-100 text-red-600" />
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-bold mb-2">گزارش تفصیلی بونس‌ها</h3>
                <DataTable
                    headers={['تاریخ', 'شماره فاکتور', 'نام مشتری', 'نام دارو', 'تعداد بونس', 'ارزش (هزینه)']}
                    rows={bonusData.tableRows}
                    isNumeric={[false, false, false, false, true, true]}
                />
            </div>
        </div>
    );
};

const WastedStockView = ({ filteredWastedStock }: { filteredWastedStock: InventoryWriteOff[] }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="font-bold mb-2">گزارش ضایعات انبار</h3>
            <DataTable 
                headers={['تاریخ', 'نام دارو', 'تعداد', 'دلیل', 'کاربر', 'ارزش کل زیان']} 
                rows={filteredWastedStock.map(w => [ new Date(w.date).toLocaleDateString('fa-IR'), w.drugName, w.quantity, w.reason, w.adjustedBy, w.totalLossValue ])}
                isNumeric={[false, false, true, false, false, true]}
            />
        </div>
    );
};

//=========== MAIN COMPONENT ===========//
type ReportsProps = {
    orders: Order[];
    drugs: Drug[];
    customers: Customer[];
    suppliers: Supplier[];
    purchaseBills: PurchaseBill[];
    inventoryWriteOffs: InventoryWriteOff[];
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
};

const Reports: React.FC<ReportsProps> = ({ orders, drugs, customers, suppliers, purchaseBills, inventoryWriteOffs, companyInfo, documentSettings }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeTab, setActiveTab] = useState<ReportTab>('profitability');
    const [filters, setFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const filteredData = useMemo(() => {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);

        const sales = orders.filter(o => {
            const orderDate = new Date(o.orderDate);
            return o.status !== 'لغو شده' && orderDate >= start && orderDate <= end;
        });

        const purchases = purchaseBills.filter(p => {
            const purchaseDate = new Date(p.purchaseDate);
            return p.status !== 'لغو شده' && purchaseDate >= start && purchaseDate <= end;
        });
        
        const wastedStock = inventoryWriteOffs.filter(w => {
            const writeOffDate = new Date(w.date);
            return writeOffDate >= start && writeOffDate <= end;
        });

        return { sales, purchases, wastedStock };
    }, [filters, orders, purchaseBills, inventoryWriteOffs]);
    
    const TabButton = ({ tabId, children }: { tabId: ReportTab, children: React.ReactNode }) => (
        <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 font-semibold rounded-lg transition-colors text-sm ${activeTab === tabId ? 'bg-teal-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
            {children}
        </button>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-full space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">مرکز گزارشات</h2>
                <p className="text-gray-500 mt-1">تحلیل عملکرد کسب‌وکار با داشبوردهای هوشمند</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="w-full bg-gray-100 p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="w-full bg-gray-100 p-2 border rounded-lg" />
                    </div>
                </div>
                <div className="flex-shrink-0 border-t md:border-t-0 md:border-r mt-4 md:mt-0 pt-4 md:pt-0 md:pr-4 flex items-end">
                    <div className="flex items-center gap-2 flex-wrap">
                        <TabButton tabId="profitability">سودآوری</TabButton>
                        <TabButton tabId="sales">فروش</TabButton>
                        <TabButton tabId="purchases">خرید</TabButton>
                        <TabButton tabId="bonuses">بونس‌ها</TabButton>
                        <TabButton tabId="wasted_stock">ضایعات</TabButton>
                    </div>
                </div>
            </div>

            <div className="transition-opacity duration-300">
                {activeTab === 'profitability' && <ProfitabilityView filteredSales={filteredData.sales} drugs={drugs} filteredWastedStock={filteredData.wastedStock} />}
                {activeTab === 'sales' && <SalesSummaryView filteredSales={filteredData.sales} />}
                {activeTab === 'purchases' && <PurchaseSummaryView filteredPurchases={filteredData.purchases} />}
                {activeTab === 'bonuses' && <BonusSummaryView filteredSales={filteredData.sales} drugs={drugs} />}
                {activeTab === 'wasted_stock' && <WastedStockView filteredWastedStock={filteredData.wastedStock} />}
            </div>
        </div>
    );
};

export default Reports;
