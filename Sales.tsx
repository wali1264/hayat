
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Drug, drugCategories } from './Inventory';
import { Customer } from './Customers';
import { CompanyInfo, User } from './Settings';

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


//=========== TYPES ===========//
export type OrderStatus = 'در حال پردازش' | 'ارسال شده' | 'تکمیل شده' | 'لغو شده';
export type PaymentStatus = 'پرداخت شده' | 'پرداخت نشده' | 'قسمتی پرداخت شده';

export type OrderItem = {
    drugId: number;
    drugName: string;
    quantity: number;
    originalPrice: number;
    discountPercentage: number;
    finalPrice: number;
};

export type Order = {
    id: number;
    orderNumber: string;
    customerName: string;
    orderDate: string;
    items: OrderItem[];
    totalAmount: number;
    amountPaid: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
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
            // FIX: Stop the scanner on success, then notify the parent.
            // This ensures the camera turns off immediately.
            html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
            }).catch(err => {
                console.error("Failed to stop scanner on success.", err);
                onScanSuccess(decodedText); // Notify parent anyway
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
};

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, initialData, drugs, customers }) => {
    
    const [orderInfo, setOrderInfo] = useState({
        customerName: '', amountPaid: '', status: 'ارسال شده' as OrderStatus,
    });
    const [items, setItems] = useState<OrderItem[]>([]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    
    // States for adding items
    const [drugSearchTerm, setDrugSearchTerm] = useState('');
    const [deviceScanInput, setDeviceScanInput] = useState('');
    const [addQuantity, setAddQuantity] = useState('1');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);


    const isEditMode = initialData !== null;

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + item.quantity * item.finalPrice, 0);
    }, [items]);

    const availableDrugs = useMemo(() => {
        if (!drugSearchTerm) return [];
        return drugs
            .filter(d => d.quantity > 0)
            .filter(d => d.name.toLowerCase().includes(drugSearchTerm.toLowerCase()))
            .slice(0, 10);
    }, [drugs, drugSearchTerm]);
    
    useEffect(() => {
        if (isOpen) {
             if (initialData) {
                setOrderInfo({ customerName: initialData.customerName, amountPaid: String(initialData.amountPaid), status: initialData.status });
                setItems(initialData.items);
            } else {
                setOrderInfo({ customerName: '', amountPaid: '', status: 'ارسال شده' });
                setItems([]);
                setDrugSearchTerm('');
                setDeviceScanInput('');
                setAddQuantity('1');
                setIsSearchFocused(false);
            }
        }
    }, [isOpen, initialData]);
    
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
        if (existingItemIndex > -1) {
            const updatedItems = [...items];
            const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
            if (newQuantity > drug.quantity) {
                alert(`تعداد درخواستی (${newQuantity}) بیشتر از موجودی انبار (${drug.quantity}) است.`);
                return false;
            }
            updatedItems[existingItemIndex].quantity = newQuantity;
            setItems(updatedItems);
        } else {
            if (quantity > drug.quantity) {
                 alert(`تعداد درخواستی (${quantity}) بیشتر از موجودی انبار (${drug.quantity}) است.`);
                 return false;
            }
            const finalPrice = drug.price * (1 - drug.discountPercentage / 100);
            setItems(prev => [...prev, {
                drugId: drug.id,
                drugName: drug.name,
                quantity: quantity,
                originalPrice: drug.price,
                discountPercentage: drug.discountPercentage,
                finalPrice: finalPrice,
            }]);
        }
        return true;
    }
    
    const handleSelectDrug = (drug: Drug) => {
        const quantity = Number(addQuantity);
        if (!quantity || quantity <= 0) {
            alert("لطفا تعداد معتبر وارد کنید.");
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
                // FIX: Automatically close the scanner modal on successful scan for better UX.
                setIsScannerOpen(false);
            }
        } else {
            alert("محصولی با این بارکد یافت نشد.");
            setIsScannerOpen(false); // Close even if not found
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
                alert("محصولی با این بارکد یافت نشد.");
            }
            setDeviceScanInput(''); // Clear input for next scan
        }
    };
    
    const handleRemoveItem = (drugId: number) => {
        setItems(prev => prev.filter(item => item.drugId !== drugId));
    };

    const handleQuantityChange = (drugId: number, newQuantityStr: string) => {
        let newQuantity = parseInt(newQuantityStr, 10);
        
        if (isNaN(newQuantity) || newQuantity < 1) {
             newQuantity = 1; // Default to 1 if input is invalid or less than 1
        }

        const drugInStock = drugs.find(d => d.id === drugId);
        if (drugInStock && newQuantity > drugInStock.quantity) {
            alert(`تعداد درخواستی (${newQuantity}) بیشتر از موجودی انبار (${drugInStock.quantity}) است.`);
            newQuantity = drugInStock.quantity; // Cap the value at max stock
        }

        setItems(currentItems =>
            currentItems.map(item =>
                item.drugId === drugId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amountPaid = Number(orderInfo.amountPaid) || 0;

        if (!orderInfo.customerName || items.length === 0) {
            alert("لطفاً نام مشتری را وارد کرده و حداقل یک قلم دارو به سفارش اضافه کنید.");
            return;
        }

        if (items.some(item => item.quantity <= 0)) {
            alert("تعداد تمام اقلام باید بیشتر از صفر باشد.");
            return;
        }

        let paymentStatus: PaymentStatus;
        if (amountPaid <= 0) {
            paymentStatus = 'پرداخت نشده';
        } else if (amountPaid >= totalAmount) {
            paymentStatus = 'پرداخت شده';
        } else {
            paymentStatus = 'قسمتی پرداخت شده';
        }

        const finalOrderData: Order = {
            id: isEditMode ? initialData!.id : Date.now(),
            orderNumber: isEditMode ? initialData!.orderNumber : '',
            orderDate: isEditMode ? initialData!.orderDate : new Date().toISOString().split('T')[0],
            customerName: orderInfo.customerName,
            status: orderInfo.status,
            amountPaid,
            items,
            totalAmount,
            paymentStatus
        };
        onSave(finalOrderData);
        onClose();
    };

    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <>
        <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl transform transition-all" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'ویرایش سفارش' : 'ثبت سفارش جدید'}</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="customerName" className={labelStyles}>نام مشتری</label>
                            <input list="customer-list" type="text" name="customerName" value={orderInfo.customerName} onChange={handleInfoChange} className={inputStyles} required autoFocus />
                            <datalist id="customer-list">
                                {customers.map(c => <option key={c.id} value={c.name} />)}
                            </datalist>
                        </div>
                        <div>
                           <label htmlFor="status" className={labelStyles}>وضعیت سفارش</label>
                            <select name="status" value={orderInfo.status} onChange={handleInfoChange} className={inputStyles}>
                                <option value="در حال پردازش">در حال پردازش</option>
                                <option value="ارسال شده">ارسال شده</option>
                                <option value="تکمیل شده">تکمیل شده</option>
                                <option value="لغو شده">لغو شده</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                        <h4 className="font-bold text-gray-700">افزودن اقلام به سفارش</h4>
                         {/* Methods for adding items */}
                        <div className="p-2 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                            {items.length === 0 ? <p className="text-center text-gray-500 py-4">هنوز هیچ آیتمی اضافه نشده است.</p> :
                                <table className="w-full text-sm">
                                    <thead className="text-right">
                                        <tr className="border-b">
                                            <th className="p-2 font-semibold">نام دارو</th>
                                            <th className="p-2 font-semibold text-center w-28">تعداد</th>
                                            <th className="p-2 font-semibold">قیمت واحد</th>
                                            <th className="p-2 font-semibold">مبلغ جزء</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.drugId} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-2">{item.drugName}</td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(item.drugId, e.target.value)}
                                                        className="w-20 text-center border rounded-md py-1 mx-auto block"
                                                        min="1"
                                                        max={drugs.find(d => d.id === item.drugId)?.quantity}
                                                        aria-label={`تعداد برای ${item.drugName}`}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    {item.discountPercentage > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-500 line-through">{item.originalPrice.toLocaleString()}</span>
                                                            <span className="font-bold text-teal-600">{item.finalPrice.toLocaleString()}</span>
                                                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item.discountPercentage}%</span>
                                                        </div>
                                                    ) : (
                                                        <span>{item.originalPrice.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="p-2 font-semibold">{(item.quantity * item.finalPrice).toLocaleString()}</td>
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
                            <input type="number" name="amountPaid" value={orderInfo.amountPaid} onChange={handleInfoChange} className={inputStyles} min="0" placeholder="مثلا: 5000" />
                        </div>
                        <div className="text-right">
                            <p className={labelStyles}>مبلغ کل سفارش</p>
                            <p className="text-2xl font-bold text-teal-600">{totalAmount.toLocaleString()} <span className="text-lg">افغانی</span></p>
                        </div>
                    </div>


                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-md hover:shadow-lg">
                           {isEditMode ? 'ذخیره تغییرات' : 'ذخیره سفارش'}
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
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order, customer, companyInfo }) => {
    if (!isOpen || !order) return null;

    const handlePrint = () => {
        // A small delay can help ensure the browser has processed any DOM/style updates before printing.
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const totalDiscount = order.items.reduce((sum, item) => {
        const itemDiscount = (item.originalPrice - item.finalPrice) * item.quantity;
        return sum + itemDiscount;
    }, 0);
    const subtotal = order.totalAmount + totalDiscount;


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl mt-8 mb-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div id="print-section" className="p-10">
                    <header className="flex justify-between items-start pb-6 border-b">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{companyInfo.name}</h1>
                            <p className="text-gray-500">{companyInfo.address}</p>
                            <p className="text-gray-500">{companyInfo.phone}</p>
                        </div>
                        {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="w-24 h-24 object-contain" />}
                    </header>
                    <div className="grid grid-cols-3 gap-8 my-8">
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
                            <h4 className="text-sm text-gray-500 font-bold mb-1">تاریخ صدور:</h4>
                            <p className="font-semibold text-gray-800">{new Date(order.orderDate).toLocaleDateString('fa-IR')}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                         <table className="w-full text-right">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-gray-600">#</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">شرح محصول</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">تعداد</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">قیمت واحد</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">تخفیف</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600">مبلغ نهایی</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {order.items.map((item, index) => (
                                    <tr key={item.drugId}>
                                        <td className="p-3">{index + 1}</td>
                                        <td className="p-3 font-medium text-gray-800">{item.drugName}</td>
                                        <td className="p-3">{item.quantity.toLocaleString()}</td>
                                        <td className="p-3">{item.originalPrice.toLocaleString()}</td>
                                        <td className="p-3">{item.discountPercentage > 0 ? `${item.discountPercentage}%` : '-'}</td>
                                        <td className="p-3 font-semibold text-gray-800">{(item.finalPrice * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-8">
                        <div className="w-full max-w-sm space-y-3">
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
                                <span>{order.totalAmount.toLocaleString()} افغانی</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse p-4 bg-gray-50 rounded-b-xl border-t print:hidden">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">بستن</button>
                    <button type="button" onClick={handlePrint} className="flex items-center px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold">
                        <PrintIcon /> <span className="mr-2">چاپ</span>
                    </button>
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
};

const Sales: React.FC<SalesProps> = ({ orders, drugs, customers, companyInfo, onSave, onDelete, currentUser }) => {
    const initialFilters = {
        searchTerm: '', status: 'all', paymentStatus: 'all', startDate: '', endDate: '',
    };
    const [filters, setFilters] = useState(initialFilters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

    const canManageSales = useMemo(() => 
        currentUser.role === 'مدیر کل' || currentUser.role === 'فروشنده', 
    [currentUser.role]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenAddModal = () => {
        setEditingOrder(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (order: Order) => {
        setEditingOrder(order);
        setIsModalOpen(true);
    };
    
    const handleOpenPrintModal = (order: Order) => {
        setOrderToPrint(order);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOrder(null);
    };
    
    const handleDeleteOrder = (id: number) => {
        if (window.confirm("آیا از حذف این سفارش اطمینان دارید؟ اگر سفارش ارسال شده باشد، موجودی کالاها به انبار باز خواهد گشت.")) {
             onDelete(id);
        }
    };
    
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
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
    }, [orders, filters]);

    const filterInputStyles = "bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full";

    return (
        <div className="p-8">
            {canManageSales && <OrderModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={onSave} 
                initialData={editingOrder}
                drugs={drugs}
                customers={customers}
            />}
             <InvoiceModal
                isOpen={!!orderToPrint}
                onClose={() => setOrderToPrint(null)}
                order={orderToPrint}
                customer={customers.find(c => c.name === orderToPrint?.customerName) || null}
                companyInfo={companyInfo}
            />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">فروش و سفارشات</h2>
                    <p className="text-gray-500">لیست کامل سفارشات ثبت شده در سیستم</p>
                </div>
                 {canManageSales && <button onClick={handleOpenAddModal} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg">
                    <PlusIcon />
                    <span className="mr-2">ثبت سفارش جدید</span>
                </button>}
            </div>

            {/* Advanced Filters */}
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
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">شماره سفارش</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">نام مشتری</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">تاریخ سفارش</th>
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
                                        هیچ سفارشی با این مشخصات یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const orderStatusStyle = getOrderStatusStyle(order.status);
                                    const paymentStatusStyle = getPaymentStatusStyle(order.paymentStatus);
                                    const remainingAmount = order.totalAmount - order.amountPaid;
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 whitespace-nowrap text-gray-800 font-medium">{order.orderNumber}</td>
                                            <td className="p-4 whitespace-nowrap text-gray-500">{order.customerName}</td>
                                            <td className="p-4 whitespace-nowrap text-gray-500">{new Date(order.orderDate).toLocaleDateString('fa-IR')}</td>
                                            <td className="p-4 whitespace-nowrap text-gray-800 font-semibold">{order.totalAmount.toLocaleString()}</td>
                                            <td className={`p-4 whitespace-nowrap font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{remainingAmount.toLocaleString()}</td>
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
                                                    <button onClick={() => handleOpenPrintModal(order)} title="چاپ فاکتور" className="text-gray-500 hover:text-gray-700 p-1"><PrintIcon /></button>
                                                    {canManageSales && (
                                                        <>
                                                        <button onClick={() => handleOpenEditModal(order)} title="ویرایش" className="text-blue-500 hover:text-blue-700 p-1"><EditIcon /></button>
                                                        <button onClick={() => handleDeleteOrder(order.id)} title="حذف" className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
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
