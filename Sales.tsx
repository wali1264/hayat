import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Drug, drugCategories } from './Inventory';
import { Customer } from './Customers';
import { CompanyInfo, User, DocumentSettings } from './Settings';

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


//=========== TYPES ===========//
export type OrderStatus = 'در حال پردازش' | 'ارسال شده' | 'تکمیل شده' | 'لغو شده';
export type PaymentStatus = 'پرداخت شده' | 'پرداخت نشده' | 'قسمتی پرداخت شده';

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


//=========== MODAL COMPONENTS ===========//

// --- Copied from Inventory.tsx for reuse ---
type DrugModalBarcodeScannerProps = {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
};

const DrugModalBarcodeScanner: React.FC<DrugModalBarcodeScannerProps> = ({ isOpen, onClose, onScanSuccess }) => {
    useEffect(() => {
        if (!isOpen) return;
        const html5QrCode = new Html5Qrcode("drug-modal-reader");
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            onScanSuccess(decodedText);
            html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
        };
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, (errorMessage) => {})
            .catch((err) => { console.error("Unable to start scanning.", err); });

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.log("Scanner already stopped or failed to stop.", err));
            }
        };
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[99] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-center mb-4">اسکن بارکد / QR کد</h3>
                <div id="drug-modal-reader" className="w-full"></div>
                <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-200 rounded-lg">انصراف</button>
            </div>
        </div>
    );
};

type DrugModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (drug: Drug) => void;
    initialData: Drug | null;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

