import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Drug, drugCategories, Batch, formatQuantity } from './Inventory';
import { Customer } from './Customers';
import { CompanyInfo, User, DocumentSettings, RolePermissions } from './Settings';
import { NoPermissionMessage } from './App';

// Declare global libraries
declare var Html5Qrcode: any;

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);

const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
const SearchIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-5 h-5 text-gray-400" />;
const EditIcon = () => <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />;
const TrashIcon = ({ className }: { className?: string }) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className} />;
const CameraIcon = ({ className = "w-6 h-6" } : { className?: string}) => <Icon path="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" className={className} />;
const PrintIcon = () => <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v4H9v-4m4 0h-2" />;
const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const BarcodeScannerIcon = () => <Icon path="M3.75 4.5A.75.75 0 003 5.25v13.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5zm4.5 0a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5zm4.5 0a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5zm4.5 0a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5z" className="w-5 h-5"/>;
const HistoryIcon = ({ className = "w-5 h-5" }: { className?: string}) => <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className={className} />;
const ReturnIcon = () => <Icon path="M9 15l-6-6 6-6" />;


//=========== PERSISTENCE HOOK ===========//
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            if (state === null) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(state));
            }
        } catch (error) {
            console.error(error);
        }
    }, [key, state]);

    return [state, setState];
}


//=========== TYPES ===========//
export type OrderStatus = 'در حال پردازش' | 'ارسال شده' | 'تکمیل شده' | 'لغو شده';
export type PaymentStatus = 'پرداخت شده' | 'پرداخت نشده' | 'قسمتی پرداخت شده';

export type BatchAllocation = {
    lotNumber: string;
    quantity: number;
    purchasePrice: number;
    expiryDate: string;
};

export type OrderItem = {
    drugId: number;
    drugName: string;
    manufacturer?: string;
    code?: string;
    quantity: number;
    bonusQuantity: number;
    originalPrice: number;
    discountPercentage: number;
    finalPrice: number;
    applyDiscountWithBonus?: boolean;
    isPriceOverridden?: boolean;
    batchAllocations?: BatchAllocation[];
};

export type ExtraCharge = {
    id: number;
    description: string;
    amount: number;
};

export type Order = {
    id: number;
    type: 'sale' | 'sale_return';
    orderNumber: string;
    customerName: string;
    orderDate: string;
    items: OrderItem[];
    extraCharges: ExtraCharge[];
    totalAmount: number;
    amountPaid: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    ledgerRefCode?: string;
};

//=========== HELPERS ===========//
const getOrderStatusStyle = (status: OrderStatus) => {
    switch (status) {
        case 'تکمیل شده': return { text: 'text-green-700', bg: 'bg-green-100' };
        case 'ارسال شده': return { text: 'text-blue-700', bg: 'bg-blue-100' };
        case 'در حال پردازش': return { text: 'text-yellow-700', bg: 'bg-yellow-100' };
        case 'لغو شده': return { text: 'text-gray-700', bg: 'bg-gray-100' };
        default: return { text: 'text-gray-700', bg: 'bg-gray-100' };
    }
};

const getPaymentStatusStyle = (status: PaymentStatus) => {
    switch (status) {
        case 'پرداخت شده': return { text: 'text-green-700', bg: 'bg-green-100' };
        case 'قسمتی پرداخت شده': return { text: 'text-yellow-700', bg: 'bg-yellow-100' };
        case 'پرداخت نشده': return { text: 'text-red-700', bg: 'bg-red-100' };
        default: return { text: 'text-gray-700', bg: 'bg-gray-100' };
    }
};

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

// --- NEW HELPER ---
const deconstructQuantity = (totalUnits: number, drug?: Drug) => {
    const unitsPerCarton = drug?.unitsPerCarton || 1;
    const cartonSize = drug?.cartonSize;

    if (!totalUnits || isNaN(totalUnits) || unitsPerCarton <= 1) {
        return { large: 0, small: 0, unit: totalUnits || 0 };
    }

    let remainingUnits = totalUnits;
    let large = 0;
    let small = 0;

    if (cartonSize && cartonSize > 1) {
        const unitsPerLargeCarton = unitsPerCarton * cartonSize;
        large = Math.floor(remainingUnits / unitsPerLargeCarton);
        remainingUnits %= unitsPerLargeCarton;
    }

    small = Math.floor(remainingUnits / unitsPerCarton);
    const unit = remainingUnits % unitsPerCarton;

    return { large, small, unit };
};


//=========== MODAL SUB-COMPONENTS ===========//

