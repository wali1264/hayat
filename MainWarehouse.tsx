import React, { useState, useMemo } from 'react';
import { Drug, formatQuantity, getStatus, getRowStyle, BatchDetailsRow, drugCategories } from './Inventory';
import { User, CompanyInfo, DocumentSettings } from './Settings';
import { StockRequisition, StockRequisitionItem } from './App';

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }: { path: string, className?: string }) => (
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
const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
    if (direction === null) {
        return <Icon path="M8 9l4-4 4 4m0 6l-4 4-4-4" className="w-4 h-4 ml-2 text-gray-300 group-hover:text-gray-500" />;
    }
    if (direction === 'ascending') {
        return <Icon path="M5 15l7-7 7 7" className="w-4 h-4 ml-2" />;
    }
    return <Icon path="M19 9l-7 7-7-7" className="w-4 h-4 ml-2" />;
};
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <Icon path={isExpanded ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} className="w-4 h-4 text-gray-500" />
);

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

    React.useEffect(() => {
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
    onTraceLotNumber: (lotNumber: string) => void;
};

type Tab = 'stock' | 'requisitions';

const MainWarehouse: React.FC<MainWarehouseProps> = ({ mainWarehouseDrugs, stockRequisitions, onFulfillRequisition, currentUser, addToast, companyInfo, documentSettings, onTraceLotNumber }) => {
    const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState<StockRequisition | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('stock');
    
    // State for inventory view
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
    const [expandedDrugId, setExpandedDrugId] = useState<number | null>(null);

    const handleOpenModal = (requisition: StockRequisition) => {
        setSelectedRequisition(requisition);
        setIsFulfillmentModalOpen(true);
    };

    const handleConfirmFulfillment = (requisition: StockRequisition, fulfilledItems: StockRequisitionItem[]) => {
        onFulfillRequisition(requisition, fulfilledItems, currentUser.username);
    };

    const handlePrint = (requisition: StockRequisition) => {
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

    // --- Inventory View Logic ---
    const processedDrugs = useMemo(() => {
        return mainWarehouseDrugs.map(drug => {
            const totalQuantity = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
            const earliestExpiry = drug.batches
                .filter(b => b.quantity > 0)
                .map(b => b.expiryDate)
                .sort()[0] || null;
            return { ...drug, totalQuantity, earliestExpiry };
        });
    }, [mainWarehouseDrugs]);

    const filteredDrugs = useMemo(() => {
        return processedDrugs.filter(drug => {
            const searchTermMatch = searchTerm === '' ||
                drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (drug.code && drug.code.toLowerCase().includes(searchTerm.toLowerCase()));
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
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredDrugs, sortConfig]);

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
            <button type="button" onClick={() => requestSort(columnKey)} className="flex items-center group focus:outline-none">
                {label}
                <SortIcon direction={sortConfig.key === columnKey ? sortConfig.direction : null} />
            </button>
        </th>
    );

    const TabButton = ({ tabId, children, count }: { tabId: Tab, children: React.ReactNode, count?: number }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`relative px-4 py-2 text-lg font-semibold rounded-t-lg border-b-4 transition-colors ${activeTab === tabId ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            {children}
            {count && count > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-pulse">{count}</span>
            )}
        </button>
    );

    return (
        <div className="p-8">
            <FulfillmentModal isOpen={isFulfillmentModalOpen} onClose={() => setIsFulfillmentModalOpen(false)} requisition={selectedRequisition} mainWarehouseDrugs={mainWarehouseDrugs} onConfirmFulfillment={handleConfirmFulfillment} />
            <PrintPreviewModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} requisition={selectedRequisition} companyInfo={companyInfo} documentSettings={documentSettings} />
            
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">انبار اصلی</h2>
                    <p className="text-gray-500 mt-2">مدیریت موجودی مرکزی و پردازش درخواست‌های کالا.</p>
                </div>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px">
                    <TabButton tabId="stock">موجودی انبار</TabButton>
                    <TabButton tabId="requisitions" count={pending.length}>درخواست‌های کالا</TabButton>
                </nav>
            </div>
            
            {activeTab === 'stock' && (
                <div>
                    <div className="flex justify-end items-center mb-4 flex-wrap gap-2">
                        <div className="relative">
                            <input type="text" placeholder="جستجوی محصول..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                        </div>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="pr-4 py-2 border border-gray-300 rounded-lg bg-white">
                            <option value="all">همه دسته‌بندی‌ها</option>
                            {drugCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pr-4 py-2 border border-gray-300 rounded-lg bg-white">
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="موجود">موجود</option>
                            <option value="نزدیک به انقضا">نزدیک به انقضا</option>
                            <option value="انقضا فوری">انقضا فوری</option>
                            <option value="منقضی شده">منقضی شده</option>
                            <option value="تمام شده">تمام شده</option>
                        </select>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="p-4"></th>
                                        <SortableHeader label="نام محصول" columnKey="name" />
                                        <SortableHeader label="کمپانی" columnKey="manufacturer" />
                                        <th className="p-4">کد محصول</th>
                                        <SortableHeader label="موجودی کل" columnKey="totalQuantity" />
                                        <SortableHeader label="نزدیک‌ترین انقضا" columnKey="earliestExpiry" />
                                        <th className="p-4">وضعیت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedAndFilteredDrugs.map(drug => {
                                        const status = getStatus(drug);
                                        const isExpanded = expandedDrugId === drug.id;
                                        return (
                                            <React.Fragment key={drug.id}>
                                                <tr className={getRowStyle(status.text)}>
                                                    <td className="p-2 text-center"><button onClick={() => setExpandedDrugId(isExpanded ? null : drug.id)} className="p-2 rounded-full hover:bg-gray-200"><ChevronIcon isExpanded={isExpanded} /></button></td>
                                                    <td className="p-4 font-medium">{drug.name}</td>
                                                    <td className="p-4 text-gray-500">{drug.manufacturer}</td>
                                                    <td className="p-4 font-mono text-xs">{drug.code || '-'}</td>
                                                    <td className="p-4 font-semibold">{formatQuantity(drug.totalQuantity, drug.unitsPerCarton, drug.cartonSize)}</td>
                                                    <td className="p-4 font-mono">{drug.earliestExpiry ? formatGregorianForDisplay(drug.earliestExpiry) : '-'}</td>
                                                    <td className="p-4"><span className={`px-3 py-1 text-xs font-bold rounded-full ${status.bg} ${status.color}`}>{status.text}</span></td>
                                                </tr>
                                                {isExpanded && <BatchDetailsRow drug={drug} colSpan={7} onTraceLotNumber={onTraceLotNumber} />}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'requisitions' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
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
                                {[...pending, ...completed].map(req => (
                                    <tr key={req.id}>
                                        <td className="p-4">{req.id}</td>
                                        <td className="p-4">{new Date(req.date).toLocaleDateString('fa-IR')}</td>
                                        <td className="p-4">{req.requestedBy}</td>
                                        <td className="p-4 text-xs">{req.items.map(i => i.drugName).join(', ')}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${req.status === 'در انتظار' ? 'bg-yellow-100 text-yellow-700' : (req.status === 'تکمیل شده' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>{req.status}</span>
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
            )}
        </div>
    );
};

export default MainWarehouse;