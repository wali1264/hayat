

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Customer } from './Customers';
import { Order } from './Sales';
import { CompanyInfo, DocumentSettings } from './Settings';

// Declare global libraries
// declare var jsPDF: any; // No longer needed

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);
const LedgerIcon = () => <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />;
const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const PrintIcon = () => <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v4H9v-4m4 0h-2" className="w-5 h-5" />;


//=========== TYPES ===========//
type CustomerFinancialSummary = {
    customerId: number;
    customerName: string;
    totalBilled: number;
    totalPaid: number;
    balance: number;
};

type ReportData = {
    customer: Customer;
    startDate: string;
    endDate: string;
    transactions: {date: string, desc: string, debit: number, credit: number, id: number, refCode?: string}[];
    summary: {
        totalBilled: number;
        totalPaid: number;
        finalBalance: number;
    }
}

//=========== HELPERS ===========//
const formatGregorianForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}/${month}/${day}`;
    } catch (e) {
        return '';
    }
};


//=========== MODAL COMPONENTS ===========//
type LedgerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    customer: CustomerFinancialSummary | null;
    orders: Order[];
};

const LedgerModal: React.FC<LedgerModalProps> = ({ isOpen, onClose, customer, orders }) => {
    const ledgerEntries = useMemo(() => {
        if (!customer) return [];

        const customerOrders = orders.filter(o => o.customerName === customer.customerName);
        let runningBalance = 0;
        
        const transactions: {date: string, desc: string, debit: number, credit: number, id: number, refCode?: string}[] = [];

        customerOrders.forEach(order => {
            if (order.type === 'sale') {
                transactions.push({
                    date: order.orderDate,
                    desc: `فاکتور فروش - ${order.orderNumber}`,
                    debit: order.totalAmount,
                    credit: 0,
                    id: order.id,
                    refCode: order.ledgerRefCode
                });
            } else if (order.type === 'sale_return') {
                 transactions.push({
                    date: order.orderDate,
                    desc: `مستردی فروش - ${order.orderNumber}`,
                    debit: 0,
                    credit: Math.abs(order.totalAmount), // Credit is positive
                    id: order.id,
                    refCode: order.ledgerRefCode
                });
            }
           
            if (order.amountPaid !== 0) {
                 transactions.push({
                    date: order.orderDate,
                    desc: order.amountPaid > 0 ? `پرداخت برای سفارش - ${order.orderNumber}` : `بازپرداخت برای مستردی - ${order.orderNumber}`,
                    debit: order.amountPaid < 0 ? Math.abs(order.amountPaid) : 0,
                    credit: order.amountPaid > 0 ? order.amountPaid : 0,
                    id: order.id + 0.1,
                    refCode: ''
                });
            }
        });

        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return transactions.map(t => {
            runningBalance += t.debit - t.credit;
            return {
                date: t.date,
                description: t.desc,
                debit: t.debit,
                credit: t.credit,
                balance: runningBalance,
                orderId: t.id,
                refCode: t.refCode
            };
        });

    }, [customer, orders]);

    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                         <h3 className="text-2xl font-bold text-gray-800">صورت حساب مشتری</h3>
                         <p className="text-lg text-gray-600 font-semibold">{customer.customerName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><CloseIcon className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold text-gray-600">تاریخ شمسی</th>
                                <th className="p-3 font-semibold text-gray-600">تاریخ میلادی</th>
                                <th className="p-3 font-semibold text-gray-600">کد ارجاع</th>
                                <th className="p-3 font-semibold text-gray-600">شرح</th>
                                <th className="p-3 font-semibold text-gray-600">بدهکار</th>
                                <th className="p-3 font-semibold text-gray-600">بستانکار</th>
                                <th className="p-3 font-semibold text-gray-600">مانده</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {ledgerEntries.map(entry => (
                                <tr key={entry.orderId} className="hover:bg-gray-50">
                                    <td className="p-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('fa-IR')}</td>
                                    <td className="p-3 whitespace-nowrap font-mono text-xs">{formatGregorianForDisplay(entry.date)}</td>
                                    <td className="p-3 whitespace-nowrap font-mono text-xs">{entry.refCode || '-'}</td>
                                    <td className="p-3">{entry.description}</td>
                                    <td className="p-3 text-red-600">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                                    <td className="p-3 text-green-600">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                                    <td className={`p-3 font-bold ${entry.balance >= 0 ? 'text-gray-800' : 'text-green-700'}`}>{entry.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="mt-6 pt-4 border-t flex justify-end">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">مانده نهایی حساب:</p>
                        <p className={`text-2xl font-bold ${customer.balance >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                            {customer.balance.toLocaleString()} افغانی
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- New Printable Statement Component ---
const CustomerAccountStatement = ({ reportData, companyInfo, documentSettings, className, style }: { reportData: ReportData, companyInfo: CompanyInfo, documentSettings: DocumentSettings, className?: string, style?: React.CSSProperties }) => {
    return (
         <div className={className} style={style}>
            <header className="print-header">
                <div className="print-company-info">
                    <h1 className="text-3xl font-bold text-gray-800 print-title">{companyInfo.name}</h1>
                    <p className="text-gray-500">{companyInfo.address}</p>
                    <p className="text-gray-500">{companyInfo.phone}</p>
                </div>
                {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="print-logo" />}
            </header>
            <div className="text-center my-8">
                <h2 className="text-2xl font-bold">صورت حساب مشتری</h2>
                <p className="text-lg mt-1">{reportData.customer.name}</p>
                <p className="text-sm text-gray-500 mt-2">
                    برای دوره از {new Date(reportData.startDate).toLocaleDateString('fa-IR')} تا {new Date(reportData.endDate).toLocaleDateString('fa-IR')}
                </p>
            </div>
             <table className="w-full text-right text-sm">
                <thead>
                    <tr>
                        <th className="p-3">تاریخ</th>
                        <th className="p-3">شرح</th>
                        <th className="p-3">بدهکار</th>
                        <th className="p-3">بستانکار</th>
                        <th className="p-3">مانده</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {reportData.transactions.map((entry, index) => (
                        <tr key={index}>
                            <td className="p-2 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('fa-IR')}</td>
                            <td className="p-2">{entry.desc}</td>
                            <td className="p-2 text-red-600">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                            <td className="p-2 text-green-600">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                            <td className="p-2 font-bold">{(entry.debit - entry.credit).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="flex justify-end mt-8">
                <div className="w-full max-w-sm space-y-3 print-summary pt-4">
                    <div className="flex justify-between text-md">
                        <span className="text-gray-600">مجموع بدهکار (فاکتورها):</span>
                        <span className="font-semibold">{reportData.summary.totalBilled.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-md">
                        <span className="text-gray-600">مجموع بستانکار (پرداختی‌ها):</span>
                        <span className="font-semibold">{reportData.summary.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                        <span>مانده نهایی حساب:</span>
                        <span>{reportData.summary.finalBalance.toLocaleString()} افغانی</span>
                    </div>
                </div>
            </div>
             <footer className="mt-16 pt-6 border-t text-sm text-gray-500 text-center">
                <span>تاریخ و زمان چاپ: {new Date().toLocaleString('fa-IR')}</span>
            </footer>
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
                    {/* FIX: Cast children to a type that accepts className and style to resolve TypeScript error. */}
                    {React.cloneElement(children as React.ReactElement<{ className?: string, style?: React.CSSProperties }>, {
                        className: `p-10 template-${selectedTemplate} layout-logo-${documentSettings.logoPosition}`,
                        style: { '--accent-color': documentSettings.accentColor }
                    })}
                </div>
            </div>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
type CustomerAccountsProps = {
    customers: Customer[];
    orders: Order[];
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

const CustomerAccounts: React.FC<CustomerAccountsProps> = ({ customers, orders, companyInfo, documentSettings, addToast }) => {
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerFinancialSummary | null>(null);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportFilters, setReportFilters] = useState({ customerId: '', startDate: '', endDate: '' });
    const [generatedReportData, setGeneratedReportData] = useState<ReportData | null>(null);


    const customerSummaries = useMemo<CustomerFinancialSummary[]>(() => {
        return customers.map(customer => {
            const customerOrders = orders.filter(o => o.customerName === customer.name);
            const totalBilled = customerOrders.filter(o => o.type === 'sale').reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const totalReturned = customerOrders.filter(o => o.type === 'sale_return').reduce((sum, o) => sum + Math.abs(Number(o.totalAmount)), 0);
            const totalPaid = customerOrders.reduce((sum, o) => sum + Number(o.amountPaid), 0);
            
            const balance = totalBilled - totalReturned - totalPaid;
            
            return {
                customerId: customer.id,
                customerName: customer.name,
                totalBilled: totalBilled - totalReturned, // Net Billed
                totalPaid: totalPaid,
                balance: balance,
            };
        });
    }, [customers, orders]);
    
    const handleViewLedger = (customerSummary: CustomerFinancialSummary) => {
        setSelectedCustomer(customerSummary);
        setIsLedgerOpen(true);
    };

    const handleReportFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setReportFilters(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleGenerateReport = (e: React.FormEvent) => {
        e.preventDefault();
        const { customerId, startDate, endDate } = reportFilters;
        if (!customerId || !startDate || !endDate) {
            addToast("لطفاً مشتری و بازه زمانی را به طور کامل انتخاب کنید.", 'error');
            return;
        }

        const customer = customers.find(c => c.id === Number(customerId));
        if (!customer) return;

        const customerOrders = orders.filter(o => {
            const orderDate = new Date(o.orderDate);
            return o.customerName === customer.name &&
                   orderDate >= new Date(startDate) &&
                   orderDate <= new Date(endDate);
        });

        const transactions: {date: string, desc: string, debit: number, credit: number, id: number, refCode?: string}[] = [];
        let totalBilled = 0;
        let totalPaid = 0;

        customerOrders.forEach(order => {
            if (order.type === 'sale') {
                transactions.push({ date: order.orderDate, desc: `فاکتور فروش - ${order.orderNumber}`, debit: order.totalAmount, credit: 0, id: order.id, refCode: order.ledgerRefCode });
                totalBilled += order.totalAmount;
            } else {
                transactions.push({ date: order.orderDate, desc: `مستردی فروش - ${order.orderNumber}`, debit: 0, credit: Math.abs(order.totalAmount), id: order.id, refCode: order.ledgerRefCode });
                totalBilled -= Math.abs(order.totalAmount);
            }
            if (order.amountPaid !== 0) {
                 transactions.push({ date: order.orderDate, desc: `پرداخت برای سفارش - ${order.orderNumber}`, debit: 0, credit: order.amountPaid, id: order.id + 0.1, refCode: '' });
                 totalPaid += order.amountPaid;
            }
        });
        transactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const summary = customerSummaries.find(s => s.customerId === Number(customerId));

        const reportData: ReportData = {
            customer,
            startDate,
            endDate,
            transactions,
            summary: {
                totalBilled,
                totalPaid,
                finalBalance: summary ? Number(summary.balance) : 0
            }
        };
        
        setGeneratedReportData(reportData);
        setIsReportModalOpen(true);
    }

    return (
        <div className="p-8">
            <LedgerModal
                isOpen={isLedgerOpen}
                onClose={() => setIsLedgerOpen(false)}
                customer={selectedCustomer}
                orders={orders}
            />
            <PrintPreviewModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                documentSettings={documentSettings}
            >
                {generatedReportData && <CustomerAccountStatement reportData={generatedReportData} companyInfo={companyInfo} documentSettings={documentSettings}/>}
            </PrintPreviewModal>

            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">مدیریت حسابات مشتریان</h2>
                <p className="text-gray-500 mt-2">بررسی وضعیت مالی، بدهی‌ها و صورت حساب هر مشتری.</p>
            </div>

            {/* Report Generation Section */}
            <div className="bg-gray-50 rounded-xl shadow-md p-4 mb-6">
                 <form onSubmit={handleGenerateReport}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">انتخاب مشتری</label>
                             <select id="customerId" name="customerId" value={reportFilters.customerId} onChange={handleReportFilterChange} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                                <option value="" disabled>-- یک مشتری را انتخاب کنید --</option>
                                {customers.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                            <input type="date" id="startDate" name="startDate" value={reportFilters.startDate} onChange={handleReportFilterChange} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg" required />
                        </div>
                         <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                            <input type="date" id="endDate" name="endDate" value={reportFilters.endDate} onChange={handleReportFilterChange} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg" required />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md">
                           ایجاد گزارش تفصیلی
                        </button>
                    </div>
                 </form>
            </div>


            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">نام مشتری</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مجموع فروش خالص</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مجموع پرداختی</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مانده حساب فعلی</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {customerSummaries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-gray-500">
                                        هیچ مشتری ثبت شده‌ای وجود ندارد.
                                    </td>
                                </tr>
                            ) : (
                                customerSummaries.map(summary => (
                                    <tr key={summary.customerId} className={`hover:bg-gray-50 transition-colors ${summary.balance > 0 ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                                        <td className="p-4 text-gray-800 font-medium">{summary.customerName}</td>
                                        <td className="p-4 text-gray-600">{summary.totalBilled.toLocaleString()}</td>
                                        <td className="p-4 text-green-600">{summary.totalPaid.toLocaleString()}</td>
                                        <td className={`p-4 font-bold ${summary.balance > 0 ? 'text-red-600' : (summary.balance < 0 ? 'text-green-700' : 'text-gray-800')}`}>
                                            {summary.balance.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => handleViewLedger(summary)} 
                                                className="flex items-center text-teal-600 hover:text-teal-800 font-semibold text-sm"
                                            >
                                                <LedgerIcon />
                                                <span className="mr-2">مشاهده صورت حساب</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerAccounts;