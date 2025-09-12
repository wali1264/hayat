
import React, { useState, useMemo } from 'react';
import { User } from './Settings';

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

//=========== TYPES ===========//
export type SupplierStatus = 'فعال' | 'غیرفعال';

export type Supplier = {
    id: number;
    name: string;
    representative: string;
    phone: string;
    email?: string;
    address: string;
    status: SupplierStatus;
};

//=========== HELPERS ===========//
const getStatusStyle = (status: SupplierStatus) => {
    switch (status) {
        case 'فعال': return { text: 'text-green-700', bg: 'bg-green-100' };
        case 'غیرفعال': return { text: 'text-red-700', bg: 'bg-red-100' };
        default: return { text: 'text-gray-700', bg: 'bg-gray-100' };
    }
};

//=========== MODAL COMPONENT ===========//
type SupplierModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
    initialData: Supplier | null;
};

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const defaultState = { name: '', representative: '', phone: '', email: '', address: '', status: 'فعال' as SupplierStatus };
    const [supplier, setSupplier] = useState(defaultState);
    const isEditMode = initialData !== null;

    React.useEffect(() => {
        if (isOpen) {
            // FIX: Explicitly map properties to handle optional 'email' and avoid adding 'id' to state.
            // This ensures the state object matches its defined type.
            setSupplier(initialData ? {
                name: initialData.name,
                representative: initialData.representative,
                phone: initialData.phone,
                email: initialData.email || '',
                address: initialData.address,
                status: initialData.status
            } : defaultState);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSupplier(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplier.name || !supplier.phone) {
            alert("لطفاً نام شرکت و شماره تماس را وارد کنید.");
            return;
        }
        onSave({ ...supplier, id: isEditMode ? initialData.id : Date.now() });
        onClose();
    };
    
    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'ویرایش تامین کننده' : 'افزودن تامین کننده جدید'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="name" className={labelStyles}>نام شرکت</label>
                            <input type="text" name="name" value={supplier.name} onChange={handleChange} className={inputStyles} required autoFocus />
                        </div>
                        <div>
                            <label htmlFor="representative" className={labelStyles}>نام نماینده</label>
                            <input type="text" name="representative" value={supplier.representative} onChange={handleChange} className={inputStyles} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label htmlFor="phone" className={labelStyles}>شماره تماس</label>
                            <input type="tel" name="phone" value={supplier.phone} onChange={handleChange} className={inputStyles} required />
                        </div>
                         <div>
                            <label htmlFor="email" className={labelStyles}>ایمیل</label>
                            <input type="email" name="email" value={supplier.email} onChange={handleChange} className={inputStyles} />
                        </div>
                    </div>
                     <div className="mb-4">
                        <label htmlFor="address" className={labelStyles}>آدرس</label>
                        <textarea name="address" value={supplier.address} onChange={handleChange} className={`${inputStyles} h-24 resize-none`}></textarea>
                    </div>
                     <div className="mb-6">
                        <label htmlFor="status" className={labelStyles}>وضعیت</label>
                        <select name="status" value={supplier.status} onChange={handleChange} className={inputStyles}>
                            <option value="فعال">فعال</option>
                            <option value="غیرفعال">غیرفعال</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md">
                           {isEditMode ? 'ذخیره تغییرات' : 'ذخیره'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
type SuppliersProps = {
    suppliers: Supplier[];
    onSave: (supplier: Supplier) => void;
    onDelete: (id: number) => void;
    currentUser: User;
};

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onSave, onDelete, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const canManage = useMemo(() => 
        currentUser.role === 'مدیر کل' || currentUser.role === 'انباردار', 
    [currentUser.role]);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.representative.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );
    
    const handleOpenAddModal = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("آیا از حذف این تامین کننده اطمینان دارید؟")) {
            onDelete(id);
        }
    };

    return (
        <div className="p-8">
            {canManage && <SupplierModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={onSave}
                initialData={editingSupplier}
            />}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">مدیریت تامین کنندگان</h2>
                    <p className="text-gray-500">لیست شرکت‌هایی که از آن‌ها خرید انجام می‌شود</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="جستجوی تامین کننده..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <SearchIcon />
                        </div>
                    </div>
                     {canManage && (
                        <button onClick={handleOpenAddModal} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md">
                            <PlusIcon />
                            <span className="mr-2">افزودن شرکت جدید</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">نام شرکت</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">نماینده</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">شماره تماس</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">ایمیل</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">وضعیت</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-gray-500">
                                        هیچ تامین کننده‌ای یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map(supplier => {
                                    const status = getStatusStyle(supplier.status);
                                    return (
                                        <tr key={supplier.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-gray-800 font-medium">{supplier.name}</td>
                                            <td className="p-4 text-gray-500">{supplier.representative}</td>
                                            <td className="p-4 text-gray-500">{supplier.phone}</td>
                                            <td className="p-4 text-gray-500">{supplier.email || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.bg} ${status.text}`}>
                                                    {supplier.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    {canManage && (
                                                        <>
                                                            <button onClick={() => handleOpenEditModal(supplier)} className="text-blue-500 hover:text-blue-700 p-1"><EditIcon /></button>
                                                            <button onClick={() => handleDelete(supplier.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
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

export default Suppliers;
