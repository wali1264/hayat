

import React, { useState, useMemo } from 'react';
import { Drug } from './Inventory';
import { Order } from './Sales';
import { Customer } from './Customers';
import { Supplier } from './Suppliers';
import { PurchaseBill } from './Purchasing';
import { Expense } from './Accounting';
import { User } from './Settings';

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);
const RestoreIcon = () => <Icon path="M4 4v5h5M7 7l8.293 8.293a1 1 0 001.414 0l4.293-4.293" />;
const TrashIcon = () => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;


//=========== TYPES ===========//
export type TrashableItem = Drug | Order | Customer | Supplier | PurchaseBill | Expense | User;

export type TrashItem = {
    id: string; 
    deletedAt: string;
    deletedBy: string;
    itemType: 'drug' | 'order' | 'customer' | 'supplier' | 'purchaseBill' | 'expense' | 'user';
    data: TrashableItem;
};

//=========== HELPERS ===========//
const itemTypeTranslations: { [key in TrashItem['itemType']]: string } = {
    drug: 'دارو',
    order: 'فاکتور فروش',
    customer: 'مشتری',
    supplier: 'تامین کننده',
    purchaseBill: 'فاکتور خرید',
    expense: 'هزینه',
    user: 'کاربر',
};

const getItemDescription = (item: TrashItem): string => {
    switch (item.itemType) {
        case 'drug': return (item.data as Drug).name;
        case 'order': return `سفارش ${ (item.data as Order).orderNumber } برای ${ (item.data as Order).customerName }`;
        case 'customer': return (item.data as Customer).name;
        case 'supplier': return (item.data as Supplier).name;
        case 'purchaseBill': return `فاکتور ${ (item.data as PurchaseBill).billNumber } از ${ (item.data as PurchaseBill).supplierName }`;
        case 'expense': return (item.data as Expense).description;
        case 'user': return (item.data as User).username;
        default: return 'نامشخص';
    }
};

//=========== MAIN COMPONENT ===========//
type RecycleBinProps = {
    trashItems: TrashItem[];
    onRestore: (item: TrashItem) => void;
    onDelete: (id: string) => void;
    onEmptyTrash: () => void;
};

const RecycleBin: React.FC<RecycleBinProps> = ({ trashItems, onRestore, onDelete, onEmptyTrash }) => {
    const [filter, setFilter] = useState('all');

    const filteredItems = useMemo(() => {
        if (filter === 'all') {
            return trashItems;
        }
        return trashItems.filter(item => item.itemType === filter);
    }, [trashItems, filter]);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">سطل زباله</h2>
                    <p className="text-gray-500">آیتم‌های حذف شده را بازیابی یا به صورت دائمی حذف کنید.</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                    <select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        aria-label="فیلتر بر اساس نوع آیتم"
                    >
                        <option value="all">همه آیتم‌ها</option>
                        {Object.entries(itemTypeTranslations).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                    <button 
                        onClick={onEmptyTrash} 
                        disabled={trashItems.length === 0}
                        className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                        <TrashIcon />
                        <span className="mr-2">خالی کردن سطل</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">نوع آیتم</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">شرح</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">حذف شده توسط</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">تاریخ حذف</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-gray-500">
                                        سطل زباله خالی است.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-800 font-medium">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">
                                                {itemTypeTranslations[item.itemType]}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 max-w-sm truncate" title={getItemDescription(item)}>
                                            {getItemDescription(item)}
                                        </td>
                                        <td className="p-4 text-gray-500">{item.deletedBy}</td>
                                        <td className="p-4 text-gray-500">{new Date(item.deletedAt).toLocaleString('fa-IR')}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <button 
                                                    onClick={() => onRestore(item)} 
                                                    title="بازیابی" 
                                                    className="flex items-center text-green-600 hover:text-green-800 p-1 font-semibold text-sm"
                                                >
                                                    <RestoreIcon /> <span className="mr-1">بازیابی</span>
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(item.id)} 
                                                    title="حذف دائمی" 
                                                    className="flex items-center text-red-500 hover:text-red-700 p-1 font-semibold text-sm"
                                                >
                                                   <TrashIcon /> <span className="mr-1">حذف دائمی</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RecycleBin;