// --- NewItemRow for Excel View ---
const NewItemRow = ({ drugs, onAddItem, onOpenQuickAddModal, addToast, mode, initialData }) => {
    const defaultState = { drugName: '', quantity: '1', bonusQuantity: '0', finalPrice: '', discountPercentage: '0' };
    const [newItem, setNewItem] = useState(defaultState);
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const [suggestions, setSuggestions] = useState<Drug[]>([]);
    
    const drugNameInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const bonusQuantityInputRef = useRef<HTMLInputElement>(null);
    const finalPriceInputRef = useRef<HTMLInputElement>(null);
    const discountInputRef = useRef<HTMLInputElement>(null);
    // FIX: Changed ref type from HTMLDivElement to HTMLTableDataCellElement to match the `<td>` element.
    const searchWrapperRef = useRef<HTMLTableDataCellElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchWrapperRef]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setNewItem(prev => ({ ...prev, drugName: term }));
        setSelectedDrug(null);

        if (term) {
            const drugsWithStock = drugs.filter(d => d.batches.some(b => b.quantity > 0));
            setSuggestions(
                (mode === 'sale' ? drugsWithStock : drugs)
                .filter(d => d.name.toLowerCase().includes(term.toLowerCase()))
                .slice(0, 5)
            );
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectSuggestion = (drug: Drug) => {
        setSelectedDrug(drug);
        setSuggestions([]);
        const finalPrice = drug.price * (1 - drug.discountPercentage / 100);
        setNewItem({
            drugName: drug.name,
            quantity: '1',
            bonusQuantity: '0',
            finalPrice: String(finalPrice),
            discountPercentage: String(drug.discountPercentage)
        });
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
    };

    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const target = e.target as HTMLInputElement;
            if (target === discountInputRef.current) {
                handleAddItem();
            } else if (target === drugNameInputRef.current && suggestions.length > 0) {
                 handleSelectSuggestion(suggestions[0]);
            }
        }
    };
    
    const handleAddItem = () => {
        if (!selectedDrug) {
            addToast('لطفاً یک دارو از لیست انتخاب کنید.', 'error');
            return;
        }
        const quantity = Number(newItem.quantity) || 0;
        if (quantity <= 0) {
            addToast('لطفاً تعداد معتبر وارد کنید.', 'error');
            return;
        }

        onAddItem(selectedDrug, {
            quantity: quantity,
            bonusQuantity: Number(newItem.bonusQuantity) || 0,
            finalPrice: Number(newItem.finalPrice) || 0,
            discountPercentage: Number(newItem.discountPercentage) || 0,
        });

        setNewItem(defaultState);
        setSelectedDrug(null);
        drugNameInputRef.current?.focus();
    };

    return (
        <tr className="bg-gray-100">
            <td className="p-2" colSpan={2} ref={searchWrapperRef}>
                <div className="relative">
                    <input ref={drugNameInputRef} type="text" placeholder="جستجوی محصول..." value={newItem.drugName} onChange={handleSearchChange} onKeyDown={handleKeyDown} className="w-full p-1 border rounded-md" />
                    {suggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 z-10 bg-white border shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map(drug => <div key={drug.id} onClick={() => handleSelectSuggestion(drug)} className="p-2 hover:bg-teal-50 cursor-pointer">{drug.name}</div>)}
                        </div>
                    )}
                </div>
            </td>
            <td className="p-2"><input ref={quantityInputRef} type="number" name="quantity" value={newItem.quantity} onChange={handleItemChange} onKeyDown={handleKeyDown} className="w-16 p-1 border rounded-md text-center" min="1"/></td>
            <td className="p-2"><input ref={bonusQuantityInputRef} type="number" name="bonusQuantity" value={newItem.bonusQuantity} onChange={handleItemChange} onKeyDown={handleKeyDown} className="w-16 p-1 border rounded-md text-center" min="0" disabled={mode === 'return'}/></td>
            <td className="p-2"><input ref={finalPriceInputRef} type="number" name="finalPrice" value={newItem.finalPrice} onChange={handleItemChange} onKeyDown={handleKeyDown} className="w-24 p-1 border rounded-md text-center" /></td>
            <td className="p-2"><input ref={discountInputRef} type="number" name="discountPercentage" value={newItem.discountPercentage} onChange={handleItemChange} onKeyDown={handleKeyDown} className="w-20 p-1 border rounded-md text-center" min="0" max="100"/></td>
            <td className="p-2 font-semibold">
                {(Number(newItem.finalPrice) * Number(newItem.quantity)).toLocaleString(undefined, {maximumFractionDigits: 0})}
            </td>
            <td className="p-2 text-center">
                <button type="button" onClick={handleAddItem} className="p-1 bg-teal-500 text-white rounded-full hover:bg-teal-600"><PlusIcon /></button>
            </td>
        </tr>
    );
};

