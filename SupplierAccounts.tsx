import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Supplier } from './Suppliers';
import { PurchaseBill } from './Purchasing';
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
type SupplierFinancialSummary = {
    supplierId: number;
    supplierName: string;
    totalPurchased: number;
    totalPaid: number;
    balance: number; // Amount we owe
};

type ReportData = {
    supplier: Supplier;
    startDate: string;
    endDate: string;
    bills: PurchaseBill[];
    summary: {
        totalPurchased: number;
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
    supplier: SupplierFinancialSummary | null;
    bills: PurchaseBill[];
};

const LedgerModal: React.FC<LedgerModalProps> = ({ isOpen, onClose, supplier, bills }) => {
    const ledgerEntries = useMemo(() => {
        if (!supplier) return [];

        const supplierBills = bills.filter(b => b.supplierName === supplier.supplierName);
        let runningBalance = 0;
        
        const transactions: {date: string, desc: string, debit: number, credit: number, id: number}[] = [];

        supplierBills.forEach(bill => {
            if (bill.type === 'purchase') {
                // A purchase increases our liability (Accounts Payable), so it's a CREDIT.
                transactions.push({
                    date: bill.purchaseDate,
                    desc: `فاکتور خرید - ${bill.billNumber}`,
                    debit: 0,
                    credit: bill.totalAmount,
                    id: bill.id
                });
            } else if (bill.type === 'purchase_return') {
                 // A purchase return decreases our liability, so it's a DEBIT.
                 transactions.push({
                    date: bill.purchaseDate,
                    desc: `مستردی خرید - ${bill.billNumber}`,
                    debit: Math.abs(bill.totalAmount),
                    credit: 0,
                    id: bill.id
                });
            }
           
            if (bill.amountPaid !== 0) {
                 // A payment decreases our liability, so it's a DEBIT.
                 transactions.push({
                    date: bill.purchaseDate,
                    desc: bill.amountPaid > 0 ? `پرداخت برای فاکتور - ${bill.billNumber}` : `بازپرداخت برای مستردی - ${bill.billNumber}`,
                    debit: bill.amountPaid > 0 ? bill.amountPaid : 0,
                    credit: bill.amountPaid < 0 ? Math.abs(bill.amountPaid) : 0,
                    id: bill.id + 0.1
                });
            }
        });

        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return transactions.map(t => {
            runningBalance += t.credit - t.debit;
            return {
                date: t.date,
                description: t.desc,
                debit: t.debit,
                credit: t.credit,
                balance: runningBalance,
                billId: t.id
            };
        });

    }, [supplier, bills]);

    if (!isOpen || !supplier) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                         <h3 className="text-2xl font-bold text-gray-800">صورت حساب شرکت</h3>
                         <p className="text-lg text-gray-600 font-semibold">{supplier.supplierName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><CloseIcon className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold text-gray-600">تاریخ شمسی</th>
                                <th className="p-3 font-semibold text-gray-600">تاریخ میلادی</th>
                                <th className="p-3 font-semibold text-gray-600">شرح</th>
                                <th className="p-3 font-semibold text-gray-600">بدهکار (پرداختی ما)</th>
                                <th className="p-3 font-semibold text-gray-600">بستانکار (خرید ما)</th>
                                <th className="p-3 font-semibold text-gray-600">مانده (بدهی ما)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {ledgerEntries.map(entry => (
                                <tr key={entry.billId} className="hover:bg-gray-50">
                                    <td className="p-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('fa-IR')}</td>
                                    <td className="p-3 whitespace-nowrap font-mono text-xs">{formatGregorianForDisplay(entry.date)}</td>
                                    <td className="p-3">{entry.description}</td>
                                    <td className="p-3 text-green-600">{entry.debit > 0 ? Math.round(entry.debit).toLocaleString() : '-'}</td>
                                    <td className="p-3 text-red-600">{entry.credit > 0 ? Math.round(entry.credit).toLocaleString() : '-'}</td>
                                    <td className={`p-3 font-bold text-gray-800`}>{Math.round(entry.balance).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="mt-6 pt-4 border-t flex justify-end">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">مانده نهایی حساب (بدهی ما):</p>
                        <p className={`text-2xl font-bold ${supplier.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                            {Math.round(supplier.balance).toLocaleString()} افغانی
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- New Printable Statement Component ---
const SupplierAccountStatement = ({ reportData, companyInfo, documentSettings, className, style }: { reportData: ReportData, companyInfo: CompanyInfo, documentSettings: DocumentSettings, className?: string, style?: React.CSSProperties }) => {
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
                <h2 className="text-2xl font-bold">صورت حساب تامین کننده</h2>
                <p className="text-lg mt-1">{reportData.supplier.name}</p>
                <p className="text-sm text-gray-500 mt-2">
                    برای دوره از {new Date(reportData.startDate).toLocaleDateString('fa-IR')} تا {new Date(reportData.endDate).toLocaleDateString('fa-IR')}
                </p>
            </div>
             <table className="w-full text-right text-sm">
                <thead>
                    <tr>
                        <th className="p-3">تاریخ</th>
                        <th className="p-3">شرح</th>
                        <th className="p-3">بدهکار (پرداختی ما)</th>
                        <th className="p-3">بستانکار (خرید ما)</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {reportData.bills.map((bill) => (
                        <tr key={bill.id}>
                            <td className="p-2 whitespace-nowrap">{new Date(bill.purchaseDate).toLocaleDateString('fa-IR')}</td>
                            <td className="p-2">{bill.type === 'purchase' ? `فاکتور خرید #${bill.billNumber}` : `مستردی خرید #${bill.billNumber}`}</td>
                            <td className="p-2 text-green-600">{bill.amountPaid > 0 ? Math.round(bill.amountPaid).toLocaleString() : '-'}</td>
                            <td className="p-2 text-red-600">{bill.totalAmount > 0 ? Math.round(bill.totalAmount).toLocaleString() : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="flex justify-end mt-8">
                <div className="w-full max-w-sm space-y-3 print-summary pt-4">
                    <div className="flex justify-between text-md">
                        <span className="text-gray-600">مجموع خرید در بازه زمانی:</span>
                        <span className="font-semibold">{Math.round(reportData.summary.totalPurchased).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-md">
                        <span className="text-gray-600">مجموع پرداختی در بازه زمانی:</span>
                        <span className="font-semibold">{Math.round(reportData.summary.totalPaid).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                        <span>مانده نهایی حساب (بدهی ما):</span>
                        <span>{Math.round(reportData.summary.finalBalance).toLocaleString()} افغانی</span>
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
type SupplierAccountsProps = {
    suppliers: Supplier[];
    purchaseBills: PurchaseBill[];
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

const SupplierAccounts: React.FC<SupplierAccountsProps> = ({ suppliers, purchaseBills: bills, companyInfo, documentSettings, addToast }) => {
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierFinancialSummary | null>(null);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportFilters, setReportFilters] = useState({ supplierId: '', startDate: '', endDate: '' });
    const [generatedReportData, setGeneratedReportData] = useState<ReportData | null>(null);


    const supplierSummaries = useMemo<SupplierFinancialSummary[]>(() => {
        return suppliers.map(supplier => {
            const supplierBills = bills.filter(b => b.supplierName === supplier.name);
            const totalPurchased = supplierBills.filter(b => b.type === 'purchase').reduce((sum, b) => sum + Number(b.totalAmount), 0);
            const totalReturned = supplierBills.filter(b => b.type === 'purchase_return').reduce((sum, b) => sum + Math.abs(Number(b.totalAmount)), 0);
            const totalPaid = supplierBills.reduce((sum, b) => sum + Number(b.amountPaid), 0);
            
            const balance = totalPurchased - totalReturned - totalPaid;
            
            return {
                supplierId: supplier.id,
                supplierName: supplier.name,
                totalPurchased: totalPurchased - totalReturned, // Net Purchased
                totalPaid: totalPaid,
                balance: balance,
            };
        });
    }, [suppliers, bills]);
    
    const handleViewLedger = (supplierSummary: SupplierFinancialSummary) => {
        setSelectedSupplier(supplierSummary);
        setIsLedgerOpen(true);
    };

    const handleReportFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setReportFilters(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleGenerateReport = (e: React.FormEvent) => {
        e.preventDefault();
        const { supplierId, startDate, endDate } = reportFilters;
        if (!supplierId || !startDate || !endDate) {
            addToast("لطفاً شرکت و بازه زمانی را به طور کامل انتخاب کنید.", 'error');
            return;
        }

        const supplier = suppliers.find(c => c.id === Number(supplierId));
        if (!supplier) return;

        const filteredBills = bills.filter(b => {
            const billDate = new Date(b.purchaseDate);
            return b.supplierName === supplier.name &&
                   billDate >= new Date(startDate) &&
                   billDate <= new Date(endDate);
        }).sort((a,b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

        const summary = supplierSummaries.find(s => s.supplierId === Number(supplierId));

        const reportData: ReportData = {
            supplier,
            startDate,
            endDate,
            bills: filteredBills,
            summary: {
                totalPurchased: filteredBills.reduce((sum, bill) => sum + Number(bill.totalAmount), 0),
                totalPaid: filteredBills.reduce((sum, bill) => sum + Number(bill.amountPaid), 0),
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
                supplier={selectedSupplier}
                bills={bills}
            />
            <PrintPreviewModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                documentSettings={documentSettings}
            >
               {generatedReportData && <SupplierAccountStatement reportData={generatedReportData} companyInfo={companyInfo} documentSettings={documentSettings}/>}
            </PrintPreviewModal>

            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">مدیریت حسابات شرکت‌ها</h2>
                <p className="text-gray-500 mt-2">بررسی وضعیت مالی، بدهی‌ها و صورت حساب هر تامین کننده.</p>
            </div>
            
            {/* Report Generation Section */}
            <div className="bg-gray-50 rounded-xl shadow-md p-4 mb-6">
                 <form onSubmit={handleGenerateReport}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">انتخاب شرکت</label>
                             <select id="supplierId" name="supplierId" value={reportFilters.supplierId} onChange={handleReportFilterChange} className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                                <option value="" disabled>-- یک شرکت را انتخاب کنید --</option>
                                {suppliers.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
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
                                <th className="p-4 text-sm font-semibold text-gray-600">نام شرکت</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مجموع خرید خالص</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مجموع پرداختی</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مانده حساب (بدهی ما)</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {supplierSummaries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-gray-500">
                                        هیچ تامین کننده‌ای ثبت نشده است.
                                    </td>
                                </tr>
                            ) : (
                                supplierSummaries.map(summary => (
                                    <tr key={summary.supplierId} className={`hover:bg-gray-50 transition-colors ${summary.balance > 0 ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                                        <td className="p-4 text-gray-800 font-medium">{summary.supplierName}</td>
                                        <td className="p-4 text-gray-600">{Math.round(summary.totalPurchased).toLocaleString()}</td>
                                        <td className="p-4 text-green-600">{Math.round(summary.totalPaid).toLocaleString()}</td>
                                        <td className={`p-4 font-bold ${summary.balance > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                            {Math.round(summary.balance).toLocaleString()}
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

export default SupplierAccounts;