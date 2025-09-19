import React, { useState, useMemo, useEffect } from 'react';
import { Drug, formatQuantity, Batch } from './Inventory';
import { User, CompanyInfo, DocumentSettings } from './Settings';
import { StockRequisition, StockRequisitionItem } from './App';

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);
const FulfillIcon = () => <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const SearchIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-5 h-5 text-gray-400" />;
const PrintIcon = () => <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m8 0v4H9v-4m4 0h-2" className="w-5 h-5"/>;


//=========== FULFILLMENT MODAL ===========//
type FulfillmentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    requisition: StockRequisition | null;
    mainWarehouseDrugs: Drug[];
    onConfirmFulfillment: (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[]) => void;
};

const FulfillmentModal: React.FC<FulfillmentModalProps> = ({ isOpen, onClose, requisition, mainWarehouseDrugs, onConfirmFulfillment }) => {
    const [fulfilledItems, setFulfilledItems] = useState<StockRequisitionItem[]>([]);

    useEffect(() => {
        if (requisition) {
            setFulfilledItems(requisition.items.map(item => ({ ...item, quantityFulfilled: item.quantityRequested })));
        }
    }, [requisition]);

    if (!isOpen || !requisition) return null;

    const handleQuantityChange = (drugId: number, value: string) => {
        const quantity = Number(value);
        setFulfilledItems(currentItems =>
            currentItems.map(item =>
                item.drugId === drugId ? { ...item, quantityFulfilled: quantity } : item
            )
        );
    };

    const handleSubmit = () => {
        onConfirmFulfillment(requisition, fulfilledItems);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">تکمیل درخواست کالا #{requisition.id}</h3>
                <p className="text-gray-600 mb-6">درخواست شده توسط: {requisition.requestedBy} در تاریخ {new Date(requisition.date).toLocaleDateString('fa-IR')}</p>
                
                <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3">نام دارو</th>
                                <th className="p-3">تعداد درخواستی</th>
                                <th className="p-3">موجودی انبار اصلی</th>
                                <th className="p-3">تعداد ارسالی</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {fulfilledItems.map(item => {
                                const drugInStock = mainWarehouseDrugs.find(d => d.id === item.drugId);
                                const maxQuantity = drugInStock ? drugInStock.batches.reduce((sum, b) => sum + b.quantity, 0) : 0;
                                return (
                                    <tr key={item.drugId} className="hover:bg-gray-50">
                                        <td className="p-3 font-semibold">{item.drugName}</td>
                                        <td className="p-3">{item.quantityRequested}</td>
                                        <td className="p-3">{formatQuantity(maxQuantity, drugInStock?.unitsPerCarton)}</td>
                                        <td className="p-3">
                                            <input 
                                                type="number" 
                                                value={item.quantityFulfilled} 
                                                onChange={e => handleQuantityChange(item.drugId, e.target.value)}
                                                max={maxQuantity}
                                                min="0"
                                                className="w-24 text-center p-1 border rounded-md focus:ring-2 focus:ring-teal-500"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-end space-x-4 space-x-reverse pt-6 mt-4 border-t">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">انصراف</button>
                    <button type="button" onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold shadow-md">تایید و انتقال موجودی</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW PRINT PREVIEW MODAL ---
const PrintPreviewModal = ({ isOpen, onClose, requisition, companyInfo, documentSettings }: { isOpen: boolean; onClose: () => void; requisition: StockRequisition | null; companyInfo: CompanyInfo; documentSettings: DocumentSettings }) => {
    if (!isOpen || !requisition) return null;

    const handlePrint = () => {
        setTimeout(() => window.print(), 100);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[90] flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl mt-8 mb-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div
                    id="print-section"
                    className={`p-10 template-modern layout-logo-${documentSettings.logoPosition}`}
                    style={{ '--accent-color': documentSettings.accentColor } as React.CSSProperties}
                >
                    <header className="print-header">
                        <div className="print-company-info">
                            <h1 className="text-3xl font-bold text-gray-800 print-title">{companyInfo.name}</h1>
                            <p className="text-gray-500">{companyInfo.address}</p>
                        </div>
                        {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="print-logo" />}
                    </header>
                    <div className="text-center my-8">
                        <h2 className="text-2xl font-bold">حواله انتقال انبار</h2>
                        <p className="text-sm text-gray-500 mt-1">شماره درخواست: {requisition.id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 my-8 text-sm">
                        <p><strong>تاریخ درخواست:</strong> {new Date(requisition.date).toLocaleDateString('fa-IR')}</p>
                        <p><strong>درخواست کننده:</strong> {requisition.requestedBy}</p>
                        <p><strong>تاریخ تکمیل:</strong> {new Date().toLocaleDateString('fa-IR')}</p>
                        <p><strong>تکمیل کننده:</strong> {requisition.fulfilledBy}</p>
                    </div>
                    <table className="w-full text-right">
                        <thead>
                            <tr>
                                <th className="p-3 text-sm font-semibold">#</th>
                                <th className="p-3 text-sm font-semibold">شرح محصول</th>
                                <th className="p-3 text-sm font-semibold">تعداد منتقل شده</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {requisition.items.map((item, index) => (
                                <tr key={item.drugId}>
                                    <td className="p-3">{index + 1}</td>
                                    <td className="p-3 font-medium">{item.drugName}</td>
                                    <td className="p-3">{item.quantityFulfilled.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-end mt-24 pt-8 border-t-2">
                        <div className="text-center w-1/3">
                            <p className="font-semibold">تحویل دهنده (انبار اصلی)</p>
                            <p className="mt-12 border-t">امضا</p>
                        </div>
                        <div className="text-center w-1/3">
                            <p className="font-semibold">تحویل گیرنده (انبار فروش)</p>
                            <p className="mt-12 border-t">امضا</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse p-4 bg-gray-50 rounded-b-xl border-t print:hidden">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">بستن</button>
                    <button type="button" onClick={handlePrint} className="flex items-center px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold">
                        <PrintIcon /> <span className="mr-2">چاپ</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
type MainWarehouseProps = {
    mainWarehouseDrugs: Drug[];
    stockRequisitions: StockRequisition[];
    onFulfillRequisition: (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[], fulfilledBy: string) => void;
    currentUser: User;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    companyInfo: CompanyInfo;
    documentSettings: DocumentSettings;
};

type Tab = 'stock' | 'requests';

const MainWarehouse: React.FC<MainWarehouseProps> = ({ mainWarehouseDrugs, stockRequisitions, onFulfillRequisition, currentUser, addToast, companyInfo, documentSettings }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [requisitionToPrint, setRequisitionToPrint] = useState<StockRequisition | null>(null);
    const [selectedRequisition, setSelectedRequisition] = useState<StockRequisition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('requests');

    const handleOpenFulfillmentModal = (req: StockRequisition) => {
        setSelectedRequisition(req);
        setIsModalOpen(true);
    };
    
    const handleOpenPrintModal = (req: StockRequisition) => {
        setRequisitionToPrint(req);
        setIsPrintModalOpen(true);
    };

    const handleConfirmFulfillment = (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[]) => {
        onFulfillRequisition(requisition, fulfilledItems, currentUser.username);
    };

    const filteredDrugs = useMemo(() => {
        return mainWarehouseDrugs.filter(drug =>
            drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (drug.code && drug.code.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [mainWarehouseDrugs, searchTerm]);

    const pendingRequisitions = useMemo(() => {
        return stockRequisitions
            .filter(r => r.status === 'در انتظار')
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [stockRequisitions]);
    
    const completedRequisitions = useMemo(() => {
        return stockRequisitions
            .filter(r => r.status !== 'در انتظار')
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stockRequisitions]);

    const TabButton = ({ tabId, children }: { tabId: Tab, children: React.ReactNode }) => (
        <button 
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-lg font-semibold rounded-t-lg border-b-4 transition-colors ${activeTab === tabId ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="p-8 space-y-8">
            <FulfillmentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                requisition={selectedRequisition}
                mainWarehouseDrugs={mainWarehouseDrugs}
                onConfirmFulfillment={handleConfirmFulfillment}
            />
             <PrintPreviewModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                requisition={requisitionToPrint}
                companyInfo={companyInfo}
                documentSettings={documentSettings}
            />

            <div>
                <h2 className="text-2xl font-bold text-gray-800">انبار اصلی</h2>
                <p className="text-gray-500">موجودی کلان و مدیریت انتقالات داخلی</p>
            </div>
            
            <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                    <TabButton tabId="requests">درخواست‌های انتقال ({pendingRequisitions.length})</TabButton>
                    <TabButton tabId="stock">موجودی انبار</TabButton>
                </nav>
            </div>

            {activeTab === 'requests' && (
                 <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="font-bold text-lg mb-4">درخواست‌های کالا در انتظار تایید</h3>
                    {pendingRequisitions.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">هیچ درخواست جدیدی وجود ندارد.</p>
                    ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {pendingRequisitions.map(req => (
                                <div key={req.id} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">درخواست #{req.id} - <span className="font-normal text-gray-600">از طرف {req.requestedBy}</span></p>
                                            <p className="text-sm text-gray-500">{new Date(req.date).toLocaleString('fa-IR')}</p>
                                        </div>
                                        <button onClick={() => handleOpenFulfillmentModal(req)} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md font-semibold">
                                            <FulfillIcon /> <span className="mr-2">بررسی و تکمیل</span>
                                        </button>
                                    </div>
                                    <ul className="mt-3 list-disc list-inside text-sm space-y-1">
                                        {req.items.map(item => <li key={item.drugId}>{item.drugName}: <span className="font-semibold">{item.quantityRequested} عدد</span></li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                
                <div className="mt-8">
                    <h3 className="font-bold text-lg mb-4">تاریخچه درخواست‌ها</h3>
                     {completedRequisitions.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">هیچ درخواست تکمیل شده‌ای وجود ندارد.</p>
                    ) : (
                         <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {completedRequisitions.map(req => (
                                <div key={req.id} className={`border rounded-lg p-4 ${req.status === 'تکمیل شده' ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">درخواست #{req.id} - <span className={`font-semibold ${req.status === 'تکمیل شده' ? 'text-green-700' : 'text-red-700'}`}>{req.status}</span></p>
                                            <p className="text-sm text-gray-500">{new Date(req.date).toLocaleString('fa-IR')}</p>
                                        </div>
                                        {req.status === 'تکمیل شده' &&
                                        <button onClick={() => handleOpenPrintModal(req)} className="flex items-center bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 text-sm font-semibold">
                                            <PrintIcon /> <span className="mr-2">چاپ حواله</span>
                                        </button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </div>
            )}
            
            {activeTab === 'stock' && (
                 <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg">لیست موجودی انبار اصلی</h3>
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
                    </div>
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="w-full text-right">
                            <thead className="bg-gray-100 border-b-2 border-gray-200 sticky top-0">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">نام دارو</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">کمپانی</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">تعداد موجود</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">نزدیک‌ترین انقضا</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredDrugs.map(drug => {
                                    const totalQuantity = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
                                    const earliestExpiry = drug.batches.filter(b => b.quantity > 0).map(b => b.expiryDate).sort()[0];
                                    return (
                                    <tr key={drug.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-800 font-medium">{drug.name}</td>
                                        <td className="p-4 text-gray-500">{drug.manufacturer}</td>
                                        <td className="p-4 text-gray-800 font-semibold">
                                            {formatQuantity(totalQuantity, drug.unitsPerCarton)}
                                        </td>
                                        <td className="p-4 text-gray-500">{earliestExpiry ? new Date(earliestExpiry).toLocaleDateString('fa-IR') : '-'}</td>
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

export default MainWarehouse;