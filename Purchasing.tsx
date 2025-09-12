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
};

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, onSave, suppliers, drugs, addToast }) => {
    const [billInfo, setBillInfo] = useState({
        supplierName: '', billNumber: '', purchaseDate: new Date().toISOString().split('T')[0], amountPaid: '', status: 'دریافت شده' as PurchaseStatus
    });
    const [items, setItems] = useState<PurchaseItem[]>([]);
    
    // States for adding items
    const [drugSearchTerm, setDrugSearchTerm] = useState('');
    const [addQuantity, setAddQuantity] = useState('1');
    const [addPrice, setAddPrice] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0), [items]);
    const availableDrugs = useMemo(() => {
        if (!drugSearchTerm) return [];
        return drugs.filter(d => d.name.toLowerCase().includes(drugSearchTerm.toLowerCase())).slice(0, 10);
    }, [drugs, drugSearchTerm]);

    useEffect(() => {
        if (isOpen) {
            setBillInfo({ supplierName: '', billNumber: '', purchaseDate: new Date().toISOString().split('T')[0], amountPaid: '', status: 'دریافت شده' });
            setItems([]);
            setDrugSearchTerm('');
            setAddQuantity('1');
            setAddPrice('');
        }
    }, [isOpen]);
    
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

    const handleSelectDrug = (drug: Drug) => {
        const quantity = Number(addQuantity);
        const price = Number(addPrice);
        if (!quantity || quantity <= 0 || !price || price <= 0) {
            addToast("لطفاً تعداد و قیمت خرید معتبر وارد کنید.", 'error');
            return;
        }

        const existingItem = items.find(item => item.drugId === drug.id);
        if (existingItem) {
            addToast("این دارو قبلا به لیست اضافه شده است. می‌توانید تعداد آن را ویرایش کنید.", 'error');
            return;
        }
        
        setItems(prev => [...prev, { drugId: drug.id, drugName: drug.name, quantity, purchasePrice: price }]);
        setDrugSearchTerm('');
        setAddQuantity('1');
        setAddPrice('');
        setIsSearchFocused(false);
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

        const billToSave: PurchaseBill = {
            id: Date.now(),
            ...billInfo,
            amountPaid: Number(billInfo.amountPaid) || 0,
            items,
            totalAmount,
        };
        onSave(billToSave);
        onClose();
    };
    
    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">ثبت فاکتور خرید جدید</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label htmlFor="supplierName" className={labelStyles}>تامین کننده</label>
                            <input list="supplier-list" type="text" name="supplierName" value={billInfo.supplierName} onChange={handleInfoChange} className={inputStyles} required autoFocus />
                            <datalist id="supplier-list">
                                {suppliers.map(s => <option key={s.id} value={s.name} />)}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor="billNumber" className={labelStyles}>شماره فاکتور</label>
                            <input type="text" name="billNumber" value={billInfo.billNumber} onChange={handleInfoChange} className={inputStyles} required />
                        </div>
                        <div>
                            <label htmlFor="purchaseDate" className={labelStyles}>تاریخ خرید</label>
                            <input type="date" name="purchaseDate" value={billInfo.purchaseDate} onChange={handleInfoChange} className={inputStyles} required />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-bold text-gray-700">افزودن اقلام به فاکتور</h4>
                        <div className="p-2 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-3 gap-3" ref={searchWrapperRef}>
                            <div className="relative md:col-span-2">
                                <label className="text-xs text-gray-600">جستجوی دارو</label>
                                <input type="text" value={drugSearchTerm} onChange={e => setDrugSearchTerm(e.target.value)} onFocus={() => setIsSearchFocused(true)} placeholder='بخشی از نام دارو...' className={inputStyles} />
                                {isSearchFocused && availableDrugs.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-10 bg-white border shadow-lg mt-1 max-h-60 overflow-y-auto">
                                        {availableDrugs.map(drug => (
                                            <div key={drug.id} onClick={() => handleSelectDrug(drug)} className="p-3 hover:bg-teal-50 cursor-pointer border-b">
                                                <p className="font-semibold text-gray-800">{drug.name}</p>
                                                <p className="text-xs text-gray-500">سازنده: {drug.manufacturer}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-600">تعداد</label>
                                    <input type="number" value={addQuantity} onChange={e => setAddQuantity(e.target.value)} className={inputStyles} min="1" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-600">قیمت خرید</label>
                                    <input type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)} className={inputStyles} min="1" placeholder="فی واحد"/>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                            {items.length === 0 ? <p className="text-center text-gray-500 py-4">هنوز هیچ آیتمی اضافه نشده است.</p> :
                                <table className="w-full text-sm">
                                    <thead className="text-right"><tr className="border-b"><th className="p-2 font-semibold">نام دارو</th><th className="p-2 font-semibold">تعداد</th><th className="p-2 font-semibold">قیمت خرید</th><th className="p-2 font-semibold">مبلغ جزء</th><th className="p-2"></th></tr></thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.drugId} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-2">{item.drugName}</td>
                                                <td className="p-2">{item.quantity.toLocaleString()}</td>
                                                <td className="p-2">{item.purchasePrice.toLocaleString()}</td>
                                                <td className="p-2 font-semibold">{(item.quantity * item.purchasePrice).toLocaleString()}</td>
                                                <td className="p-2 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.drugId)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            }
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                         <div>
                            <label htmlFor="amountPaid" className={labelStyles}>مبلغ پرداخت شده (افغانی)</label>
                            <input type="number" name="amountPaid" value={billInfo.amountPaid} onChange={handleInfoChange} className={inputStyles} min="0" />
                        </div>
                        <div className="text-right">
                            <p className={labelStyles}>مبلغ کل فاکتور</p>
                            <p className="text-2xl font-bold text-teal-600">{totalAmount.toLocaleString()} <span className="text-lg">افغانی</span></p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md">ذخیره فاکتور</button>
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
    const [searchTerm, setSearchTerm] = useState('');

    const canManage = useMemo(() => 
        currentUser.role === 'مدیر کل' || currentUser.role === 'انباردار', 
    [currentUser.role]);

    const filteredBills = useMemo(() => {
        return purchaseBills.filter(bill =>
            bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [purchaseBills, searchTerm]);

    const getStatusStyle = (status: PurchaseStatus) => {
        switch (status) {
            case 'دریافت شده': return { text: 'text-green-700', bg: 'bg-green-100' };
            case 'در انتظار': return { text: 'text-yellow-700', bg: 'bg-yellow-100' };
            case 'لغو شده': return { text: 'text-gray-700', bg: 'bg-gray-100' };
            default: return { text: 'text-gray-700', bg: 'bg-gray-100' };
        }
    };

    return (
        <div className="p-8">
            {canManage && <PurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSave}
                suppliers={suppliers}
                drugs={drugs}
                addToast={addToast}
            />}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">خرید و فاکتورها</h2>
                    <p className="text-gray-500">فاکتورهای خرید از تامین کنندگان را مدیریت کنید.</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="جستجوی فاکتور..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <SearchIcon />
                        </div>
                    </div>
                    {canManage && (
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md">
                            <PlusIcon />
                            <span className="mr-2">ثبت فاکتور جدید</span>
                        </button>
                    )}
                </div>
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
                                <th className="p-4 text-sm font-semibold text-gray-600">پرداختی</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مانده</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">وضعیت</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                             {filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-gray-500">
                                        هیچ فاکتوری با این مشخصات یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map(bill => {
                                    const remaining = bill.totalAmount - bill.amountPaid;
                                    const statusStyle = getStatusStyle(bill.status);
                                    return (
                                    <tr key={bill.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium">{bill.billNumber}</td>
                                        <td className="p-4">{bill.supplierName}</td>
                                        <td className="p-4">{new Date(bill.purchaseDate).toLocaleDateString('fa-IR')}</td>
                                        <td className="p-4 font-semibold">{bill.totalAmount.toLocaleString()}</td>
                                        <td className="p-4 text-green-600">{bill.amountPaid.toLocaleString()}</td>
                                        <td className={`p-4 font-bold ${remaining > 0 ? 'text-red-600' : 'text-gray-800'}`}>{remaining.toLocaleString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{bill.status}</span></td>
                                        <td className="p-4">
                                            {canManage && (
                                                <button onClick={() => onDelete(bill.id)} title="حذف" className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                            )}
                                        </td>
                                    </tr>
                                )})
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Purchasing;
