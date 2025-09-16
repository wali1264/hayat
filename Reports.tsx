
import React, { useState, useMemo } from 'react';
import { Order, OrderItem } from './Sales';
import { PurchaseBill, PurchaseItem } from './Purchasing';
import { Customer } from './Customers';
import { Supplier } from './Suppliers';
import { CompanyInfo, DocumentSettings } from './Settings';

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);

const PrintIcon = () => <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v4H9v-4m4 0h-2" />;
const BackIcon = () => <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" />;
const SalesIcon = ({ className = "w-10 h-10" }) => <Icon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" className={className} />;
const PurchaseIcon = ({ className = "w-10 h-10" }) => <Icon path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" className={className} />;


//=========== TYPES ===========//
type ReportType = 'sales' | 'purchases';
type View = 
    | { level: 'home' }
    | { level: 'summary', type: ReportType }
    | { level: 'detail', type: ReportType, entityName: string }
    | { level: 'invoice', type: ReportType, entityName: string, invoice: Order | PurchaseBill };

type PrintData = {
    type: 'full' | 'entity' | 'invoice';
    reportType: ReportType;
    filters: { startDate: string; endDate: string; };
    data: any;
};

//=========== COMPONENTS ===========//

// --- Main Reports Component ---
type ReportsProps = {
    orders: Order[];
    customers: Customer[];
    suppliers: Supplier[];
    purchaseBills: PurchaseBill[];
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
};

