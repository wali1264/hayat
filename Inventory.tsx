
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from './Settings';

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
const TrashIcon = () => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
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
const CloseIcon = ({ className = "w-6 h-6" }: { className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


//=========== TYPES ===========//
export type Drug = {
    id: number;
    name: string;
    barcode?: string;
    code: string;
    manufacturer: string;
    quantity: number;
    expiryDate: string;
    productionDate?: string;
    price: number;
    discountPercentage: number;
    category?: string;
};

//=========== CONSTANTS ===========//
export const drugCategories = ['آنتی‌بیوتیک', 'مسکن', 'ویتامین و مکمل', 'ضد حساسیت', 'بیماری‌های قلبی', 'دیابت', 'تنفسی', 'گوارشی', 'سایر'];


//=========== HELPERS ===========//
const getStatus = (expiryDate: string, quantity: number) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    if (quantity <= 0) return { text: 'تمام شده', color: 'text-gray-700', bg: 'bg-gray-200' };
    if (expiry < now) return { text: 'منقضی شده', color: 'text-red-800', bg: 'bg-red-200' };
    if (expiry < threeMonthsFromNow) return { text: 'انقضا فوری', color: 'text-red-800', bg: 'bg-red-200' };
    if (expiry < sixMonthsFromNow) return { text: 'نزدیک به انقضا', color: 'text-yellow-800', bg: 'bg-yellow-200' };
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
    onSave: (drug: Drug) => void;
    initialData: Drug | null;
};

const DrugModal: React.FC<DrugModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const defaultState = { name: '', barcode: '', code: '', manufacturer: '', quantity: '', expiryDate: '', productionDate: '', price: '', discountPercentage: '', category: 'سایر' };
    const [drug, setDrug] = useState(defaultState);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const isEditMode = initialData !== null;

    useEffect(() => {
        if (isOpen) {
             setDrug(initialData ? {
                 name: initialData.name,
                 barcode: initialData.barcode || '',
                 code: initialData.code,
                 manufacturer: initialData.manufacturer,
                 quantity: String(initialData.quantity),
                 expiryDate: initialData.expiryDate,
                 productionDate: initialData.productionDate || '',
                 price: String(initialData.price),
                 discountPercentage: String(initialData.discountPercentage),
                 category: initialData.category || 'سایر'
             } : defaultState);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDrug(prev => ({ ...prev, [name]: value }));
    };
    
    // const handleGenerateInternalBarcode = () => {
    //     const timestamp = Date.now();
    //     const random = Math.random().toString(36).substring(2, 8);
    //     setDrug(prev => ({...prev, barcode: `HAYAT-INTERNAL-${timestamp}${random}`.toUpperCase()}));
    // }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const priceValue = Number(drug.price) || 0;
        if (!drug.name || !drug.expiryDate || priceValue <= 0) {
            alert("لطفاً نام دارو، تاریخ انقضا و قیمت معتبر را وارد کنید.");
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
            quantity: Number(drug.quantity) || 0,
            price: priceValue,
            discountPercentage: Number(drug.discountPercentage) || 0,
        };
        
        onSave(drugToSave);
        onClose();
    };
    
    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow";
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'ویرایش دارو' : 'افزودن داروی جدید'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label htmlFor="name" className={labelStyles}>نام دارو (ضروری)</label>
                            <input type="text" name="name" id="name" value={drug.name} onChange={handleChange} className={inputStyles} required autoFocus />
                        </div>
                        <div>
                           <label htmlFor="manufacturer" className={labelStyles}>شرکت سازنده</label>
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
                             {/* <button type="button" title="تولید بارکد داخلی" onClick={handleGenerateInternalBarcode} className="p-2 border rounded-lg hover:bg-gray-100"><QrCodeIcon /></button> */}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label htmlFor="quantity" className={labelStyles}>تعداد</label>
                            <input type="number" name="quantity" id="quantity" value={drug.quantity} onChange={handleChange} className={inputStyles} min="0" placeholder="مثلا: 100" />
                        </div>
                         <div>
                            <label htmlFor="price" className={labelStyles}>قیمت واحد (ضروری)</label>
                            <input type="number" name="price" id="price" value={drug.price} onChange={handleChange} className={inputStyles} min="1" required placeholder="مثلا: 150" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="discountPercentage" className={labelStyles}>تخفیف (٪)</label>
                            <input type="number" name="discountPercentage" id="discountPercentage" value={drug.discountPercentage} onChange={handleChange} className={inputStyles} min="0" max="100" placeholder="مثلا: 5"/>
                        </div>
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


//=========== MAIN COMPONENT ===========//
type InventoryProps = {
    drugs: Drug[];
    onSave: (drug: Drug) => void;
    onDelete: (id: number) => void;
    currentUser: User;
};

const Inventory: React.FC<InventoryProps> = ({ drugs, onSave, onDelete, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
    const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
    const [drugsToPrint, setDrugsToPrint] = useState<Drug[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Drug | null; direction: 'ascending' | 'descending' }>({
        key: null,
        direction: 'ascending',
    });

    const canManageInventory = useMemo(() => 
        currentUser.role === 'مدیر کل' || currentUser.role === 'انباردار', 
    [currentUser.role]);

    const handleOpenAddModal = () => {
        setEditingDrug(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (drug: Drug) => {
        setEditingDrug(drug);
        setIsModalOpen(true);
    };

    const handleDeleteDrug = (id: number) => {
        if (window.confirm("آیا از حذف این دارو اطمینان دارید؟ این عمل قابل بازگشت نیست.")) {
             onDelete(id);
        }
    };
    
    const filteredDrugs = useMemo(() => {
        return drugs.filter(drug => {
            const searchTermMatch = searchTerm === '' ||
                drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (drug.code && drug.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (drug.barcode && drug.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (drug.manufacturer && drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const statusMatch = statusFilter === 'all' || getStatus(drug.expiryDate, drug.quantity).text === statusFilter;
            const categoryMatch = categoryFilter === 'all' || drug.category === categoryFilter;

            return searchTermMatch && statusMatch && categoryMatch;
        });
    }, [drugs, searchTerm, statusFilter, categoryFilter]);

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
            alert("هیچ داروی دارای بارکد در لیست فعلی برای چاپ وجود ندارد.");
            return;
        }
        setDrugsToPrint(drugsWithBarcodes);
        setIsSheetModalOpen(true);
    };
    
    const requestSort = (key: keyof Drug) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
            setSortConfig({ key: null, direction: 'ascending' });
            return;
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, columnKey }: { label: string; columnKey: keyof Drug }) => (
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

    return (
        <div className="p-8">
             {canManageInventory && <DrugModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSave={onSave}
                initialData={editingDrug}
            />}
            <BarcodeSheetModal
                isOpen={isSheetModalOpen}
                onClose={() => setIsSheetModalOpen(false)}
                drugs={drugsToPrint}
            />
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">مدیریت انبار و موجودی</h2>
                    <p className="text-gray-500">لیست کامل داروهای موجود در انبار</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="جستجوی دارو..."
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
                    {canManageInventory && (
                        <>
                        {/* <button onClick={handlePrintBarcodeSheet} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
                           <PrintIcon />
                           <span className="mr-2">چاپ برگه بارکدها</span>
                        </button> */}
                        <button onClick={handleOpenAddModal} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg">
                            <PlusIcon />
                            <span className="mr-2">افزودن داروی جدید</span>
                        </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <SortableHeader label="نام دارو" columnKey="name" />
                                <SortableHeader label="دسته‌بندی" columnKey="category" />
                                <SortableHeader label="قیمت واحد" columnKey="price" />
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">تخفیف</th>
                                <SortableHeader label="تعداد موجود" columnKey="quantity" />
                                <SortableHeader label="تاریخ انقضا" columnKey="expiryDate" />
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">وضعیت</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedAndFilteredDrugs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-gray-500">
                                        هیچ دارویی با این مشخصات یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                sortedAndFilteredDrugs.map(drug => {
                                    const status = getStatus(drug.expiryDate, drug.quantity);
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
                                            <td className="p-4 whitespace-nowrap text-gray-800 font-semibold">{drug.quantity.toLocaleString()}</td>
                                            <td className="p-4 whitespace-nowrap text-gray-500">{new Date(drug.expiryDate).toLocaleDateString('fa-IR')}</td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.bg} ${status.color}`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    {canManageInventory && (
                                                        <>
                                                            <button onClick={() => handleOpenEditModal(drug)} title="ویرایش" className="text-blue-500 hover:text-blue-700 p-1"><EditIcon /></button>
                                                            <button onClick={() => handleDeleteDrug(drug.id)} title="حذف" className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
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

export default Inventory;