const DrugModal: React.FC<DrugModalProps> = ({ isOpen, onClose, onSave, initialData, addToast }) => {
    const defaultState = { name: '', barcode: '', code: '', manufacturer: '', cartonQuantity: '', unitQuantity: '', unitsPerCarton: '', expiryDate: '', productionDate: '', price: '', purchasePrice: '', discountPercentage: '', category: 'سایر' };
    const [drug, setDrug] = useState(defaultState);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const isEditMode = initialData !== null;

    useEffect(() => {
        if (isOpen) {
             if (initialData) {
                 const totalQuantity = initialData.quantity;
                 const unitsPerCarton = initialData.unitsPerCarton && initialData.unitsPerCarton > 1 ? initialData.unitsPerCarton : 1;
                 const cartons = unitsPerCarton > 1 ? Math.floor(totalQuantity / unitsPerCarton) : 0;
                 const units = unitsPerCarton > 1 ? totalQuantity % unitsPerCarton : totalQuantity;
                 
                 setDrug({
                     name: initialData.name,
                     barcode: initialData.barcode || '',
                     code: initialData.code,
                     manufacturer: initialData.manufacturer,
                     cartonQuantity: String(cartons),
                     unitQuantity: String(units),
                     unitsPerCarton: String(initialData.unitsPerCarton || ''),
                     expiryDate: initialData.expiryDate,
                     productionDate: initialData.productionDate || '',
                     price: String(initialData.price),
                     purchasePrice: String(initialData.purchasePrice),
                     discountPercentage: String(initialData.discountPercentage),
                     category: initialData.category || 'سایر'
                 });
             } else {
                setDrug(defaultState);
             }
        }
    }, [isOpen, initialData]);

    const calculatedTotal = useMemo(() => {
        const unitsPerCarton = Number(drug.unitsPerCarton);
        const cartons = Number(drug.cartonQuantity) || 0;
        const units = Number(drug.unitQuantity) || 0;
        if (!unitsPerCarton || unitsPerCarton <= 1) {
            return units;
        }
        return (cartons * unitsPerCarton) + units;
    }, [drug.unitsPerCarton, drug.cartonQuantity, drug.unitQuantity]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDrug(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const priceValue = Number(drug.price) || 0;
        const purchasePriceValue = Number(drug.purchasePrice) || 0;
        if (!drug.name || !drug.expiryDate || priceValue <= 0 || purchasePriceValue <= 0) {
            addToast("لطفا تمام فیلدهای ضروری (نام، تاریخ انقضا، قیمت خرید و فروش) را با مقادیر معتبر پر کنید.", 'error');
            return;
        }

        const drugToSave: Drug = {
            id: isEditMode ? initialData.id : Date.now(),
            name: drug.name,
            barcode: drug.barcode,
            code: drug.code,
            manufacturer: drug.manufacturer,
            category: drug.category,
            expiryDate: drug.expiryDate,
            productionDate: drug.productionDate,
            quantity: calculatedTotal,
            unitsPerCarton: Number(drug.unitsPerCarton) || 1,
            price: priceValue,
            purchasePrice: purchasePriceValue,
            discountPercentage: Number(drug.discountPercentage) || 0,
        };
        
        onSave(drugToSave);
        onClose();
    };
    
    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <>
        <DrugModalBarcodeScanner
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanSuccess={(text) => {
                setDrug(prev => ({...prev, barcode: text}));
                setIsScannerOpen(false);
            }}
        />
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[90] flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'ویرایش دارو' : 'افزودن داروی جدید'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label htmlFor="name" className={labelStyles}>نام دارو (ضروری)</label>
                            <input type="text" name="name" id="name" value={drug.name} onChange={handleChange} className={inputStyles} required autoFocus />
                        </div>
                        <div>
                           <label htmlFor="manufacturer" className={labelStyles}>کمپانی</label>
                           <input type="text" name="manufacturer" id="manufacturer" value={drug.manufacturer} onChange={handleChange} className={inputStyles} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="category" className={labelStyles}>دسته‌بندی</label>
                            <select name="category" id="category" value={drug.category} onChange={handleChange} className={inputStyles}>
                                {drugCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="code" className={labelStyles}>کد محصول</label>
                            <input type="text" name="code" id="code" value={drug.code} onChange={handleChange} className={inputStyles} />
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <label htmlFor="barcode" className={labelStyles}>بارکد / QR Code</label>
                        <div className="flex gap-2">
                             <input type="text" name="barcode" id="barcode" value={drug.barcode} onChange={handleChange} className={inputStyles} />
                             <button type="button" title="اسکن با دوربین" onClick={() => setIsScannerOpen(true)} className="p-2 border rounded-lg hover:bg-gray-100"><CameraIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                         <div>
                            <label htmlFor="purchasePrice" className={labelStyles}>قیمت خرید (ضروری)</label>
                            <input type="number" name="purchasePrice" id="purchasePrice" value={drug.purchasePrice} onChange={handleChange} className={inputStyles} min="1" required placeholder="مثلا: 120" />
                        </div>
                         <div>
                            <label htmlFor="price" className={labelStyles}>قیمت فروش (ضروری)</label>
                            <input type="number" name="price" id="price" value={drug.price} onChange={handleChange} className={inputStyles} min="1" required placeholder="مثلا: 150" />
                        </div>
                        <div>
                            <label htmlFor="discountPercentage" className={labelStyles}>تخفیف (٪)</label>
                            <input type="number" name="discountPercentage" id="discountPercentage" value={drug.discountPercentage} onChange={handleChange} className={inputStyles} min="0" max="100" placeholder="مثلا: 5"/>
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label htmlFor="productionDate" className={labelStyles}>تاریخ تولید</label>
                            <input type="date" name="productionDate" id="productionDate" value={drug.productionDate} onChange={handleChange} className={inputStyles} />
                        </div>
                         <div>
                            <label htmlFor="expiryDate" className={labelStyles}>تاریخ انقضا (ضروری)</label>
                            <input type="date" name="expiryDate" id="expiryDate" value={drug.expiryDate} onChange={handleChange} className={inputStyles} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label htmlFor="unitsPerCarton" className={labelStyles}>تعداد در کارتن</label>
                            <input type="number" name="unitsPerCarton" id="unitsPerCarton" value={drug.unitsPerCarton} onChange={handleChange} className={inputStyles} min="1" placeholder="مثلا: 100" />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelStyles}>موجودی انبار</label>
                            <div className="flex items-center gap-2">
                                <input type="number" name="cartonQuantity" value={drug.cartonQuantity} onChange={handleChange} className={inputStyles} min="0" placeholder="تعداد کارتن" disabled={!drug.unitsPerCarton || Number(drug.unitsPerCarton) <= 1} />
                                <span className="text-gray-500 flex-shrink-0">کارتن</span>
                                <input type="number" name="unitQuantity" value={drug.unitQuantity} onChange={handleChange} className={inputStyles} min="0" placeholder="تعداد واحد" />
                                <span className="text-gray-500 flex-shrink-0">عدد</span>
                            </div>
                        </div>
                    </div>

                     <div className="mb-6 text-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <span>مجموع کل: </span>
                        <span className="font-bold font-mono text-base text-teal-700">{calculatedTotal.toLocaleString()}</span>
                        <span> واحد</span>
                    </div>

                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-md hover:shadow-lg">
                            {isEditMode ? 'ذخیره تغییرات' : 'ذخیره'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};
// --- End of copied components ---


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
};

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, initialData, drugs, customers, orders, addToast, mode }) => {
    
    const [orderInfo, setOrderInfo] = useState({
        customerName: '', amountPaid: '', status: 'ارسال شده' as OrderStatus,
    });
    const [items, setItems] = useState<OrderItem[]>([]);
    const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
    const [newCharge, setNewCharge] = useState({ description: '', amount: '' });
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    const [drugSearchTerm, setDrugSearchTerm] = useState('');
    const [deviceScanInput, setDeviceScanInput] = useState('');
    const [addQuantity, setAddQuantity] = useState('1');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);
    const [historyVisibleForDrugId, setHistoryVisibleForDrugId] = useState<number | null>(null);
    const [editingPriceForDrugId, setEditingPriceForDrugId] = useState<number | null>(null);


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
        return itemsTotal + chargesTotal;
    }, [items, extraCharges]);

    const availableDrugs = useMemo(() => {
        if (!drugSearchTerm) return [];
        return drugs
            .filter(d => (mode === 'sale' ? d.quantity > 0 : true)) // For returns, show all drugs
            .filter(d => d.name.toLowerCase().includes(drugSearchTerm.toLowerCase()))
            .slice(0, 10);
    }, [drugs, drugSearchTerm, mode]);

    const lastPurchaseHistory = useMemo(() => {
        const historyMap = new Map<number, OrderItem & { orderDate: string }>();
        if (!orderInfo.customerName) return historyMap;

        // Find all orders for the current customer, excluding the one being edited, and sort by most recent first.
        const customerOrders = orders
            .filter(o => o.customerName === orderInfo.customerName && o.id !== initialData?.id)
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

        // Iterate through sorted orders to find the most recent purchase for each drug
        for (const order of customerOrders) {
            for (const item of order.items) {
                // If we haven't found a history for this drug yet, this is the most recent one.
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
                setOrderInfo({ customerName: initialData.customerName, amountPaid: String(initialData.amountPaid), status: initialData.status });
                setItems(initialData.items.map(item => ({...item, bonusQuantity: item.bonusQuantity || 0})));
                setExtraCharges(initialData.extraCharges || []);
                if(mode === 'return') {
                     setOrderInfo(prev => ({...prev, status: 'تکمیل شده'}));
                }
            } else {
                setOrderInfo({ customerName: '', amountPaid: '', status: 'ارسال شده' });
                setItems([]);
                setExtraCharges([]);
                setNewCharge({ description: '', amount: '' });
                setDrugSearchTerm('');
                setDeviceScanInput('');
                setAddQuantity('1');
                setIsSearchFocused(false);
                setHistoryVisibleForDrugId(null);
                setEditingPriceForDrugId(null);
            }
        }
    }, [isOpen, initialData, mode]);
    
     useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchWrapperRef]);


    if (!isOpen) return null;

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setOrderInfo(prev => ({ ...prev, [name]: value }));
    };

    const addItemToOrder = (drug: Drug, quantity: number) => {
         const existingItemIndex = items.findIndex(item => item.drugId === drug.id);
         const totalRequired = existingItemIndex > -1 ? items[existingItemIndex].quantity + quantity + (items[existingItemIndex].bonusQuantity || 0) : quantity;

         if (mode === 'sale' && totalRequired > drug.quantity) {
            addToast(`تعداد درخواستی (${totalRequired}) بیشتر از موجودی انبار (${drug.quantity}) است.`, 'error');
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
            setItems(updatedItems);
        } else {
            const finalPrice = drug.price * (1 - drug.discountPercentage / 100);
            setItems(prev => [...prev, {
                drugId: drug.id,
                drugName: drug.name,
                manufacturer: drug.manufacturer,
                code: drug.code,
                quantity: quantity,
                bonusQuantity: 0,
                originalPrice: drug.price,
                discountPercentage: drug.discountPercentage,
                finalPrice: finalPrice,
                applyDiscountWithBonus: false,
                isPriceOverridden: false
            }]);
        }
        return true;
    }
    
    const handleSelectDrug = (drug: Drug) => {
        const quantity = Number(addQuantity);
        if (!quantity || quantity <= 0) {
            addToast("لطفا تعداد معتبر وارد کنید.", 'error');
            return;
        }
        if (addItemToOrder(drug, quantity)) {
            setDrugSearchTerm('');
            setIsSearchFocused(false);
            setAddQuantity('1');
        }
    };
    
    const handleScanSuccess = (barcode: string) => {
        const drug = drugs.find(d => d.barcode === barcode);
        if (drug) {
            if (addItemToOrder(drug, 1)) {
                setIsScannerOpen(false);
            }
        } else {
            addToast("محصولی با این بارکد یافت نشد.", 'error');
            setIsScannerOpen(false);
        }
    };

    const handleDeviceScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (deviceScanInput.trim() === '') return;

            const drug = drugs.find(d => d.barcode === deviceScanInput.trim());
            if (drug) {
                 addItemToOrder(drug, 1);
            } else {
                addToast("محصولی با این بارکد یافت نشد.", 'error');
            }
            setDeviceScanInput(''); 
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
        if (mode === 'sale' && drugInStock && (newQuantity + item.bonusQuantity) > drugInStock.quantity) {
            addToast(`مجموع تعداد فروش و بونس (${newQuantity + item.bonusQuantity}) بیشتر از موجودی انبار (${drugInStock.quantity}) است.`, 'error');
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
        // Not applicable for returns
        if (mode === 'return') return;

        const newBonusQuantity = parseInt(newBonusQuantityStr, 10) || 0;
        const item = items.find(i => i.drugId === drugId);
        if (!item) return;

        const drugInStock = drugs.find(d => d.id === drugId);
        if (drugInStock && (item.quantity + newBonusQuantity) > drugInStock.quantity) {
            addToast(`مجموع تعداد فروش و بونس (${item.quantity + newBonusQuantity}) بیشتر از موجودی انبار (${drugInStock.quantity}) است.`, 'error');
            return;
        }

        setItems(currentItems =>
            currentItems.map(it => it.drugId === drugId ? { ...it, bonusQuantity: newBonusQuantity } : it)
        );
    };
    
    const handleManualPriceChange = (drugId: number, newPriceStr: string) => {
        const newFinalPrice = Number(newPriceStr);
        const itemToUpdate = items.find(it => it.drugId === drugId);
    
        if (!itemToUpdate || isNaN(newFinalPrice)) {
            setEditingPriceForDrugId(null);
            return;
        }
    
        const { originalPrice } = itemToUpdate;
        let finalPrice = newFinalPrice;
        let discountPercentage = 0;
    
        if (finalPrice < 0) finalPrice = 0;
        
        // Calculate discount only if the new price is less than original
        if (originalPrice > 0 && finalPrice < originalPrice) {
            discountPercentage = ((originalPrice - finalPrice) / originalPrice) * 100;
        } else {
            // If price is higher than or equal to original, there's no discount
            finalPrice = newFinalPrice;
            discountPercentage = 0;
        }
    
        setItems(currentItems =>
            currentItems.map(it => {
                if (it.drugId === drugId) {
                    return {
                        ...it,
                        finalPrice: finalPrice,
                        // Round to 2 decimal places
                        discountPercentage: Math.round(discountPercentage * 100) / 100,
                        isPriceOverridden: true, 
                    };
                }
                return it;
            })
        );
        setEditingPriceForDrugId(null);
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
            orderNumber: isEditMode ? initialData!.orderNumber : (initialData?.orderNumber || ''), // Will be set in parent
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

    return (
        <>
        <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-5xl transform transition-all" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{modalTitle}</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="customerName" className={labelStyles}>نام مشتری</label>
                            <input list="customer-list" type="text" name="customerName" value={orderInfo.customerName} onChange={handleInfoChange} className={`${inputStyles} bg-gray-100`} required readOnly={mode==='return'} />
                            <datalist id="customer-list">
                                {customers.map(c => <option key={c.id} value={c.name} />)}
                            </datalist>
                        </div>
                        <div>
                           <label htmlFor="status" className={labelStyles}>وضعیت</label>
                            <select name="status" value={orderInfo.status} onChange={handleInfoChange} className={inputStyles} disabled={mode === 'return'}>
                                {mode === 'sale' && <>
                                <option value="در حال پردازش">در حال پردازش</option>
                                <option value="ارسال شده">ارسال شده</option>
                                </>}
                                <option value="تکمیل شده">تکمیل شده</option>
                                <option value="لغو شده">لغو شده</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                        <h4 className="font-bold text-gray-700">{mode === 'return' ? 'اقلام برگشتی' : 'افزودن اقلام به سفارش'}</h4>
                         {mode === 'sale' && <div className="p-2 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div ref={searchWrapperRef}>
                                <label className="text-xs text-gray-600">۱. جستجوی دستی دارو</label>
                                <div className="relative flex items-center">
                                    <input 
                                        type="text" 
                                        value={drugSearchTerm}
                                        onChange={e => setDrugSearchTerm(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        placeholder='بخشی از نام دارو را تایپ کنید...'
                                        className={`${inputStyles} rounded-l-none`}
                                    />
                                     <input 
                                        type="number" 
                                        value={addQuantity} 
                                        onChange={e => setAddQuantity(e.target.value)} 
                                        className={`${inputStyles} w-20 text-center rounded-r-none border-l-0`}
                                        min="1"
                                        title="تعداد"
                                    />
                                    {isSearchFocused && availableDrugs.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                            {availableDrugs.map(drug => (
                                                <div key={drug.id} onClick={() => handleSelectDrug(drug)} className="p-3 hover:bg-teal-50 cursor-pointer border-b">
                                                    <p className="font-semibold text-gray-800">{drug.name}</p>
                                                    <p className="text-xs text-gray-500">موجودی: <span className="font-mono">{drug.quantity}</span></p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <label className="text-xs text-gray-600">۲. اسکن با دستگاه</label>
                                    <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="بارکد را اسکن کنید..."
                                        value={deviceScanInput}
                                        onChange={(e) => setDeviceScanInput(e.target.value)}
                                        onKeyDown={handleDeviceScan}
                                        className={`${inputStyles} pl-10`}
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <BarcodeScannerIcon />
                                    </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                <button type="button" onClick={() => setIsScannerOpen(true)} title="اسکن با دوربین" className="h-10 px-4 flex items-center gap-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold">
                                    <CameraIcon className="w-5 h-5" />
                                </button>
                                </div>
                            </div>
                        </div>}

                        <div className="max-h-48 overflow-y-auto">
                            {items.length === 0 ? <p className="text-center text-gray-500 py-4">هنوز هیچ آیتمی اضافه نشده است.</p> :
                                <table className="w-full text-sm">
                                    <thead className="text-right">
                                        <tr className="border-b">
                                            <th className="p-2 font-semibold">نام دارو</th>
                                            <th className="p-2 font-semibold text-center w-56">{mode === 'return' ? 'تعداد برگشتی' : 'تعداد (فروش / بونس)'}</th>
                                            <th className="p-2 font-semibold">قیمت واحد</th>
                                            <th className="p-2 font-semibold">مبلغ جزء</th>
                                            <th className="p-2 text-center">{mode === 'sale' ? 'سابقه' : ''}</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => {
                                            const pricePerUnit = item.isPriceOverridden
                                                ? item.finalPrice
                                                : (item.bonusQuantity > 0 && !item.applyDiscountWithBonus)
                                                    ? item.originalPrice
                                                    : item.finalPrice;
                                            const history = lastPurchaseHistory.get(item.drugId);
                                            return (
                                            <React.Fragment key={item.drugId}>
                                            <tr className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-2">{item.drugName}</td>
                                                <td className="p-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.drugId, e.target.value)} className="w-20 text-center border rounded-md py-1" min="0" aria-label={`تعداد فروش برای ${item.drugName}`} />
                                                        {mode === 'sale' && <>
                                                        <span className="text-gray-400">/</span>
                                                        <input type="number" value={item.bonusQuantity} onChange={(e) => handleBonusQuantityChange(item.drugId, e.target.value)} className="w-20 text-center border rounded-md py-1 bg-yellow-50" min="0" placeholder="بونس" aria-label={`تعداد بونس برای ${item.drugName}`} />
                                                        </>}
                                                    </div>
                                                    {mode === 'sale' && item.bonusQuantity > 0 && item.discountPercentage > 0 && (
                                                         <div className="text-center mt-1">
                                                            <label className="flex items-center justify-center gap-1.5 cursor-pointer text-xs text-gray-600">
                                                                <input type="checkbox" checked={!!item.applyDiscountWithBonus} onChange={e => handleApplyDiscountToggle(item.drugId, e.target.checked)} className="form-checkbox h-3.5 w-3.5 text-teal-600" />
                                                                اعمال تخفیف با بونس
                                                            </label>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                     {editingPriceForDrugId === item.drugId ? (
                                                        <input
                                                            type="number"
                                                            defaultValue={item.finalPrice}
                                                            autoFocus
                                                            onBlur={(e) => handleManualPriceChange(item.drugId, e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') { e.preventDefault(); handleManualPriceChange(item.drugId, (e.target as HTMLInputElement).value); } 
                                                                else if (e.key === 'Escape') { setEditingPriceForDrugId(null); }
                                                            }}
                                                            className="w-24 text-center border rounded-md py-1"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingPriceForDrugId(item.drugId)}>
                                                            {(item.bonusQuantity > 0 && !item.applyDiscountWithBonus) ? (
                                                                 <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-800">{item.originalPrice.toLocaleString()}</span>
                                                                    <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full" title="چون بونس اعمال شده، تخفیف نادیده گرفته شد">بونس</span>
                                                                </div>
                                                            ) : item.discountPercentage > 0 ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-500 line-through">{item.originalPrice.toLocaleString()}</span>
                                                                    <span className="font-bold text-teal-600">{item.finalPrice.toLocaleString()}</span>
                                                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item.discountPercentage}%</span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-bold">{item.originalPrice.toLocaleString()}</span>
                                                            )}
                                                             <button type="button" className="text-gray-400 hover:text-blue-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" title="ویرایش دستی قیمت">
                                                                <EditIcon />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2 font-semibold">{(item.quantity * pricePerUnit).toLocaleString()}</td>
                                                <td className="p-2 text-center">
                                                    {mode === 'sale' && <button type="button" onClick={() => setHistoryVisibleForDrugId(historyVisibleForDrugId === item.drugId ? null : item.drugId)} className={`p-1 rounded-full ${historyVisibleForDrugId === item.drugId ? 'bg-blue-200 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="نمایش سابقه خرید مشتری"><HistoryIcon /></button>}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.drugId)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                            {historyVisibleForDrugId === item.drugId && (
                                                <tr className="bg-blue-50 transition-all">
                                                    <td colSpan={6} className="p-3 text-xs">
                                                        {history ? (
                                                            <div className="flex justify-around items-center">
                                                                <span className="font-semibold">آخرین خرید در تاریخ {new Date(history.orderDate).toLocaleDateString('fa-IR')}:</span>
                                                                <span><span className="font-semibold">{history.quantity}</span> عدد</span>
                                                                <span>بونس: <span className="font-semibold">{history.bonusQuantity > 0 ? history.bonusQuantity : 'نداشت'}</span></span>
                                                                <span>تخفیف: <span className="font-semibold">{history.discountPercentage > 0 ? `${history.discountPercentage}%` : 'نداشت'}</span></span>
                                                                <span>قیمت نهایی: <span className="font-semibold">{history.finalPrice.toLocaleString()}</span></span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-center text-gray-600">سابقه خریدی برای این مشتری یافت نشد.</p>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                            </React.Fragment>
                                        )})}
                                    </tbody>
                                </table>
                            }
                        </div>
                    </div>
                    
                    {mode === 'sale' && (
                        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                            <h4 className="font-bold text-gray-700">هزینه‌های اضافی</h4>
                            {extraCharges.length > 0 && (
                                <div className="max-h-32 overflow-y-auto">
                                    <ul className="divide-y">
                                        {extraCharges.map(charge => (
                                            <li key={charge.id} className="py-2 flex justify-between items-center text-sm">
                                                <div>
                                                    <p className="font-semibold">{charge.description}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                     <p className="text-gray-800 font-semibold">{charge.amount.toLocaleString()} افغانی</p>
                                                    <button type="button" onClick={() => handleRemoveCharge(charge.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             <div className="flex gap-2 items-end pt-2 border-t">
                                <div className="flex-grow">
                                    <label className="text-xs font-semibold text-gray-600">شرح هزینه</label>
                                    <input type="text" value={newCharge.description} onChange={e => setNewCharge(p => ({...p, description: e.target.value}))} className={inputStyles} placeholder="مثلا: کرایه حمل" />
                                </div>
                                <div className="w-32">
                                     <label className="text-xs font-semibold text-gray-600">مبلغ</label>
                                    <input type="number" value={newCharge.amount} onChange={e => setNewCharge(p => ({...p, amount: e.target.value}))} className={inputStyles} placeholder="200" />
                                </div>
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


                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-md hover:shadow-lg">
                           {mode === 'return' ? 'ثبت مستردی' : (isEditMode ? 'ذخیره تغییرات' : 'ذخیره سفارش')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
};

type InvoiceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    customer: Customer | null;
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
    previousBalance: number;
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order, customer, companyInfo, documentSettings, previousBalance }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [notes, setNotes] = useState('');
    const [showBonusInPrint, setShowBonusInPrint] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 my-8">
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">فاکتور برای:</h4>
                            <p className="font-semibold text-gray-800">{customer?.name}</p>
                            <p className="text-gray-600">{customer?.address}</p>
                            <p className="text-gray-600">{customer?.phone}</p>
                        </div>
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">شماره فاکتور:</h4>
                            <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                        </div>
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">کد ارجاع:</h4>
                            <p className="font-semibold text-gray-800 font-mono">{order.ledgerRefCode || '-'}</p>
                        </div>
                        <div>
                            <h4 className="text-sm text-gray-500 font-bold mb-1">تاریخ صدور:</h4>
                            <p className="font-semibold text-gray-800">{new Date(order.orderDate).toLocaleDateString('fa-IR')} / <span className="font-mono text-sm">{formatGregorianForDisplay(order.orderDate)}</span></p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                         <table className="w-full text-right">
                            <thead>
                                <tr>
                                    <th className="p-3 text-sm font-semibold">#</th>
                                    <th className="p-3 text-sm font-semibold">شرح محصول</th>
                                    <th className="p-3 text-sm font-semibold">کد</th>
                                    <th className="p-3 text-sm font-semibold">کمپانی</th>
                                    <th className="p-3 text-sm font-semibold">تعداد</th>
                                    {showBonusInPrint && <th className="p-3 text-sm font-semibold">بونس</th>}
                                    <th className="p-3 text-sm font-semibold">قیمت واحد</th>
                                    <th className="p-3 text-sm font-semibold">تخفیف</th>
                                    <th className="p-3 text-sm font-semibold">مبلغ نهایی</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {order.items.map((item, index) => {
                                    const hasBonus = item.bonusQuantity > 0;
                                    const applyDiscount = !(hasBonus && !item.applyDiscountWithBonus);
                                    const pricePerUnit = applyDiscount ? item.finalPrice : item.originalPrice;
                                    
                                    let displayDiscount = '-';
                                    const roundedDiscount = Math.round(item.discountPercentage * 100) / 100;

                                    if (hasBonus && !applyDiscount) {
                                        displayDiscount = 'بونس';
                                    } else if (roundedDiscount > 0) {
                                        displayDiscount = `${roundedDiscount}%`;
                                    }

                                    return (
                                        <tr key={item.drugId}>
                                            <td className="p-3">{index + 1}</td>
                                            <td className="p-3 font-medium text-gray-800">{item.drugName}</td>
                                            <td className="p-3 font-mono text-xs">{item.code || '-'}</td>
                                            <td className="p-3 text-gray-600 text-xs">{item.manufacturer || '-'}</td>
                                            <td className="p-3">{item.quantity.toLocaleString()}</td>
                                            {showBonusInPrint && (
                                                <td className="p-3 font-semibold bg-yellow-50">
                                                    {item.bonusQuantity > 0 ? item.bonusQuantity.toLocaleString() : '-'}
                                                </td>
                                            )}
                                            <td className="p-3">{item.originalPrice.toLocaleString()}</td>
                                            <td className="p-3">{displayDiscount}</td>
                                            <td className="p-3 font-semibold text-gray-800">{(pricePerUnit * item.quantity).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-start mt-8">
                        <div className="w-1/2">
                            <h4 className="text-sm text-gray-500 font-bold mb-1">ملاحظات این بل:</h4>
                            <p className="text-sm text-gray-700 min-h-[40px] border-b pb-2 whitespace-pre-wrap">{notes || ' '}</p>
                        </div>
                        <div className="w-full max-w-sm space-y-2 print-summary pt-4">
                             <div className="flex justify-between text-md">
                                <span className="text-gray-600">جمع جزء اقلام:</span>
                                <span className="font-semibold">{itemsSubtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-md">
                                <span className="text-gray-600">مجموع تخفیف اقلام:</span>
                                <span className="font-semibold text-green-600">{totalItemsDiscount.toLocaleString()}</span>
                            </div>
                            {extraCharges.map(charge => (
                                <div key={charge.id} className="flex justify-between text-md pt-1">
                                    <span className="text-gray-600">{charge.description}:</span>
                                    <span className="font-semibold">{charge.amount.toLocaleString()}</span>
                                </div>
                            ))}
                             <div className="flex justify-between text-md font-bold pt-2 border-t">
                                <span className="text-gray-800">مجموعه افغانی:</span>
                                <span className="font-semibold">{Number(order.totalAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-md">
                                <span className="text-gray-600">باقی گذشته:</span>
                                <span className="font-semibold">{previousBalance.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between text-md">
                                <span className="text-gray-600">رسید نقدی:</span>
                                <span className="font-semibold">{Number(order.amountPaid).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                                <span>صرف باقی:</span>
                                <span>{finalBalance.toLocaleString()} افغانی</span>
                            </div>
                        </div>
                    </div>
                     <footer className="mt-16 pt-6 border-t text-sm text-gray-500 flex justify-between">
                        <div>
                            <span>تاریخ و زمان چاپ: {new Date().toLocaleString('fa-IR')}</span>
                        </div>
                        <div>
                            <span>مهر و امضای فروشنده</span>
                        </div>
                    </footer>
                </div>
                <div className="p-4 bg-gray-50 rounded-b-xl border-t print:hidden space-y-4">
                    <div>
                        <label htmlFor="invoice-notes" className="text-sm font-semibold text-gray-700">یادداشت برای چاپ:</label>
                        <textarea 
                            id="invoice-notes" 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            className="w-full text-sm border rounded-lg p-2 mt-1 bg-white focus:ring-2 focus:ring-teal-500" 
                            rows="2"
                            placeholder="هرگونه ملاحظات لازم برای این فاکتور را اینجا بنویسید..."
                        ></textarea>
                    </div>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                         <div className="flex items-center gap-4">
                            <div>
                                <label htmlFor="template-select" className="text-sm font-semibold mr-2">قالب:</label>
                                <select id="template-select" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="bg-white border border-gray-300 rounded-md px-2 py-1">
                                    <option value="modern">مدرن</option>
                                    <option value="classic">کلاسیک</option>
                                    <option value="minimalist">ساده</option>
                                    <option value="compact">فشرده</option>
                                </select>
                            </div>
                             <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="showBonusCheckbox"
                                    checked={showBonusInPrint}
                                    onChange={(e) => setShowBonusInPrint(e.target.checked)}
                                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                                />
                                <label htmlFor="showBonusCheckbox" className="mr-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                    نمایش تعداد بونس در چاپ
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">بستن</button>
                            <button type="button" onClick={handlePrint} className="flex items-center px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold">
                                <PrintIcon /> <span className="mr-2">چاپ</span>
                            </button>
                        </div>
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
    documentSettings: DocumentSettings;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onSaveDrug: (drug: Drug) => void;
};

const Sales: React.FC<SalesProps> = ({ orders, drugs, customers, companyInfo, onSave, onDelete, currentUser, documentSettings, addToast, onSaveDrug }) => {
    const initialFilters = {
        searchTerm: '', status: 'all', paymentStatus: 'all', startDate: '', endDate: '',
    };
    const [filters, setFilters] = useState(initialFilters);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'sale' | 'return'>('sale');
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [printData, setPrintData] = useState<{order: Order, previousBalance: number} | null>(null);

    const canManageSales = useMemo(() => 
        currentUser.role === 'مدیر کل' || currentUser.role === 'فروشنده', 
    [currentUser.role]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenAddOrderModal = () => {
        setEditingOrder(null);
        setModalMode('sale');
        setIsOrderModalOpen(true);
    };
    
    const handleOpenAddDrugModal = () => {
        setIsDrugModalOpen(true);
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
    
    const handleOpenPrintModal = (orderToPrint: Order) => {
        const totalBalance = orders
            .filter(o => o.customerName === orderToPrint.customerName)
            .reduce((balance, o) => balance + (Number(o.totalAmount) - Number(o.amountPaid)), 0);

        const currentInvoiceBalanceContribution = Number(orderToPrint.totalAmount) - Number(orderToPrint.amountPaid);
        const previousBalance = totalBalance - currentInvoiceBalanceContribution;
        
        setPrintData({ order: orderToPrint, previousBalance });
    };

    const handleCloseModal = () => {
        setIsOrderModalOpen(false);
        setEditingOrder(null);
    };
    
    const handleDeleteOrder = (id: number) => {
        onDelete(id);
    };
    
    const sortedOrders = useMemo(() => {
        return [...orders].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }, [orders]);
    
    const filteredOrders = useMemo(() => {
        return sortedOrders.filter(order => {
            const searchTermMatch = filters.searchTerm === '' ||
                order.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                order.orderNumber.toLowerCase().includes(filters.searchTerm.toLowerCase());

            const statusMatch = filters.status === 'all' || order.status === filters.status;
            const paymentStatusMatch = filters.paymentStatus === 'all' || order.paymentStatus === filters.paymentStatus;
            
            const orderDate = new Date(order.orderDate);
            orderDate.setHours(0,0,0,0);
            
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            if (startDate) startDate.setHours(0,0,0,0);
            
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            if (endDate) endDate.setHours(0,0,0,0);

            const startDateMatch = !startDate || orderDate >= startDate;
            const endDateMatch = !endDate || orderDate <= endDate;
            
            return searchTermMatch && statusMatch && paymentStatusMatch && startDateMatch && endDateMatch;
        });
    }, [sortedOrders, filters]);

    const filterInputStyles = "bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full";

    return (
        <div className="p-8">
            {canManageSales && <DrugModal 
                isOpen={isDrugModalOpen} 
                onClose={() => setIsDrugModalOpen(false)}
                onSave={onSaveDrug}
                initialData={null}
                addToast={addToast}
            />}
            {canManageSales && <OrderModal 
                isOpen={isOrderModalOpen} 
                onClose={handleCloseModal} 
                onSave={onSave} 
                initialData={editingOrder}
                drugs={drugs}
                customers={customers}
                orders={orders}
                addToast={addToast}
                mode={modalMode}
            />}
             <InvoiceModal
                isOpen={!!printData}
                onClose={() => setPrintData(null)}
                order={printData?.order || null}
                customer={customers.find(c => c.name === printData?.order?.customerName) || null}
                companyInfo={companyInfo}
                documentSettings={documentSettings}
                previousBalance={printData?.previousBalance || 0}
            />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">فروش و سفارشات</h2>
                    <p className="text-gray-500">لیست کامل سفارشات و مستردی‌های ثبت شده در سیستم</p>
                </div>
                 <div className="flex items-center gap-2">
                    {canManageSales && <button onClick={handleOpenAddDrugModal} className="flex items-center bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                        <PlusIcon />
                        <span className="mr-2">افزودن داروی جدید</span>
                    </button>}
                    {canManageSales && <button onClick={handleOpenAddOrderModal} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md">
                        <PlusIcon />
                        <span className="mr-2">ثبت سفارش جدید</span>
                    </button>}
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl shadow-md p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">جستجو</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="searchTerm"
                                placeholder="نام مشتری یا شماره سفارش..."
                                className={`${filterInputStyles} pl-10`}
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                            />
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <SearchIcon />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت سفارش</label>
                         <select name="status" value={filters.status} onChange={handleFilterChange} className={filterInputStyles}>
                            <option value="all">همه</option>
                            <option value="در حال پردازش">در حال پردازش</option>
                            <option value="ارسال شده">ارسال شده</option>
                            <option value="تکمیل شده">تکمیل شده</option>
                            <option value="لغو شده">لغو شده</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت پرداخت</label>
                         <select name="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange} className={filterInputStyles}>
                            <option value="all">همه</option>
                            <option value="پرداخت شده">پرداخت شده</option>
                            <option value="قسمتی پرداخت شده">قسمتی پرداخت شده</option>
                            <option value="پرداخت نشده">پرداخت نشده</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={filterInputStyles} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={filterInputStyles} />
                        </div>
                    </div>
                    <div className="lg:col-span-6 flex justify-end">
                        <button onClick={() => setFilters(initialFilters)} className="text-sm text-gray-600 hover:text-teal-600 font-semibold transition-colors">
                            پاک کردن فیلترها
                        </button>
                    </div>
                </div>
            </div>


            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">شماره سند</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">نام مشتری</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">تاریخ</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">مبلغ کل</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">مبلغ باقی‌مانده</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">وضعیت پرداخت</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">وضعیت سفارش</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-gray-500">
                                        هیچ سندی با این مشخصات یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const orderStatusStyle = getOrderStatusStyle(order.status);
                                    const paymentStatusStyle = getPaymentStatusStyle(order.paymentStatus);
                                    const remainingAmount = Number(order.totalAmount) - Number(order.amountPaid);
                                    const isReturn = order.type === 'sale_return';
                                    return (
                                        <tr key={order.id} className={`${isReturn ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'} transition-colors`}>
                                            <td className="p-4 whitespace-nowrap text-gray-800 font-medium">
                                                <div className='flex items-center gap-2'>
                                                     {isReturn && <span className="text-red-600" title="مستردی فروش"><ReturnIcon /></span>}
                                                     <span>{order.orderNumber}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-gray-500">{order.customerName}</td>
                                            <td className="p-4 whitespace-nowrap text-gray-500 text-sm">
                                                {new Date(order.orderDate).toLocaleDateString('fa-IR')}
                                                <div className="font-mono text-xs text-gray-400">{formatGregorianForDisplay(order.orderDate)}</div>
                                            </td>
                                            <td className={`p-4 whitespace-nowrap font-semibold ${isReturn ? 'text-red-600' : 'text-gray-800'}`}>{order.totalAmount.toLocaleString()}</td>
                                            <td className={`p-4 whitespace-nowrap font-semibold ${remainingAmount > 0 ? 'text-red-600' : (remainingAmount < 0 ? 'text-green-600' : 'text-gray-800')}`}>{remainingAmount.toLocaleString()}</td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${paymentStatusStyle.bg} ${paymentStatusStyle.text}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${orderStatusStyle.bg} ${orderStatusStyle.text}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    {!isReturn && <button onClick={() => handleOpenPrintModal(order)} title="چاپ فاکتور" className="text-gray-500 hover:text-gray-700 p-1"><PrintIcon /></button>}
                                                    {canManageSales && (
                                                        <>
                                                        {!isReturn && <button onClick={() => handleOpenEditModal(order)} title="ویرایش" className="text-blue-500 hover:text-blue-700 p-1"><EditIcon /></button>}
                                                        <button onClick={() => handleDeleteOrder(order.id)} title="حذف" className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                                        {order.status !== 'در حال پردازش' && !isReturn && (
                                                          <button onClick={() => handleOpenReturnModal(order)} title="مستردی/برگشت" className="text-yellow-600 hover:text-yellow-800 p-1"><ReturnIcon /></button>
                                                        )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sales;