const Reports: React.FC<ReportsProps> = ({ orders, customers, suppliers, purchaseBills, companyInfo, documentSettings }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [viewStack, setViewStack] = useState<View[]>([{ level: 'home' }]);
    const [filters, setFilters] = useState({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [printData, setPrintData] = useState<PrintData | null>(null);

    const currentView = viewStack[viewStack.length - 1];

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

        return { sales, purchases };
    }, [filters, orders, purchaseBills]);

    // --- Navigation Handlers ---
    const navigateTo = (view: View) => setViewStack(prev => [...prev, view]);
    const goBack = () => setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

    // --- Content Rendering ---
    const renderContent = () => {
        switch (currentView.level) {
            case 'home':
                return <HomeView setReportType={(type) => navigateTo({ level: 'summary', type })} />;
            case 'summary':
                return <SummaryView
                    type={currentView.type}
                    data={filteredData}
                    onSelectEntity={(entityName) => navigateTo({ level: 'detail', type: currentView.type, entityName })}
                />;
            case 'detail':
                return <DetailView
                    type={currentView.type}
                    entityName={currentView.entityName}
                    data={filteredData}
                    onSelectInvoice={(invoice) => navigateTo({ level: 'invoice', type: currentView.type, entityName: currentView.entityName, invoice })}
                />;
            case 'invoice':
                return <InvoiceView invoice={currentView.invoice} />;
            default:
                return null;
        }
    };

    // --- Print Handler ---
    const handlePrint = () => {
        let dataToPrint: PrintData | null = null;
        if (currentView.level === 'summary') {
            dataToPrint = { type: 'full', reportType: currentView.type, filters, data: filteredData };
        } else if (currentView.level === 'detail') {
             const entityData = currentView.type === 'sales'
                ? filteredData.sales.filter(o => o.customerName === currentView.entityName)
                : filteredData.purchases.filter(p => p.supplierName === currentView.entityName);
            dataToPrint = { type: 'entity', reportType: currentView.type, filters, data: { entityName: currentView.entityName, items: entityData } };
        } else if (currentView.level === 'invoice') {
             dataToPrint = { type: 'invoice', reportType: currentView.type, filters, data: currentView.invoice };
        }
        
        if (dataToPrint) {
            setPrintData(dataToPrint);
            setTimeout(() => {
                window.print();
                setPrintData(null);
            }, 100);
        }
    };
    
    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">مرکز گزارشات</h2>
                    <p className="text-gray-500 mt-1">تحلیل عمیق خرید و فروش با گزارشات سلسله مراتبی</p>
                </div>
                {currentView.level !== 'home' && (
                    <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md">
                        <PrintIcon /> <span className="mr-2">چاپ گزارش تفصیلی</span>
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                {viewStack.map((view, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && <span>/</span>}
                        <button
                            onClick={() => setViewStack(prev => prev.slice(0, index + 1))}
                            className={`hover:text-teal-600 ${index === viewStack.length - 1 ? 'text-teal-700 font-bold' : ''}`}
                        >
                            {view.level === 'home' && 'گزارشات'}
                            {view.level === 'summary' && (view.type === 'sales' ? 'گزارش فروش' : 'گزارش خرید')}
                            {(view.level === 'detail' || view.level === 'invoice') && view.entityName}
                            {view.level === 'invoice' && ` > فاکتور ${'orderNumber' in view.invoice ? view.invoice.orderNumber : view.invoice.billNumber}`}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {currentView.level !== 'home' && (
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="w-full bg-gray-50 p-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="w-full bg-gray-50 p-2 border rounded-lg" />
                        </div>
                        <button onClick={() => goBack()} disabled={viewStack.length <= 1} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 font-semibold shadow-md disabled:bg-gray-300">
                            <BackIcon /> بازگشت به مرحله قبل
                        </button>
                    </div>
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-lg p-6 min-h-[400px]">
                {renderContent()}
            </div>
            
            {printData && <PrintView printData={printData} companyInfo={companyInfo} />}
        </div>
    );
};


// --- Sub-Views ---
const HomeView = ({ setReportType }) => (
    <div className="flex flex-col justify-center items-center h-full">
        <h3 className="text-xl font-bold text-gray-700 mb-6">کدام گزارش را نیاز دارید؟</h3>
        <div className="flex gap-8">
            <button onClick={() => setReportType('purchases')} className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed hover:bg-teal-50 hover:border-teal-400 transition-colors">
                <PurchaseIcon className="text-teal-600" />
                <span className="font-semibold text-lg text-teal-800">گزارش خرید</span>
            </button>
            <button onClick={() => setReportType('sales')} className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed hover:bg-blue-50 hover:border-blue-400 transition-colors">
                <SalesIcon className="text-blue-600" />
                <span className="font-semibold text-lg text-blue-800">گزارش فروش</span>
            </button>
        </div>
    </div>
);

const SummaryView = ({ type, data, onSelectEntity }) => {
    const summaries = useMemo(() => {
        const sourceData = type === 'sales' ? data.sales : data.purchases;
        const entityKey = type === 'sales' ? 'customerName' : 'supplierName';
        
        // FIX: Explicitly type the accumulator for `reduce` to ensure correct type inference for `values`.
        const grouped = sourceData.reduce((acc, item) => {
            const entity = item[entityKey];
            if (!acc[entity]) acc[entity] = { totalAmount: 0, amountPaid: 0 };
            acc[entity].totalAmount += Number(item.totalAmount);
            acc[entity].amountPaid += Number(item.amountPaid);
            return acc;
        }, {} as { [key: string]: { totalAmount: number; amountPaid: number } });

        return Object.entries(grouped).map(([name, values]) => ({
            name,
            ...values,
            balance: values.totalAmount - values.amountPaid
        }));
    }, [type, data]);

    const headers = type === 'sales' ? ['نام مشتری', 'مجموع فروش', 'مجموع دریافتی', 'مانده حساب'] : ['نام شرکت', 'مجموع خرید', 'مجموع پرداختی', 'مانده حساب'];

    return <DataTable headers={headers} rows={summaries.map(s => [s.name, s.totalAmount.toLocaleString(), s.amountPaid.toLocaleString(), s.balance.toLocaleString()])} onRowClick={onSelectEntity} />;
};

const DetailView = ({ type, entityName, data, onSelectInvoice }) => {
    const invoices = useMemo(() => {
        return type === 'sales'
            ? data.sales.filter(o => o.customerName === entityName)
            : data.purchases.filter(p => p.supplierName === entityName);
    }, [type, entityName, data]);
    
    const headers = ['شماره فاکتور', 'تاریخ', 'مبلغ کل', 'پرداختی', 'مانده'];
    
    return <DataTable headers={headers} rows={invoices.map(inv => [
        'orderNumber' in inv ? inv.orderNumber : inv.billNumber,
        new Date('orderDate' in inv ? inv.orderDate : inv.purchaseDate).toLocaleDateString('fa-IR'),
        inv.totalAmount.toLocaleString(),
        inv.amountPaid.toLocaleString(),
        (inv.totalAmount - inv.amountPaid).toLocaleString()
    ])} onRowClick={(_, index) => onSelectInvoice(invoices[index])} />;
};

const InvoiceView = ({ invoice }) => {
    const isSales = 'orderNumber' in invoice;
    const headers = isSales ? ['نام دارو', 'تعداد', 'قیمت واحد', 'تخفیف', 'مبلغ جزء'] : ['نام دارو', 'تعداد', 'قیمت خرید', 'مبلغ جزء'];
    
    const rows = invoice.items.map((item: OrderItem | PurchaseItem) => {
        if ('originalPrice' in item) { // OrderItem
             const pricePerUnit = item.isPriceOverridden ? item.finalPrice : (item.bonusQuantity > 0 && !item.applyDiscountWithBonus) ? item.originalPrice : item.finalPrice;
            return [item.drugName, item.quantity, item.originalPrice.toLocaleString(), `${item.discountPercentage}%`, (item.quantity * pricePerUnit).toLocaleString()];
        } else { // PurchaseItem
            return [item.drugName, item.quantity, item.purchasePrice.toLocaleString(), (item.quantity * item.purchasePrice).toLocaleString()];
        }
    });

    return <DataTable headers={headers} rows={rows} />;
};

// FIX: Corrected the default prop for `onRowClick` to match its usage signature.
const DataTable = ({ headers, rows, onRowClick = (firstCell: string | number, rowIndex: number) => {} }) => (
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
                        <tr key={rowIndex} onClick={() => onRowClick(row[0], rowIndex)} className="hover:bg-teal-50 cursor-pointer transition-colors">
                            {row.map((cell, cellIndex) => <td key={cellIndex} className="p-4 whitespace-nowrap">{cell}</td>)}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

// --- Print View ---
const PrintView = ({ printData, companyInfo }) => {
    const { type, reportType, filters, data } = printData;

    const renderFullReport = () => {
        const sourceData = reportType === 'sales' ? data.sales : data.purchases;
        const entityKey = reportType === 'sales' ? 'customerName' : 'supplierName';
        const grouped = sourceData.reduce((acc, item) => {
            const entity = item[entityKey];
            if (!acc[entity]) acc[entity] = [];
            acc[entity].push(item);
            return acc;
        }, {});

        return Object.entries(grouped).map(([entityName, invoices]) => (
            <div key={entityName} className="entity-group">
                <h4 className="entity-header">{entityName}</h4>
                <table>
                    <thead><tr><th>شماره</th><th>تاریخ</th><th>مبلغ کل</th><th>پرداختی</th><th>مانده</th></tr></thead>
                    <tbody>
                        {(invoices as (Order | PurchaseBill)[]).map(inv => (
                            <tr key={inv.id}>
                                <td>{'orderNumber' in inv ? inv.orderNumber : inv.billNumber}</td>
                                <td>{new Date('orderDate' in inv ? inv.orderDate : inv.purchaseDate).toLocaleDateString('fa-IR')}</td>
                                <td>{inv.totalAmount.toLocaleString()}</td>
                                <td>{inv.amountPaid.toLocaleString()}</td>
                                <td>{(inv.totalAmount - inv.amountPaid).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ));
    };
    
    const renderEntityReport = () => {
         return (
            <div className="entity-group">
                <h4 className="entity-header">{data.entityName}</h4>
                <table>
                    <thead><tr><th>شماره</th><th>تاریخ</th><th>مبلغ کل</th><th>پرداختی</th><th>مانده</th></tr></thead>
                    <tbody>
                        {data.items.map((inv: Order | PurchaseBill) => (
                             <tr key={inv.id}>
                                <td>{'orderNumber' in inv ? inv.orderNumber : inv.billNumber}</td>
                                <td>{new Date('orderDate' in inv ? inv.orderDate : inv.purchaseDate).toLocaleDateString('fa-IR')}</td>
                                <td>{inv.totalAmount.toLocaleString()}</td>
                                <td>{inv.amountPaid.toLocaleString()}</td>
                                <td>{(inv.totalAmount - inv.amountPaid).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    
     const renderInvoiceReport = () => {
        const invoice = data;
        const isSales = 'orderNumber' in invoice;
        return (
            <div className="entity-group">
                <h4 className="entity-header">فاکتور {isSales ? invoice.orderNumber : invoice.billNumber} برای {isSales ? invoice.customerName : invoice.supplierName}</h4>
                <table>
                     <thead><tr><th>نام دارو</th><th>تعداد</th><th>قیمت</th><th>مبلغ جزء</th></tr></thead>
                     <tbody>
                        {invoice.items.map((item: OrderItem | PurchaseItem, index: number) => (
                             <tr key={index}>
                                <td>{item.drugName}</td>
                                <td>{item.quantity}</td>
                                <td>{'originalPrice' in item ? item.originalPrice.toLocaleString() : item.purchasePrice.toLocaleString()}</td>
                                <td>{'originalPrice' in item ? (item.quantity * item.finalPrice).toLocaleString() : (item.quantity * item.purchasePrice).toLocaleString()}</td>
                            </tr>
                        ))}
                     </tbody>
                </table>
            </div>
        );
     }


    return (
        <div id="print-section" className="template-report-classic">
             <header className="print-header">
                <div className="print-company-info">
                    <h1 className="text-xl font-bold">{companyInfo.name}</h1>
                    <p className="text-xs">{companyInfo.address}</p>
                </div>
            </header>
            <h2 className="print-title">گزارش تفصیلی {reportType === 'sales' ? 'فروشات' : 'خرید'}</h2>
            <p className="report-subtitle">از {new Date(filters.startDate).toLocaleDateString('fa-IR')} تا {new Date(filters.endDate).toLocaleDateString('fa-IR')}</p>
            {type === 'full' && renderFullReport()}
            {type === 'entity' && renderEntityReport()}
            {type === 'invoice' && renderInvoiceReport()}
        </div>
    );
};


export default Reports;
