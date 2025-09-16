
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Drug } from './Inventory';
import { Supplier } from './Suppliers';
import { User } from './Settings';


//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);
const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
const TrashIcon = ({ className }: { className?: string }) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className} />;
const SearchIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-5 h-5 text-gray-400" />;
const ReturnIcon = () => <Icon path="M9 15l-6-6 6-6" />;


//=========== TYPES ===========//
export type PurchaseStatus = 'دریافت شده' | 'در انتظار' | 'لغو شده';

export type PurchaseItem = {
    drugId: number;
    drugName: string;
    quantity: number;
    purchasePrice: number;
};

export type PurchaseBill = {
    id: number;
    type: 'purchase' | 'purchase_return';
    billNumber: string;
    supplierName: string;
    purchaseDate: string;
    items: PurchaseItem[];
    totalAmount: number;
    amountPaid: number;
    status: PurchaseStatus;
};

//=========== MODAL COMPONENT ===========//
type PurchaseModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (bill: PurchaseBill) => void;
    suppliers: Supplier[];
    drugs: Drug[];
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    mode: 'purchase' | 'return';
    initialData: PurchaseBill | null;
};

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, onSave, suppliers, drugs, addToast, mode, initialData }) => {
    const [billInfo, setBillInfo] = useState({
        supplierName: '', billNumber: '', purchaseDate: new Date().toISOString().split('T')[0], amountPaid: '', status: 'دریافت شده' as PurchaseStatus
    });
    const [items, setItems] = useState<PurchaseItem[]>([]);
    
    // States for adding items
    const [drugSearchTerm, setDrugSearchTerm] = useState('');
    const [addCarton, setAddCarton] = useState('0');
    const [addUnit, setAddUnit] = useState('0');
    const [addPrice, setAddPrice] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const searchWrapperRef = useRef<HTMLFormElement>(null);

    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0), [items]);
    const availableDrugs = useMemo(() => {
        if (!drugSearchTerm) return [];
        return drugs.filter(d => d.name.toLowerCase().includes(drugSearchTerm.toLowerCase())).slice(0, 10);
    }, [drugs, drugSearchTerm]);

    useEffect(() => {
        if (isOpen) {
             if (initialData && mode === 'return') {
                 setBillInfo({ supplierName: initialData.supplierName, billNumber: `RT-${initialData.billNumber}`, purchaseDate: new Date().toISOString().split('T')[0], amountPaid: '0', status: 'دریافت شده' });
                 setItems(initialData.items);
             } else {
                setBillInfo({ supplierName: '', billNumber: '', purchaseDate: new Date().toISOString().split('T')[0], amountPaid: '', status: 'دریافت شده' });
                setItems([]);
                setDrugSearchTerm('');
                setAddCarton('0');
                setAddUnit('0');
                setAddPrice('');
                setSelectedDrug(null);
             }
        }
    }, [isOpen, initialData, mode]);
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) setIsSearchFocused(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchWrapperRef]);

    if (!isOpen) return null;

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setBillInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedDrug) {
            addToast("لطفاً یک دارو را از لیست انتخاب کنید.", "error");
            return;
        }

        const price = Number(addPrice);
        const unitsPerCarton = selectedDrug.unitsPerCarton || 1;
        const totalQuantity = (Number(addCarton) * unitsPerCarton) + Number(addUnit);

        if (totalQuantity <= 0 || price <= 0) {
            addToast("لطفاً تعداد و قیمت خرید معتبر وارد کنید.", 'error');
            return;
        }

        if (items.some(item => item.drugId === selectedDrug.id)) {
            addToast("این دارو قبلا به لیست اضافه شده است.", 'error');
            return;
        }
        
        setItems(prev => [...prev, { drugId: selectedDrug.id, drugName: selectedDrug.name, quantity: totalQuantity, purchasePrice: price }]);
        
        // Reset inputs
        setDrugSearchTerm('');
        setSelectedDrug(null);
        setAddCarton('0');
        setAddUnit('0');
        setAddPrice('');
        setIsSearchFocused(false);
    };
    
     const handleItemQuantityChange = (drugId: number, newQuantityStr: string) => {
        const newQuantity = parseInt(newQuantityStr, 10) || 0;
        if (mode === 'return' && initialData) {
            const originalItem = initialData.items.find(i => i.drugId === drugId);
            if (originalItem && newQuantity > originalItem.quantity) {
                 addToast(`تعداد برگشتی نمی‌تواند بیشتر از تعداد خریداری شده (${originalItem.quantity}) باشد.`, 'error');
                return;
            }
        }
        setItems(currentItems =>
            currentItems.map(it => it.drugId === drugId ? { ...it, quantity: newQuantity } : it)
        );
    };

    const handleRemoveItem = (drugId: number) => {
        setItems(prev => prev.filter(item => item.drugId !== drugId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!billInfo.supplierName || !billInfo.billNumber || items.length === 0) {
            addToast("لطفاً تامین کننده، شماره فاکتور و حداقل یک قلم دارو را وارد کنید.", 'error');
            return;
        }
        
        const finalAmount = mode === 'return' ? -totalAmount : totalAmount;
        const finalPaid = mode === 'return' ? -Number(billInfo.amountPaid) : Number(billInfo.amountPaid);

        const billToSave: PurchaseBill = {
            id: Date.now(),
            ...billInfo,
            // FIX: Mapped modal mode 'return' to the correct data type 'purchase_return'.
            type: mode === 'return' ? 'purchase_return' : 'purchase',
            amountPaid: finalPaid || 0,
            items,
            totalAmount: finalAmount,
        };
        onSave(billToSave);
        onClose();
    };
    
    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{mode === 'purchase' ? 'ثبت فاکتور خرید جدید' : `ثبت مستردی برای فاکتور ${initialData?.billNumber}`}</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label htmlFor="supplierName" className={labelStyles}>تامین کننده</label>
                            <input list="supplier-list" type="text" name="supplierName" value={billInfo.supplierName} onChange={handleInfoChange} className={inputStyles} required autoFocus readOnly={mode === 'return'} />
                            <datalist id="supplier-list">
                                {suppliers.map(s => <option key={s.id} value={s.name} />)}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor="billNumber" className={labelStyles}>شماره فاکتور</label>
                            <input type="text" name="billNumber" value={billInfo.billNumber} onChange={handleInfoChange} className={inputStyles} required />
                        </div>
                        <div>
                            <label htmlFor="purchaseDate" className={labelStyles}>تاریخ</label>
                            <input type="date" name="purchaseDate" value={billInfo.purchaseDate} onChange={handleInfoChange} className={inputStyles} required />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-bold text-gray-700">{mode === 'purchase' ? 'افزودن اقلام به فاکتور' : 'اقلام برگشتی'}</h4>
                        {mode === 'purchase' ? (
                        <form onSubmit={handleAddItem} className="p-2 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-5 gap-3 items-end" ref={searchWrapperRef}>
                            <div className="relative md:col-span-2">
                                <label className="text-xs text-gray-600">۱. جستجوی دارو</label>
                                <input type="text" value={drugSearchTerm} onChange={e => { setDrugSearchTerm(e.target.value); setSelectedDrug(null); }} onFocus={() => setIsSearchFocused(true)} className="w-full p-2 border rounded-lg mt-1" placeholder="نام دارو..." />
                                {isSearchFocused && availableDrugs.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-10 bg-white border shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {availableDrugs.map(drug => (
                                            <div key={drug.id} onClick={() => { setSelectedDrug(drug); setDrugSearchTerm(drug.name); setAddPrice(String(drug.purchasePrice)); setIsSearchFocused(false); }} className="p-2 hover:bg-teal-50 cursor-pointer">
                                                {drug.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-xs text-gray-600">کارتن</label><input type="number" value={addCarton} onChange={e => setAddCarton(e.target.value)} min="0" className="w-full p-2 border rounded-lg mt-1" disabled={!selectedDrug || !selectedDrug.unitsPerCarton || selectedDrug.unitsPerCarton <= 1} /></div>
                                <div><label className="text-xs text-gray-600">عدد</label><input type="number" value={addUnit} onChange={e => setAddUnit(e.target.value)} min="0" className="w-full p-2 border rounded-lg mt-1" /></div>
                            </div>
                            <div><label className="text-xs text-gray-600">قیمت خرید</label><input type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)} min="1" className="w-full p-2 border rounded-lg mt-1" required /></div>
                            <div className="md:col-span-1"><label className="text-xs text-gray-600 invisible">افزودن</label><button type="submit" className="w-full bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600 h-10 flex items-center justify-center"><PlusIcon /> <span className="mr-2">افزودن</span></button></div>
                        </form>
                        ) : (
                            <div className="p-4 border border-dashed rounded-lg">
                                <h4 className="font-bold mb-2">اقلام برگشتی</h4>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-right">
                                            <tr className="border-b">
                                                <th className="p-2 font-semibold">نام دارو</th>
                                                <th className="p-2 font-semibold">تعداد برگشتی</th>
                                                <th className="p-2 font-semibold">قیمت خرید</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(item => (
                                                <tr key={item.drugId} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="p-2">{item.drugName}</td>
                                                    <td className="p-2">
                                                        <input type="number" value={item.quantity} onChange={(e) => handleItemQuantityChange(item.drugId, e.target.value)} className="w-24 text-center border rounded-md py-1" min="0" />
                                                    </td>
                                                    <td className="p-2">{item.purchasePrice.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="max-h-48 overflow-y-auto">
                             {items.length > 0 && <table className="w-full text-sm">
                                <thead className="text-right">
                                    <tr className="border-b">
                                        <th className="p-2 font-semibold">نام دارو</th>
                                        <th className="p-2 font-semibold">تعداد</th>
                                        <th className="p-2 font-semibold">قیمت خرید</th>
                                        <th className="p-2 font-semibold">مبلغ جزء</th>
                                        <th className="p-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                    <tr key={item.drugId} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-2">{item.drugName}</td>
                                        <td className="p-2">{item.quantity}</td>
                                        <td className="p-2">{item.purchasePrice.toLocaleString()}</td>
                                        <td className="p-2 font-semibold">{(item.quantity * item.purchasePrice).toLocaleString()}</td>
                                        <td className="p-2 text-center">
                                            <button type="button" onClick={() => handleRemoveItem(item.drugId)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>}
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                         <div>
                            <label htmlFor="amountPaid" className={labelStyles}>{mode === 'purchase' ? 'مبلغ پرداخت شده' : 'مبلغ بازپرداخت شده'}</label>
                            <input type="number" name="amountPaid" value={billInfo.amountPaid} onChange={handleInfoChange} className={inputStyles} min="0" />
                        </div>
                        <div className="text-right">
                            <p className={labelStyles}>{mode === 'purchase' ? 'مبلغ کل فاکتور' : 'مبلغ کل مستردی'}</p>
                            <p className={`text-2xl font-bold ${mode === 'return' ? 'text-red-600' : 'text-teal-600'}`}>{totalAmount.toLocaleString()} <span className="text-lg">افغانی</span></p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md">
                           {mode === 'return' ? 'ثبت مستردی' : 'ذخیره فاکتور'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
type PurchasingProps = {
    purchaseBills: PurchaseBill[];
    suppliers: Supplier[];
    drugs: Drug[];
    onSave: (bill: PurchaseBill) => void;
    onDelete: (id: number) => void;
    currentUser: User;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};


const Purchasing: React.FC<PurchasingProps> = ({ purchaseBills, suppliers, drugs, onSave, onDelete, currentUser, addToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'purchase' | 'return'>('purchase');
    const [initialModalData, setInitialModalData] = useState<PurchaseBill | null>(null);

    const canManage = useMemo(() => currentUser.role === 'مدیر کل' || currentUser.role === 'انباردار', [currentUser.role]);

    const handleOpenAddModal = () => {
        setInitialModalData(null);
        setModalMode('purchase');
        setIsModalOpen(true);
    };

    const handleOpenReturnModal = (bill: PurchaseBill) => {
        setInitialModalData(bill);
        setModalMode('return');
        setIsModalOpen(true);
    };

    const sortedBills = useMemo(() => {
        return [...purchaseBills].sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    }, [purchaseBills]);
    
    return (
        <div className="p-8">
            {canManage && <PurchaseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSave}
                suppliers={suppliers}
                drugs={drugs}
                addToast={addToast}
                mode={modalMode}
                initialData={initialModalData}
            />}
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-gray-800">خرید و فاکتورها</h2>
                    <p className="text-gray-500">ثبت و مدیریت فاکتورهای خرید از تامین کنندگان.</p>
                </div>
                 {canManage && <button onClick={handleOpenAddModal} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md">
                    <PlusIcon />
                    <span className="mr-2">ثبت فاکتور جدید</span>
                </button>}
            </div>

             <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">شماره فاکتور</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">تامین کننده</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">تاریخ</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مبلغ کل</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مانده</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">وضعیت</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sortedBills.map(bill => {
                                const remaining = bill.totalAmount - bill.amountPaid;
                                const isReturn = bill.type === 'purchase_return';
                                return (
                                <tr key={bill.id} className={`${isReturn ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'} transition-colors`}>
                                    <td className="p-4 font-medium text-gray-800">
                                         <div className='flex items-center gap-2'>
                                            {isReturn && <span className="text-red-600" title="مستردی خرید"><ReturnIcon /></span>}
                                            <span>{bill.billNumber}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500">{bill.supplierName}</td>
                                    <td className="p-4 text-gray-500">{new Date(bill.purchaseDate).toLocaleDateString('fa-IR')}</td>
                                    <td className={`p-4 font-semibold ${isReturn ? 'text-red-600' : 'text-gray-800'}`}>{bill.totalAmount.toLocaleString()}</td>
                                    <td className={`p-4 font-semibold ${remaining > 0 ? 'text-red-600' : 'text-gray-800'}`}>{remaining.toLocaleString()}</td>
                                    <td className="p-4"><span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">{bill.status}</span></td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            {canManage && (
                                                <>
                                                    <button onClick={() => onDelete(bill.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon/></button>
                                                    {!isReturn && <button onClick={() => handleOpenReturnModal(bill)} title="مستردی/برگشت" className="text-yellow-600 hover:text-yellow-800 p-1"><ReturnIcon /></button>}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Purchasing;
