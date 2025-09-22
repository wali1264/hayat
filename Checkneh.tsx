import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Customer } from './Customers';
import { CompanyInfo, DocumentSettings } from './Settings';

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);
const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className} />;
const PrintIcon = () => <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v4H9v-4m4 0h-2" />;
const CloseIcon = () => <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5 text-gray-500"/>;
const UploadIcon = () => <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />;
const DownloadIcon = () => <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />;
const EditIcon = () => <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" className="w-5 h-5" />;


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

//=========== TYPES ===========//
export type ChecknehItem = {
    id: number;
    drugName: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    discountPercentage: number;
    productionDate?: string;
    expiryDate?: string;
};

export type ChecknehInvoice = {
    id: number;
    invoiceNumber: string;
    customerName: string;
    supplierName: string;
    invoiceDate: string;
    items: ChecknehItem[];
    totalAmount: number;
};

type Tab = 'new_invoice' | 'invoice_list' | 'reports' | 'backup';


//=========== SUB-COMPONENTS / MODALS ===========//

// --- Invoice Print Modal ---
const ChecknehInvoicePrintModal = ({ isOpen, onClose, invoice, companyInfo, documentSettings }: { isOpen: boolean, onClose: () => void, invoice: ChecknehInvoice | null, companyInfo: CompanyInfo, documentSettings: DocumentSettings }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    if (!isOpen || !invoice) return null;

    const handlePrint = () => {
        setTimeout(() => window.print(), 100);
    };

    const subtotal = invoice.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    const totalDiscount = subtotal - invoice.totalAmount;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl mt-8 mb-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div 
                    id="print-section"
                    className={`p-10 ${'template-' + selectedTemplate} ${'layout-logo-' + documentSettings.logoPosition}`}
                    style={{ '--accent-color': documentSettings.accentColor } as React.CSSProperties}
                >
                    <header className="print-header">
                        <div className="print-company-info">
                            <h1 className="text-3xl font-bold text-gray-800 print-title">{companyInfo.name}</h1>
                            <p className="text-gray-500">{companyInfo.address}</p>
                            <p className="text-gray-500">{companyInfo.phone}</p>
                        </div>
                        {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="print-logo" />}
                    </header>
                    <div className="grid grid-cols-3 gap-8 my-8">
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">فاکتور برای:</h4>
                            <p className="font-semibold text-gray-800">{invoice.customerName}</p>
                        </div>
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">شماره فاکتور:</h4>
                            <p className="font-semibold text-gray-800">{invoice.invoiceNumber}</p>
                        </div>
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">تاریخ صدور:</h4>
                            <p className="font-semibold text-gray-800">
                                {new Date(invoice.invoiceDate).toLocaleDateString('fa-IR')}
                                <span className="block text-xs font-normal font-mono text-gray-500 mt-1">{formatGregorianForDisplay(invoice.invoiceDate)}</span>
                            </p>
                        </div>
                    </div>
                    <table className="w-full text-right">
                        <thead>
                            <tr>
                                <th className="p-3 text-sm font-semibold">#</th>
                                <th className="p-3 text-sm font-semibold">شرح محصول</th>
                                <th className="p-3 text-sm font-semibold">تعداد</th>
                                <th className="p-3 text-sm font-semibold">قیمت واحد</th>
                                <th className="p-3 text-sm font-semibold">تخفیف</th>
                                <th className="p-3 text-sm font-semibold">مبلغ نهایی</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {invoice.items.map((item, index) => {
                                const finalPrice = item.sellingPrice * (1 - item.discountPercentage / 100);
                                return (
                                <tr key={item.id}>
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3 font-medium">{item.drugName}</td>
                                    <td className="p-3">{item.quantity.toLocaleString()}</td>
                                    <td className="p-3">{item.sellingPrice.toLocaleString()}</td>
                                    <td className="p-3">{item.discountPercentage > 0 ? `${item.discountPercentage}%` : '-'}</td>
                                    <td className="p-3 font-semibold">{(finalPrice * item.quantity).toLocaleString()}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    <div className="flex justify-end mt-8">
                        <div className="w-full max-w-sm space-y-3 print-summary pt-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">جمع جزء:</span>
                                <span className="font-semibold">{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">مجموع تخفیف:</span>
                                <span className="font-semibold text-green-600">{totalDiscount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                                <span>مبلغ نهایی قابل پرداخت:</span>
                                <span>{invoice.totalAmount.toLocaleString()} افغانی</span>
                            </div>
                        </div>
                    </div>
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
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">بستن</button>
                        <button type="button" onClick={handlePrint} className="flex items-center px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold"><PrintIcon /> <span className="mr-2">چاپ</span></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- New Invoice Form ---
type ChecknehInvoiceFormProps = {
    customers: Customer[];
    onSave: (invoiceData: Omit<ChecknehInvoice, 'id' | 'invoiceNumber' | 'totalAmount'>, existingId?: number) => void;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    initialData: ChecknehInvoice | null;
    onCancel: () => void;
};


const ChecknehInvoiceForm = ({ customers, onSave, addToast, initialData, onCancel }: ChecknehInvoiceFormProps) => {
    const isEditMode = initialData !== null;
    const defaultInfo = { customerName: '', supplierName: '', invoiceDate: new Date().toISOString().split('T')[0] };
    const [info, setInfo] = useState(defaultInfo);
    const [items, setItems] = useState<ChecknehItem[]>([]);
    const [currentItem, setCurrentItem] = useState({ drugName: '', quantity: '1', purchasePrice: '', sellingPrice: '', discountPercentage: '0', expiryDate: '' });

    useEffect(() => {
        if (initialData) {
            setInfo({ customerName: initialData.customerName, supplierName: initialData.supplierName, invoiceDate: initialData.invoiceDate });
            setItems(initialData.items);
        } else {
            setInfo(defaultInfo);
            setItems([]);
        }
    }, [initialData]);


    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentItem(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentItem.drugName || !currentItem.quantity || !currentItem.purchasePrice || !currentItem.sellingPrice) {
            addToast("لطفا نام دارو، تعداد، قیمت خرید و قیمت فروش را وارد کنید.", 'error');
            return;
        }
        setItems(prev => [...prev, { ...currentItem, id: Date.now(), quantity: Number(currentItem.quantity), purchasePrice: Number(currentItem.purchasePrice), sellingPrice: Number(currentItem.sellingPrice), discountPercentage: Number(currentItem.discountPercentage) }]);
        setCurrentItem({ drugName: '', quantity: '1', purchasePrice: '', sellingPrice: '', discountPercentage: '0', expiryDate: '' });
    };

    const handleRemoveItem = (id: number) => setItems(prev => prev.filter(item => item.id !== id));

    const handleSaveInvoice = () => {
        if (!info.customerName || !info.supplierName || items.length === 0) {
            addToast("لطفا مشتری، تامین‌کننده و حداقل یک قلم دارو را مشخص کنید.", 'error');
            return;
        }
        onSave({ ...info, items }, isEditMode ? initialData.id : undefined);
    };

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => {
            const finalPrice = item.sellingPrice * (1 - item.discountPercentage / 100);
            return sum + (finalPrice * item.quantity);
        }, 0);
    }, [items]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
            <h3 className="text-xl font-bold text-gray-800">{isEditMode ? `ویرایش فاکتور ${initialData.invoiceNumber}` : 'ثبت فاکتور جدید در بخش چکنه'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-bold mb-1">مشتری (ضروری)</label>
                    <input list="customer-list" name="customerName" value={info.customerName} onChange={handleInfoChange} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                    <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">خریداری شده از (ضروری)</label>
                    <input type="text" name="supplierName" value={info.supplierName} onChange={handleInfoChange} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">تاریخ فاکتور</label>
                    <input type="date" name="invoiceDate" value={info.invoiceDate} onChange={handleInfoChange} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                </div>
            </div>

            <form onSubmit={handleAddItem} className="p-4 border border-dashed rounded-lg grid grid-cols-1 lg:grid-cols-7 gap-3 items-end">
                <div className="lg:col-span-2"><label className="text-xs font-semibold">نام دارو</label><input type="text" name="drugName" value={currentItem.drugName} onChange={handleItemChange} className="w-full p-2 border rounded-lg mt-1" required /></div>
                <div><label className="text-xs font-semibold">تعداد</label><input type="number" name="quantity" value={currentItem.quantity} onChange={handleItemChange} min="1" className="w-full p-2 border rounded-lg mt-1" required /></div>
                <div><label className="text-xs font-semibold">قیمت خرید</label><input type="number" name="purchasePrice" value={currentItem.purchasePrice} onChange={handleItemChange} min="0" className="w-full p-2 border rounded-lg mt-1" required /></div>
                <div><label className="text-xs font-semibold">قیمت فروش</label><input type="number" name="sellingPrice" value={currentItem.sellingPrice} onChange={handleItemChange} min="0" className="w-full p-2 border rounded-lg mt-1" required /></div>
                <div><label className="text-xs font-semibold">تخفیف (٪)</label><input type="number" name="discountPercentage" value={currentItem.discountPercentage} onChange={handleItemChange} min="0" max="100" className="w-full p-2 border rounded-lg mt-1" /></div>
                <button type="submit" className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600 h-10 flex items-center justify-center"><PlusIcon /></button>
            </form>

            <div>
                <h4 className="font-bold mb-2">اقلام فاکتور:</h4>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50"><tr><th className="p-2">نام دارو</th><th className="p-2">تعداد</th><th className="p-2">قیمت فروش</th><th className="p-2">مبلغ کل</th><th className="p-2"></th></tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {items.map(item => <tr key={item.id}>
                                <td className="p-2">{item.drugName}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">{item.sellingPrice.toLocaleString()}</td>
                                <td className="p-2 font-semibold">{(item.sellingPrice * (1 - item.discountPercentage / 100) * item.quantity).toLocaleString()}</td>
                                <td className="p-2 text-center"><button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button></td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-xl font-bold">مبلغ نهایی: <span className="text-teal-600">{totalAmount.toLocaleString()}</span> افغانی</div>
                <div className="flex gap-4">
                    {isEditMode && <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">انصراف</button>}
                    <button onClick={handleSaveInvoice} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md">
                        {isEditMode ? 'ذخیره تغییرات' : 'ذخیره و ثبت نهایی فاکتور'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Report Tab ---
const ChecknehReports = ({ invoices, addToast }: { invoices: ChecknehInvoice[], addToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const [reportData, setReportData] = useState<any>(null);

    const handleGenerate = () => {
        if (!filters.startDate || !filters.endDate) { addToast("لطفا بازه زمانی را مشخص کنید.", 'error'); return; }
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = invoices.filter(inv => {
            const invDate = new Date(inv.invoiceDate);
            return invDate >= start && invDate <= end;
        });

        let totalSales = 0, totalCost = 0;
        const allItems = filtered.flatMap(inv => inv.items.map(item => ({ ...item, customerName: inv.customerName, supplierName: inv.supplierName, date: inv.invoiceDate })));
        
        allItems.forEach(item => {
            totalSales += item.sellingPrice * (1 - item.discountPercentage / 100) * item.quantity;
            totalCost += item.purchasePrice * item.quantity;
        });

        setReportData({
            totalSales,
            totalCost,
            netProfit: totalSales - totalCost,
            items: allItems.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        });
    };
    
    return (
         <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-gray-800">گزارشات بخش چکنه</h3>
            <div className="flex gap-4 items-end p-4 bg-gray-50 rounded-lg">
                <div><label className="text-sm font-semibold">از تاریخ</label><input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className="w-full p-2 border rounded mt-1" /></div>
                <div><label className="text-sm font-semibold">تا تاریخ</label><input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className="w-full p-2 border rounded mt-1" /></div>
                <button onClick={handleGenerate} className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 h-10">ایجاد گزارش</button>
            </div>
            {reportData && <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                    <div className="bg-green-100 p-4 rounded-lg"><p className="font-semibold">مجموع فروش</p><p className="text-lg font-bold">{reportData.totalSales.toLocaleString()} افغانی</p></div>
                    <div className="bg-red-100 p-4 rounded-lg"><p className="font-semibold">مجموع هزینه خرید</p><p className="text-lg font-bold">{reportData.totalCost.toLocaleString()} افغانی</p></div>
                    <div className="bg-blue-100 p-4 rounded-lg"><p className="font-semibold">سود خالص</p><p className="text-lg font-bold">{reportData.netProfit.toLocaleString()} افغانی</p></div>
                </div>
                 <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 sticky top-0"><tr>
                            <th className="p-2">تاریخ</th><th className="p-2">نام دارو</th><th className="p-2">تعداد</th><th className="p-2">قیمت خرید</th><th className="p-2">قیمت فروش</th><th className="p-2">سود</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportData.items.map((item, i) => {
                                const saleAmt = item.sellingPrice * (1 - item.discountPercentage / 100) * item.quantity;
                                const costAmt = item.purchasePrice * item.quantity;
                                return (<tr key={i}>
                                    <td className="p-2">{new Date(item.date).toLocaleDateString('fa-IR')}</td>
                                    <td className="p-2">{item.drugName}</td><td className="p-2">{item.quantity}</td>
                                    <td className="p-2">{item.purchasePrice.toLocaleString()}</td><td className="p-2">{item.sellingPrice.toLocaleString()}</td>
                                    <td className="p-2 font-semibold">{(saleAmt - costAmt).toLocaleString()}</td>
                                </tr>);
                            })}
                        </tbody>
                    </table>
                 </div>
            </div>}
        </div>
    );
};

// --- Backup Tab ---
const ChecknehBackup = ({ invoices, setInvoices, addToast, showConfirmation }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleBackup = () => {
        try {
            const data = JSON.stringify(invoices, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `hayat-checkneh-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
            addToast("پشتیبان‌گیری از داده‌های بخش چکنه با موفقیت انجام شد.", 'success');
        } catch (error) {
            addToast("خطا در ایجاد فایل پشتیبان.", 'error');
        }
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        showConfirmation(
            'تایید بازیابی اطلاعات چکنه',
            'آیا مطمئنید؟ با این کار تمام داده‌های فعلی بخش چکنه با اطلاعات فایل پشتیبان جایگزین خواهد شد.',
            () => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const text = e.target?.result as string;
                        const restoredInvoices = JSON.parse(text);
                        // Basic validation
                        if (Array.isArray(restoredInvoices)) {
                            setInvoices(restoredInvoices);
                            addToast('اطلاعات با موفقیت بازیابی شد.', 'success');
                        } else {
                            throw new Error("Invalid file format");
                        }
                    } catch (error) {
                        addToast("خطا در بازیابی اطلاعات از فایل.", 'error');
                    }
                };
                reader.readAsText(file);
            }
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
             <h3 className="text-xl font-bold text-gray-800">پشتیبان‌گیری محلی بخش چکنه</h3>
             <p className="text-sm text-gray-600">از آنجایی که اطلاعات این بخش در سرور ذخیره نمی‌شود، توصیه می‌شود به طور منظم از آن نسخه پشتیبان تهیه کنید.</p>
             <div className="flex gap-4">
                <button onClick={handleBackup} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <DownloadIcon /> ایجاد فایل پشتیبان
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                    <UploadIcon /> بازیابی از فایل
                </button>
                <input type="file" ref={fileInputRef} onChange={handleRestore} className="hidden" accept=".json" />
             </div>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
interface ChecknehProps {
    customers: Customer[];
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    showConfirmation: (title: string, message: React.ReactNode, onConfirm: () => void) => void;
    invoices: ChecknehInvoice[];
    setInvoices: React.Dispatch<React.SetStateAction<ChecknehInvoice[]>>;
}

const Checkneh: React.FC<ChecknehProps> = ({ customers, companyInfo, documentSettings, addToast, showConfirmation, invoices, setInvoices }) => {
    const [activeTab, setActiveTab] = useState<Tab>('invoice_list');
    const [invoiceToPrint, setInvoiceToPrint] = useState<ChecknehInvoice | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<ChecknehInvoice | null>(null);


    const handleSaveOrUpdateInvoice = (invoiceData: Omit<ChecknehInvoice, 'id' | 'invoiceNumber' | 'totalAmount'>, existingId?: number) => {
        const totalAmount = invoiceData.items.reduce((sum, item) => {
            const finalPrice = item.sellingPrice * (1 - item.discountPercentage / 100);
            return sum + (finalPrice * item.quantity);
        }, 0);

        if (existingId) {
            // Update logic
            const updatedInvoice: ChecknehInvoice = {
                ...invoiceData,
                id: existingId,
                invoiceNumber: invoices.find(inv => inv.id === existingId)!.invoiceNumber, // Preserve original invoice number
                totalAmount,
            };
            setInvoices(prev => prev.map(inv => inv.id === existingId ? updatedInvoice : inv));
            addToast("فاکتور با موفقیت ویرایش شد.", 'success');
        } else {
            // Create logic
            const invoiceDateObj = new Date(invoiceData.invoiceDate);
            const year = invoiceDateObj.getFullYear().toString().slice(-2);
            const month = (invoiceDateObj.getMonth() + 1).toString().padStart(2, '0');
            const day = invoiceDateObj.getDate().toString().padStart(2, '0');
            const dailyCount = invoices.filter(inv => inv.invoiceDate === invoiceData.invoiceDate).length + 1;
            const invoiceNumber = `CHK-${year}${month}${day}-${dailyCount.toString().padStart(2, '0')}`;
            
            const finalInvoice: ChecknehInvoice = {
                ...invoiceData,
                id: Date.now(),
                totalAmount,
                invoiceNumber
            };
            setInvoices(prev => [finalInvoice, ...prev].sort((a,b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));
            addToast("فاکتور با موفقیت ذخیره شد.", 'success');
        }
        setEditingInvoice(null);
        setActiveTab('invoice_list');
    };
    
    const handleDeleteInvoice = (id: number) => {
        showConfirmation(
            "تایید حذف فاکتور",
            "آیا از حذف این فاکتور اطمینان دارید؟ این عمل غیرقابل بازگشت است.",
            () => {
                setInvoices(prev => prev.filter(inv => inv.id !== id));
                addToast("فاکتور با موفقیت حذف شد.", 'info');
            }
        );
    };
    
    const handleEditInvoice = (invoice: ChecknehInvoice) => {
        setEditingInvoice(invoice);
        setActiveTab('new_invoice');
    };

    const handleCancelEdit = () => {
        setEditingInvoice(null);
        setActiveTab('invoice_list');
    };

    const TabButton = ({ tabId, children }: { tabId: Tab, children: React.ReactNode }) => (
        <button onClick={() => { setActiveTab(tabId); setEditingInvoice(null); }} className={`px-4 py-2 font-semibold rounded-lg transition-colors ${activeTab === tabId ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {children}
        </button>
    );

    return (
        <div className="p-8">
             <ChecknehInvoicePrintModal isOpen={!!invoiceToPrint} onClose={() => setInvoiceToPrint(null)} invoice={invoiceToPrint} companyInfo={companyInfo} documentSettings={documentSettings} />
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">بخش چکنه (مدیریت دستی)</h2>
                <p className="text-gray-500 mt-1">محیط ایزوله برای ثبت فاکتورهای خارج از موجودی انبار.</p>
            </div>

            <div className="flex gap-4 mb-6 border-b pb-4">
                <TabButton tabId="new_invoice">ثبت فاکتور جدید</TabButton>
                <TabButton tabId="invoice_list">لیست فاکتورها</TabButton>
                <TabButton tabId="reports">گزارشات</TabButton>
                <TabButton tabId="backup">پشتیبان‌گیری</TabButton>
            </div>

            <div>
                {activeTab === 'new_invoice' && <ChecknehInvoiceForm customers={customers} onSave={handleSaveOrUpdateInvoice} addToast={addToast} initialData={editingInvoice} onCancel={handleCancelEdit} />}
                {activeTab === 'invoice_list' && (
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                         <h3 className="text-xl font-bold text-gray-800 mb-4">لیست فاکتورهای چکنه</h3>
                         <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 sticky top-0"><tr>
                                    <th className="p-2">شماره فاکتور</th><th className="p-2">تاریخ</th><th className="p-2">مشتری</th><th className="p-2">تامین‌کننده</th><th className="p-2">مبلغ کل</th><th className="p-2">عملیات</th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-200">
                                {invoices.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center p-6 text-gray-500">هیچ فاکتوری ثبت نشده است.</td></tr>
                                ) : (
                                invoices.map(inv => <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="p-2 font-mono">{inv.invoiceNumber}</td>
                                    <td className="p-2">{new Date(inv.invoiceDate).toLocaleDateString('fa-IR')}</td>
                                    <td className="p-2">{inv.customerName}</td>
                                    <td className="p-2">{inv.supplierName}</td>
                                    <td className="p-2 font-semibold">{inv.totalAmount.toLocaleString()}</td>
                                    <td className="p-2 flex gap-2">
                                        <button onClick={() => handleEditInvoice(inv)} className="text-blue-600 p-1 hover:text-blue-800" title="ویرایش فاکتور"><EditIcon /></button>
                                        <button onClick={() => setInvoiceToPrint(inv)} className="text-blue-600 p-1 hover:text-blue-800" title="چاپ فاکتور"><PrintIcon /></button>
                                        <button onClick={() => handleDeleteInvoice(inv.id)} className="text-red-600 p-1 hover:text-red-800" title="حذف فاکتور"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>)
                                )}
                                </tbody>
                            </table>
                         </div>
                    </div>
                )}
                {activeTab === 'reports' && <ChecknehReports invoices={invoices} addToast={addToast} />}
                {activeTab === 'backup' && <ChecknehBackup invoices={invoices} setInvoices={setInvoices} addToast={addToast} showConfirmation={showConfirmation} />}
            </div>
        </div>
    );
};

export default Checkneh;