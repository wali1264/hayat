import React, { useState, useEffect, useMemo } from 'react';
import { User } from './Settings';
import { RolePermissions } from './Settings';
import { NoPermissionMessage } from './App';

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
const AccountStatementIcon = () => <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />;


//=========== TYPES ===========//
export type CustomerStatus = 'فعال' | 'غیرفعال';

export type Customer = {
    id: number;
    name: string;
    manager: string;
    phone: string;
    address: string;
    registrationDate: string;
    status: CustomerStatus;
};

//=========== HELPERS ===========//
const getStatusStyle = (status: CustomerStatus) => {
    switch (status) {
        case 'فعال':
            return { text: 'text-green-700', bg: 'bg-green-100' };
        case 'غیرفعال':
            return { text: 'text-red-700', bg: 'bg-red-100' };
        default:
            return { text: 'text-gray-700', bg: 'bg-gray-100' };
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

//=========== MODAL COMPONENT ===========//
type CustomerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Customer) => void;
    initialData: Customer | null;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    isReadOnly?: boolean;
};

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, initialData, addToast, isReadOnly }) => {
    const [customer, setCustomer] = useState({
        name: '', manager: '', phone: '', address: '', status: 'فعال' as CustomerStatus
    });

    const isEditMode = initialData !== null;

    useEffect(() => {
        if (isOpen && initialData) {
            setCustomer(initialData);
        } else {
            setCustomer({ name: '', manager: '', phone: '', address: '', status: 'فعال' });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer.name || !customer.phone) {
            addToast("لطفاً نام مشتری و شماره تماس را وارد کنید.", "error");
            return;
        }
        onSave({
            ...customer,
            id: isEditMode ? initialData.id : Date.now(),
            registrationDate: isEditMode ? initialData.registrationDate : '' // Will be set in parent
        });
        onClose();
    };

    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow disabled:bg-gray-100";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'ویرایش مشتری' : 'افزودن مشتری جدید'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="name" className={labelStyles}>نام مشتری</label>
                            <input type="text" name="name" id="name" value={customer.name} onChange={handleChange} className={inputStyles} required autoFocus disabled={isReadOnly} />
                        </div>
                        <div>
                            <label htmlFor="manager" className={labelStyles}>نام مسئول</label>
                            <input type="text" name="manager" id="manager" value={customer.manager} onChange={handleChange} className={inputStyles} disabled={isReadOnly} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label htmlFor="phone" className={labelStyles}>شماره تماس</label>
                            <input type="tel" name="phone" id="phone" value={customer.phone} onChange={handleChange} className={inputStyles} required disabled={isReadOnly} />
                        </div>
                        <div>
                            <label htmlFor="status" className={labelStyles}>وضعیت</label>
                            <select name="status" id="status" value={customer.status} onChange={handleChange} className={inputStyles} disabled={isReadOnly}>
                                <option value="فعال">فعال</option>
                                <option value="غیرفعال">غیرفعال</option>
                            </select>
                        </div>
                    </div>
                     <div className="mb-6">
                        <label htmlFor="address" className={labelStyles}>آدرس</label>
                        <textarea name="address" id="address" value={customer.address} onChange={handleChange} className={`${inputStyles} h-24 resize-none`} disabled={isReadOnly}></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md disabled:bg-teal-400" disabled={isReadOnly}>
                           {isEditMode ? 'ذخیره تغییرات' : 'ذخیره مشتری'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

//=========== MAIN COMPONENT ===========//
type CustomersProps = {
    customers: Customer[];
    onSave: (customer: Customer) => void;
    onDelete: (id: number) => void;
    currentUser: User;
    rolePermissions: RolePermissions;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onViewLedger: (customerId: number) => void;
    isRemoteView?: boolean;
    isSystemOnline?: boolean;
};

const Customers: React.FC<CustomersProps> = ({ customers, onSave, onDelete, currentUser, rolePermissions, addToast, onViewLedger, isRemoteView, isSystemOnline }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    const isReadOnly = isRemoteView && !isSystemOnline;

    const permissions = useMemo(() => {
        if (currentUser.role === 'مدیر کل') {
            return {
                canCreateCustomer: true,
                canEditCustomer: true,
                canDeleteCustomer: true,
            };
        }
        return rolePermissions[currentUser.role];
    }, [currentUser.role, rolePermissions]);

    const hasAnyPermission = useMemo(() => {
        return permissions.canCreateCustomer || permissions.canEditCustomer || permissions.canDeleteCustomer;
    }, [permissions]);

    if (!hasAnyPermission && currentUser.role !== 'مدیر کل') {
        return <NoPermissionMessage />;
    }

    const handleOpenAddModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);
    
    const handleDeleteCustomer = (id: number) => {
        onDelete(id);
    };
    
    const filteredCustomers = customers.filter(customer => {
        const searchTermMatch = searchTerm === '' ||
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm);

        const statusMatch = statusFilter === 'all' || customer.status === statusFilter;

        return searchTermMatch && statusMatch;
    });

    return (
        <div className="p-4 md:p-8">
             {(permissions.canCreateCustomer || permissions.canEditCustomer) && <CustomerModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={onSave}
                initialData={editingCustomer}
                addToast={addToast}
                isReadOnly={isReadOnly}
            />}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">مدیریت مشتریان</h2>
                    <p className="text-gray-500">لیست کامل مشتریان و داروخانه‌ها</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="جستجوی مشتری..."
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
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            aria-label="فیلتر بر اساس وضعیت"
                        >
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="فعال">فعال</option>
                            <option value="غیرفعال">غیرفعال</option>
                        </select>
                    </div>
                    {permissions.canCreateCustomer && (
                        <button onClick={handleOpenAddModal} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md disabled:bg-teal-400" disabled={isReadOnly}>
                            <PlusIcon />
                            <span className="mr-2">افزودن مشتری جدید</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-2 md:p-4 text-sm font-semibold text-gray-600">نام مشتری</th>
                                <th className="p-2 md:p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">مسئول</th>
                                <th className="p-2 md:p-4 text-sm font-semibold text-gray-600">شماره تماس</th>
                                <th className="p-2 md:p-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">آدرس</th>
                                <th className="p-2 md:p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">تاریخ ثبت</th>
                                <th className="p-2 md:p-4 text-sm font-semibold text-gray-600">وضعیت</th>
                                <th className="p-2 md:p-4 text-sm font-semibold text-gray-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-gray-500">
                                        هیچ مشتری با این مشخصات یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => {
                                    const status = getStatusStyle(customer.status);
                                    return (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="p-2 md:p-4 text-sm md:text-base text-gray-800 font-medium">{customer.name}</td>
                                            <td className="p-2 md:p-4 text-sm text-gray-500 hidden md:table-cell">{customer.manager}</td>
                                            <td className="p-2 md:p-4 text-sm text-gray-500">{customer.phone}</td>
                                            <td className="p-2 md:p-4 text-sm text-gray-500 truncate max-w-xs hidden lg:table-cell">{customer.address}</td>
                                            <td className="p-2 md:p-4 whitespace-nowrap text-gray-500 text-sm hidden md:table-cell">
                                                {new Date(customer.registrationDate).toLocaleDateString('fa-IR')}
                                                <div className="font-mono text-xs text-gray-400">{formatGregorianForDisplay(customer.registrationDate)}</div>
                                            </td>
                                            <td className="p-2 md:p-4">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.bg} ${status.text}`}>
                                                    {customer.status}
                                                </span>
                                            </td>
                                            <td className="p-2 md:p-4">
                                                <div className="flex items-center space-x-1 space-x-reverse md:space-x-2">
                                                    <button onClick={() => onViewLedger(customer.id)} title="صورت حساب" className="text-teal-600 hover:text-teal-800 p-1"><AccountStatementIcon /></button>
                                                    {permissions.canEditCustomer && (
                                                        <button onClick={() => handleOpenEditModal(customer)} className="text-blue-500 hover:text-blue-700 p-1 disabled:opacity-50" disabled={isReadOnly}><EditIcon /></button>
                                                    )}
                                                    {permissions.canDeleteCustomer && (
                                                        <button onClick={() => handleDeleteCustomer(customer.id)} className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50" disabled={isReadOnly}><TrashIcon /></button>
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

export default Customers;