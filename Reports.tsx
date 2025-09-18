import React, { useState, useMemo, useEffect, useRef } from 'react';
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


//=========== TYPES ===========//
type ReportTab = 'profitability' | 'sales' | 'purchases' | 'inventory' | 'bonuses' | 'wasted_stock';

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
            totalRevenue += order.totalAmount;
            
            for (const item of order.items) {
                const drug = drugsMap.get(item.drugId);
                // FIX: Property 'purchasePrice' does not exist on type 'Drug'.
                // Calculate an average purchase price from the drug's batches as an approximation.
                // A better solution would use batchAllocations from the OrderItem, but that data seems unavailable.
                let purchasePrice = 0;
                if (drug && drug.batches.length > 0) {
                    const totalQuantityInStock = drug.batches.reduce((acc, b) => acc + b.quantity, 0);
                    const totalValueInStock = drug.batches.reduce((acc, b) => acc + (b.quantity * b.purchasePrice), 0);
                    purchasePrice = totalQuantityInStock > 0 ? totalValueInStock / totalQuantityInStock : 0;
                }
                
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

     const monthlyProfitData = useMemo(() => {
        const monthlyData: { [month: string]: { revenue: number, cogs: number } } = {};
        
        for (const order of filteredSales) {
            if (order.type !== 'sale') continue;
            const month = order.orderDate.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) monthlyData[month] = { revenue: 0, cogs: 0 };
            
            monthlyData[month].revenue += order.totalAmount;

            for (const item of order.items) {
                 const drug = drugsMap.get(item.drugId);
                 // FIX: Property 'purchasePrice' does not exist on type 'Drug'. Calculate average price.
                 let purchasePrice = 0;
                 if (drug && drug.batches.length > 0) {
                    const totalQuantityInStock = drug.batches.reduce((acc, b) => acc + b.quantity, 0);
                    const totalValueInStock = drug.batches.reduce((acc, b) => acc + (b.quantity * b.purchasePrice), 0);
                    purchasePrice = totalQuantityInStock > 0 ? totalValueInStock / totalQuantityInStock : 0;
                 }
                 monthlyData[month].cogs += purchasePrice * (item.quantity + item.bonusQuantity);
            }
        }
        
        const sortedMonths = Object.keys(monthlyData).sort();
        return {
            labels: sortedMonths.map(m => new Date(m + '-02').toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })),
            data: sortedMonths.map(m => monthlyData[m].revenue - monthlyData[m].cogs),
        };
    }, [filteredSales, drugsMap]);

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
                <KPICard title="مجموع درآمد" value={`${profitData.totalRevenue.toLocaleString()} افغانی`} icon={<SalesIcon />} colorClass="bg-green-100 text-green-600" />
                <KPICard title="هزینه کالای فروخته شده" value={`${profitData.totalCogs.toLocaleString()} افغانی`} icon={<PurchaseIcon />} colorClass="bg-red-100 text-red-600" />
                <KPICard title="هزینه کالاهای ضایع شده" value={`${profitData.totalWastedCost.toLocaleString()} افغانی`} icon={<WasteIcon />} colorClass="bg-yellow-100 text-yellow-600" />
                <KPICard title="سود ناخالص" value={`${profitData.grossProfit.toLocaleString()} افغانی`} icon={<ProfitIcon />} colorClass="bg-blue-100 text-blue-600" />
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md"><h3 className="font-bold mb-2">روند سودآوری ماهانه</h3><div className="relative h-72"><canvas ref={monthlyProfitChartRef}></canvas></div></div>
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
            // FIX: Property 'purchasePrice' does not exist on type 'Drug'. Calculate average price.
            let purchasePrice = 0;
            if (drug && drug.batches.length > 0) {
                const totalQuantityInStock = drug.batches.reduce((acc, b) => acc + b.quantity, 0);
                const totalValueInStock = drug.batches.reduce((acc, b) => acc + (b.quantity * b.purchasePrice), 0);
                purchasePrice = totalQuantityInStock > 0 ? totalValueInStock / totalQuantityInStock : 0;
            }
            const cost = purchasePrice * item.bonusQuantity;
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

