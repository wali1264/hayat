import React, { useState, useMemo, useEffect } from 'react';
import { Drug, formatQuantity } from './Inventory';
import { User } from './Settings';
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
                                const maxQuantity = drugInStock ? drugInStock.quantity : 0;
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


//=========== MAIN COMPONENT ===========//
type MainWarehouseProps = {
    mainWarehouseDrugs: Drug[];
    stockRequisitions: StockRequisition[];
    onFulfillRequisition: (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[], fulfilledBy: string) => void;
    currentUser: User;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};

type Tab = 'stock' | 'requests';

const MainWarehouse: React.FC<MainWarehouseProps> = ({ mainWarehouseDrugs, stockRequisitions, onFulfillRequisition, currentUser, addToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState<StockRequisition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('requests');

    const handleOpenFulfillmentModal = (req: StockRequisition) => {
        setSelectedRequisition(req);
        setIsModalOpen(true);
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
                                    <th className="p-4 text-sm font-semibold text-gray-600">تاریخ انقضا</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredDrugs.map(drug => (
                                    <tr key={drug.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-800 font-medium">{drug.name}</td>
                                        <td className="p-4 text-gray-500">{drug.manufacturer}</td>
                                        <td className="p-4 text-gray-800 font-semibold">
                                            {formatQuantity(drug.quantity, drug.unitsPerCarton)}
                                        </td>
                                        <td className="p-4 text-gray-500">{new Date(drug.expiryDate).toLocaleDateString('fa-IR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainWarehouse;