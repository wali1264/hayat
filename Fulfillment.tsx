import React, { useState } from 'react';
import { Order, OrderStatus } from './Sales';
import { Drug, formatQuantity } from './Inventory';

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);

const EyeIcon = () => <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0zM21 12c-2.833 4-8 7-11 7S1 16 1 12s5.167-7 11-7 9 3 11 7z" />;
const TruckIcon = () => <Icon path="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM2 11h15l4 6h-6" />;
const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


//=========== MODAL COMPONENT ===========//
type FulfillmentDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    drugs: Drug[];
    onUpdateStatus: (order: Order, newStatus: OrderStatus) => void;
};

const FulfillmentDetailModal: React.FC<FulfillmentDetailModalProps> = ({ isOpen, onClose, order, drugs, onUpdateStatus }) => {
    if (!isOpen || !order) return null;

    const handleMarkAsShipped = () => {
        onUpdateStatus(order, 'ارسال شده');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">جزئیات سفارش جهت آماده‌سازی</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><CloseIcon className="w-5 h-5 text-gray-500" /></button>
                </div>
                 <div className="mb-6 bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">شماره سفارش</p>
                        <p className="font-bold text-gray-800">{order.orderNumber}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">نام مشتری</p>
                        <p className="font-bold text-gray-800">{order.customerName}</p>
                    </div>
                </div>

                <h4 className="font-bold text-lg text-gray-700 mb-2">لیست اقلام (Picking List)</h4>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                     <table className="w-full text-sm text-right">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3 font-semibold text-gray-600">نام دارو</th>
                                <th className="p-3 font-semibold text-gray-600">تعداد</th>
                                <th className="p-3 font-semibold text-gray-600">بونس</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {order.items.map(item => {
                                const drugInfo = drugs.find(d => d.id === item.drugId);
                                return (
                                    <tr key={item.drugId}>
                                        <td className="p-3 text-gray-800">{item.drugName}</td>
                                        <td className="p-3 text-gray-800 font-semibold">
                                            {formatQuantity(item.quantity, drugInfo?.unitsPerCarton)}
                                        </td>
                                        <td className="p-3 text-gray-800 font-semibold bg-yellow-50">
                                            {item.bonusQuantity > 0 ? formatQuantity(item.bonusQuantity, drugInfo?.unitsPerCarton) : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mt-8 pt-4 border-t">
                    <button 
                        onClick={handleMarkAsShipped}
                        className="flex items-center px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold shadow-md transition-all text-lg"
                    >
                        <TruckIcon />
                        <span className="mr-2">علامت‌گذاری به عنوان "ارسال شده"</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
type FulfillmentProps = {
    orders: Order[];
    drugs: Drug[];
    onUpdateOrder: (order: Order) => void;
};

const Fulfillment: React.FC<FulfillmentProps> = ({ orders, drugs, onUpdateOrder }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const pendingOrders = orders.filter(o => o.status === 'در حال پردازش');

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };
    
    const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
        onUpdateOrder({ ...order, status: newStatus });
    };

    return (
        <div className="p-8">
            <FulfillmentDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                drugs={drugs}
                onUpdateStatus={handleUpdateStatus}
            />
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">آماده‌سازی سفارشات</h2>
                <p className="text-gray-500 mt-2">سفارشات جدید را برای ارسال آماده کنید. موجودی انبار برای این سفارشات قبلا کسر شده است.</p>
            </div>

            {pendingOrders.length === 0 ? (
                <div className="text-center bg-white rounded-xl shadow-lg p-12">
                    <p className="text-gray-600 text-lg">در حال حاضر هیچ سفارش جدیدی برای آماده‌سازی وجود ندارد.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-lg p-5 flex flex-col justify-between transition-shadow hover:shadow-2xl">
                            <div>
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-lg text-gray-800">{order.customerName}</p>
                                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">{order.status}</span>
                                </div>
                                <p className="text-sm text-gray-500">{order.orderNumber}</p>
                                <div className="mt-4 pt-4 border-t border-dashed">
                                    <p className="text-sm text-gray-600">تعداد اقلام: <span className="font-semibold">{order.items.length}</span></p>
                                    <p className="text-sm text-gray-600">مبلغ کل: <span className="font-semibold">{order.totalAmount.toLocaleString()} افغانی</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleViewDetails(order)}
                                className="w-full mt-4 flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                            >
                                <EyeIcon />
                                <span className="mr-2">مشاهده و آماده‌سازی</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Fulfillment;