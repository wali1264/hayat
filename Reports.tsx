import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Order, OrderItem } from './Sales';
import { PurchaseBill, PurchaseItem } from './Purchasing';
import { Customer } from './Customers';
import { Supplier } from './Suppliers';
import { CompanyInfo, DocumentSettings } from './Settings';
import { Drug, formatQuantity } from './Inventory';
import { InventoryWriteOff } from './App';

// Declare global libraries
declare var Chart: any;
declare var XLSX: any;

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
const InventoryIcon = () => <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />;
const ExportIcon = () => <Icon path="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a4 4 0 01-4-4V9a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V16a4 4 0 01-4 4z" className="w-5 h-5"/>;
const PrintIcon = () => <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v4H9v-4m4 0h-2" className="w-5 h-5"/>;
const ExcelIcon = () => <Icon path="M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 9h16M8 13h1m3 0h1" className="w-5 h-5"/>;
const TraceIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 4H4v6M14 20h6v-6" />;
const BuilderIcon = () => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
const ReturnReportIcon = () => <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z M9 15l-3-3m0 0l3-3m-3 3h6" />;


//=========== TYPES ===========//
type ReportTab = 'report_builder' | 'profitability' | 'sales' | 'purchases' | 'inventory' | 'bonuses' | 'wasted_stock' | 'batch_traceability' | 'sales_returns' | 'stock_ledger';
type GeneratedReport = {
    title: string;
    headers: string[];
    rows: (string | number)[][];
    summary?: { label: string; value: string | number }[];
    isNumeric?: boolean[];
    printData?: any; // For complex print structures
};

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
                                    {typeof cell === 'number' ? Math.round(cell).toLocaleString() : cell}
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
    const monthlyProfitChartRef = useRef<HTMLCanvasElement>(null);

    const drugsMap = useMemo(() => new Map(drugs.map(d => [d.id, d])), [drugs]);

    const profitData = useMemo(() => {
        let totalRevenue = 0;
        let totalCogs = 0;
        const profitByProduct: { [key: string]: number } = {};
        const profitByCustomer: { [key: string]: number } = {};
        const allItems: { name: string, qty: number, revenue: number, cogs: number, profit: number }[] = [];

        for (const order of filteredSales) {
            if (order.type !== 'sale') continue;
            
            // Revenue is based on the final price of items sold. Bonus items don't generate revenue.
            const itemsRevenue = order.items.reduce((sum, item) => {
                return sum + (item.quantity * item.finalPrice);
            }, 0);
            totalRevenue += itemsRevenue;
            
            for (const item of order.items) {
                // Cost of Goods Sold (COGS) from precise batch allocations
                const itemCogs = item.batchAllocations
                    ? item.batchAllocations.reduce((sum, alloc) => sum + (alloc.quantity * alloc.purchasePrice), 0)
                    : 0; 

                const itemRevenue = item.finalPrice * item.quantity;
                
                const itemProfit = itemRevenue - itemCogs;
                
                totalCogs += itemCogs;

                profitByProduct[item.drugName] = (profitByProduct[item.drugName] || 0) + itemProfit;
                profitByCustomer[order.customerName] = (profitByCustomer[order.customerName] || 0) + itemProfit;
                
                const existingItem = allItems.find(i => i.name === item.drugName);
                if(existingItem) {
                    existingItem.qty += item.quantity + (item.bonusQuantity || 0);
                    existingItem.revenue += itemRevenue;
                    existingItem.cogs += itemCogs;
                    existingItem.profit += itemProfit;
                } else {
                     allItems.push({ name: item.drugName, qty: item.quantity + (item.bonusQuantity || 0), revenue: itemRevenue, cogs: itemCogs, profit: itemProfit });
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
    }, [filteredSales, filteredWastedStock]);

     const monthlyProfitData = useMemo(() => {
        const monthlyData: { [month: string]: { revenue: number, cogs: number } } = {};
        
        for (const order of filteredSales) {
            if (order.type !== 'sale') continue;
            const month = order.orderDate.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) monthlyData[month] = { revenue: 0, cogs: 0 };
            
            const itemsRevenue = order.items.reduce((sum, item) => {
                return sum + (item.quantity * item.finalPrice);
            }, 0);
            monthlyData[month].revenue += itemsRevenue;

            for (const item of order.items) {
                 const itemCogs = item.batchAllocations
                    ? item.batchAllocations.reduce((sum, alloc) => sum + (alloc.quantity * alloc.purchasePrice), 0)
                    : 0;
                 monthlyData[month].cogs += itemCogs;
            }
        }
        
        const sortedMonths = Object.keys(monthlyData).sort();
        return {
            labels: sortedMonths.map(m => new Date(m + '-02').toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })),
            data: sortedMonths.map(m => monthlyData[m].revenue - monthlyData[m].cogs),
        };
    }, [filteredSales]);

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
         if (monthlyProfitChartRef.current && monthlyProfitData.data.length > 0) {
            charts.push(new Chart(monthlyProfitChartRef.current, {
                type: 'line',
                data: {
                    labels: monthlyProfitData.labels,
                    datasets: [{ label: 'سود ناخالص ماهانه', data: monthlyProfitData.data, borderColor: '#6366f1', tension: 0.1, fill: false }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            }));
        }
        return () => charts.forEach(c => c.destroy());
    }, [profitData.top5Products, profitData.top5Customers, monthlyProfitData]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="مجموع درآمد" value={`${Math.round(profitData.totalRevenue).toLocaleString()} افغانی`} icon={<SalesIcon />} colorClass="bg-green-100 text-green-600" />
                <KPICard title="هزینه کالای فروخته شده" value={`${Math.round(profitData.totalCogs).toLocaleString()} افغانی`} icon={<PurchaseIcon />} colorClass="bg-red-100 text-red-600" />
                <KPICard title="هزینه کالاهای ضایع شده" value={`${Math.round(profitData.totalWastedCost).toLocaleString()} افغانی`} icon={<WasteIcon />} colorClass="bg-yellow-100 text-yellow-600" />
                <KPICard title="سود ناخالص" value={`${Math.round(profitData.grossProfit).toLocaleString()} افغانی`} icon={<ProfitIcon />} colorClass="bg-blue-100 text-blue-600" />
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md"><h3 className="font-bold mb-2">روند سودآوری ماهانه</h3><div className="relative h-72"><canvas ref={monthlyProfitChartRef}></canvas></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-md"><h3 className="font-bold mb-2">۵ محصول سودآور برتر</h3><div className="relative h-64"><canvas ref={topProductsChartRef}></canvas></div></div>
                <div className="bg-white p-4 rounded-xl shadow-md"><h3 className="font-bold mb-2">۵ مشتری سودآور برتر</h3><div className="relative h-64"><canvas ref={topCustomersChartRef}></canvas></div></div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-bold mb-2">گزارش سودآوری بر اساس محصول</h3>
                <DataTable 
                    headers={['نام محصول', 'تعداد فروش (با بونس)', 'مجموع درآمد', 'مجموع هزینه', 'سود کل']} 
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
            const cost = (item.batchAllocations || [])
                .reduce((sum, alloc) => sum + (alloc.quantity * alloc.purchasePrice), 0)
                * (item.bonusQuantity / (item.quantity + item.bonusQuantity)); // Approximate cost of bonus

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
                <KPICard title="تعداد کل بونس داده شده" value={`${Math.round(bonusData.totalBonusUnits).toLocaleString()} عدد`} icon={<GiftIcon />} colorClass="bg-purple-100 text-purple-600" />
                <KPICard title="ارزش کل بونس‌ها (هزینه)" value={`${Math.round(bonusData.totalBonusValue).toLocaleString()} افغانی`} icon={<PurchaseIcon />} colorClass="bg-red-100 text-red-600" />
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

const SalesReturnView = ({ filteredSales }: { filteredSales: Order[] }) => {
    const returnData = useMemo(() => {
        const returnOrders = filteredSales.filter(o => o.type === 'sale_return');
        let totalReturnValue = 0;
        let totalProfitLoss = 0;
        
        const tableRows = returnOrders.map(order => {
            const itemsRevenue = Math.abs(order.items.reduce((sum, item) => {
                return sum + (item.quantity * item.finalPrice);
            }, 0));
             const cogs = order.items.reduce((sum, item) => sum + (item.batchAllocations || []).reduce((cogsSum, alloc) => cogsSum + (alloc.quantity * alloc.purchasePrice), 0), 0);
             const profitLoss = itemsRevenue - cogs;
             
             totalReturnValue += Math.abs(order.totalAmount);
             totalProfitLoss += profitLoss;

             return [
                 new Date(order.orderDate).toLocaleDateString('fa-IR'),
                 order.orderNumber,
                 order.customerName,
                 Math.abs(order.totalAmount),
                 -profitLoss // Show loss as a positive number representing the loss
             ];
        });

        return { totalReturnValue, totalProfitLoss, tableRows };
    }, [filteredSales]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <KPICard title="تعداد کل فاکتورهای مستردی" value={`${returnData.tableRows.length} فاکتور`} icon={<ReturnReportIcon />} colorClass="bg-orange-100 text-orange-600" />
                <KPICard title="ارزش کل کالای مسترد شده" value={`${Math.round(returnData.totalReturnValue).toLocaleString()} افغانی`} icon={<SalesIcon />} colorClass="bg-red-100 text-red-600" />
                <KPICard title="مجموع زیان سود از مستردی‌ها" value={`${Math.round(returnData.totalProfitLoss * -1).toLocaleString()} افغانی`} icon={<ProfitIcon />} colorClass="bg-yellow-100 text-yellow-600" />
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-bold mb-2">گزارش تفصیلی مستردی‌ها</h3>
                <DataTable
                    headers={['تاریخ', 'شماره فاکتور', 'نام مشتری', 'مبلغ کل مستردی', 'زیان سود']}
                    rows={returnData.tableRows}
                    isNumeric={[false, false, false, true, true]}
                />
            </div>
        </div>
    );
};

const InventoryReportView = ({ salesWarehouseDrugs, mainWarehouseDrugs }: { salesWarehouseDrugs: Drug[], mainWarehouseDrugs: Drug[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const inventoryData = useMemo(() => {
        const calcValue = (drugs: Drug[]) => drugs.reduce((totalSum, drug) => 
            totalSum + drug.batches.reduce((drugSum, batch) => drugSum + (batch.quantity * batch.purchasePrice), 0)
        , 0);
        
        const salesValue = calcValue(salesWarehouseDrugs);
        const mainValue = calcValue(mainWarehouseDrugs);
        
        const now = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(now.getMonth() + 6);

        const expiringValue = [...salesWarehouseDrugs, ...mainWarehouseDrugs]
            .flatMap(drug => drug.batches)
            .filter(batch => {
                if (!batch.expiryDate) return false;
                const expiry = new Date(batch.expiryDate);
                return expiry < sixMonthsFromNow && expiry > now;
            })
            .reduce((sum, batch) => sum + (batch.quantity * batch.purchasePrice), 0);
            
        return { salesValue, mainValue, totalValue: salesValue + mainValue, expiringValue };
    }, [salesWarehouseDrugs, mainWarehouseDrugs]);

    const filterDrugs = (drugs: Drug[]) => {
        if (!searchTerm) return drugs;
        return drugs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="ارزش موجودی انبار فروش" value={`${Math.round(inventoryData.salesValue).toLocaleString()} افغانی`} icon={<SalesIcon />} colorClass="bg-cyan-100 text-cyan-600" />
                <KPICard title="ارزش موجودی انبار اصلی" value={`${Math.round(inventoryData.mainValue).toLocaleString()} افغانی`} icon={<InventoryIcon />} colorClass="bg-blue-100 text-blue-600" />
                <KPICard title="ارزش کل موجودی" value={`${Math.round(inventoryData.totalValue).toLocaleString()} افغانی`} icon={<ProfitIcon />} colorClass="bg-indigo-100 text-indigo-600" />
                <KPICard title="ارزش موجودی نزدیک به انقضا" value={`${Math.round(inventoryData.expiringValue).toLocaleString()} افغانی`} icon={<WasteIcon />} colorClass="bg-yellow-100 text-yellow-600" />
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md">
                 <h3 className="font-bold mb-4">گزارش تفصیلی انبارها</h3>
                 <input type="text" placeholder="جستجوی محصول..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-sm p-2 border rounded-lg mb-4"/>
                 <div className="space-y-4">
                    <details open className="border rounded-lg">
                        <summary className="p-4 font-bold cursor-pointer bg-gray-50">انبار فروش</summary>
                         <DataTable
                            headers={['نام محصول', 'تعداد موجود', 'قیمت خرید (میانگین)', 'ارزش کل']}
                            rows={filterDrugs(salesWarehouseDrugs).map(d => {
                                const totalQuantity = d.batches.reduce((sum, b) => sum + b.quantity, 0);
                                const totalValue = d.batches.reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);
                                const avgPurchasePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                                return [d.name, formatQuantity(totalQuantity, d.unitsPerCarton), avgPurchasePrice, totalValue];
                            })}
                            isNumeric={[false, false, true, true]}
                        />
                    </details>
                     <details className="border rounded-lg">
                        <summary className="p-4 font-bold cursor-pointer bg-gray-50">انبار اصلی</summary>
                         <DataTable
                            headers={['نام محصول', 'تعداد موجود', 'قیمت خرید (میانگین)', 'ارزش کل']}
                            rows={filterDrugs(mainWarehouseDrugs).map(d => {
                                const totalQuantity = d.batches.reduce((sum, b) => sum + b.quantity, 0);
                                const totalValue = d.batches.reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);
                                const avgPurchasePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                                return [d.name, formatQuantity(totalQuantity, d.unitsPerCarton), avgPurchasePrice, totalValue];
                            })}
                            isNumeric={[false, false, true, true]}
                        />
                    </details>
                 </div>
            </div>
        </div>
    );
};

type TraceabilityResult = {
    purchaseInfo: (PurchaseItem & { bill: PurchaseBill }) | null;
    salesInfo: { customer: string; orderNumber: string; date: string; quantitySold: number; }[];
    currentStock: { drugName: string; quantity: number; expiryDate: string; }[];
} | null;

// --- New Batch Traceability View ---
const BatchTraceabilityView = ({ orders, purchaseBills, drugs, mainWarehouseDrugs, onPrint, lotNumberToTrace }: { orders: Order[], purchaseBills: PurchaseBill[], drugs: Drug[], mainWarehouseDrugs: Drug[], onPrint: (data: any) => void, lotNumberToTrace: string | null }) => {
    const [lotNumber, setLotNumber] = useState('');
    const [result, setResult] = useState<TraceabilityResult>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = useCallback(() => {
        const searchTerm = lotNumber.trim();
        if (!searchTerm) return;
        setIsLoading(true);

        const purchaseInfo = purchaseBills
            .flatMap(bill => bill.items.map(item => ({ ...item, bill })))
            .find(item => item.lotNumber === searchTerm) || null;

        const salesInfo = orders
            .flatMap(order => order.items.map(item => ({ item, order })))
            .filter(({ item }) => item.batchAllocations?.some(alloc => alloc.lotNumber === searchTerm))
            .map(({ item, order }) => {
                const allocation = item.batchAllocations!.find(alloc => alloc.lotNumber === searchTerm)!;
                return {
                    customer: order.customerName,
                    orderNumber: order.orderNumber,
                    date: order.orderDate,
                    quantitySold: allocation.quantity,
                };
            });
            
        const currentStock = [...drugs, ...mainWarehouseDrugs]
            .flatMap(drug => drug.batches.map(batch => ({...batch, drugName: drug.name})))
            .filter(batch => batch.lotNumber === searchTerm);

        const searchResult = { purchaseInfo, salesInfo, currentStock };
        setResult(searchResult);
        setIsLoading(false);
    }, [lotNumber, purchaseBills, orders, drugs, mainWarehouseDrugs]);
    
    useEffect(() => {
        if (lotNumberToTrace) {
            setLotNumber(lotNumberToTrace);
        }
    }, [lotNumberToTrace]);
    
    useEffect(() => {
        if (lotNumberToTrace && lotNumber === lotNumberToTrace) {
            handleSearch();
        }
    }, [lotNumber, lotNumberToTrace, handleSearch]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-gray-800">ردیابی بچ/لات</h3>
            <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg">
                <input 
                    type="text" 
                    value={lotNumber}
                    onChange={e => setLotNumber(e.target.value)}
                    placeholder="شماره لات را وارد کنید..."
                    className="w-full p-2 border rounded-lg"
                />
                <button onClick={handleSearch} className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700">جستجو</button>
                {result && (
                     <button onClick={() => onPrint({lotNumber, result})} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">
                        <PrintIcon /> چاپ
                    </button>
                )}
            </div>
            {result && (
                <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-2">۱. اطلاعات خرید</h4>
                        {result.purchaseInfo ? (
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>نام محصول: <strong>{result.purchaseInfo.drugName}</strong></li>
                                <li>تامین کننده: <strong>{result.purchaseInfo.bill.supplierName}</strong></li>
                                <li>تاریخ خرید: <strong>{new Date(result.purchaseInfo.bill.purchaseDate).toLocaleDateString('fa-IR')}</strong></li>
                                <li>شماره فاکتور: <strong>{result.purchaseInfo.bill.billNumber}</strong></li>
                                <li>تعداد خریداری شده: <strong>{result.purchaseInfo.quantity}</strong></li>
                                {(result.purchaseInfo.bonusQuantity > 0) && <li>تعداد بونس: <strong>{result.purchaseInfo.bonusQuantity}</strong></li>}
                                <li>قیمت خرید (قبل از تخفیف): <strong>{Math.round(result.purchaseInfo.purchasePrice).toLocaleString()}</strong></li>
                                {(result.purchaseInfo.discountPercentage > 0) && <li>تخفیف: <strong>{result.purchaseInfo.discountPercentage}%</strong></li>}
                            </ul>
                        ) : <p>اطلاعات خریدی برای این لات یافت نشد.</p>}
                    </div>
                     <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-2">۲. اطلاعات فروش</h4>
                        {result.salesInfo.length > 0 ? (
                            <DataTable 
                                headers={['تاریخ فروش', 'شماره فاکتور', 'مشتری', 'تعداد فروخته شده']}
                                rows={result.salesInfo.map(s => [new Date(s.date).toLocaleDateString('fa-IR'), s.orderNumber, s.customer, s.quantitySold])}
                            />
                        ) : <p>این لات هنوز فروخته نشده است.</p>}
                    </div>
                     <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-2">۳. موجودی فعلی</h4>
                        {result.currentStock.length > 0 ? (
                             <DataTable 
                                headers={['نام محصول', 'موجودی فعلی', 'تاریخ انقضا']}
                                rows={result.currentStock.map(s => [s.drugName, s.quantity, new Date(s.expiryDate).toLocaleDateString('fa-IR')])}
                            />
                        ) : <p>هیچ موجودی از این لات در انبارها یافت نشد.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- New Printable Report Component ---
const ReportPrintView = ({ title, dateRange, headers, rows, companyInfo, documentSettings, className, style, children }: { title?: string, dateRange?: string, headers?: string[], rows?: (string|number)[][], companyInfo: CompanyInfo, documentSettings: DocumentSettings, className?: string, style?: React.CSSProperties, children?: React.ReactNode }) => {
    return (
        <div className={className} style={style}>
            <header className="print-header">
                <div className="print-company-info">
                    <h1 className="text-3xl font-bold text-gray-800 print-title">{companyInfo.name}</h1>
                </div>
                {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="print-logo" />}
            </header>
            <div className="text-center my-8">
                {title && <h2 className="text-2xl font-bold">{title}</h2>}
                {dateRange && <p className="text-sm text-gray-500 mt-2">{dateRange}</p>}
            </div>
            {headers && rows && (
                 <table className="w-full text-right text-sm">
                    <thead>
                        <tr>{headers.map(h => <th key={h} className="p-3">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y">
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => 
                                    <td key={cellIndex} className="p-2">
                                        {typeof cell === 'number' ? Math.round(cell).toLocaleString() : cell}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {children}
        </div>
    );
};

// --- New Unified Print Preview Modal ---
const PrintPreviewModal = ({ isOpen, onClose, children, documentSettings }: { isOpen: boolean; onClose: () => void; children: React.ReactNode; documentSettings: DocumentSettings }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('report-classic');
    if (!isOpen) return null;

    const handlePrint = () => {
        setTimeout(() => window.print(), 100);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl mt-8 mb-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-50 rounded-b-xl border-t print:hidden flex justify-between items-center">
                    <div>
                        <label className="text-sm font-semibold mr-2">قالب:</label>
                        <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="bg-white border border-gray-300 rounded-md px-2 py-1">
                            <option value="report-classic">گزارش کلاسیک</option>
                            <option value="modern">مدرن</option>
                            <option value="classic">کلاسیک</option>
                            <option value="minimalist">ساده</option>
                        </select>
                    </div>
                    <div className='flex gap-2'>
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">بستن</button>
                        <button type="button" onClick={handlePrint} className="flex items-center px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold"><PrintIcon /> <span className="mr-2">چاپ</span></button>
                    </div>
                </div>
                <div id="print-section" className="max-h-[75vh] overflow-y-auto">
                    {React.cloneElement(children as React.ReactElement<{ className?: string, style?: React.CSSProperties }>, {
                        className: `p-10 template-${selectedTemplate} layout-logo-${documentSettings.logoPosition}`,
                        style: { '--accent-color': documentSettings.accentColor } as React.CSSProperties
                    })}
                </div>
            </div>
        </div>
    );
};

//=========== ADVANCED REPORT BUILDER COMPONENT ===========//
const reportOptions = {
    'فروش': {
        'فروش بر اساس محصول': {
            metrics: { qty: 'تعداد فروش', bonus: 'تعداد بونس', revenue: 'مبلغ فروش', profit: 'سود ناخالص' },
            entity: 'product'
        },
        'فروش بر اساس مشتری': {
            metrics: { invoices: 'تعداد فاکتور', sales: 'مجموع فروش', profit: 'سود ناخالص' },
            entity: 'customer'
        }
    },
    'خرید': {
        'خرید بر اساس محصول': {
            metrics: { qty: 'تعداد خرید', bonus: 'تعداد بونس', value: 'مبلغ خرید' },
            entity: 'product'
        },
        'خرید بر اساس شرکت': {
            metrics: { bills: 'تعداد فاکتور', value: 'مجموع خرید' },
            entity: 'supplier'
        }
    },
    'انبار': {
         'خلاصه موجودی انبار': {
            metrics: { main: 'موجودی انبار اصلی', sales: 'موجودی انبار فروش', total: 'موجودی کل', value: 'ارزش کل (خرید)'},
            entity: 'product'
        },
    }
};

const AdvancedReportBuilder = ({ orders, drugs, mainWarehouseDrugs, customers, suppliers, purchaseBills, inventoryWriteOffs, dateFilters, onGenerated }) => {
    const defaultSection = 'فروش';
    const defaultBasedOn = 'فروش بر اساس محصول';
    const defaultMetrics = Object.keys(reportOptions[defaultSection][defaultBasedOn].metrics).reduce((acc, key) => ({ ...acc, [key]: true }), {});

    const [filters, setFilters] = useState({
        section: defaultSection,
        basedOn: defaultBasedOn,
        selectedItem: null as { id: any; name: string } | null,
        searchTerm: '',
        allItems: true,
        metrics: defaultMetrics as { [key: string]: boolean }
    });
    const [suggestions, setSuggestions] = useState<{ id: any; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const allDrugs = useMemo(() => {
        const drugMap = new Map<number, Drug>();
        [...drugs, ...mainWarehouseDrugs].forEach(d => {
            if (!drugMap.has(d.id)) {
                const { batches, ...drugInfo } = d;
                drugMap.set(d.id, { ...drugInfo, batches: [] });
            }
        });
        return Array.from(drugMap.values());
    }, [drugs, mainWarehouseDrugs]);

    const handleFilterChange = (field: string, value: any) => {
        setFilters(prev => {
            let newFilters = { ...prev, [field]: value };
            if (field === 'section') {
                const newBasedOn = Object.keys(reportOptions[value])[0];
                const newMetrics = Object.keys(reportOptions[value][newBasedOn].metrics).reduce((acc, key) => ({ ...acc, [key]: true }), {});
                newFilters = { ...newFilters, basedOn: newBasedOn, metrics: newMetrics, searchTerm: '', selectedItem: null, allItems: true };
            }
            if (field === 'basedOn') {
                const newMetrics = Object.keys(reportOptions[newFilters.section][value].metrics).reduce((acc, key) => ({ ...acc, [key]: true }), {});
                newFilters = { ...newFilters, metrics: newMetrics, searchTerm: '', selectedItem: null, allItems: true };
            }
            if (field === 'allItems' && value === true) {
                 newFilters.searchTerm = '';
                 newFilters.selectedItem = null;
            }
            return newFilters;
        });
        onGenerated(null);
    };

    const handleMetricChange = (metricKey: string) => {
        setFilters(prev => ({
            ...prev,
            metrics: {
                ...prev.metrics,
                [metricKey]: !prev.metrics[metricKey]
            }
        }));
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        handleFilterChange('searchTerm', term);
        if (!term) {
            setSuggestions([]);
            return;
        }

        const currentEntity = reportOptions[filters.section][filters.basedOn].entity;
        let source: { id: any; name: string }[] = [];
        if(currentEntity === 'product') source = allDrugs;
        if(currentEntity === 'customer') source = customers;
        if(currentEntity === 'supplier') source = suppliers;

        setSuggestions(source.filter(s => s.name.toLowerCase().includes(term.toLowerCase())).slice(0, 10));
    };

    const handleSelectSuggestion = (item: { id: any; name: string }) => {
        setFilters(prev => ({ ...prev, selectedItem: item, searchTerm: item.name }));
        setSuggestions([]);
    };

    const handleGenerateReport = () => {
        setIsLoading(true);
        onGenerated(null);

        const { section, basedOn, selectedItem, allItems, metrics } = filters;
        
        if (!allItems && !selectedItem) {
             alert("لطفاً یک آیتم را برای گزارش‌گیری انتخاب کنید.");
             setIsLoading(false);
             return;
        }

        const start = new Date(dateFilters.startDate);
        const end = new Date(dateFilters.endDate);
        end.setHours(23, 59, 59, 999);
        
        const filterByDate = (items: any[], dateKey: string) => items.filter(item => {
            const itemDate = new Date(item[dateKey]);
            return itemDate >= start && itemDate <= end;
        });

        setTimeout(() => {
            let report: GeneratedReport | null = null;
            const activeMetrics = reportOptions[section][basedOn].metrics;
            const headers = Object.keys(activeMetrics).filter(key => metrics[key]).map(key => activeMetrics[key]);
            headers.unshift("نام"); // Add the entity name header
            
            // --- SALES REPORTS ---
            if (section === 'فروش') {
                const relevantOrders = filterByDate(orders, 'orderDate').filter(o => o.type === 'sale');
                
                if (basedOn === 'فروش بر اساس محصول') {
                    const productSales = new Map<number, any>();
                    relevantOrders.forEach(order => order.items.forEach(item => {
                        if (!allItems && selectedItem?.id !== item.drugId) return;
                        const existing = productSales.get(item.drugId) || { name: item.drugName, qty: 0, bonus: 0, revenue: 0, profit: 0 };
                        const itemRevenue = item.finalPrice * item.quantity;
                        const itemCogs = (item.batchAllocations || []).reduce((sum, alloc) => sum + (alloc.quantity * alloc.purchasePrice), 0);
                        existing.qty += item.quantity;
                        existing.bonus += item.bonusQuantity || 0;
                        existing.revenue += itemRevenue;
                        existing.profit += (itemRevenue - itemCogs);
                        productSales.set(item.drugId, existing);
                    }));
                    const rows = Array.from(productSales.values()).map(p => {
                        const row: (string | number)[] = [p.name];
                        if (metrics.qty) row.push(p.qty);
                        if (metrics.bonus) row.push(p.bonus);
                        if (metrics.revenue) row.push(p.revenue);
                        if (metrics.profit) row.push(p.profit);
                        return row;
                    });
                    report = { title: `گزارش فروش بر اساس محصول`, headers, rows };
                } else if (basedOn === 'فروش بر اساس مشتری') {
                    const customerSales = new Map<string, any>();
                     relevantOrders.forEach(order => {
                        if (!allItems && selectedItem?.name !== order.customerName) return;
                        const existing = customerSales.get(order.customerName) || { name: order.customerName, invoices: 0, sales: 0, profit: 0 };
                        const orderRevenue = order.items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
                        const orderCogs = order.items.reduce((sum, item) => sum + (item.batchAllocations || []).reduce((s, a) => s + a.quantity * a.purchasePrice, 0), 0);
                        existing.invoices += 1;
                        existing.sales += orderRevenue + order.extraCharges.reduce((s, c) => s + c.amount, 0);
                        existing.profit += (orderRevenue - orderCogs);
                        customerSales.set(order.customerName, existing);
                    });
                    const rows = Array.from(customerSales.values()).map(c => {
                        const row: (string | number)[] = [c.name];
                        if(metrics.invoices) row.push(c.invoices);
                        if(metrics.sales) row.push(c.sales);
                        if(metrics.profit) row.push(c.profit);
                        return row;
                    });
                    report = { title: `گزارش فروش بر اساس مشتری`, headers, rows };
                }
            }
            // --- PURCHASE REPORTS ---
            else if (section === 'خرید') {
                 const relevantPurchases = filterByDate(purchaseBills, 'purchaseDate');
                if (basedOn === 'خرید بر اساس محصول') {
                    const productPurchases = new Map<number, any>();
                    relevantPurchases.forEach(bill => bill.items.forEach(item => {
                        if (!allItems && selectedItem?.id !== item.drugId) return;
                        const existing = productPurchases.get(item.drugId) || { name: item.drugName, qty: 0, bonus: 0, value: 0 };
                        existing.qty += item.quantity;
                        existing.bonus += item.bonusQuantity || 0;
                        existing.value += item.quantity * item.purchasePrice * (1 - (item.discountPercentage || 0) / 100);
                        productPurchases.set(item.drugId, existing);
                    }));
                    const rows = Array.from(productPurchases.values()).map(p => {
                        const row: (string | number)[] = [p.name];
                        if(metrics.qty) row.push(p.qty);
                        if(metrics.bonus) row.push(p.bonus);
                        if(metrics.value) row.push(p.value);
                        return row;
                    });
                    report = { title: `گزارش خرید بر اساس محصول`, headers, rows };
                } else if (basedOn === 'خرید بر اساس شرکت') {
                    const supplierPurchases = new Map<string, any>();
                    relevantPurchases.forEach(bill => {
                         if (!allItems && selectedItem?.name !== bill.supplierName) return;
                         const existing = supplierPurchases.get(bill.supplierName) || { name: bill.supplierName, bills: 0, value: 0 };
                         existing.bills += 1;
                         existing.value += bill.totalAmount;
                         supplierPurchases.set(bill.supplierName, existing);
                    });
                    const rows = Array.from(supplierPurchases.values()).map(s => {
                         const row: (string | number)[] = [s.name];
                         if(metrics.bills) row.push(s.bills);
                         if(metrics.value) row.push(s.value);
                         return row;
                    });
                    report = { title: `گزارش خرید بر اساس شرکت`, headers, rows };
                }
            }
            // --- INVENTORY REPORTS ---
            else if (section === 'انبار') {
                if (basedOn === 'خلاصه موجودی انبار') {
                    const inventoryMap = new Map<number, any>();
                    const processDrugs = (drugList: Drug[], location: 'main' | 'sales') => {
                        drugList.forEach(drug => {
                            if (!allItems && selectedItem?.id !== drug.id) return;
                            const existing = inventoryMap.get(drug.id) || { name: drug.name, main: 0, sales: 0, total: 0, value: 0 };
                            const qty = drug.batches.reduce((s, b) => s + b.quantity, 0);
                            const val = drug.batches.reduce((s, b) => s + b.quantity * b.purchasePrice, 0);
                            if (location === 'main') existing.main += qty; else existing.sales += qty;
                            existing.total += qty;
                            existing.value += val;
                            inventoryMap.set(drug.id, existing);
                        });
                    };
                    processDrugs(mainWarehouseDrugs, 'main');
                    processDrugs(drugs, 'sales');
                    const rows = Array.from(inventoryMap.values()).map(d => {
                         const row: (string | number)[] = [d.name];
                         if(metrics.main) row.push(d.main);
                         if(metrics.sales) row.push(d.sales);
                         if(metrics.total) row.push(d.total);
                         if(metrics.value) row.push(d.value);
                         return row;
                    });
                    report = { title: 'گزارش خلاصه موجودی انبار', headers, rows };
                }
            }

            onGenerated(report);
            setIsLoading(false);
        }, 500);
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => { if (searchRef.current && !searchRef.current.contains(event.target)) setSuggestions([]); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentMetrics = reportOptions[filters.section]?.[filters.basedOn]?.metrics || {};

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label className="block text-sm font-bold mb-1">۱. حوزه گزارش</label>
                    <select value={filters.section} onChange={(e) => handleFilterChange('section', e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                        {Object.keys(reportOptions).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-bold mb-1">۲. دیدگاه گزارش</label>
                    <select value={filters.basedOn} onChange={(e) => handleFilterChange('basedOn', e.target.value)} className="w-full p-2 border rounded-lg bg-white" disabled={!filters.section}>
                        {(Object.keys(reportOptions[filters.section] || {})).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>
             <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                <h4 className="text-sm font-bold">۳. انتخاب معیارها (ستون‌های گزارش)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(currentMetrics).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-200">
                            <input type="checkbox" checked={filters.metrics[key] || false} onChange={() => handleMetricChange(key)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                            <span className="text-sm">{label as React.ReactNode}</span>
                        </label>
                    ))}
                </div>
            </div>
             <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                 <h4 className="text-sm font-bold">۴. فیلتر کردن (اختیاری)</h4>
                 <div className="relative" ref={searchRef}>
                    <input type="text" value={filters.searchTerm} onChange={handleSearch} className="w-full p-2 border rounded-lg" disabled={filters.allItems} placeholder={filters.allItems ? 'همه موارد انتخاب شده' : 'برای جستجو و فیلتر کردن تایپ کنید...'} />
                    <div className="flex items-center gap-2 mt-2 text-sm">
                        <input type="checkbox" id="all-items-checkbox" checked={filters.allItems} onChange={e => handleFilterChange('allItems', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/>
                        <label htmlFor="all-items-checkbox" className="text-gray-700">انتخاب همه موارد</label>
                    </div>
                    {suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-white border shadow-lg mt-1 max-h-48 overflow-y-auto">
                            {suggestions.map(item => (
                                <div key={item.id} onClick={() => handleSelectSuggestion(item)} className="p-2 hover:bg-teal-50 cursor-pointer">{item.name}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
             <div className="flex justify-end items-center pt-2">
                <button onClick={handleGenerateReport} disabled={isLoading} className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 shadow-md disabled:bg-teal-300 disabled:cursor-not-allowed">
                    {isLoading ? 'در حال ایجاد...' : 'ایجاد گزارش'}
                </button>
            </div>
        </div>
    );
};

// --- New Stock Ledger View ---
const StockLedgerView = ({ allDrugs, orders, purchaseBills, inventoryWriteOffs, dateFilters, selectedDrug, setSelectedDrug }: { allDrugs: Drug[], orders: Order[], purchaseBills: PurchaseBill[], inventoryWriteOffs: InventoryWriteOff[], dateFilters: { startDate: string, endDate: string }, selectedDrug: Drug | null, setSelectedDrug: (drug: Drug | null) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredDrugs = useMemo(() => {
        if (!searchTerm) return [];
        return allDrugs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 10);
    }, [searchTerm, allDrugs]);

    const handleViewLedger = (drug: Drug) => {
        setSearchTerm('');
        setSelectedDrug(drug);
    };
    
    const ledgerData = useMemo(() => {
        if (!selectedDrug) return null;

        const drugId = selectedDrug.id;
        let allTransactions: any[] = [];

        purchaseBills.forEach(bill => {
            if (bill.type !== 'purchase') return;
            bill.items.forEach(item => {
                if (item.drugId === drugId) {
                    allTransactions.push({ date: bill.purchaseDate, type: 'خرید', doc: bill.billNumber, lot: item.lotNumber, inQty: item.quantity + (item.bonusQuantity || 0), outQty: 0, unitCost: item.purchasePrice });
                }
            });
        });
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.drugId === drugId && item.batchAllocations) {
                    item.batchAllocations.forEach(alloc => {
                        const isReturn = order.type === 'sale_return';
                        allTransactions.push({ date: order.orderDate, type: isReturn ? 'برگشت فروش' : 'فروش', doc: order.orderNumber, lot: alloc.lotNumber, inQty: isReturn ? alloc.quantity : 0, outQty: isReturn ? 0 : alloc.quantity, unitCost: alloc.purchasePrice });
                    });
                }
            });
        });
        inventoryWriteOffs.forEach(wo => {
            if (wo.drugId === drugId) {
                allTransactions.push({ date: wo.date, type: `ضایعات (${wo.reason})`, doc: `ض-${wo.id}`, lot: wo.lotNumber, inQty: 0, outQty: wo.quantity, unitCost: wo.costAtTime });
            }
        });
        
        allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // 1. Calculate Opening Balance
        let openingQty = 0;
        let openingValue = 0;
        const start = new Date(dateFilters.startDate);

        allTransactions.forEach(t => {
            if (new Date(t.date) < start) {
                const qtyChange = t.inQty - t.outQty;
                openingQty += qtyChange;
                openingValue += qtyChange * t.unitCost;
            }
        });

        // 2. Process Period Transactions
        const end = new Date(dateFilters.endDate);
        end.setHours(23, 59, 59, 999);
        const periodTransactions = allTransactions.filter(t => { const tDate = new Date(t.date); return tDate >= start && tDate <= end; });

        let runningQty = openingQty;
        let runningValue = openingValue;
        let totalIn = 0;
        let totalOut = 0;

        const processedRows = periodTransactions.map(t => {
            const qtyChange = t.inQty - t.outQty;
            const valueChange = qtyChange * t.unitCost;
            runningQty += qtyChange;
            runningValue += valueChange;
            totalIn += t.inQty;
            totalOut += t.outQty;
            return { ...t, transactionValue: valueChange, runningQty, runningValue };
        });

        const kpis = { openingQty, openingValue, totalIn, totalOut, closingQty: runningQty, closingValue: runningValue };

        return { drugName: selectedDrug.name, rows: processedRows, kpis };
    }, [selectedDrug, purchaseBills, orders, inventoryWriteOffs, dateFilters]);

    const getRowStyle = (type: string) => {
        if (['خرید', 'برگشت فروش'].includes(type)) return 'bg-green-50';
        if (['فروش', 'ضایعات'].some(t => type.startsWith(t))) return 'bg-red-50';
        return '';
    };

    const LedgerKpiCard = ({ title, qty, value, color }) => (
        <div className={`bg-${color}-50 p-4 rounded-lg text-center border border-${color}-200`}>
            <p className={`text-sm text-${color}-800 font-semibold`}>{title}</p>
            <p className={`text-xl font-bold text-${color}-900`}>{qty.toLocaleString()}</p>
            <p className="text-xs text-gray-600 font-mono">{Math.round(value).toLocaleString()} افغانی</p>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-gray-800">کاردکس کالا (Stock Ledger)</h3>
            <p className="text-sm text-gray-500">تاریخچه کامل ورود، خروج، و ارزش‌گذاری هر کالا را مشاهده کنید. برای شروع، نام محصول مورد نظر را جستجو کنید.</p>
            <div className="relative max-w-lg">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="جستجوی محصول..." className="w-full p-2 border rounded-lg" />
                 {filteredDrugs.length > 0 && searchTerm && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-white border shadow-lg mt-1">
                        {filteredDrugs.map(drug => (
                            <div key={drug.id} onClick={() => handleViewLedger(drug)} className="p-2 hover:bg-teal-50 cursor-pointer">{drug.name}</div>
                        ))}
                    </div>
                )}
            </div>
            {ledgerData && (
                <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-bold">کاردکس برای: <span className="text-teal-600">{ledgerData.drugName}</span></h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <LedgerKpiCard title="موجودی اولیه" qty={ledgerData.kpis.openingQty} value={ledgerData.kpis.openingValue} color="blue" />
                        <LedgerKpiCard title="مجموع ورودی" qty={ledgerData.kpis.totalIn} value={0} color="green" />
                        <LedgerKpiCard title="مجموع خروجی" qty={ledgerData.kpis.totalOut} value={0} color="red" />
                        <LedgerKpiCard title="مانده نهایی" qty={ledgerData.kpis.closingQty} value={ledgerData.kpis.closingValue} color="gray" />
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm text-right">
                             <thead className="bg-gray-100 sticky top-0"><tr>
                                <th className="p-2">تاریخ</th><th className="p-2">نوع</th><th className="p-2">سند</th>
                                <th className="p-2">لات</th><th className="p-2">ورودی</th><th className="p-2">خروجی</th>
                                <th className="p-2">مانده (تعداد)</th><th className="p-2">نرخ واحد</th><th className="p-2">ارزش تراکنش</th>
                                <th className="p-2">مانده (ارزش)</th>
                            </tr></thead>
                             <tbody className="divide-y divide-gray-200">
                                <tr className="font-bold bg-gray-100">
                                    <td className="p-2" colSpan={6}>{new Date(dateFilters.startDate).toLocaleDateString('fa-IR')} - موجودی اولیه</td>
                                    <td className="p-2">{ledgerData.kpis.openingQty.toLocaleString()}</td>
                                    <td className="p-2">-</td>
                                    <td className="p-2">-</td>
                                    <td className="p-2 font-mono">{Math.round(ledgerData.kpis.openingValue).toLocaleString()}</td>
                                </tr>
                                {ledgerData.rows.map((t, i) => (
                                <tr key={i} className={getRowStyle(t.type)}>
                                    <td className="p-2 whitespace-nowrap">{new Date(t.date).toLocaleDateString('fa-IR')}</td>
                                    <td className="p-2">{t.type}</td><td className="p-2">{t.doc}</td>
                                    <td className="p-2 font-mono text-xs">{t.lot}</td>
                                    <td className="p-2 text-green-600">{t.inQty > 0 ? t.inQty.toLocaleString() : '-'}</td>
                                    <td className="p-2 text-red-600">{t.outQty > 0 ? t.outQty.toLocaleString() : '-'}</td>
                                    <td className="p-2 font-semibold">{t.runningQty.toLocaleString()}</td>
                                    <td className="p-2 font-mono">{Math.round(t.unitCost).toLocaleString()}</td>
                                    <td className={`p-2 font-mono ${t.transactionValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.round(t.transactionValue).toLocaleString()}</td>
                                    <td className="p-2 font-semibold font-mono">{Math.round(t.runningValue).toLocaleString()}</td>
                                </tr>
                                ))}
                             </tbody>
                             <tfoot className="bg-gray-100 font-bold sticky bottom-0">
                                <tr>
                                    <td className="p-2 text-right" colSpan={4}>جمع کل دوره</td>
                                    <td className="p-2 text-green-700">{ledgerData.kpis.totalIn.toLocaleString()}</td>
                                    <td className="p-2 text-red-700">{ledgerData.kpis.totalOut.toLocaleString()}</td>
                                    <td className="p-2" colSpan={4}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
             {!selectedDrug && (
                <div className="text-center p-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">برای مشاهده کاردکس، لطفاً یک محصول را از کادر جستجوی بالا انتخاب کنید.</p>
                </div>
             )}
        </div>
    );
};

// --- New Stock Ledger Print View Component ---
const StockLedgerPrintView = ({ reportData, companyInfo, documentSettings, className, style }: {
    reportData: any;
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
    className?: string;
    style?: React.CSSProperties;
}) => {
    if (!reportData) return null;
    const { title, dateRange, headers, rows, kpis } = reportData;

    return (
        <div className={className} style={style}>
            <header className="print-header">
                <div className="print-company-info">
                    <h1 className="text-3xl font-bold text-gray-800 print-title">{companyInfo.name}</h1>
                </div>
                {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="print-logo" />}
            </header>
            <div className="text-center my-8">
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-sm text-gray-500 mt-2">{dateRange}</p>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-sm mb-8 page-break-inside-avoid">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                    <p className="font-semibold text-blue-800">موجودی اولیه</p>
                    <p className="font-bold text-blue-900">{kpis.openingQty.toLocaleString()}</p>
                    <p className="text-xs font-mono">{Math.round(kpis.openingValue).toLocaleString()} افغانی</p>
                </div>
                 <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                    <p className="font-semibold text-green-800">مجموع ورودی</p>
                    <p className="font-bold text-green-900">{kpis.totalIn.toLocaleString()}</p>
                </div>
                 <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                    <p className="font-semibold text-red-800">مجموع خروجی</p>
                    <p className="font-bold text-red-900">{kpis.totalOut.toLocaleString()}</p>
                </div>
                 <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-center">
                    <p className="font-semibold text-gray-800">مانده نهایی</p>
                    <p className="font-bold text-gray-900">{kpis.closingQty.toLocaleString()}</p>
                    <p className="text-xs font-mono">{Math.round(kpis.closingValue).toLocaleString()} افغانی</p>
                </div>
            </div>

            <table className="w-full text-right text-xs">
                <thead>
                    <tr>{headers.map(h => <th key={h} className="p-2">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {row.map((cell, cellIndex) => 
                                <td key={cellIndex} className="p-2">{cellIndex > 3 ? (typeof cell === 'number' ? cell.toLocaleString() : cell) : cell}</td>
                            )}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td className="p-2" colSpan={4}>جمع کل دوره</td>
                        <td className="p-2 text-green-700">{kpis.totalIn.toLocaleString()}</td>
                        <td className="p-2 text-red-700">{kpis.totalOut.toLocaleString()}</td>
                        <td className="p-2" colSpan={4}></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
type ReportsProps = {
    orders: Order[];
    drugs: Drug[];
    mainWarehouseDrugs: Drug[];
    customers: Customer[];
    suppliers: Supplier[];
    purchaseBills: PurchaseBill[];
    inventoryWriteOffs: InventoryWriteOff[];
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
    lotNumberToTrace: string | null;
};

const Reports: React.FC<ReportsProps> = ({ orders, drugs, mainWarehouseDrugs, customers, suppliers, purchaseBills, inventoryWriteOffs, companyInfo, documentSettings, lotNumberToTrace }) => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [activeTab, setActiveTab] = useState<ReportTab>('report_builder');
    const [filters, setFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
    });
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [printData, setPrintData] = useState<any>(null); // For generic print data
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
    const [selectedDrugForKardex, setSelectedDrugForKardex] = useState<Drug | null>(null);
    
    const allDrugs = useMemo(() => {
        const drugMap = new Map<number, Drug>();
        [...drugs, ...mainWarehouseDrugs].forEach(d => {
            const { batches, ...baseInfo } = d; // We only need base info for the search list
            if (!drugMap.has(d.id)) {
                drugMap.set(d.id, { ...baseInfo, batches: [] }); 
            }
        });
        return Array.from(drugMap.values());
    }, [drugs, mainWarehouseDrugs]);

    useEffect(() => {
        if(lotNumberToTrace) {
            setActiveTab('batch_traceability');
        }
    }, [lotNumberToTrace]);

     useEffect(() => {
        if (activeTab !== 'report_builder') {
            setGeneratedReport(null);
        }
        if (activeTab !== 'stock_ledger') {
            setSelectedDrugForKardex(null);
        }
    }, [activeTab]);


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
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [exportMenuRef]);

    const getReportDataForExport = (tab: ReportTab) => {
        if (tab === 'report_builder' && generatedReport) {
            return {
                ...generatedReport,
                dateRange: `از ${new Date(filters.startDate).toLocaleDateString('fa-IR')} تا ${new Date(filters.endDate).toLocaleDateString('fa-IR')}`
            };
        }
        
        const { sales, purchases, wastedStock } = filteredData;
        const dateRange = `از ${new Date(filters.startDate).toLocaleDateString('fa-IR')} تا ${new Date(filters.endDate).toLocaleDateString('fa-IR')}`;
        
        switch (tab) {
            case 'stock_ledger': {
                if (!selectedDrugForKardex) return null;

                const ledgerData = ((): { drugName: string, rows: any[], kpis: any } | null => {
                    const drugId = selectedDrugForKardex.id;
                    let allTransactions: any[] = [];
                    purchaseBills.forEach(bill => { if (bill.type !== 'purchase') return; bill.items.forEach(item => { if (item.drugId === drugId) allTransactions.push({ date: bill.purchaseDate, type: 'خرید', doc: bill.billNumber, lot: item.lotNumber, inQty: item.quantity + (item.bonusQuantity || 0), outQty: 0, unitCost: item.purchasePrice }); }); });
                    orders.forEach(order => { order.items.forEach(item => { if (item.drugId === drugId && item.batchAllocations) { item.batchAllocations.forEach(alloc => { const isReturn = order.type === 'sale_return'; allTransactions.push({ date: order.orderDate, type: isReturn ? 'برگشت فروش' : 'فروش', doc: order.orderNumber, lot: alloc.lotNumber, inQty: isReturn ? alloc.quantity : 0, outQty: isReturn ? 0 : alloc.quantity, unitCost: alloc.purchasePrice }); }); } }); });
                    inventoryWriteOffs.forEach(wo => { if (wo.drugId === drugId) allTransactions.push({ date: wo.date, type: `ضایعات (${wo.reason})`, doc: `ض-${wo.id}`, lot: wo.lotNumber, inQty: 0, outQty: wo.quantity, unitCost: wo.costAtTime }); });
                    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    let openingQty = 0; let openingValue = 0; const start = new Date(filters.startDate);
                    allTransactions.forEach(t => { if (new Date(t.date) < start) { const qtyChange = t.inQty - t.outQty; openingQty += qtyChange; openingValue += qtyChange * t.unitCost; } });
                    const end = new Date(filters.endDate); end.setHours(23, 59, 59, 999);
                    const periodTransactions = allTransactions.filter(t => { const tDate = new Date(t.date); return tDate >= start && tDate <= end; });
                    let runningQty = openingQty; let runningValue = openingValue; let totalIn = 0; let totalOut = 0;
                    const processedRows = periodTransactions.map(t => { const qtyChange = t.inQty - t.outQty; const valueChange = qtyChange * t.unitCost; runningQty += qtyChange; runningValue += valueChange; totalIn += t.inQty; totalOut += t.outQty; return { ...t, transactionValue: valueChange, runningQty, runningValue }; });
                    const kpis = { openingQty, openingValue, totalIn, totalOut, closingQty: runningQty, closingValue: runningValue };
                    return { drugName: selectedDrugForKardex.name, rows: processedRows, kpis };
                })();

                if (!ledgerData) return null;
                
                const headers = ['تاریخ', 'نوع', 'سند', 'لات', 'ورودی', 'خروجی', 'مانده (تعداد)', 'نرخ واحد', 'ارزش تراکنش', 'مانده (ارزش)'];
                const rows = [
                    ['موجودی اولیه در تاریخ ' + new Date(filters.startDate).toLocaleDateString('fa-IR'), '', '', '', '', '', ledgerData.kpis.openingQty, '-', '-', Math.round(ledgerData.kpis.openingValue)],
                    ...ledgerData.rows.map(t => [ new Date(t.date).toLocaleDateString('fa-IR'), t.type, t.doc, t.lot, t.inQty || '-', t.outQty || '-', t.runningQty, Math.round(t.unitCost), Math.round(t.transactionValue), Math.round(t.runningValue) ])
                ];

                return { title: `کاردکس کالا - ${selectedDrugForKardex.name}`, dateRange, headers, rows, kpis: ledgerData.kpis };
            }
            case 'inventory': {
                const headers = ['نام محصول', 'تعداد موجود', 'قیمت خرید (میانگین)', 'ارزش کل'];
                const processDrugs = (drugList: Drug[]) => {
                    return drugList.map(d => {
                        const totalQuantity = d.batches.reduce((sum, b) => sum + b.quantity, 0);
                        const totalValue = d.batches.reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);
                        const avgPurchasePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                        return [d.name, formatQuantity(totalQuantity, d.unitsPerCarton), avgPurchasePrice, totalValue];
                    });
                };
                const salesData = processDrugs(drugs);
                const mainData = processDrugs(mainWarehouseDrugs);
                
                return {
                    title: 'گزارش موجودی انبارها',
                    dateRange: `تا تاریخ ${new Date(filters.endDate).toLocaleDateString('fa-IR')}`,
                    headers, 
                    rows: [...salesData, ...mainData], // Dummy rows to pass the check
                    printData: {
                        sales: { headers, rows: salesData },
                        main: { headers, rows: mainData }
                    }
                };
            }
            case 'profitability': {
                 const profitItems = sales.filter(o => o.type === 'sale').flatMap(o => o.items).reduce((acc, item) => {
                    const itemRevenue = item.finalPrice * item.quantity;
                    const itemCogs = (item.batchAllocations || []).reduce((sum, alloc) => sum + (alloc.quantity * alloc.purchasePrice), 0);
                    const itemProfit = itemRevenue - itemCogs;
                    
                    const existing = acc.find(i => i.name === item.drugName);
                    if (existing) {
                        existing.qty += item.quantity + (item.bonusQuantity || 0);
                        existing.revenue += itemRevenue;
                        existing.cogs += itemCogs;
                        existing.profit += itemProfit;
                    } else {
                        acc.push({ name: item.drugName, qty: item.quantity + (item.bonusQuantity || 0), revenue: itemRevenue, cogs: itemCogs, profit: itemProfit });
                    }
                    return acc;
                }, [] as { name: string, qty: number, revenue: number, cogs: number, profit: number }[]);

                return {
                    title: 'گزارش سودآوری',
                    dateRange,
                    headers: ['نام محصول', 'تعداد فروش (با بونس)', 'مجموع درآمد', 'مجموع هزینه', 'سود کل'],
                    rows: profitItems.sort((a,b) => b.profit - a.profit).map(i => [i.name, i.qty, i.revenue, i.cogs, i.profit]),
                };
            }
            case 'sales': {
                const summary = Object.entries(sales.reduce((acc, order) => {
                    if (!acc[order.customerName]) acc[order.customerName] = { totalAmount: 0, amountPaid: 0 };
                    acc[order.customerName].totalAmount += Number(order.totalAmount);
                    acc[order.customerName].amountPaid += Number(order.amountPaid);
                    return acc;
                }, {} as { [key: string]: { totalAmount: number; amountPaid: number } })).map(([name, values]) => ({ name, ...values, balance: values.totalAmount - values.amountPaid }));

                return {
                    title: 'خلاصه فروش',
                    dateRange,
                    headers: ['نام مشتری', 'مجموع فروش', 'مجموع دریافتی', 'مانده حساب'],
                    rows: summary.sort((a,b) => b.totalAmount - a.totalAmount).map(s => [s.name, s.totalAmount, s.amountPaid, s.balance]),
                };
            }
            case 'purchases': {
                 const summary = Object.entries(purchases.reduce((acc, bill) => {
                    if (!acc[bill.supplierName]) acc[bill.supplierName] = { totalAmount: 0, amountPaid: 0 };
                    acc[bill.supplierName].totalAmount += Number(bill.totalAmount);
                    acc[bill.supplierName].amountPaid += Number(bill.amountPaid);
                    return acc;
                }, {} as { [key: string]: { totalAmount: number; amountPaid: number } })).map(([name, values]) => ({ name, ...values, balance: values.totalAmount - values.amountPaid }));
                 return {
                    title: 'خلاصه خرید',
                    dateRange,
                    headers: ['نام شرکت', 'مجموع خرید', 'مجموع پرداختی', 'مانده حساب'],
                    rows: summary.sort((a,b) => b.totalAmount - a.totalAmount).map(s => [s.name, s.totalAmount, s.amountPaid, s.balance]),
                };
            }
            case 'sales_returns': {
                const returnOrders = sales.filter(o => o.type === 'sale_return');
                const rows = returnOrders.map(order => {
                    const itemsRevenue = Math.abs(order.items.reduce((sum, item) => {
                        return sum + (item.quantity * item.finalPrice);
                    }, 0));
                    const cogs = order.items.reduce((sum, item) => sum + (item.batchAllocations || []).reduce((cogsSum, alloc) => cogsSum + (alloc.quantity * alloc.purchasePrice), 0), 0);
                    const profitLoss = itemsRevenue - cogs;
                    return [
                        new Date(order.orderDate).toLocaleDateString('fa-IR'),
                        order.orderNumber,
                        order.customerName,
                        Math.abs(order.totalAmount),
                        -profitLoss // Show loss as a positive number
                    ];
                });
                return {
                    title: 'گزارش مستردی‌های فروش',
                    dateRange,
                    headers: ['تاریخ', 'شماره فاکتور', 'مشتری', 'مبلغ کل مستردی', 'زیان سود'],
                    rows,
                };
            }
            default:
                return { title: `گزارش ${activeTab}`, dateRange, headers: [], rows: [] };
        }
    };
    
    const handleExcelExport = () => {
        const reportData = getReportDataForExport(activeTab);
        if (!reportData || !reportData.rows || reportData.rows.length === 0) {
            alert("داده‌ای برای خروجی گرفتن وجود ندارد.");
            return;
        }
        const { title, headers, rows } = reportData;
    
        const wb = XLSX.utils.book_new();
        let finalRows;
    
        if (activeTab === 'inventory') {
            // FIX: Cast reportData to 'any' to access the 'printData' property.
            // The type of reportData is a union, and TypeScript cannot infer that 'printData'
            // is available specifically when activeTab is 'inventory'. The logic ensures it is.
            const { printData } = reportData as any;
            finalRows = [
                ['انبار فروش'],
                printData.sales.headers,
                ...printData.sales.rows,
                [],
                ['انبار اصلی'],
                printData.main.headers,
                ...printData.main.rows
            ];
        } else if (activeTab === 'stock_ledger') {
            const { kpis } = reportData;
            finalRows = [headers, ...rows];
            finalRows.push([]); // Spacer
            finalRows.push(['', 'جمع کل دوره', '', '', kpis.totalIn, kpis.totalOut]);
        } else {
            finalRows = [headers, ...rows];
        }
    
        const ws = XLSX.utils.aoa_to_sheet(finalRows);
        XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 30));
        XLSX.writeFile(wb, `${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsExportMenuOpen(false);
    };

    const handlePrintRequest = () => {
        const data = getReportDataForExport(activeTab);
         if (!data || (activeTab !== 'stock_ledger' && (!data.rows || data.rows.length === 0))) {
            alert("داده‌ای برای چاپ وجود ندارد.");
            return;
        }
        setPrintData(data);
        setIsPrintPreviewOpen(true);
        setIsExportMenuOpen(false);
    };

    const handleTraceabilityPrint = (data: any) => {
        setPrintData(data);
        setIsPrintPreviewOpen(true);
    };
    
    const handleQuickFilter = (period: 'today' | 'week' | 'month' | 'last_month') => {
        const end = new Date();
        let start = new Date();
        
        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(end.getDate() - 6);
                break;
            case 'month':
                start.setDate(1);
                break;
            case 'last_month':
                start.setMonth(start.getMonth() - 1, 1);
                end.setDate(0);
                break;
        }
        
        setFilters({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        });
    };
    
    const ReportTabButton = ({ tabId, children, icon }: { tabId: ReportTab, children: React.ReactNode, icon: React.ReactNode }) => (
        <button 
            onClick={() => setActiveTab(tabId)} 
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors text-sm ${activeTab === tabId ? 'bg-teal-600 text-white shadow' : 'text-gray-600 hover:bg-teal-50'}`}
        >
            {icon}
            {children}
        </button>
    );
    
    const renderPrintContent = () => {
        if (!printData) return null;
    
        if (activeTab === 'inventory') {
            const { title, dateRange, printData: inventoryPrintData } = printData;
            return (
                <ReportPrintView title={title} dateRange={dateRange} companyInfo={companyInfo} documentSettings={documentSettings}>
                    <h3 className="text-xl font-bold mt-6 mb-2">انبار فروش</h3>
                    <DataTable headers={inventoryPrintData.sales.headers} rows={inventoryPrintData.sales.rows} isNumeric={[false, false, true, true]} />
                    <h3 className="text-xl font-bold mt-8 mb-2 page-break-before-always">انبار اصلی</h3>
                    <DataTable headers={inventoryPrintData.main.headers} rows={inventoryPrintData.main.rows} isNumeric={[false, false, true, true]} />
                </ReportPrintView>
            );
        }
    
        if (activeTab === 'stock_ledger') {
             return <StockLedgerPrintView reportData={printData} companyInfo={companyInfo} documentSettings={documentSettings} />;
        }
        
        if (activeTab === 'batch_traceability' || printData.lotNumber) { // Check for traceability print
            const {lotNumber, result} = printData;
             return (
                <ReportPrintView title={`گزارش ردیابی لات: ${lotNumber}`} companyInfo={companyInfo} documentSettings={documentSettings}>
                     <div className="space-y-6 mt-4 text-sm">
                        <div className="border rounded-lg p-4 page-break-inside-avoid">
                            <h4 className="font-bold mb-2 text-md">۱. اطلاعات خرید</h4>
                            {result.purchaseInfo ? (
                                <ul className="list-disc list-inside space-y-1">
                                    <li>نام محصول: <strong>{result.purchaseInfo.drugName}</strong></li>
                                    <li>تامین کننده: <strong>{result.purchaseInfo.bill.supplierName}</strong></li>
                                    <li>تاریخ خرید: <strong>{new Date(result.purchaseInfo.bill.purchaseDate).toLocaleDateString('fa-IR')}</strong></li>
                                    <li>شماره فاکتور: <strong>{result.purchaseInfo.bill.billNumber}</strong></li>
                                </ul>
                            ) : <p>اطلاعات خریدی برای این لات یافت نشد.</p>}
                        </div>
                        <div className="border rounded-lg p-4 page-break-inside-avoid">
                            <h4 className="font-bold mb-2 text-md">۲. اطلاعات فروش</h4>
                            {result.salesInfo.length > 0 ? (
                                <DataTable headers={['تاریخ', 'فاکتور', 'مشتری', 'تعداد']} rows={result.salesInfo.map(s => [new Date(s.date).toLocaleDateString('fa-IR'), s.orderNumber, s.customer, s.quantitySold])} />
                            ) : <p>این لات هنوز فروخته نشده است.</p>}
                        </div>
                         <div className="border rounded-lg p-4 page-break-inside-avoid">
                            <h4 className="font-bold mb-2 text-md">۳. موجودی فعلی</h4>
                            {result.currentStock.length > 0 ? (
                                <DataTable headers={['نام محصول', 'موجودی', 'تاریخ انقضا']} rows={result.currentStock.map(s => [s.drugName, s.quantity, new Date(s.expiryDate).toLocaleDateString('fa-IR')])} />
                            ) : <p>هیچ موجودی از این لات در انبارها یافت نشد.</p>}
                        </div>
                    </div>
                </ReportPrintView>
             )
        }
        
        const { title, dateRange, headers, rows } = printData;
        return <ReportPrintView title={title} dateRange={dateRange} headers={headers} rows={rows} companyInfo={companyInfo} documentSettings={documentSettings} />;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-full space-y-6">
            <PrintPreviewModal
                isOpen={isPrintPreviewOpen}
                onClose={() => setIsPrintPreviewOpen(false)}
                documentSettings={documentSettings}
            >
                {renderPrintContent()}
            </PrintPreviewModal>

            <div>
                <h2 className="text-3xl font-bold text-gray-800">مرکز گزارشات</h2>
                <p className="text-gray-500 mt-1">تحلیل عملکرد کسب‌وکار با داشبوردهای هوشمند و گزارش‌ساز پیشرفته</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                     <div className="flex gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="w-full bg-gray-100 p-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="w-full bg-gray-100 p-2 border rounded-lg" />
                        </div>
                    </div>
                     <div className="flex gap-2 items-center pt-5">
                        <button onClick={() => handleQuickFilter('today')} className="px-3 py-1 text-sm bg-gray-200 rounded-full hover:bg-gray-300">امروز</button>
                        <button onClick={() => handleQuickFilter('week')} className="px-3 py-1 text-sm bg-gray-200 rounded-full hover:bg-gray-300">۷ روز اخیر</button>
                        <button onClick={() => handleQuickFilter('month')} className="px-3 py-1 text-sm bg-gray-200 rounded-full hover:bg-gray-300">این ماه</button>
                        <button onClick={() => handleQuickFilter('last_month')} className="px-3 py-1 text-sm bg-gray-200 rounded-full hover:bg-gray-300">ماه گذشته</button>
                     </div>
                </div>
                 <div className="relative" ref={exportMenuRef}>
                    <button onClick={() => setIsExportMenuOpen(prev => !prev)} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors text-sm bg-gray-600 text-white hover:bg-gray-700 shadow" disabled={activeTab === 'batch_traceability' || (activeTab === 'report_builder' && !generatedReport) || (activeTab === 'stock_ledger' && !selectedDrugForKardex)}>
                        <ExportIcon />
                        چاپ / خروجی
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <button onClick={handlePrintRequest} className="w-full text-right flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><PrintIcon /> چاپ / پیش‌نمایش</button>
                            <button onClick={handleExcelExport} className="w-full text-right flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><ExcelIcon /> دانلود Excel</button>
                        </div>
                    )}
                </div>
            </div>
            
             <div className="flex items-center gap-2 flex-wrap justify-center bg-white rounded-xl shadow-md p-2">
                <ReportTabButton tabId="report_builder" icon={<BuilderIcon />}>گزارش‌ساز پیشرفته</ReportTabButton>
                <ReportTabButton tabId="stock_ledger" icon={<InventoryIcon />}>کاردکس کالا</ReportTabButton>
                <ReportTabButton tabId="profitability" icon={<ProfitIcon />}>سودآوری</ReportTabButton>
                <ReportTabButton tabId="batch_traceability" icon={<TraceIcon />}>ردیابی بچ</ReportTabButton>
                <ReportTabButton tabId="inventory" icon={<InventoryIcon />}>گزارش انبارها</ReportTabButton>
                <ReportTabButton tabId="sales" icon={<SalesIcon />}>فروش</ReportTabButton>
                <ReportTabButton tabId="purchases" icon={<PurchaseIcon />}>خرید</ReportTabButton>
                <ReportTabButton tabId="sales_returns" icon={<ReturnReportIcon />}>مستردی‌ها</ReportTabButton>
                <ReportTabButton tabId="bonuses" icon={<GiftIcon />}>بونس‌ها</ReportTabButton>
                <ReportTabButton tabId="wasted_stock" icon={<WasteIcon />}>ضایعات</ReportTabButton>
            </div>

            <div className="transition-opacity duration-300">
                {activeTab === 'profitability' && <ProfitabilityView filteredSales={filteredData.sales} drugs={drugs} filteredWastedStock={filteredData.wastedStock} />}
                {activeTab === 'sales' && <SalesSummaryView filteredSales={filteredData.sales} />}
                {activeTab === 'purchases' && <PurchaseSummaryView filteredPurchases={filteredData.purchases} />}
                {activeTab === 'inventory' && <InventoryReportView salesWarehouseDrugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} />}
                {activeTab === 'sales_returns' && <SalesReturnView filteredSales={filteredData.sales} />}
                {activeTab === 'bonuses' && <BonusSummaryView filteredSales={filteredData.sales} drugs={drugs} />}
                {activeTab === 'wasted_stock' && <WastedStockView filteredWastedStock={filteredData.wastedStock} />}
                {activeTab === 'batch_traceability' && <BatchTraceabilityView orders={orders} purchaseBills={purchaseBills} drugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} onPrint={handleTraceabilityPrint} lotNumberToTrace={lotNumberToTrace} />}
                {activeTab === 'stock_ledger' && <StockLedgerView allDrugs={allDrugs} orders={orders} purchaseBills={purchaseBills} inventoryWriteOffs={inventoryWriteOffs} dateFilters={filters} selectedDrug={selectedDrugForKardex} setSelectedDrug={setSelectedDrugForKardex}/>}
                {activeTab === 'report_builder' && (
                     <div className="space-y-4">
                        <AdvancedReportBuilder 
                            orders={orders}
                            drugs={drugs}
                            mainWarehouseDrugs={mainWarehouseDrugs}
                            customers={customers}
                            suppliers={suppliers}
                            purchaseBills={purchaseBills}
                            inventoryWriteOffs={inventoryWriteOffs}
                            dateFilters={filters}
                            onGenerated={setGeneratedReport}
                        />
                        {generatedReport && (
                             <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                                <h3 className="text-xl font-bold text-gray-800">{generatedReport.title}</h3>
                                {generatedReport.summary && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {generatedReport.summary.map(item => (
                                            <div key={item.label} className="bg-gray-100 p-3 rounded-lg">
                                                <p className="text-sm text-gray-600">{item.label}</p>
                                                <p className="text-lg font-bold">{typeof item.value === 'number' ? Math.round(item.value).toLocaleString() : item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <DataTable headers={generatedReport.headers} rows={generatedReport.rows} isNumeric={generatedReport.isNumeric} />
                             </div>
                        )}
                     </div>
                )}
            </div>
        </div>
    );
};

export default Reports;