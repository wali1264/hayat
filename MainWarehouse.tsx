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

//=========== FULFILLMENT MODAL ===========//
type FulfillmentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    requisition: StockRequisition | null;
    mainWarehouseDrugs: Drug[];
    onConfirmFulfillment: (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[]) => void;
    isReadOnly?: boolean;
};

const FulfillmentModal: React.FC<FulfillmentModalProps> = ({ isOpen, onClose, requisition, mainWarehouseDrugs, onConfirmFulfillment, isReadOnly }) => {
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
                                        <td className="p-3">{formatQuantity(item.quantityRequested, drugInStock?.unitsPerCarton, drugInStock?.cartonSize)}</td>
                                        <td className="p-3">{formatQuantity(maxQuantity, drugInStock?.unitsPerCarton, drugInStock?.cartonSize)}</td>
                                        <td className="p-3">
                                            <input 
                                                type="number" 
                                                value={item.quantityFulfilled} 
                                                onChange={e => handleQuantityChange(item.drugId, e.target.value)}
                                                max={maxQuantity}
                                                min="0"
                                                className="w-24 text-center p-1 border rounded-md focus:ring-2 focus:ring-teal-500"
                                                disabled={isReadOnly}
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
                    <button type="button" onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold shadow-md disabled:bg-teal-400" disabled={isReadOnly}>تایید و انتقال موجودی</button>
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
                        <p><strong>تاریخ درخواست:</strong> {new Date(requisition.date).toLocaleDateString('fa-IR')} <span className="font-mono text-xs">({formatGregorianForDisplay(requisition.date)})</span></p>
                        <p><strong>درخواست کننده:</strong> {requisition.requestedBy}</p>
                        <p><strong>تاریخ تکمیل:</strong> {new Date().toLocaleDateString('fa-IR')} <span className="font-mono text-xs">({formatGregorianForDisplay(new Date().toISOString())})</span></p>
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

const MainWarehouse: React.FC<MainWarehouseProps> = ({ mainWarehouseDrugs, stockRequisitions, onFulfillRequisition, currentUser, addToast, companyInfo, documentSettings }) => {
    const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState<StockRequisition | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    const handleOpenModal = (requisition: StockRequisition) => {
        setSelectedRequisition(requisition);
        setIsFulfillmentModalOpen(true);
    };

    const handleConfirmFulfillment = (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[]) => {
        onFulfillRequisition(requisition, fulfilledItems, currentUser.username);
    };

    const handlePrint = (requisition: StockRequisition) => {
        // We need to simulate the fulfillment to get the fulfilledBy name for printing
        const updatedReq = { ...requisition, fulfilledBy: currentUser.username };
        setSelectedRequisition(updatedReq);
        setIsPrintModalOpen(true);
    };

    const { pending, completed } = useMemo(() => {
        const pending: StockRequisition[] = [];
        const completed: StockRequisition[] = [];
        stockRequisitions.forEach(req => {
            if (req.status === 'در انتظار') {
                pending.push(req);
            } else {
                completed.push(req);
            }
        });
        return { pending, completed };
    }, [stockRequisitions]);

    const TabButton = ({ tabId, children, count }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`relative px-4 py-2 font-semibold rounded-t-lg transition-colors ${activeTab === tabId ? 'bg-white text-teal-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
            {children}
            {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">{count}</span>
            )}
        </button>
    );

    return (
        <div className="p-8">
            <FulfillmentModal
                isOpen={isFulfillmentModalOpen}
                onClose={() => setIsFulfillmentModalOpen(false)}
                requisition={selectedRequisition}
                mainWarehouseDrugs={mainWarehouseDrugs}
                onConfirmFulfillment={handleConfirmFulfillment}
            />
            <PrintPreviewModal 
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                requisition={selectedRequisition}
                companyInfo={companyInfo}
                documentSettings={documentSettings}
            />
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">انبار اصلی</h2>
                <p className="text-gray-500 mt-2">مدیریت درخواست‌های کالا از انبار فروش و انتقال موجودی.</p>
            </div>

            <div className="flex border-b mb-6">
                <TabButton tabId="pending" count={pending.length}>درخواست‌های در انتظار</TabButton>
                <TabButton tabId="completed" count={0}>تاریخچه درخواست‌ها</TabButton>
            </div>
            
             <div className="bg-white rounded-xl shadow-lg p-6">
                 <h3 className="text-xl font-bold text-gray-800 mb-4">
                     {activeTab === 'pending' ? `لیست درخواست‌های در انتظار (${pending.length})` : 'تاریخچه درخواست‌های تکمیل شده'}
                 </h3>
                 <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2">
                            <tr>
                                <th className="p-4">#</th>
                                <th className="p-4">تاریخ</th>
                                <th className="p-4">درخواست‌کننده</th>
                                <th className="p-4">اقلام</th>
                                <th className="p-4">وضعیت</th>
                                <th className="p-4">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {(activeTab === 'pending' ? pending : completed).map(req => (
                                <tr key={req.id}>
                                    <td className="p-4">{req.id}</td>
                                    <td className="p-4">{new Date(req.date).toLocaleDateString('fa-IR')}</td>
                                    <td className="p-4">{req.requestedBy}</td>
                                    <td className="p-4 text-xs">{req.items.map(i => i.drugName).join(', ')}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${req.status === 'در انتظار' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{req.status}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                        {req.status === 'در انتظار' ? (
                                            <button onClick={() => handleOpenModal(req)} className="flex items-center text-green-600 hover:text-green-800 font-semibold text-sm">
                                                <FulfillIcon /> <span className="mr-1">تکمیل درخواست</span>
                                            </button>
                                        ) : (
                                            <button onClick={() => handlePrint(req)} className="flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm">
                                                <PrintIcon /> <span className="mr-1">چاپ حواله</span>
                                            </button>
                                        )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// FIX: Add default export for the MainWarehouse component
export default MainWarehouse;
