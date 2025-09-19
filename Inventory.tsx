import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from './Settings';
import { StockRequisition, StockRequisitionItem } from './App';
import { RolePermissions } from './Settings';
import { NoPermissionMessage } from './App';

// Declare global libraries
declare var Html5Qrcode: any;
declare var QRCode: any;

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);

const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
const SearchIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-5 h-5 text-gray-400" />;
const EditIcon = () => <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />;
const TrashIcon = ({ className = "w-5 h-5"}: {className?: string}) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className} />;
const WasteIcon = () => <Icon path="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />;
const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
    if (direction === null) {
        return <Icon path="M8 9l4-4 4 4m0 6l-4 4-4-4" className="w-4 h-4 ml-2 text-gray-300 group-hover:text-gray-500" />;
    }
    if (direction === 'ascending') {
        return <Icon path="M5 15l7-7 7 7" className="w-4 h-4 ml-2" />;
    }
    return <Icon path="M19 9l-7 7-7-7" className="w-4 h-4 ml-2" />;
};
const CameraIcon = () => <Icon path="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4" />;
const QrCodeIcon = () => <Icon path="M3.75 4.5A.75.75 0 003 5.25v13.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5zm4.5 0a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5zm4.5 0a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5zm4.5 0a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5z" className="w-4 h-4" />;
const PrintIcon = () => <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v4H9v-4m4 0h-2" />;
const RequestIcon = () => <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />;

const CloseIcon = ({ className = "w-6 h-6" }: { className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


//=========== TYPES ===========//
// NEW BATCH TYPE
export type Batch = {
    lotNumber: string;
    quantity: number;
    expiryDate: string;
    productionDate?: string;
    purchasePrice: number;
};

// UPDATED DRUG TYPE to represent a product with multiple batches
export type Drug = {
    id: number;
    name: string;
    barcode?: string;
    code: string;
    manufacturer: string;
    unitsPerCarton?: number;
    price: number; // Selling price (per-product)
    discountPercentage: number; // Per-product discount
    category?: string;
    batches: Batch[];
};

export type WriteOffReason = 'تاریخ گذشته' | 'آسیب دیده' | 'مفقود شده' | 'سایر';


//=========== CONSTANTS ===========//
export const drugCategories = ['آنتی‌بیوتیک', 'مسکن', 'ویتامین و مکمل', 'ضد حساسیت', 'بیماری‌های قلبی', 'دیابت', 'تنفسی', 'گوارشی', 'سایر'];


//=========== HELPERS ===========//
export const formatQuantity = (totalUnits: number, unitsPerCarton?: number) => {
    if (!unitsPerCarton || unitsPerCarton <= 1) {
        return `${totalUnits.toLocaleString()} عدد`;
    }
    const cartons = Math.floor(totalUnits / unitsPerCarton);
    const units = totalUnits % unitsPerCarton;
    
    let result = '';
    if (cartons > 0) {
        result += `${cartons} کارتن`;
    }
    if (units > 0) {
        if (result) result += ' / ';
        result += `${units} عدد`;
    }
     if (!result) return '0 عدد';
    return result;
};


const getStatus = (drug: Drug) => {
    const totalQuantity = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalQuantity <= 0) return { text: 'تمام شده', color: 'text-gray-700', bg: 'bg-gray-200' };

    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    const earliestExpiry = drug.batches
        .filter(b => b.quantity > 0)
        .map(b => new Date(b.expiryDate))
        .sort((a, b) => a.getTime() - b.getTime())[0];

    if (!earliestExpiry) return { text: 'تمام شده', color: 'text-gray-700', bg: 'bg-gray-200' };

    if (earliestExpiry < now) return { text: 'منقضی شده', color: 'text-red-800', bg: 'bg-red-200' };
    if (earliestExpiry < threeMonthsFromNow) return { text: 'انقضا فوری', color: 'text-red-800', bg: 'bg-red-200' };
    if (earliestExpiry < sixMonthsFromNow) return { text: 'نزدیک به انقضا', color: 'text-yellow-800', bg: 'bg-yellow-200' };
    
    return { text: 'موجود', color: 'text-green-800', bg: 'bg-green-200' };
};

const getRowStyle = (statusText: string) => {
    const baseStyle = 'transition-colors';
    switch (statusText) {
        case 'منقضی شده':
        case 'انقضا فوری':
            return `${baseStyle} bg-red-50 hover:bg-red-100`;
        case 'نزدیک به انقضا':
            return `${baseStyle} bg-yellow-50 hover:bg-yellow-100`;
        default:
            return `${baseStyle} hover:bg-gray-50`;
    }
};

const getRequisitionStatusStyle = (status: StockRequisition['status']) => {
    switch (status) {
        case 'تکمیل شده': return { text: 'text-green-700', bg: 'bg-green-100' };
        case 'در انتظار': return { text: 'text-yellow-700', bg: 'bg-yellow-100' };
        case 'رد شده': return { text: 'text-red-700', bg: 'bg-red-100' };
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

        const html5QrCode = new Html5Qrcode("reader");
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            onScanSuccess(decodedText);
            html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
        };
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, (errorMessage) => {})
            .catch((err) => {
                console.error("Unable to start scanning.", err);
            });

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.log("Scanner already stopped or failed to stop.", err));
            }
        };
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-center mb-4">اسکن بارکد / QR کد</h3>
                <div id="reader" className="w-full"></div>
                <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-200 rounded-lg">انصراف</button>
            </div>
        </div>
    );
};