const InventoryReportView = ({ salesWarehouseDrugs, mainWarehouseDrugs }: { salesWarehouseDrugs: Drug[], mainWarehouseDrugs: Drug[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const inventoryData = useMemo(() => {
        // FIX: Property 'quantity' and 'purchasePrice' does not exist on type 'Drug'.
        // Calculate value by iterating through batches for each drug.
        const calcValue = (drugs: Drug[]) => drugs.reduce((totalSum, drug) => 
            totalSum + drug.batches.reduce((drugSum, batch) => drugSum + (batch.quantity * batch.purchasePrice), 0)
        , 0);
        
        const salesValue = calcValue(salesWarehouseDrugs);
        const mainValue = calcValue(mainWarehouseDrugs);
        
        const now = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(now.getMonth() + 6);

        // FIX: Property 'expiryDate', 'quantity', 'purchasePrice' does not exist on type 'Drug'.
        // Flatten all batches, filter them by expiry date, then sum their values.
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
                <KPICard title="ارزش موجودی انبار فروش" value={`${inventoryData.salesValue.toLocaleString()} افغانی`} icon={<SalesIcon />} colorClass="bg-cyan-100 text-cyan-600" />
                <KPICard title="ارزش موجودی انبار اصلی" value={`${inventoryData.mainValue.toLocaleString()} افغانی`} icon={<InventoryIcon />} colorClass="bg-blue-100 text-blue-600" />
                <KPICard title="ارزش کل موجودی" value={`${inventoryData.totalValue.toLocaleString()} افغانی`} icon={<ProfitIcon />} colorClass="bg-indigo-100 text-indigo-600" />
                <KPICard title="ارزش موجودی نزدیک به انقضا" value={`${inventoryData.expiringValue.toLocaleString()} افغانی`} icon={<WasteIcon />} colorClass="bg-yellow-100 text-yellow-600" />
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md">
                 <h3 className="font-bold mb-4">گزارش تفصیلی انبارها</h3>
                 <input type="text" placeholder="جستجوی محصول..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-sm p-2 border rounded-lg mb-4"/>
                 <div className="space-y-4">
                    <details open className="border rounded-lg">
                        <summary className="p-4 font-bold cursor-pointer bg-gray-50">انبار فروش</summary>
                         <DataTable
                            headers={['نام محصول', 'تعداد موجود', 'قیمت خرید', 'ارزش کل']}
                            // FIX: Property 'quantity' and 'purchasePrice' does not exist on type 'Drug'.
                            // Aggregate data from batches for each drug.
                            rows={filterDrugs(salesWarehouseDrugs).map(d => {
                                const totalQuantity = d.batches.reduce((sum, b) => sum + b.quantity, 0);
                                const totalValue = d.batches.reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);
                                const avgPurchasePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                                return [d.name, formatQuantity(totalQuantity, d.unitsPerCarton), avgPurchasePrice.toFixed(2), totalValue];
                            })}
                            isNumeric={[false, false, true, true]}
                        />
                    </details>
                     <details className="border rounded-lg">
                        <summary className="p-4 font-bold cursor-pointer bg-gray-50">انبار اصلی</summary>
                         <DataTable
                            headers={['نام محصول', 'تعداد موجود', 'قیمت خرید', 'ارزش کل']}
                            // FIX: Property 'quantity' and 'purchasePrice' does not exist on type 'Drug'.
                            // Aggregate data from batches for each drug.
                            rows={filterDrugs(mainWarehouseDrugs).map(d => {
                                const totalQuantity = d.batches.reduce((sum, b) => sum + b.quantity, 0);
                                const totalValue = d.batches.reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);
                                const avgPurchasePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                                return [d.name, formatQuantity(totalQuantity, d.unitsPerCarton), avgPurchasePrice.toFixed(2), totalValue];
                            })}
                            isNumeric={[false, false, true, true]}
                        />
                    </details>
                 </div>
            </div>
        </div>
    );
};

// --- New Printable Report Component ---
const ReportPrintView = ({ title, dateRange, headers, rows, companyInfo, documentSettings, className, style }: { title: string, dateRange: string, headers: string[], rows: (string|number)[][], companyInfo: CompanyInfo, documentSettings: DocumentSettings, className?: string, style?: React.CSSProperties }) => {
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
            <table className="w-full text-right text-sm">
                <thead>
                    <tr>{headers.map(h => <th key={h} className="p-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => 
                                <td key={cellIndex} className="p-2">
                                    {typeof cell === 'number' ? cell.toLocaleString() : cell}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
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
                    {/* FIX: Cast the style object to React.CSSProperties to allow for CSS custom properties. */}
                    {React.cloneElement(children as React.ReactElement<{ className?: string, style?: React.CSSProperties }>, {
                        className: `p-10 template-${selectedTemplate} layout-logo-${documentSettings.logoPosition}`,
                        style: { '--accent-color': documentSettings.accentColor } as React.CSSProperties
                    })}
                </div>
            </div>
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
};

const Reports: React.FC<ReportsProps> = ({ orders, drugs, mainWarehouseDrugs, customers, suppliers, purchaseBills, inventoryWriteOffs, companyInfo, documentSettings }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeTab, setActiveTab] = useState<ReportTab>('profitability');
    const [filters, setFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);


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

    const getCurrentReportData = () => {
        const { sales, purchases, wastedStock } = filteredData;
        const dateRange = `از ${new Date(filters.startDate).toLocaleDateString('fa-IR')} تا ${new Date(filters.endDate).toLocaleDateString('fa-IR')}`;
        
        switch (activeTab) {
            case 'profitability': {
                const drugsMap = new Map(drugs.map(d => [d.id, d]));
                const profitItems = sales.filter(o => o.type === 'sale').flatMap(o => o.items).reduce((acc, item) => {
                    const drug = drugsMap.get(item.drugId);
                    // FIX: Property 'purchasePrice' does not exist on type 'Drug'. Calculate average.
                    let purchasePrice = 0;
                    if (drug && drug.batches.length > 0) {
                        const totalQuantityInStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
                        const totalValueInStock = drug.batches.reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);
                        purchasePrice = totalQuantityInStock > 0 ? totalValueInStock / totalQuantityInStock : 0;
                    }
                    const itemRevenue = item.finalPrice * item.quantity;
                    const itemCogs = purchasePrice * (item.quantity + item.bonusQuantity);
                    const itemProfit = itemRevenue - itemCogs;
                    
                    const existing = acc.find(i => i.name === item.drugName);
                    if (existing) {
                        existing.qty += item.quantity;
                        existing.revenue += itemRevenue;
                        existing.cogs += itemCogs;
                        existing.profit += itemProfit;
                    } else {
                        acc.push({ name: item.drugName, qty: item.quantity, revenue: itemRevenue, cogs: itemCogs, profit: itemProfit });
                    }
                    return acc;
                }, [] as { name: string, qty: number, revenue: number, cogs: number, profit: number }[]);

                return {
                    title: 'گزارش سودآوری',
                    dateRange,
                    headers: ['نام محصول', 'تعداد فروش', 'مجموع درآمد', 'مجموع هزینه', 'سود کل'],
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
            default:
                return { title: `گزارش ${activeTab}`, dateRange, headers: [], rows: [] };
        }
    };
    
    const handleExcelExport = () => {
        const { title, headers, rows } = getCurrentReportData();
        const dataToExport = rows.map(row => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);
        XLSX.writeFile(wb, `${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsExportMenuOpen(false);
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
    
    const reportPrintData = getCurrentReportData();

    return (
        <div className="p-8 bg-gray-50 min-h-full space-y-6">
            <PrintPreviewModal
                isOpen={isPrintPreviewOpen}
                onClose={() => setIsPrintPreviewOpen(false)}
                documentSettings={documentSettings}
            >
                <ReportPrintView {...reportPrintData} companyInfo={companyInfo} documentSettings={documentSettings} />
            </PrintPreviewModal>

            <div>
                <h2 className="text-3xl font-bold text-gray-800">مرکز گزارشات</h2>
                <p className="text-gray-500 mt-1">تحلیل عملکرد کسب‌وکار با داشبوردهای هوشمند</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="w-full bg-gray-100 p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="w-full bg-gray-100 p-2 border rounded-lg" />
                    </div>
                </div>
                 <div className="relative" ref={exportMenuRef}>
                    <button onClick={() => setIsExportMenuOpen(prev => !prev)} className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors text-sm bg-gray-600 text-white hover:bg-gray-700 shadow">
                        <ExportIcon />
                        چاپ / خروجی
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <button onClick={() => { setIsPrintPreviewOpen(true); setIsExportMenuOpen(false); }} className="w-full text-right flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><PrintIcon /> چاپ / پیش‌نمایش</button>
                            <button onClick={handleExcelExport} className="w-full text-right flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><ExcelIcon /> دانلود Excel</button>
                        </div>
                    )}
                </div>
            </div>
            
             <div className="flex items-center gap-2 flex-wrap justify-center bg-white rounded-xl shadow-md p-2">
                <ReportTabButton tabId="profitability" icon={<ProfitIcon />}>سودآوری</ReportTabButton>
                <ReportTabButton tabId="inventory" icon={<InventoryIcon />}>گزارش انبارها</ReportTabButton>
                <ReportTabButton tabId="sales" icon={<SalesIcon />}>فروش</ReportTabButton>
                <ReportTabButton tabId="purchases" icon={<PurchaseIcon />}>خرید</ReportTabButton>
                <ReportTabButton tabId="bonuses" icon={<GiftIcon />}>بونس‌ها</ReportTabButton>
                <ReportTabButton tabId="wasted_stock" icon={<WasteIcon />}>ضایعات</ReportTabButton>
            </div>

            <div className="transition-opacity duration-300">
                {activeTab === 'profitability' && <ProfitabilityView filteredSales={filteredData.sales} drugs={drugs} filteredWastedStock={filteredData.wastedStock} />}
                {activeTab === 'sales' && <SalesSummaryView filteredSales={filteredData.sales} />}
                {activeTab === 'purchases' && <PurchaseSummaryView filteredPurchases={filteredData.purchases} />}
                {activeTab === 'inventory' && <InventoryReportView salesWarehouseDrugs={drugs} mainWarehouseDrugs={mainWarehouseDrugs} />}
                {activeTab === 'bonuses' && <BonusSummaryView filteredSales={filteredData.sales} drugs={drugs} />}
                {activeTab === 'wasted_stock' && <WastedStockView filteredWastedStock={filteredData.wastedStock} />}
            </div>
        </div>
    );
};

export default Reports;