// --- Excel View ---
const ExcelView = ({ items, drugs, handleQuantityChange, handleBonusQuantityChange, handleRemoveItem, handleAddItemFromExcel, addToast, onOpenQuickAddModal, mode, initialData }) => {
    return (
        <div className="space-y-4 rounded-lg border border-gray-200 p-4 h-full flex flex-col">
             <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-right">
                    <thead><tr className="border-b"><th className="p-2" colSpan={2}>نام دارو</th><th className="p-2">تعداد</th><th className="p-2">بونس</th><th className="p-2">قیمت واحد</th><th className="p-2">تخفیف (٪)</th><th className="p-2">مبلغ جزء</th><th className="p-2"></th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.map(item => (
                             <tr key={item.drugId}>
                                <td className="p-2" colSpan={2}>{item.drugName}</td>
                                <td className="p-2"><input type="number" value={item.quantity} onChange={e => handleQuantityChange(item.drugId, e.target.value)} className="w-16 p-1 border rounded-md text-center" min="0"/></td>
                                <td className="p-2"><input type="number" value={item.bonusQuantity} onChange={e => handleBonusQuantityChange(item.drugId, e.target.value)} className="w-16 p-1 border rounded-md text-center" min="0" disabled={mode === 'return'}/></td>
                                <td className="p-2">{item.finalPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                <td className="p-2">{item.discountPercentage.toFixed(1)}%</td>
                                <td className="p-2 font-semibold">{(item.finalPrice * item.quantity).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveItem(item.drugId)} className="text-red-500 p-1"><TrashIcon className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <NewItemRow drugs={drugs} onAddItem={handleAddItemFromExcel} addToast={addToast} onOpenQuickAddModal={onOpenQuickAddModal} mode={mode} initialData={initialData}/>
                    </tfoot>
                </table>
             </div>
        </div>
    );
};

// --- Modern View ---
const ModernView = ({ items, drugs, customers, orders, orderInfo, initialData, mode, permissions, handleQuantityChange, handleBonusQuantityChange, handleRemoveItem, handleApplyDiscountToggle, handleDragStart, historyVisibleForDrugId, setHistoryVisibleForDrugId, lastPurchaseHistory, catalogSearchTerm, setCatalogSearchTerm, setIsScannerOpen, catalogCategory, setCatalogCategory, availableDrugsForCatalog, handleAddFromCatalog }) => {
    return (
         <div className="flex-1 overflow-hidden flex flex-row">
            {/* LEFT PANEL: PRODUCT CATALOG */}
            <div className="w-1/3 border-l p-4 flex flex-col bg-gray-50">
                <h4 className="font-bold text-lg text-gray-800 mb-4">کاتالوگ محصولات</h4>
                <div className="flex gap-2 mb-4">
                    <input type="text" placeholder="جستجوی نام یا شرکت..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                    <button type="button" onClick={() => setIsScannerOpen(true)} title="اسکن با دوربین" className="p-2 border rounded-lg bg-white hover:bg-gray-100"><BarcodeScannerIcon /></button>
                </div>
                <select value={catalogCategory} onChange={e => setCatalogCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white mb-4">
                    <option value="all">همه دسته‌بندی‌ها</option>{drugCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div className="flex-1 overflow-y-auto -mx-4 px-4">
                    {availableDrugsForCatalog.map(drug => (
                        <div key={drug.id} onClick={() => handleAddFromCatalog(drug)} className="p-3 border-b bg-white hover:bg-teal-50 cursor-pointer rounded-md mb-2 shadow-sm">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-gray-800">{drug.name}</p>
                                <span className="text-xs font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{formatQuantity(drug.totalStock, drug.unitsPerCarton, drug.cartonSize)}</span>
                            </div>
                            <p className="text-xs text-gray-500">{drug.manufacturer}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* RIGHT PANEL: ORDER FORM */}
            <div className="w-2/3 overflow-y-auto p-6">
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                    <h4 className="font-bold text-gray-700">{mode === 'return' ? 'اقلام برگشتی' : 'اقلام سفارش'}</h4>
                    <div className="max-h-48 overflow-y-auto">
                        {items.length === 0 ? <p className="text-center text-gray-500 py-4">برای شروع، محصولی را از کاتالوگ اضافه کنید.</p> :
                            <table className="w-full text-sm">
                                <thead><tr className="border-b"><th className="p-2 font-semibold">نام دارو</th><th className="p-2 font-semibold text-center w-56">{mode === 'return' ? 'تعداد برگشتی' : 'تعداد (فروش / بونس)'}</th><th className="p-2 font-semibold">قیمت واحد</th><th className="p-2 font-semibold">مبلغ جزء</th><th className="p-2 text-center">{mode === 'sale' ? 'سابقه' : ''}</th><th className="p-2"></th></tr></thead>
                                <tbody>
                                    {items.map(item => {
                                        const drugInStock = drugs.find(d => d.id === item.drugId);
                                        const deconstructedQty = deconstructQuantity(item.quantity, drugInStock);
                                        const deconstructedBonus = deconstructQuantity(item.bonusQuantity, drugInStock);

                                        const handleCartonBasedChange = (isBonus: boolean, field: 'large' | 'small' | 'unit', value: string) => {
                                            if (!drugInStock) return;
                                            const numValue = Number(value) || 0;
                                            const currentDeconstructed = isBonus ? deconstructedBonus : deconstructedQty;
                                            const newLarge = field === 'large' ? numValue : currentDeconstructed.large;
                                            const newSmall = field === 'small' ? numValue : currentDeconstructed.small;
                                            const newUnit = field === 'unit' ? numValue : currentDeconstructed.unit;
                                            const unitsPerCarton = drugInStock.unitsPerCarton || 1;
                                            const cartonSize = drugInStock.cartonSize || 1;
                                            const unitsPerLargeCarton = unitsPerCarton * cartonSize;
                                            const newTotal = (newLarge * unitsPerLargeCarton) + (newSmall * unitsPerCarton) + newUnit;
                                            if (isBonus) { handleBonusQuantityChange(item.drugId, String(newTotal)); } else { handleQuantityChange(item.drugId, String(newTotal)); }
                                        };

                                        const pricePerUnit = item.isPriceOverridden ? item.finalPrice : (item.bonusQuantity > 0 && !item.applyDiscountWithBonus) ? item.originalPrice : item.finalPrice;
                                        const history = lastPurchaseHistory.get(item.drugId);
                                        return (
                                        <React.Fragment key={item.drugId}>
                                        <tr className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="p-2">{item.drugName}</td>
                                            <td className="p-2">
                                                <div className="grid grid-cols-3 gap-1">
                                                    <input type="number" value={deconstructedQty.large || ''} onChange={e => handleCartonBasedChange(false, 'large', e.target.value)} className="w-full text-center border rounded-md py-1" min="0" placeholder="بزرگ" title="کارتن بزرگ" disabled={!drugInStock?.cartonSize} />
                                                    <input type="number" value={deconstructedQty.small || ''} onChange={e => handleCartonBasedChange(false, 'small', e.target.value)} className="w-full text-center border rounded-md py-1" min="0" placeholder="کوچک" title="کارتن کوچک" disabled={!drugInStock?.unitsPerCarton} />
                                                    <input type="number" value={deconstructedQty.unit || ''} onChange={e => handleCartonBasedChange(false, 'unit', e.target.value)} className="w-full text-center border rounded-md py-1" min="0" placeholder="عدد" title="عدد" />
                                                </div>
                                                {mode === 'sale' &&
                                                    <div className="grid grid-cols-3 gap-1 mt-1">
                                                        <input type="number" value={deconstructedBonus.large || ''} onChange={e => handleCartonBasedChange(true, 'large', e.target.value)} className="w-full text-center border rounded-md py-1 bg-yellow-50" min="0" placeholder="بونس" title="بونس کارتن بزرگ" disabled={!drugInStock?.cartonSize} />
                                                        <input type="number" value={deconstructedBonus.small || ''} onChange={e => handleCartonBasedChange(true, 'small', e.target.value)} className="w-full text-center border rounded-md py-1 bg-yellow-50" min="0" placeholder="بونس" title="بونس کارتن کوچک" disabled={!drugInStock?.unitsPerCarton} />
                                                        <input type="number" value={deconstructedBonus.unit || ''} onChange={e => handleCartonBasedChange(true, 'unit', e.target.value)} className="w-full text-center border rounded-md py-1 bg-yellow-50" min="0" placeholder="بونس" title="بونس عدد" />
                                                    </div>
                                                }
                                                {mode === 'sale' && item.bonusQuantity > 0 && item.discountPercentage > 0 && (
                                                    <div className="text-center mt-1">
                                                        <label className="flex items-center justify-center gap-1.5 cursor-pointer text-xs text-gray-600">
                                                            <input type="checkbox" checked={!!item.applyDiscountWithBonus} onChange={e => handleApplyDiscountToggle(item.drugId, e.target.checked)} className="form-checkbox h-3.5 w-3.5 text-teal-600" />
                                                            اعمال تخفیف با بونس
                                                        </label>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 relative">
                                                <div className="flex items-center justify-center gap-2 group h-full">
                                                    {(item.bonusQuantity > 0 && !item.applyDiscountWithBonus) ? (
                                                        <div className="flex items-center gap-2"><span className="font-bold text-gray-800">{item.originalPrice.toLocaleString()}</span><span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full" title="چون بونس اعمال شده، تخفیف نادیده گرفته شد">بونس</span></div>
                                                    ) : item.discountPercentage > 0 ? (
                                                        <div className="flex items-center gap-2"><span className="text-gray-500 line-through">{item.originalPrice.toLocaleString()}</span><span className="font-bold text-teal-600">{item.finalPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</span><span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item.discountPercentage.toFixed(1)}%</span></div>
                                                    ) : (<span className="font-bold">{item.originalPrice.toLocaleString()}</span>)}
                                                    {permissions.canGiveManualDiscount && (<div onMouseDown={(e) => handleDragStart(e, item)} className="absolute right-[-10px] top-0 h-full w-5 flex items-center justify-center cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity" title="برای تخفیف، پایین بکشید"><div className="w-1 h-6 bg-gray-300 rounded-full group-active:bg-teal-500"></div></div>)}
                                                </div>
                                            </td>
                                            <td className="p-2 font-semibold">{(item.quantity * pricePerUnit).toLocaleString()}</td>
                                            <td className="p-2 text-center">{mode === 'sale' && <button type="button" onClick={() => setHistoryVisibleForDrugId(historyVisibleForDrugId === item.drugId ? null : item.drugId)} className={`p-1 rounded-full ${historyVisibleForDrugId === item.drugId ? 'bg-blue-200 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="نمایش سابقه خرید مشتری"><HistoryIcon /></button>}</td>
                                            <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveItem(item.drugId)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button></td>
                                        </tr>
                                        {historyVisibleForDrugId === item.drugId && (
                                            <tr className="bg-blue-50 transition-all"><td colSpan={6} className="p-3 text-xs">
                                                {history ? (<div className="flex justify-around items-center"><span className="font-semibold">آخرین خرید در تاریخ {new Date(history.orderDate).toLocaleDateString('fa-IR')}:</span><span><span className="font-semibold">{history.quantity}</span> عدد</span><span>بونس: <span className="font-semibold">{history.bonusQuantity > 0 ? history.bonusQuantity : 'نداشت'}</span></span><span>تخفیف: <span className="font-semibold">{history.discountPercentage > 0 ? `${history.discountPercentage}%` : 'نداشت'}</span></span><span>قیمت نهایی: <span className="font-semibold">{history.finalPrice.toLocaleString()}</span></span></div>) : (<p className="text-center text-gray-600">سابقه خریدی برای این مشتری یافت نشد.</p>)}
                                            </td></tr>
                                        )}
                                        </React.Fragment>
                                    )})}
                                </tbody>
                            </table>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

//=========== MODAL COMPONENTS ===========//

type BarcodeScannerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
};

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    useEffect(() => {
        if (!isOpen) return;

        const html5QrCode = new Html5Qrcode("sales-reader");
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
            }).catch(err => {
                console.error("Failed to stop scanner on success.", err);
                onScanSuccess(decodedText); 
            });
        };
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, (errorMessage) => {})
            .catch((err) => {
                console.error("Unable to start scanning.", err);
            });

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.log("Scanner cleanup failed.", err));
            }
        };
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-center mb-4">اسکن بارکد / QR کد محصول</h3>
                <div id="sales-reader" className="w-full"></div>
                <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-200 rounded-lg">انصراف</button>
            </div>
        </div>
    );
};

type OrderModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Order) => void;
    initialData: Order | null;
    drugs: Drug[];
    customers: Customer[];
    orders: Order[];
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    mode: 'sale' | 'return';
    onOpenQuickAddModal: () => void;
    permissions: {
        canGiveManualDiscount: boolean;
        maxDiscountPercentage: number;
    };
};

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, initialData, drugs, customers, orders, addToast, mode, onOpenQuickAddModal, permissions }) => {
    
    const [orderInfo, setOrderInfo] = useState({
        customerName: '', amountPaid: '' as number | '', status: 'ارسال شده' as OrderStatus,
    });
    const [items, setItems] = useState<OrderItem[]>([]);
    const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
    const [newCharge, setNewCharge] = useState({ description: '', amount: '' });
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
    const [catalogCategory, setCatalogCategory] = useState('all');
    const [historyVisibleForDrugId, setHistoryVisibleForDrugId] = useState<number | null>(null);

    const [dragState, setDragState] = useState<{
        itemId: number | null;
        startY: number;
        startPrice: number;
        originalPrice: number;
    }>({ itemId: null, startY: 0, startPrice: 0, originalPrice: 0 });

    const [viewMode, setViewMode] = usePersistentState<'modern' | 'excel'>('hayat_orderViewMode', 'modern');

    const isEditMode = initialData !== null && mode === 'sale';

    const totalAmount = useMemo(() => {
        const itemsTotal = items.reduce((sum, item) => {
            const pricePerUnit = item.isPriceOverridden
                ? item.finalPrice
                : (item.bonusQuantity > 0 && !item.applyDiscountWithBonus)
                    ? item.originalPrice
                    : item.finalPrice;
            return sum + (item.quantity * pricePerUnit);
        }, 0);
        const chargesTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
        const rawTotal = itemsTotal + chargesTotal;
        return Math.round(rawTotal * 100) / 100;
    }, [items, extraCharges]);

    const availableDrugsForCatalog = useMemo(() => {
        return drugs
            .map(d => ({
                ...d,
                totalStock: d.batches.reduce((sum, b) => sum + b.quantity, 0)
            }))
            .filter(d => (mode === 'sale' ? d.totalStock > 0 : true))
            .filter(d => catalogSearchTerm === '' || d.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) || d.manufacturer.toLowerCase().includes(catalogSearchTerm.toLowerCase()))
            .filter(d => catalogCategory === 'all' || d.category === catalogCategory);
    }, [drugs, catalogSearchTerm, catalogCategory, mode]);
    

    const lastPurchaseHistory = useMemo(() => {
        const historyMap = new Map<number, OrderItem & { orderDate: string }>();
        if (!orderInfo.customerName) return historyMap;

        const customerOrders = orders
            .filter(o => o.customerName === orderInfo.customerName && o.id !== initialData?.id)
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

        for (const order of customerOrders) {
            for (const item of order.items) {
                if (!historyMap.has(item.drugId)) {
                    historyMap.set(item.drugId, { ...item, orderDate: order.orderDate });
                }
            }
        }
        return historyMap;
    }, [orders, orderInfo.customerName, initialData]);
    
    useEffect(() => {
        if (isOpen) {
             if (initialData) {
                setOrderInfo({ customerName: initialData.customerName, amountPaid: initialData.amountPaid, status: initialData.status });
                setItems(initialData.items.map(item => ({...item, bonusQuantity: item.bonusQuantity || 0})));
                setExtraCharges(initialData.extraCharges || []);
                if(mode === 'return') {
                     setOrderInfo(prev => ({...prev, status: 'تکمیل شده'}));
                }
            } else {
                setOrderInfo({ customerName: '', amountPaid: '', status: 'ارسال شده' });
                setItems([]);
                setExtraCharges([]);
            }
            setNewCharge({ description: '', amount: '' });
            setCatalogSearchTerm('');
            setCatalogCategory('all');
            setHistoryVisibleForDrugId(null);
        }
    }, [isOpen, initialData, mode]);

    const handleDragStart = (e: React.MouseEvent, item: OrderItem) => {
        e.preventDefault();
        if (!permissions.canGiveManualDiscount) return;
        setDragState({
            itemId: item.drugId,
            startY: e.clientY,
            startPrice: item.finalPrice,
            originalPrice: item.originalPrice
        });
    };

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (dragState.itemId === null) return;

        const deltaY = e.clientY - dragState.startY;
        let newFinalPrice = dragState.startPrice - deltaY; 

        if (newFinalPrice > dragState.originalPrice) newFinalPrice = dragState.originalPrice;
        if (newFinalPrice < 0) newFinalPrice = 0;

        let calculatedDiscount = 0;
        if (dragState.originalPrice > 0) {
            calculatedDiscount = ((dragState.originalPrice - newFinalPrice) / dragState.originalPrice) * 100;
        }
        
        if (calculatedDiscount > permissions.maxDiscountPercentage) {
            newFinalPrice = dragState.originalPrice * (1 - (permissions.maxDiscountPercentage / 100));
            calculatedDiscount = permissions.maxDiscountPercentage;
        }

        setItems(currentItems =>
            currentItems.map(it => {
                if (it.drugId === dragState.itemId) {
                    return {
                        ...it,
                        finalPrice: newFinalPrice,
                        discountPercentage: Math.round(calculatedDiscount * 100) / 100,
                        isPriceOverridden: true,
                    };
                }
                return it;
            })
        );
    }, [dragState, permissions.maxDiscountPercentage, setItems]);

    const handleDragEnd = useCallback(() => {
        setDragState({ itemId: null, startY: 0, startPrice: 0, originalPrice: 0 });
    }, []);

    useEffect(() => {
        if (dragState.itemId !== null) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [dragState.itemId, handleDragMove, handleDragEnd]);


    if (!isOpen) return null;

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'amountPaid') {
            setOrderInfo(prev => ({ ...prev, amountPaid: value === '' ? '' : Number(value) }));
        } else if (name === 'customerName' || name === 'status') {
            setOrderInfo(prev => ({ ...prev, [name]: value as OrderStatus | string }));
        }
    };

    const addItemToOrder = (drug: Drug, quantity: number, bonus: number = 0) => {
         const existingItemIndex = items.findIndex(item => item.drugId === drug.id);
         const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
         const totalRequired = existingItemIndex > -1 ? items[existingItemIndex].quantity + quantity + (items[existingItemIndex].bonusQuantity || 0) + bonus : quantity + bonus;

         if (mode === 'sale' && totalRequired > totalStock) {
            addToast(`تعداد درخواستی (${totalRequired}) بیشتر از موجودی انبار (${totalStock}) است.`, 'error');
            return false;
         }
        
         if (mode === 'return') {
            const originalItem = initialData?.items.find(i => i.drugId === drug.id);
            if (!originalItem || totalRequired > originalItem.quantity) {
                addToast(`تعداد برگشتی (${totalRequired}) نمی‌تواند بیشتر از تعداد فروخته شده (${originalItem?.quantity || 0}) باشد.`, 'error');
                return false;
            }
        }

        if (existingItemIndex > -1) {
            const updatedItems = [...items];
            updatedItems[existingItemIndex].quantity += quantity;
            updatedItems[existingItemIndex].bonusQuantity += bonus;
            setItems(updatedItems);
        } else {
            const finalPrice = drug.price * (1 - drug.discountPercentage / 100);
            setItems(prev => [...prev, {
                drugId: drug.id,
                drugName: drug.name,
                manufacturer: drug.manufacturer,
                code: drug.code,
                quantity: quantity,
                bonusQuantity: bonus,
                originalPrice: drug.price,
                discountPercentage: drug.discountPercentage,
                finalPrice: finalPrice,
                applyDiscountWithBonus: false,
                isPriceOverridden: false
            }]);
        }
        return true;
    }

    const handleAddItemFromExcel = (drug: Drug, itemDetails: { quantity: number; bonusQuantity: number; finalPrice: number; discountPercentage: number; }) => {
        const { quantity, bonusQuantity, finalPrice, discountPercentage } = itemDetails;
        const existingItemIndex = items.findIndex(item => item.drugId === drug.id);
        const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
        const totalRequired = existingItemIndex > -1 
            ? items[existingItemIndex].quantity + quantity + (items[existingItemIndex].bonusQuantity || 0) + bonusQuantity 
            : quantity + bonusQuantity;
        
        if (mode === 'sale' && totalRequired > totalStock) {
            addToast(`تعداد درخواستی (${totalRequired}) بیشتر از موجودی انبار (${totalStock}) است.`, 'error');
            return false;
        }

        if (existingItemIndex > -1) {
             const updatedItems = [...items];
             updatedItems[existingItemIndex].quantity += quantity;
             updatedItems[existingItemIndex].bonusQuantity += bonusQuantity;
             setItems(updatedItems);
        } else {
             setItems(prev => [...prev, {
                drugId: drug.id, drugName: drug.name, manufacturer: drug.manufacturer, code: drug.code,
                quantity, bonusQuantity, originalPrice: drug.price, discountPercentage, finalPrice,
                applyDiscountWithBonus: false, isPriceOverridden: drug.price !== finalPrice
             }]);
        }
        return true;
    };
    
    const handleAddFromCatalog = (drug: Drug) => {
        if (addItemToOrder(drug, 1)) {
           // Success feedback can be added here if needed
        }
    };
    
    const handleScanSuccess = (barcode: string) => {
        setIsScannerOpen(false);
        const drug = drugs.find(d => d.barcode === barcode);
        if (drug) {
            addItemToOrder(drug, 1);
        } else {
            addToast("محصولی با این بارکد یافت نشد.", 'error');
        }
    };
    
    const handleRemoveItem = (drugId: number) => {
        setItems(prev => prev.filter(item => item.drugId !== drugId));
    };

    const handleQuantityChange = (drugId: number, newQuantityStr: string) => {
        const newQuantity = parseInt(newQuantityStr, 10) || 0;
        const item = items.find(i => i.drugId === drugId);
        if (!item) return;

        const drugInStock = drugs.find(d => d.id === drugId);
        const totalStock = drugInStock ? drugInStock.batches.reduce((sum, b) => sum + b.quantity, 0) : 0;

        if (mode === 'sale' && drugInStock && (newQuantity + item.bonusQuantity) > totalStock) {
            addToast(`مجموع تعداد فروش و بونس (${newQuantity + item.bonusQuantity}) بیشتر از موجودی انبار (${totalStock}) است.`, 'error');
            return;
        }

        if (mode === 'return' && initialData) {
            const originalItem = initialData.items.find(i => i.drugId === drugId);
            if (originalItem && newQuantity > originalItem.quantity) {
                addToast(`تعداد برگشتی نمی‌تواند بیشتر از تعداد فروخته شده (${originalItem.quantity}) باشد.`, 'error');
                return;
            }
        }

        setItems(currentItems =>
            currentItems.map(it => it.drugId === drugId ? { ...it, quantity: newQuantity } : it)
        );
    };
    
    const handleBonusQuantityChange = (drugId: number, newBonusQuantityStr: string) => {
        if (mode === 'return') return;

        const newBonusQuantity = parseInt(newBonusQuantityStr, 10) || 0;
        const item = items.find(i => i.drugId === drugId);
        if (!item) return;

        const drugInStock = drugs.find(d => d.id === drugId);
        const totalStock = drugInStock ? drugInStock.batches.reduce((sum, b) => sum + b.quantity, 0) : 0;
        if (drugInStock && (item.quantity + newBonusQuantity) > totalStock) {
            addToast(`مجموع تعداد فروش و بونس (${item.quantity + newBonusQuantity}) بیشتر از موجودی انبار (${totalStock}) است.`, 'error');
            return;
        }

        setItems(currentItems =>
            currentItems.map(it => it.drugId === drugId ? { ...it, bonusQuantity: newBonusQuantity } : it)
        );
    };
    
    const handleApplyDiscountToggle = (drugId: number, isChecked: boolean) => {
        setItems(currentItems =>
            currentItems.map(it => it.drugId === drugId ? { ...it, applyDiscountWithBonus: isChecked } : it)
        );
    };

    const handleAddCharge = () => {
        const amount = Number(newCharge.amount);
        if (!newCharge.description.trim() || !amount || amount <= 0) {
            addToast("لطفا شرح و مبلغ معتبر برای هزینه وارد کنید.", 'error');
            return;
        }
        setExtraCharges(prev => [...prev, { id: Date.now(), description: newCharge.description, amount }]);
        setNewCharge({ description: '', amount: '' });
    };

    const handleRemoveCharge = (id: number) => {
        setExtraCharges(prev => prev.filter(charge => charge.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amountPaid = Number(orderInfo.amountPaid) || 0;

        if (!orderInfo.customerName || items.length === 0) {
            addToast("لطفاً نام مشتری را وارد کرده و حداقل یک قلم دارو به سفارش اضافه کنید.", 'error');
            return;
        }

        if (items.some(item => item.quantity < 0 || item.bonusQuantity < 0)) {
            addToast("تعداد فروش یا بونس نمی‌تواند منفی باشد.", 'error');
            return;
        }
        
         if (items.some(item => item.quantity === 0 && item.bonusQuantity > 0)) {
            addToast("نمی‌توان برای محصولی که فروخته نشده، بونس ثبت کرد. لطفاً حداقل یک عدد در تعداد فروش وارد کنید.", 'error');
            return;
        }
        
        const finalAmount = mode === 'return' ? -totalAmount : totalAmount;
        const finalPaid = mode === 'return' ? -amountPaid : amountPaid;

        let paymentStatus: PaymentStatus;
        if (finalPaid <= 0 && finalAmount > 0) {
            paymentStatus = 'پرداخت نشده';
        } else if (finalPaid >= finalAmount) {
            paymentStatus = 'پرداخت شده';
        } else {
            paymentStatus = 'قسمتی پرداخت شده';
        }

        const finalOrderData: Order = {
            id: isEditMode ? initialData!.id : Date.now(),
            type: mode === 'return' ? 'sale_return' : 'sale',
            orderNumber: isEditMode ? initialData!.orderNumber : (initialData?.orderNumber || ''), 
            orderDate: isEditMode ? initialData!.orderDate : new Date().toISOString().split('T')[0],
            customerName: orderInfo.customerName,
            status: orderInfo.status,
            amountPaid: finalPaid,
            items,
            extraCharges,
            totalAmount: finalAmount,
            paymentStatus
        };
        onSave(finalOrderData);
        onClose();
    };

    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    const modalTitle = mode === 'return' ? `ثبت مستردی برای فاکتور ${initialData?.orderNumber}` : isEditMode ? 'ویرایش سفارش' : 'ثبت سفارش جدید';
    
    const modernViewProps = { items, drugs, customers, orders, orderInfo, initialData, mode, permissions, handleQuantityChange, handleBonusQuantityChange, handleRemoveItem, handleApplyDiscountToggle, handleDragStart, historyVisibleForDrugId, setHistoryVisibleForDrugId, lastPurchaseHistory, catalogSearchTerm, setCatalogSearchTerm, setIsScannerOpen, catalogCategory, setCatalogCategory, availableDrugsForCatalog, handleAddFromCatalog };
    const excelViewProps = { items, drugs, handleQuantityChange, handleBonusQuantityChange, handleRemoveItem, handleAddItemFromExcel, addToast, onOpenQuickAddModal, mode, initialData };


    return (
        <>
        <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800">{modalTitle}</h3>
                     <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><CloseIcon /></button>
                </header>
                <form id="order-modal-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-6 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="customerName" className={labelStyles}>نام مشتری</label>
                                <input list="customer-list" type="text" name="customerName" value={orderInfo.customerName} onChange={handleInfoChange} className={`${inputStyles} bg-gray-100`} required readOnly={mode==='return'} />
                                <datalist id="customer-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                            </div>
                            <div>
                                <label htmlFor="status" className={labelStyles}>وضعیت</label>
                                <select name="status" value={orderInfo.status} onChange={handleInfoChange} className={inputStyles} disabled={mode === 'return'}>
                                    {mode === 'sale' && <><option value="در حال پردازش">در حال پردازش</option><option value="ارسال شده">ارسال شده</option></>}
                                    <option value="تکمیل شده">تکمیل شده</option><option value="لغو شده">لغو شده</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <main className="flex-1 overflow-hidden px-6">
                        {viewMode === 'modern' ? <ModernView {...modernViewProps} /> : <ExcelView {...excelViewProps} />}
                    </main>
                    <div className="p-6 space-y-6">
                         {mode === 'sale' && (
                            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                                <h4 className="font-bold text-gray-700">هزینه‌های اضافی</h4>
                                {extraCharges.length > 0 && (
                                    <div className="max-h-32 overflow-y-auto"><ul className="divide-y">{extraCharges.map(charge => (<li key={charge.id} className="py-2 flex justify-between items-center text-sm"><div><p className="font-semibold">{charge.description}</p></div><div className="flex items-center gap-4"><p className="text-gray-800 font-semibold">{charge.amount.toLocaleString()} افغانی</p><button type="button" onClick={() => handleRemoveCharge(charge.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button></div></li>))}</ul></div>
                                )}
                                <div className="flex gap-2 items-end pt-2 border-t">
                                    <div className="flex-grow"><label className="text-xs font-semibold text-gray-600">شرح هزینه</label><input type="text" value={newCharge.description} onChange={e => setNewCharge(p => ({...p, description: e.target.value}))} className={inputStyles} placeholder="مثلا: کرایه حمل" /></div>
                                    <div className="w-32"><label className="text-xs font-semibold text-gray-600">مبلغ</label><input type="number" value={newCharge.amount} onChange={e => setNewCharge(p => ({...p, amount: e.target.value}))} className={inputStyles} placeholder="200" /></div>
                                    <button type="button" onClick={handleAddCharge} className="px-4 h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold">افزودن</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <label htmlFor="amountPaid" className={labelStyles}>{mode === 'return' ? 'مبلغ بازپرداخت شده' : 'مبلغ پرداخت شده'} (افغانی)</label>
                                <input type="number" name="amountPaid" value={orderInfo.amountPaid} onChange={handleInfoChange} className={inputStyles} min="0" placeholder="مثلا: 5000" />
                            </div>
                            <div className="text-right">
                                <p className={labelStyles}>{mode === 'return' ? 'مبلغ کل مستردی' : 'مبلغ کل سفارش'}</p>
                                <p className={`text-2xl font-bold ${mode === 'return' ? 'text-red-600' : 'text-teal-600'}`}>{totalAmount.toLocaleString()} <span className="text-lg">افغانی</span></p>
                            </div>
                        </div>
                    </div>
                </form>
                <footer className="p-6 flex-shrink-0 border-t border-gray-200 flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={viewMode === 'excel'} onChange={e => setViewMode(e.target.checked ? 'excel' : 'modern')} className="form-checkbox h-4 w-4 text-teal-600 rounded focus:ring-teal-500" />
                        حالت اکسلی
                    </label>
                    <div className="flex space-x-4 space-x-reverse">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors">انصراف</button>
                        <button type="submit" form="order-modal-form" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-md hover:shadow-lg">
                           {mode === 'return' ? 'ثبت مستردی' : (isEditMode ? 'ذخیره تغییرات' : 'ذخیره سفارش')}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
        </>
    );
};

type PrintPreviewModalProps = {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    customer: Customer | null;
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
    previousBalance: number;
    drugs: Drug[];
};

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ isOpen, onClose, order, customer, companyInfo, documentSettings, previousBalance, drugs }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [notes, setNotes] = useState('');
    const [showBonusInPrint, setShowBonusInPrint] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setShowBonusInPrint(false);
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen || !order) return null;

    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 100);
    };
    
    const itemsSubtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.originalPrice), 0);
    const itemsTotalAfterDiscount = order.items.reduce((sum, item) => {
        const pricePerUnit = (item.bonusQuantity > 0 && !item.applyDiscountWithBonus)
            ? item.originalPrice
            : item.finalPrice;
        return sum + (item.quantity * pricePerUnit);
    }, 0);
    const totalItemsDiscount = itemsSubtotal - itemsTotalAfterDiscount;
    const extraCharges = order.extraCharges || [];
    
    const finalBalance = Number(previousBalance) + Number(order.totalAmount) - Number(order.amountPaid);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[90] flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
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
                            <p className="font-semibold text-gray-800">{customer?.name}</p>
                            <p className="text-xs text-gray-600">{customer?.address}</p>
                        </div>
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">شماره فاکتور:</h4>
                            <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                        </div>
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">تاریخ صدور:</h4>
                            <p className="font-semibold text-gray-800">
                                {new Date(order.orderDate).toLocaleDateString('fa-IR')}
                                <span className="block text-xs font-normal font-mono text-gray-500 mt-1">{formatGregorianForDisplay(order.orderDate)}</span>
                            </p>
                        </div>
                    </div>
                    <table className="w-full text-right">
                        <thead>
                            <tr>
                                <th className="p-3 text-sm font-semibold">#</th>
                                <th className="p-3 text-sm font-semibold">شرح محصول</th>
                                <th className="p-3 text-sm font-semibold">تعداد</th>
                                {showBonusInPrint && <th className="p-3 text-sm font-semibold">بونس</th>}
                                <th className="p-3 text-sm font-semibold">قیمت واحد</th>
                                <th className="p-3 text-sm font-semibold">تخفیف</th>
                                <th className="p-3 text-sm font-semibold">مبلغ نهایی</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {order.items.map((item, index) => {
                                const drugInfo = drugs.find(d => d.id === item.drugId);
                                const finalPrice = item.isPriceOverridden ? item.finalPrice : (item.bonusQuantity > 0 && !item.applyDiscountWithBonus) ? item.originalPrice : item.finalPrice;
                                return (
                                <tr key={item.drugId}>
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3 font-medium">
                                        {item.drugName}
                                        {item.batchAllocations && item.batchAllocations.length > 0 && (
                                            <div className="text-xs text-gray-500 font-mono mt-1">
                                            لات: {item.batchAllocations.map(a => a.lotNumber).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">{formatQuantity(item.quantity, drugInfo?.unitsPerCarton, drugInfo?.cartonSize)}</td>
                                    {showBonusInPrint && <td className="p-3">{item.bonusQuantity > 0 ? formatQuantity(item.bonusQuantity, drugInfo?.unitsPerCarton, drugInfo?.cartonSize) : '-'}</td>}
                                    <td className="p-3">{item.originalPrice.toLocaleString()}</td>
                                    <td className="p-3">{item.discountPercentage > 0 ? `${item.discountPercentage.toFixed(2)}%` : '-'}</td>
                                    <td className="p-3 font-semibold">{(finalPrice * item.quantity).toLocaleString()}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    <div className="flex justify-end mt-8">
                        <div className="w-full max-w-sm space-y-3 print-summary pt-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">جمع جزء:</span>
                                <span className="font-semibold">{itemsSubtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">مجموع تخفیف:</span>
                                <span className="font-semibold text-green-600">{(+totalItemsDiscount.toFixed(2)).toLocaleString()}</span>
                            </div>
                            {extraCharges.map(charge => (
                                <div key={charge.id} className="flex justify-between">
                                    <span className="text-gray-600">{charge.description}:</span>
                                    <span className="font-semibold">{charge.amount.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                                <span>مبلغ نهایی قابل پرداخت:</span>
                                <span>{(+order.totalAmount.toFixed(2)).toLocaleString()} افغانی</span>
                            </div>
                             <div className="flex justify-between">
                                <span>مبلغ پرداخت شده:</span>
                                <span>{(+order.amountPaid.toFixed(2)).toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between">
                                <span>مانده قبلی:</span>
                                <span>{(+previousBalance.toFixed(2)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>مانده نهایی:</span>
                                <span>{(+finalBalance.toFixed(2)).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    {notes && <div className="mt-8 pt-4 border-t"><p className="font-semibold">یادداشت:</p><p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p></div>}
                </div>
                <div className="flex justify-between items-center space-x-2 space-x-reverse p-4 bg-gray-50 rounded-b-xl border-t print:hidden">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showBonusInPrint} onChange={e => setShowBonusInPrint(e.target.checked)} /> نمایش ستون بونس</label>
                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="اضافه کردن یادداشت..." className="p-1 border rounded-md text-sm" />
                        <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm">
                            <option value="modern">مدرن</option>
                            <option value="classic">کلاسیک</option>
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

//=========== MAIN COMPONENT ===========//
type SalesProps = {
    orders: Order[];
    drugs: Drug[];
    customers: Customer[];
    companyInfo: CompanyInfo;
    onSave: (order: Order) => void;
    onDelete: (id: number) => void;
    currentUser: User;
    rolePermissions: RolePermissions;
    documentSettings: DocumentSettings;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onOpenQuickAddModal: () => void;
};

const Sales: React.FC<SalesProps> = ({ orders, drugs, customers, companyInfo, onSave, onDelete, currentUser, rolePermissions, documentSettings, addToast, onOpenQuickAddModal }) => {
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [modalMode, setModalMode] = useState<'sale' | 'return'>('sale');
    const [searchTerm, setSearchTerm] = useState('');

    const permissions = useMemo(() => {
        if (currentUser.role === 'مدیر کل') {
            return {
                canCreateSale: true,
                canEditSale: true,
                canDeleteSale: true,
                canGiveManualDiscount: true,
                maxDiscountPercentage: 100,
            };
        }
        return rolePermissions[currentUser.role];
    }, [currentUser.role, rolePermissions]);

    const hasAnyPermission = useMemo(() => {
        return permissions.canCreateSale || permissions.canEditSale || permissions.canDeleteSale;
    }, [permissions]);

    if (!hasAnyPermission && currentUser.role !== 'مدیر کل') {
        return <NoPermissionMessage />;
    }

    const handleOpenAddModal = () => {
        setEditingOrder(null);
        setModalMode('sale');
        setIsOrderModalOpen(true);
    };

    const handleOpenEditModal = (order: Order) => {
        setEditingOrder(order);
        setModalMode('sale');
        setIsOrderModalOpen(true);
    };
    
    const handleOpenReturnModal = (order: Order) => {
        setEditingOrder(order);
        setModalMode('return');
        setIsOrderModalOpen(true);
    };

    const handleOpenPrintModal = (order: Order) => {
        setOrderToPrint(order);
        setIsPrintModalOpen(true);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => 
            o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }, [orders, searchTerm]);

    const customerBalances = useMemo(() => {
        const balances = new Map<string, number>();
        orders.slice().sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()).forEach(o => {
            const currentBalance = balances.get(o.customerName) || 0;
            balances.set(o.customerName, currentBalance + o.totalAmount - o.amountPaid);
        });
        return balances;
    }, [orders]);

    return (
        <div className="p-8">
            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onSave={onSave}
                initialData={editingOrder}
                drugs={drugs}
                customers={customers}
                orders={orders}
                addToast={addToast}
                mode={modalMode}
                onOpenQuickAddModal={onOpenQuickAddModal}
                permissions={permissions}
            />
            <PrintPreviewModal 
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                order={orderToPrint}
                customer={customers.find(c => c.name === orderToPrint?.customerName) || null}
                companyInfo={companyInfo}
                documentSettings={documentSettings}
                previousBalance={(customerBalances.get(orderToPrint?.customerName || '') || 0) - ((orderToPrint?.totalAmount || 0) - (orderToPrint?.amountPaid || 0))}
                drugs={drugs}
            />

            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">فروش و سفارشات</h2>
                    <p className="text-gray-500">لیست فاکتورهای فروش و مستردی</p>
                </div>
                 <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="جستجوی فاکتور..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg"
                        />
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <SearchIcon />
                        </div>
                    </div>
                     {permissions.canCreateSale && (
                        <button onClick={handleOpenAddModal} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md">
                            <PlusIcon />
                            <span className="mr-2">ثبت سفارش جدید</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2">
                             <tr>
                                <th className="p-4">شماره فاکتور</th>
                                <th className="p-4">مشتری</th>
                                <th className="p-4">تاریخ</th>
                                <th className="p-4">مبلغ کل</th>
                                <th className="p-4">سود</th>
                                <th className="p-4">وضعیت پرداخت</th>
                                <th className="p-4">وضعیت سفارش</th>
                                <th className="p-4">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredOrders.map(order => {
                                const orderStatusStyle = getOrderStatusStyle(order.status);
                                const paymentStatusStyle = getPaymentStatusStyle(order.paymentStatus);
                                const itemsRevenue = order.items.reduce((sum, item) => {
                                     const pricePerUnit = (item.bonusQuantity > 0 && !item.applyDiscountWithBonus)
                                        ? item.originalPrice
                                        : item.finalPrice;
                                    return sum + (item.quantity * pricePerUnit);
                                }, 0);
                                const cogs = order.items.reduce((sum, item) => sum + (item.batchAllocations || []).reduce((cogsSum, alloc) => cogsSum + (alloc.quantity * alloc.purchasePrice), 0), 0);
                                const profit = order.type === 'sale_return' ? -(itemsRevenue - cogs) : (itemsRevenue - cogs);
                                return (
                                <tr key={order.id} className={order.type === 'sale_return' ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}>
                                    <td className="p-4 font-mono">{order.orderNumber}</td>
                                    <td className="p-4">{order.customerName}</td>
                                    <td className="p-4 whitespace-nowrap text-gray-500 text-sm">
                                        {new Date(order.orderDate).toLocaleDateString('fa-IR')}
                                        <div className="font-mono text-xs text-gray-400">{formatGregorianForDisplay(order.orderDate)}</div>
                                    </td>
                                    <td className="p-4 font-semibold">{Math.abs(order.totalAmount).toLocaleString()}</td>
                                    <td className={`p-4 font-semibold ${profit < 0 ? 'text-red-600' : 'text-gray-700'}`}>{profit.toLocaleString()}</td>
                                    <td className="p-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${paymentStatusStyle.bg} ${paymentStatusStyle.text}`}>{order.paymentStatus}</span></td>
                                    <td className="p-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${orderStatusStyle.bg} ${orderStatusStyle.text}`}>{order.status}</span></td>
                                    <td className="p-4"><div className="flex gap-2">
                                        <button onClick={() => handleOpenPrintModal(order)} title="چاپ"><PrintIcon /></button>
                                        {permissions.canEditSale && <button onClick={() => handleOpenEditModal(order)} title="ویرایش"><EditIcon /></button>}
                                        {permissions.canDeleteSale && <button onClick={() => onDelete(order.id)} title="حذف"><TrashIcon className="w-5 h-5 text-red-500" /></button>}
                                        {permissions.canCreateSale && order.type === 'sale' && <button onClick={() => handleOpenReturnModal(order)} title="ثبت مستردی"><ReturnIcon /></button>}
                                    </div></td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default Sales;