type BarcodeSheetModalProps = {
    isOpen: boolean;
    onClose: () => void;
    drugs: Drug[];
};

const BarcodeSheetModal: React.FC<BarcodeSheetModalProps> = ({ isOpen, onClose, drugs }) => {
    useEffect(() => {
        if (isOpen && drugs.length > 0) {
            drugs.forEach(drug => {
                if (drug.barcode) {
                    const canvas = document.getElementById(`qr-canvas-${drug.id}`);
                    if (canvas) {
                        QRCode.toCanvas(canvas, drug.barcode, { width: 100, margin: 1 }, (error) => {
                            if (error) console.error(error);
                        });
                    }
                }
            });
        }
    }, [isOpen, drugs]);

    if (!isOpen) return null;

    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">چاپ برگه بارکدها</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="بستن">
                        <CloseIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div id="print-section">
                         <h2 className="text-2xl font-bold text-center mb-6 hidden print:block">برگه بارکد محصولات</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {drugs.map(drug => (
                                <div key={drug.id} className="bg-white border rounded-lg p-2 flex flex-col items-center justify-center text-center">
                                    <p className="text-xs font-semibold break-words w-full mb-1">{drug.name}</p>
                                    <canvas id={`qr-canvas-${drug.id}`} className="max-w-full h-auto"></canvas>
                                    <p className="text-xs font-mono mt-1 break-all w-full">{drug.barcode}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
                 <footer className="p-4 border-t bg-white flex justify-end space-x-2 space-x-reverse print:hidden">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">بستن</button>
                    <button type="button" onClick={handlePrint} className="flex items-center px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold">
                        <PrintIcon /> <span className="mr-2">چاپ</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};


type DrugModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (drug: Omit<Drug, 'batches'>) => void;
    initialData: Omit<Drug, 'batches'> | null;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

export const DrugModal: React.FC<DrugModalProps> = ({ isOpen, onClose, onSave, initialData, addToast }) => {
    const defaultState = { name: '', barcode: '', code: '', manufacturer: '', unitsPerCarton: '', price: '', discountPercentage: '0', category: 'سایر' };
    const [drug, setDrug] = useState(defaultState);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const isEditMode = initialData !== null;

    useEffect(() => {
        if (isOpen) {
             if (initialData) {
                 setDrug({
                     name: initialData.name,
                     barcode: initialData.barcode || '',
                     code: initialData.code,
                     manufacturer: initialData.manufacturer,
                     unitsPerCarton: String(initialData.unitsPerCarton || ''),
                     price: String(initialData.price),
                     discountPercentage: String(initialData.discountPercentage || '0'),
                     category: initialData.category || 'سایر'
                 });
             } else {
                setDrug(defaultState);
             }
        }
    }, [isOpen, initialData]);


    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDrug(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const priceValue = Number(drug.price) || 0;
        if (!drug.name || priceValue <= 0) {
            addToast("لطفا نام محصول و قیمت فروش معتبر را وارد کنید.", 'error');
            return;
        }

        const drugToSave: Omit<Drug, 'batches'> = {
            id: isEditMode ? initialData!.id : Date.now(),
            name: drug.name,
            barcode: drug.barcode,
            code: drug.code,
            manufacturer: drug.manufacturer,
            category: drug.category,
            unitsPerCarton: Number(drug.unitsPerCarton) || 1,
            price: priceValue,
            discountPercentage: Number(drug.discountPercentage) || 0,
        };
        
        onSave(drugToSave);
        onClose();
    };
    
    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <>
        <BarcodeScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanSuccess={(text) => {
                setDrug(prev => ({...prev, barcode: text}));
                setIsScannerOpen(false);
            }}
        />
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-8 pb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-gray-800">{isEditMode ? 'ویرایش اطلاعات محصول' : 'افزودن محصول جدید'}</h3>
                </header>
                <main className="flex-1 overflow-y-auto px-8">
                    <form id="drug-modal-form" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div>
                                <label htmlFor="name" className={labelStyles}>نام محصول (ضروری)</label>
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
                                 <button type="button" title="اسکن با دوربین" onClick={() => setIsScannerOpen(true)} className="p-2 border rounded-lg hover:bg-gray-100"><CameraIcon /></button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                             <div>
                                <label htmlFor="price" className={labelStyles}>قیمت فروش (ضروری)</label>
                                <input type="number" name="price" id="price" value={drug.price} onChange={handleChange} className={inputStyles} min="1" required placeholder="مثلا: 150" />
                            </div>
                            <div>
                                <label htmlFor="discountPercentage" className={labelStyles}>تخفیف (٪)</label>
                                <input type="number" name="discountPercentage" id="discountPercentage" value={drug.discountPercentage} onChange={handleChange} className={inputStyles} min="0" max="100" placeholder="مثلا: 5"/>
                            </div>
                             <div>
                                <label htmlFor="unitsPerCarton" className={labelStyles}>تعداد در کارتن</label>
                                <input type="number" name="unitsPerCarton" id="unitsPerCarton" value={drug.unitsPerCarton} onChange={handleChange} className={inputStyles} min="1" placeholder="مثلا: 100" />
                            </div>
                        </div>
                    </form>
                </main>
                <footer className="flex justify-end space-x-4 space-x-reverse p-8 pt-4 border-t border-gray-200 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors">انصراف</button>
                    <button type="submit" form="drug-modal-form" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-md hover:shadow-lg">
                        {isEditMode ? 'ذخیره تغییرات' : 'ذخیره محصول'}
                    </button>
                </footer>
            </div>
        </div>
        </>
    );
};

type WriteOffModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (lotNumber: string, quantity: number, reason: WriteOffReason, notes: string) => void;
    drug: Drug | null;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

const WriteOffModal: React.FC<WriteOffModalProps> = ({ isOpen, onClose, onConfirm, drug, addToast }) => {
    const [selectedLot, setSelectedLot] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState<WriteOffReason>('تاریخ گذشته');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if(isOpen) {
            setSelectedLot(drug?.batches[0]?.lotNumber || '');
            setQuantity('');
            setReason('تاریخ گذشته');
            setNotes('');
        }
    }, [isOpen, drug]);

    if (!isOpen || !drug) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numQuantity = Number(quantity);
        const batch = drug.batches.find(b => b.lotNumber === selectedLot);

        if (!batch) {
            addToast("لطفا یک بچ معتبر انتخاب کنید.", 'error');
            return;
        }
        if (numQuantity <= 0) {
            addToast("لطفا تعداد معتبر وارد کنید.", 'error');
            return;
        }
        if (numQuantity > batch.quantity) {
            addToast(`تعداد ضایعات (${numQuantity}) نمی‌تواند بیشتر از موجودی بچ (${batch.quantity}) باشد.`, 'error');
            return;
        }
        onConfirm(selectedLot, numQuantity, reason, notes);
        onClose();
    };

    const totalQuantity = drug.batches.reduce((sum, b) => sum + b.quantity, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">ثبت ضایعات برای <span className="text-teal-600">{drug.name}</span></h3>
                <p className="text-sm text-gray-500 mb-6">موجودی کل: {formatQuantity(totalQuantity, drug.unitsPerCarton)}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">انتخاب بچ/لات</label>
                        <select value={selectedLot} onChange={e => setSelectedLot(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                            {drug.batches.filter(b => b.quantity > 0).map(b => (
                                <option key={b.lotNumber} value={b.lotNumber}>
                                    لات: {b.lotNumber} (موجودی: {b.quantity}, انقضا: {new Date(b.expiryDate).toLocaleDateString('fa-IR')})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">تعداد ضایع شده (واحد)</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" max={drug.batches.find(b => b.lotNumber === selectedLot)?.quantity} className="w-full p-2 border rounded-lg" required autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">دلیل</label>
                        <select value={reason} onChange={e => setReason(e.target.value as WriteOffReason)} className="w-full p-2 border rounded-lg bg-white">
                            <option value="تاریخ گذشته">تاریخ گذشته</option>
                            <option value="آسیب دیده">آسیب دیده</option>
                            <option value="مفقود شده">مفقود شده</option>
                            <option value="سایر">سایر</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">توضیحات (اختیاری)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded-lg h-20 resize-none"></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold">ثبت ضایعات</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type RequisitionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (requisition: Omit<StockRequisition, 'id' | 'status' | 'requestedBy' | 'date'>) => void;
    mainWarehouseDrugs: Drug[];
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

const RequisitionModal: React.FC<RequisitionModalProps> = ({ isOpen, onClose, onSave, mainWarehouseDrugs, addToast }) => {
    const [items, setItems] = useState<Omit<StockRequisitionItem, 'quantityFulfilled'>[]>([]);
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const [quantity, setQuantity] = useState('');
    const searchWrapperRef = useRef<HTMLDivElement>(null);

     const availableDrugs = useMemo(() => {
        if (!searchTerm) return [];
        const mainWarehouseDrugsWithStock = mainWarehouseDrugs.filter(d => d.batches.some(b => b.quantity > 0));
        return mainWarehouseDrugsWithStock
            .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) && !items.some(i => i.drugId === d.id))
            .slice(0, 5);
    }, [mainWarehouseDrugs, searchTerm, items]);
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
                setSearchTerm('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchWrapperRef]);

    if (!isOpen) return null;

    const handleAddItem = () => {
        if (!selectedDrug || !quantity || Number(quantity) <= 0) {
            addToast("لطفا دارو و تعداد معتبر را انتخاب کنید.", "error");
            return;
        }
        const totalStock = selectedDrug.batches.reduce((sum, b) => sum + b.quantity, 0);
        if (Number(quantity) > totalStock) {
             addToast(`تعداد درخواستی (${quantity}) بیشتر از موجودی انبار اصلی (${totalStock}) است.`, "error");
            return;
        }
        setItems(prev => [...prev, { drugId: selectedDrug.id, drugName: selectedDrug.name, quantityRequested: Number(quantity) }]);
        setSelectedDrug(null);
        setSearchTerm('');
        setQuantity('');
    };
    
    const handleRemoveItem = (drugId: number) => {
        setItems(prev => prev.filter(item => item.drugId !== drugId));
    };

    const handleSubmit = () => {
        if (items.length === 0) {
            addToast("لطفا حداقل یک قلم به درخواست اضافه کنید.", "error");
            return;
        }
        const itemsToSave: StockRequisitionItem[] = items.map(item => ({...item, quantityFulfilled: 0}));
        onSave({ items: itemsToSave, notes });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">ایجاد درخواست جدید کالا از انبار اصلی</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                        <div className="md:col-span-2 relative" ref={searchWrapperRef}>
                            <label className="block text-sm font-bold mb-1">انتخاب دارو</label>
                            <input type="text" placeholder="جستجو..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg" />
                            {searchTerm && availableDrugs.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                                    {availableDrugs.map(drug => {
                                        const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
                                        return (
                                        <div key={drug.id} onClick={() => { setSelectedDrug(drug); setSearchTerm(drug.name); }} className="p-2 hover:bg-teal-50 cursor-pointer">
                                            {drug.name} <span className="text-xs text-gray-500">(موجودی: {totalStock})</span>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                         <div>
                            <label className="block text-sm font-bold mb-1">تعداد</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" max={selectedDrug ? selectedDrug.batches.reduce((s, b) => s + b.quantity, 0) : undefined} className="w-full p-2 border rounded-lg" disabled={!selectedDrug} />
                        </div>
                        <button onClick={handleAddItem} className="w-full bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600 font-semibold h-10">افزودن</button>
                    </div>

                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2">نام دارو</th>
                                    <th className="p-2">تعداد درخواستی</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.drugId}>
                                        <td className="p-2">{item.drugName}</td>
                                        <td className="p-2">{item.quantityRequested.toLocaleString()}</td>
                                        <td className="p-2 text-center"><button onClick={() => handleRemoveItem(item.drugId)} className="text-red-500"><TrashIcon className="w-4 h-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div>
                        <label className="block text-sm font-bold mb-1">ملاحظات (اختیاری)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded-lg h-20 resize-none"></textarea>
                    </div>
                </div>
                 <div className="flex justify-end space-x-4 space-x-reverse pt-6 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">انصراف</button>
                    <button type="button" onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold shadow-md">ثبت و ارسال درخواست</button>
                </div>
            </div>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
type InventoryProps = {
    drugs: Drug[];
    mainWarehouseDrugs: Drug[];
    stockRequisitions: StockRequisition[];
    onSaveDrug: (drug: Omit<Drug, 'batches'>) => void;
    onDelete: (id: number) => void;
    onWriteOff: (drugId: number, lotNumber: string, quantity: number, reason: WriteOffReason, notes: string) => void;
    onSaveRequisition: (requisition: Omit<StockRequisition, 'id' | 'status' | 'requestedBy' | 'date'>) => void;
    currentUser: User;
    rolePermissions: RolePermissions;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

type Tab = 'stock' | 'requisitions';

const Inventory: React.FC<InventoryProps> = ({ drugs, mainWarehouseDrugs, stockRequisitions, onSaveDrug, onDelete, onWriteOff, onSaveRequisition, currentUser, rolePermissions, addToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);
    const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
    const [editingDrug, setEditingDrug] = useState<Omit<Drug, 'batches'> | null>(null);
    const [drugForWriteOff, setDrugForWriteOff] = useState<Drug | null>(null);
    const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
    const [drugsToPrint, setDrugsToPrint] = useState<Drug[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' }>({
        key: null,
        direction: 'ascending',
    });
    const [activeTab, setActiveTab] = useState<Tab>('stock');
    
    const permissions = useMemo(() => {
        if (currentUser.role === 'مدیر کل') {
            return {
                canCreateDrug: true,
                canEditDrug: true,
                canDeleteDrug: true,
                canWriteOffStock: true,
            };
        }
        return rolePermissions[currentUser.role];
    }, [currentUser.role, rolePermissions]);

    const hasAnyPermission = useMemo(() => {
        return permissions.canCreateDrug || permissions.canEditDrug || permissions.canDeleteDrug || permissions.canWriteOffStock;
    }, [permissions]);


    if (!hasAnyPermission && currentUser.role !== 'مدیر کل') {
        return <NoPermissionMessage />;
    }

    const handleOpenAddModal = () => {
        setEditingDrug(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (drug: Drug) => {
        const { batches, ...drugInfo } = drug;
        setEditingDrug(drugInfo);
        setIsModalOpen(true);
    };

    const handleOpenWriteOffModal = (drug: Drug) => {
        setDrugForWriteOff(drug);
        setIsWriteOffModalOpen(true);
    };

    const handleDeleteDrug = (id: number) => {
        onDelete(id);
    };
    
    const processedDrugs = useMemo(() => {
        return drugs.map(drug => {
            const totalQuantity = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
            const earliestExpiry = drug.batches
                .filter(b => b.quantity > 0)
                .map(b => b.expiryDate)
                .sort()[0] || null;
            return {
                ...drug,
                totalQuantity,
                earliestExpiry,
            };
        });
    }, [drugs]);

    const filteredDrugs = useMemo(() => {
        return processedDrugs.filter(drug => {
            const searchTermMatch = searchTerm === '' ||
                drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (drug.code && drug.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (drug.barcode && drug.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (drug.manufacturer && drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const statusMatch = statusFilter === 'all' || getStatus(drug).text === statusFilter;
            const categoryMatch = categoryFilter === 'all' || drug.category === categoryFilter;

            return searchTermMatch && statusMatch && categoryMatch;
        });
    }, [processedDrugs, searchTerm, statusFilter, categoryFilter]);

    const sortedAndFilteredDrugs = useMemo(() => {
        let sortableItems = [...filteredDrugs];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key!];
                const valB = b[sortConfig.key!];

                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;
                
                if (valA < valB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredDrugs, sortConfig]);

    const handlePrintBarcodeSheet = () => {
        const drugsWithBarcodes = sortedAndFilteredDrugs.filter(d => d.barcode && d.barcode.trim() !== '');
        if (drugsWithBarcodes.length === 0) {
            addToast("هیچ دارویی با بارکد برای چاپ یافت نشد.", "info");
            return;
        }
        setDrugsToPrint(drugsWithBarcodes);
        setIsSheetModalOpen(true);
    };
    
    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
            setSortConfig({ key: null, direction: 'ascending' });
            return;
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, columnKey }: { label: string; columnKey: string }) => (
        <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">
            <button
                type="button"
                onClick={() => requestSort(columnKey)}
                className="flex items-center group focus:outline-none"
            >
                {label}
                <SortIcon direction={sortConfig.key === columnKey ? sortConfig.direction : null} />
            </button>
        </th>
    );

    const TabButton = ({ tabId, children }: { tabId: Tab, children: React.ReactNode }) => (
        <button 
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-lg font-semibold rounded-t-lg border-b-4 transition-colors ${activeTab === tabId ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="p-8">
             {(permissions.canCreateDrug || permissions.canEditDrug) && <DrugModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSave={onSaveDrug}
                initialData={editingDrug}
                addToast={addToast}
            />}
            {permissions.canWriteOffStock && <WriteOffModal
                isOpen={isWriteOffModalOpen}
                onClose={() => setIsWriteOffModalOpen(false)}
                drug={drugForWriteOff}
                onConfirm={(lotNumber, quantity, reason, notes) => onWriteOff(drugForWriteOff!.id, lotNumber, quantity, reason, notes)}
                addToast={addToast}
            />}
            <RequisitionModal
                isOpen={isRequisitionModalOpen}
                onClose={() => setIsRequisitionModalOpen(false)}
                onSave={onSaveRequisition}
                mainWarehouseDrugs={mainWarehouseDrugs}
                addToast={addToast}
            />
            <BarcodeSheetModal
                isOpen={isSheetModalOpen}
                onClose={() => setIsSheetModalOpen(false)}
                drugs={drugsToPrint}
            />
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">مدیریت انبار فروش</h2>
                    <p className="text-gray-500">لیست داروهای موجود در انبار برای فروش روزانه</p>
                </div>
                {activeTab === 'stock' && (
                <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="جستجوی محصول..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <SearchIcon />
                        </div>
                    </div>
                    <div>
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            aria-label="فیلتر بر اساس دسته‌بندی"
                        >
                            <option value="all">همه دسته‌بندی‌ها</option>
                            {drugCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            aria-label="فیلتر بر اساس وضعیت"
                        >
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="موجود">موجود</option>
                            <option value="نزدیک به انقضا">نزدیک به انقضا</option>
                            <option value="انقضا فوری">انقضا فوری</option>
                            <option value="منقضی شده">منقضی شده</option>
                            <option value="تمام شده">تمام شده</option>
                        </select>
                    </div>
                    {permissions.canCreateDrug && (
                        <button onClick={handleOpenAddModal} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md">
                            <PlusIcon />
                            <span className="mr-2">افزودن محصول جدید</span>
                        </button>
                    )}
                </div>
                )}
            </div>
            
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px">
                    <TabButton tabId="stock">موجودی انبار</TabButton>
                    <TabButton tabId="requisitions">درخواست‌های کالا</TabButton>
                </nav>
            </div>
            
            {activeTab === 'stock' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <SortableHeader label="نام محصول" columnKey="name" />
                                    <SortableHeader label="کمپانی" columnKey="manufacturer" />
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">کد محصول</th>
                                    <SortableHeader label="دسته‌بندی" columnKey="category" />
                                    <SortableHeader label="قیمت فروش" columnKey="price" />
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">تخفیف</th>
                                    <SortableHeader label="موجودی کل" columnKey="totalQuantity" />
                                    <SortableHeader label="نزدیک‌ترین انقضا" columnKey="earliestExpiry" />
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">وضعیت</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sortedAndFilteredDrugs.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center p-8 text-gray-500">
                                            هیچ محصولی با این مشخصات یافت نشد.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedAndFilteredDrugs.map(drug => {
                                        const status = getStatus(drug);
                                        let indicatorElement = null;
                                        if (status.text === 'منقضی شده' || status.text === 'انقضا فوری') {
                                            indicatorElement = <span className="w-2.5 h-2.5 bg-red-500 rounded-full ml-3 flex-shrink-0" title={status.text}></span>;
                                        } else if (status.text === 'نزدیک به انقضا') {
                                            indicatorElement = <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full ml-3 flex-shrink-0" title={status.text}></span>;
                                        }

                                        return (
                                            <tr key={drug.id} className={getRowStyle(status.text)}>
                                                <td className="p-4 whitespace-nowrap text-gray-800 font-medium">
                                                    <div className="flex items-center">
                                                        {indicatorElement}
                                                        <span>{drug.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 whitespace-nowrap text-gray-500">{drug.manufacturer}</td>
                                                <td className="p-4 whitespace-nowrap text-gray-500 font-mono text-xs">{drug.code || '-'}</td>
                                                <td className="p-4 whitespace-nowrap text-gray-500">{drug.category || '-'}</td>
                                                <td className="p-4 whitespace-nowrap text-gray-600">{drug.price.toLocaleString()}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    {drug.discountPercentage > 0 ? (
                                                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
                                                            {drug.discountPercentage}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 whitespace-nowrap text-gray-800 font-semibold">
                                                    {formatQuantity(drug.totalQuantity, drug.unitsPerCarton)}
                                                </td>
                                                <td className="p-4 whitespace-nowrap text-gray-500">{drug.earliestExpiry ? new Date(drug.earliestExpiry).toLocaleDateString('fa-IR') : '-'}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.bg} ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                        {permissions.canEditDrug && <button onClick={() => handleOpenEditModal(drug)} title="ویرایش" className="text-blue-500 hover:text-blue-700 p-1"><EditIcon /></button>}
                                                        {permissions.canDeleteDrug && <button onClick={() => handleDeleteDrug(drug.id)} title="حذف" className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>}
                                                        {permissions.canWriteOffStock && <button onClick={() => handleOpenWriteOffModal(drug)} title="ثبت ضایعات" className="text-yellow-600 hover:text-yellow-800 p-1"><WasteIcon /></button>}
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
            )}
            
             {activeTab === 'requisitions' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg">تاریخچه درخواست‌های کالا</h3>
                         <button onClick={() => setIsRequisitionModalOpen(true)} className="flex items-center bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors shadow-md">
                            <RequestIcon />
                            <span className="mr-2">ایجاد درخواست جدید</span>
                        </button>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-4">#</th>
                                    <th className="p-4">تاریخ</th>
                                    <th className="p-4">درخواست‌کننده</th>
                                    <th className="p-4">تکمیل‌کننده</th>
                                    <th className="p-4">اقلام</th>
                                    <th className="p-4">وضعیت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stockRequisitions.map(req => {
                                    const statusStyle = getRequisitionStatusStyle(req.status);
                                    return (
                                    <tr key={req.id}>
                                        <td className="p-4 font-mono text-sm">{req.id}</td>
                                        <td className="p-4">{new Date(req.date).toLocaleDateString('fa-IR')}</td>
                                        <td className="p-4">{req.requestedBy}</td>
                                        <td className="p-4">{req.fulfilledBy || '-'}</td>
                                        <td className="p-4 text-xs">{req.items.map(i => i.drugName).join(', ')}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{req.status}</span>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
             )}
        </div>
    );
};

export default Inventory;