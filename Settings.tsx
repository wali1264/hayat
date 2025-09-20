import React, { useState, useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

//=========== ICONS ===========//
const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);

const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
const EditIcon = () => <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />;
const TrashIcon = () => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
const UploadIcon = () => <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />;
const DownloadIcon = () => <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />;
const CloudUploadIcon = () => <Icon path="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293h4.586a4 4 0 014 4v5a4 4 0 01-4 4H7z" className="w-6 h-6" />;
const CloudDownloadIcon = () => <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-6 h-6" />;
const RefreshIcon = () => <Icon path="M4 4v5h5M20 20v-5h-5" />;
const KeyIcon = () => <Icon path="M15 7a3 3 0 11-6 0 3 3 0 016 0zm-1.667 3.333H10V14h3.333v-3.667z" />;

//=========== TYPES ===========//
export type UserRole = 'مدیر کل' | 'انباردار' | 'فروشنده' | 'حسابدار';
export type User = {
    id: number;
    username: string;
    password?: string;
    role: UserRole;
    lastLogin: string;
};

export type CompanyInfo = {
    name: string;
    address: string;
    phone: string;
    logo: string | null;
};

export type DocumentSettings = {
    logoPosition: 'left' | 'center' | 'right';
    accentColor: string;
    backgroundImage: string | null;
};

// --- NEW PERMISSION TYPES ---
export type PermissionSet = {
    // Sales
    canCreateSale: boolean;
    canEditSale: boolean;
    canDeleteSale: boolean;
    canGiveManualDiscount: boolean;
    maxDiscountPercentage: number;
    // Customers
    canCreateCustomer: boolean;
    canEditCustomer: boolean;
    canDeleteCustomer: boolean;
    // Inventory
    canCreateDrug: boolean;
    canEditDrug: boolean;
    canDeleteDrug: boolean;
    canWriteOffStock: boolean;
};

export type RolePermissions = {
    'فروشنده': PermissionSet;
    'انباردار': PermissionSet;
    'حسابدار': PermissionSet;
};


//=========== MOCK DATA ===========//
export const mockUsers: User[] = [
    { id: 1, username: 'admin', password: 'admin', role: 'مدیر کل', lastLogin: '1403/03/15، 09:30:15' },
    { id: 2, username: 'sales_user', password: '123', role: 'فروشنده', lastLogin: '1403/03/15، 08:45:10' },
    { id: 3, username: 'warehouse_user', password: '123', role: 'انباردار', lastLogin: '1403/03/14، 14:00:05' },
    { id: 4, username: 'accountant_user', password: '123', role: 'حسابدار', lastLogin: '1403/03/14، 16:20:45' },
];

//=========== HELPERS ===========//
const getRoleStyle = (role: UserRole) => {
    switch (role) {
        case 'مدیر کل': return 'bg-red-100 text-red-700';
        case 'انباردار': return 'bg-blue-100 text-blue-700';
        case 'فروشنده': return 'bg-green-100 text-green-700';
        case 'حسابدار': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

//=========== SUB-COMPONENTS ===========//
const SettingsCard = ({ title, description, children }) => (
    <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <p className="text-gray-500 mt-1">{description}</p>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

type UserModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'lastLogin'>) => void;
    initialData: User | null;
};

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const defaultState = { username: '', role: 'فروشنده' as UserRole, password: '' };
    const [user, setUser] = useState(defaultState);
    const isEditMode = initialData !== null;

    useEffect(() => {
        if (isOpen) {
            setUser(initialData ? { username: initialData.username, role: initialData.role, password: '' } : defaultState);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userToSave: Omit<User, 'lastLogin'> = {
            id: isEditMode ? initialData!.id : Date.now(),
            username: user.username,
            role: user.role
        };
        // Only add password if it's a new user or the password field is filled
        if (!isEditMode || user.password) {
            userToSave.password = user.password;
        }
        onSave(userToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-6">{isEditMode ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">نام کاربری</label>
                        <input type="text" name="username" value={user.username} onChange={handleChange} className="w-full p-2 border rounded-lg" required autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">رمز عبور</label>
                        <input type="password" name="password" value={user.password} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder={isEditMode ? 'برای عدم تغییر خالی بگذارید' : ''} required={!isEditMode} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">نقش کاربری</label>
                        <select name="role" value={user.role} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                            <option value="فروشنده">فروشنده</option>
                            <option value="انباردار">انباردار</option>
                            <option value="حسابدار">حسابدار</option>
                            <option value="مدیر کل">مدیر کل</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 space-x-reverse pt-6 mt-6 border-t">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">انصراف</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold">{isEditMode ? 'ذخیره' : 'افزودن'}</button>
                </div>
            </form>
        </div>
    );
};

const ResetPasswordModal = ({isOpen, onClose, onConfirm, user}) => {
    const [newPassword, setNewPassword] = useState('');
    if(!isOpen || !user) return null;

    const handleSubmit = () => {
        if (newPassword.length < 4) {
            // A more robust app would use a toast here
            alert('رمز عبور باید حداقل ۴ کاراکتر باشد.');
            return;
        }
        onConfirm(user.username, newPassword);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">بازنشانی رمز عبور برای {user.username}</h3>
                <div>
                    <label className="block text-sm font-bold mb-2">رمز عبور جدید</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-lg" autoFocus />
                </div>
                 <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200">انصراف</button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-teal-600 text-white">ذخیره رمز جدید</button>
                 </div>
            </div>
        </div>
    );
}


const CompanyInfoSection = ({ companyInfo, onSetCompanyInfo }) => {
    const [info, setInfo] = useState(companyInfo);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setInfo(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSetCompanyInfo(info);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold mb-2">نام شرکت</label>
                    <input type="text" name="name" value={info.name} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
                 <div>
                    <label className="block text-sm font-bold mb-2">شماره تماس</label>
                    <input type="text" name="phone" value={info.phone} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">آدرس</label>
                <input type="text" name="address" value={info.address} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">لوگو</label>
                <div className="flex items-center gap-4">
                     <input type="file" accept="image/*" onChange={handleLogoChange} className="w-full text-sm" />
                     {info.logo && <img src={info.logo} alt="Logo Preview" className="w-16 h-16 rounded-lg object-contain border p-1" />}
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold">ذخیره اطلاعات</button>
            </div>
        </form>
    );
};

const DocumentCustomizerSection = ({ settings, onSetSettings, companyInfo }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings(prev => ({ ...prev, backgroundImage: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBackground = () => {
        setLocalSettings(prev => ({ ...prev, backgroundImage: null }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSetSettings(localSettings);
    };
    
    return (
         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Controls */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">موقعیت لوگو در سربرگ</label>
                        <div className="flex gap-4">
                            {(['right', 'center', 'left'] as const).map(pos => (
                                <label key={pos} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="logoPosition" value={pos} checked={localSettings.logoPosition === pos} onChange={handleSettingChange} className="form-radio text-teal-600" />
                                    <span>{pos === 'right' ? 'راست' : pos === 'center' ? 'وسط' : 'چپ'}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">رنگ اصلی</label>
                         <div className="flex items-center gap-2">
                             <input type="color" name="accentColor" value={localSettings.accentColor} onChange={handleSettingChange} className="w-10 h-10 border-none cursor-pointer" />
                             <span className="font-mono text-sm">{localSettings.accentColor}</span>
                         </div>
                    </div>
                     <div>
                        <label className="block text-sm font-bold mb-2">تصویر پس‌زمینه فاکتور</label>
                        <p className="text-xs text-gray-500 mb-2">این تصویر به صورت محو در پس‌زمینه تمام اسناد چاپی قرار می‌گیرد.</p>
                        <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" onChange={handleBackgroundChange} className="w-full text-sm" />
                            {localSettings.backgroundImage && (
                                <div className="relative">
                                    <img src={localSettings.backgroundImage} alt="Background Preview" className="w-16 h-16 rounded-lg object-cover border p-1" />
                                    <button type="button" onClick={handleRemoveBackground} title="حذف پس‌زمینه" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs shadow-md">X</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                 {/* Live Preview */}
                <div className="border-2 border-dashed rounded-lg p-4">
                    <h4 className="text-center font-semibold text-gray-500 text-sm mb-2">پیش‌نمایش زنده سربرگ</h4>
                     <div 
                        className={`print-header layout-logo-${localSettings.logoPosition}`} 
                        style={{ borderColor: localSettings.accentColor }}
                    >
                        <div className="print-company-info">
                            <h1 className="font-bold text-gray-800" style={{ color: localSettings.accentColor }}>{companyInfo.name || 'نام شرکت شما'}</h1>
                            <p className="text-xs text-gray-500">{companyInfo.address || 'آدرس شما'}</p>
                        </div>
                        {companyInfo.logo && <img src={companyInfo.logo} alt="Logo" className="w-12 h-12 object-contain" />}
                    </div>
                </div>
            </div>
             <div className="flex justify-end pt-4 border-t mt-4">
                <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold">ذخیره تنظیمات اسناد</button>
            </div>
         </form>
    );
};

const UserManagementSection = ({ users, onSaveUser, onDeleteUser, onPasswordReset, showConfirmation }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);

    const handleAdd = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleDelete = (user: User) => {
        showConfirmation(
            `حذف کاربر`,
            <p>آیا از حذف کاربر <span className="font-bold">{user.username}</span> اطمینان دارید؟ این عمل دائمی است.</p>,
            () => onDeleteUser(user.id)
        );
    };

    const handleResetPassword = (user: User) => {
        setUserToReset(user);
    };
    
    return (
        <>
        <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={onSaveUser} initialData={editingUser} />
        <ResetPasswordModal isOpen={!!userToReset} onClose={() => setUserToReset(null)} onConfirm={onPasswordReset} user={userToReset} />

        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={handleAdd} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md">
                    <PlusIcon />
                    <span className="mr-2">افزودن کاربر</span>
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-right">
                    <thead className="bg-gray-50"><tr className="border-b"><th className="p-3">نام کاربری</th><th className="p-3">نقش</th><th className="p-3">آخرین ورود</th><th className="p-3">عملیات</th></tr></thead>
                    <tbody className="divide-y">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium">{user.username}</td>
                                <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full ${getRoleStyle(user.role)}`}>{user.role}</span></td>
                                <td className="p-3 text-sm text-gray-500">{user.lastLogin}</td>
                                <td className="p-3"><div className="flex gap-2"><button onClick={() => handleEdit(user)} className="text-blue-500 p-1" title="ویرایش"><EditIcon /></button><button onClick={() => handleDelete(user)} className="text-red-500 p-1" title="حذف"><TrashIcon /></button><button onClick={() => handleResetPassword(user)} className="text-yellow-600 p-1" title="بازنشانی رمز عبور"><KeyIcon /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        </>
    );
};

// --- NEW ROLE MANAGEMENT SECTION ---
const RoleManagementSection = ({ permissions, setPermissions, addToast }) => {
    const [activeRole, setActiveRole] = useState<keyof RolePermissions>('فروشنده');
    const [localPermissions, setLocalPermissions] = useState(permissions);

    useEffect(() => {
        setLocalPermissions(permissions);
    }, [permissions]);

    const handleToggleChange = (role: keyof RolePermissions, key: keyof PermissionSet) => {
        setLocalPermissions(prev => ({
            ...prev,
            [role]: { ...prev[role], [key]: !prev[role][key] }
        }));
    };

    const handleValueChange = (role: keyof RolePermissions, key: keyof PermissionSet, value: string) => {
        setLocalPermissions(prev => ({
            ...prev,
            [role]: { ...prev[role], [key]: Number(value) }
        }));
    };
    
    const handleSave = () => {
        setPermissions(localPermissions);
        addToast("دسترسی‌ها با موفقیت ذخیره شد.", 'success');
    };

    const PermissionToggle = ({ label, isChecked, onChange }) => (
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <span className="font-semibold text-gray-700 text-sm">{label}</span>
            <button type="button" className={`${isChecked ? 'bg-teal-600' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`} onClick={onChange}>
                <span className={`${isChecked ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
            </button>
        </div>
    );
    
    const currentRolePermissions = localPermissions[activeRole];

    return (
         <div className="space-y-4">
            <div className="flex border-b">
                {Object.keys(permissions).map((role) => (
                    <button key={role} onClick={() => setActiveRole(role as keyof RolePermissions)} className={`px-4 py-2 font-semibold ${activeRole === role ? 'border-b-2 border-teal-600 text-teal-700' : 'text-gray-500'}`}>
                        {role}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                 {/* Sales Permissions */}
                <div>
                    <h4 className="font-bold mb-2">بخش فروش</h4>
                    <div className="space-y-2">
                        <PermissionToggle label="ایجاد فاکتور جدید" isChecked={currentRolePermissions.canCreateSale} onChange={() => handleToggleChange(activeRole, 'canCreateSale')} />
                        <PermissionToggle label="ویرایش فاکتور" isChecked={currentRolePermissions.canEditSale} onChange={() => handleToggleChange(activeRole, 'canEditSale')} />
                        <PermissionToggle label="حذف فاکتور" isChecked={currentRolePermissions.canDeleteSale} onChange={() => handleToggleChange(activeRole, 'canDeleteSale')} />
                        <PermissionToggle label="اعمال تخفیف دستی" isChecked={currentRolePermissions.canGiveManualDiscount} onChange={() => handleToggleChange(activeRole, 'canGiveManualDiscount')} />
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <span className="font-semibold text-gray-700 text-sm">حداکثر تخفیف مجاز</span>
                            <div className="flex items-center gap-2">
                                <input type="number" value={currentRolePermissions.maxDiscountPercentage} onChange={(e) => handleValueChange(activeRole, 'maxDiscountPercentage', e.target.value)} className="w-20 p-1 text-center border rounded-md" disabled={!currentRolePermissions.canGiveManualDiscount} />
                                <span>٪</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Permissions */}
                <div>
                    <h4 className="font-bold mb-2">بخش مشتریان</h4>
                    <div className="space-y-2">
                         <PermissionToggle label="افزودن مشتری جدید" isChecked={currentRolePermissions.canCreateCustomer} onChange={() => handleToggleChange(activeRole, 'canCreateCustomer')} />
                         <PermissionToggle label="ویرایش اطلاعات مشتری" isChecked={currentRolePermissions.canEditCustomer} onChange={() => handleToggleChange(activeRole, 'canEditCustomer')} />
                         <PermissionToggle label="حذف مشتری" isChecked={currentRolePermissions.canDeleteCustomer} onChange={() => handleToggleChange(activeRole, 'canDeleteCustomer')} />
                    </div>
                </div>
                
                 {/* Inventory Permissions */}
                <div>
                    <h4 className="font-bold mb-2">بخش انبار</h4>
                    <div className="space-y-2">
                         <PermissionToggle label="تعریف محصول جدید" isChecked={currentRolePermissions.canCreateDrug} onChange={() => handleToggleChange(activeRole, 'canCreateDrug')} />
                         <PermissionToggle label="ویرایش اطلاعات محصول" isChecked={currentRolePermissions.canEditDrug} onChange={() => handleToggleChange(activeRole, 'canEditDrug')} />
                         <PermissionToggle label="حذف محصول" isChecked={currentRolePermissions.canDeleteDrug} onChange={() => handleToggleChange(activeRole, 'canDeleteDrug')} />
                         <PermissionToggle label="ثبت ضایعات" isChecked={currentRolePermissions.canWriteOffStock} onChange={() => handleToggleChange(activeRole, 'canWriteOffStock')} />
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4">
                <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold">ذخیره دسترسی‌ها</button>
            </div>
        </div>
    );
};


const BackupAndRestoreSection = ({ onBackupLocal, onRestoreLocal, onBackupOnline, onRestoreOnline, supabase, licenseId, hasUnsavedChanges, addToast }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [onlineBackup, setOnlineBackup] = useState<{ id: string, created_at: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const fetchBackup = async () => {
        setIsLoading(true);
        try {
            if (!licenseId) return;
            const { data, error } = await supabase
                .from('backups')
                .select('id, created_at')
                .eq('license_id', licenseId)
                .single();
            if (error && error.code !== 'PGRST116') throw error; // Ignore "exactly one row" error
            setOnlineBackup(data || null);
        } catch (error: any) {
            console.error("Error fetching backup:", error);
            addToast(`خطا در دریافت اطلاعات پشتیبان: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBackup();
    }, [licenseId, supabase]);
    
    const handleCreateOnlineBackup = async () => {
        setIsUploading(true);
        const success = await onBackupOnline();
        if (success) {
            await fetchBackup(); // Refresh the backup info
        }
        setIsUploading(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Local Backup */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-bold text-lg">پشتیبان‌گیری محلی</h4>
                <p className="text-sm text-gray-600">یک فایل از تمام اطلاعات برنامه روی کامپیوتر شما ذخیره می‌شود. این فایل برای بازیابی در آینده ضروری است.</p>
                <button onClick={onBackupLocal} className="relative w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    {hasUnsavedChanges && (
                        <span className="absolute top-2 right-2 flex h-3 w-3" title="تغییرات ذخیره نشده وجود دارد">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <DownloadIcon /> تهیه نسخه پشتیبان
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                    <UploadIcon /> بازیابی از فایل
                </button>
                <input type="file" ref={fileInputRef} onChange={onRestoreLocal} className="hidden" accept=".json" />
            </div>
            {/* Online Backup */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                 <div className="flex justify-between items-center">
                    <h4 className="font-bold text-lg">پشتیبان‌گیری ابری</h4>
                    <button onClick={fetchBackup} title="بارگذاری مجدد" className="p-1 text-gray-500 hover:text-gray-800"><RefreshIcon /></button>
                </div>
                <p className="text-sm text-gray-600">یک نسخه امن از اطلاعات شما در فضای ابری ذخیره می‌شود تا از هر سیستمی قابل دسترس باشد.</p>
                <button onClick={handleCreateOnlineBackup} disabled={isUploading} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:bg-teal-400 disabled:cursor-not-allowed">
                    {isUploading ? (
                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : <CloudUploadIcon />}
                    <span>{isUploading ? 'در حال آپلود...' : 'ایجاد / به‌روزرسانی پشتیبان آنلاین'}</span>
                </button>
                <div className="space-y-2 pt-2 border-t">
                     <h5 className="font-semibold text-sm">وضعیت پشتیبان ابری:</h5>
                     {isLoading ? <p className="text-sm">در حال بارگذاری...</p> : (
                         onlineBackup ? (
                            <div className="flex justify-between items-center text-sm py-1">
                                <span>آخرین پشتیبان: {new Date(onlineBackup.created_at).toLocaleString('fa-IR')}</span>
                                <button onClick={() => onRestoreOnline()} className="font-semibold text-blue-600 hover:underline">بازیابی</button>
                            </div>
                         ) : <p className="text-sm text-gray-500">هیچ نسخه پشتیبان آنلاینی یافت نشد.</p>
                     )}
                </div>
            </div>
        </div>
    );
};

const DataPurgeSection = ({ onPurgeData, showConfirmation, addToast }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleOpenModal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            addToast('لطفا تاریخ شروع و پایان را انتخاب کنید.', 'error');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            addToast('تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.', 'error');
            return;
        }
        setIsModalOpen(true);
    };

    const handleConfirmPurge = () => {
        onPurgeData(startDate, endDate);
        setIsModalOpen(false);
        setConfirmText('');
        setStartDate('');
        setEndDate('');
    };

    return (
        <>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl p-8 max-w-lg w-full text-center space-y-4">
                        <h2 className="text-xl font-bold text-red-700">تایید حذف دائمی داده‌ها</h2>
                        <p className="text-gray-600">
                            شما در حال حذف دائمی تمام فاکتورهای فروش، فاکتورهای خرید و هزینه‌ها از تاریخ
                            <span className="font-bold mx-1">{new Date(startDate).toLocaleDateString('fa-IR')}</span>
                            تا
                            <span className="font-bold mx-1">{new Date(endDate).toLocaleDateString('fa-IR')}</span>
                            هستید.
                        </p>
                        <p className="text-lg font-bold text-red-600 bg-red-50 p-3 rounded-lg">این عمل به هیچ عنوان قابل بازگشت نیست.</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">برای تایید، لطفاً کلمه «<span className="font-mono">حذف</span>» را در کادر زیر تایپ کنید.</label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full text-center px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={() => { setIsModalOpen(false); setConfirmText(''); }} className="px-6 py-2 rounded-lg bg-gray-200 font-semibold">انصراف</button>
                            <button 
                                onClick={handleConfirmPurge} 
                                className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold disabled:bg-red-300 disabled:cursor-not-allowed" 
                                disabled={confirmText !== 'حذف'}
                            >
                                حذف دائمی
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <form onSubmit={handleOpenModal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-bold mb-1">حذف داده‌ها از تاریخ</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">تا تاریخ</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg" required />
                    </div>
                    <button type="submit" className="w-full py-2.5 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 shadow-md">
                        پاک‌سازی داده‌ها
                    </button>
                </div>
            </form>
        </>
    );
};

const SecuritySettingsSection = ({ backupKey, onBackupKeyChange, addToast }) => {
    const [currentKey, setCurrentKey] = useState('');
    const [newKey, setNewKey] = useState('');
    const [confirmNewKey, setConfirmNewKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentKey !== backupKey) {
            addToast('شاه کلید فعلی اشتباه است.', 'error');
            return;
        }
        if (newKey.length < 8) {
            addToast('شاه کلید جدید باید حداقل ۸ کاراکتر باشد.', 'error');
            return;
        }
        if (newKey !== confirmNewKey) {
            addToast('شاه کلید جدید و تکرار آن مطابقت ندارند.', 'error');
            return;
        }
        onBackupKeyChange(newKey);
        addToast('شاه کلید پشتیبان با موفقیت تغییر کرد.', 'success');
        setCurrentKey('');
        setNewKey('');
        setConfirmNewKey('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold mb-2">شاه کلید فعلی</label>
                <input type="password" value={currentKey} onChange={e => setCurrentKey(e.target.value)} className="w-full p-2 border rounded-lg" required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold mb-2">شاه کلید جدید</label>
                    <input type="password" value={newKey} onChange={e => setNewKey(e.target.value)} className="w-full p-2 border rounded-lg" required />
                </div>
                 <div>
                    <label className="block text-sm font-bold mb-2">تکرار شاه کلید جدید</label>
                    <input type="password" value={confirmNewKey} onChange={e => setConfirmNewKey(e.target.value)} className="w-full p-2 border rounded-lg" required />
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-semibold">تغییر شاه کلید</button>
            </div>
        </form>
    );
}

//=========== MAIN COMPONENT ===========//
type SettingsProps = {
    companyInfo: CompanyInfo;
    onSetCompanyInfo: (info: CompanyInfo) => void;
    users: User[];
    onSaveUser: (user: Omit<User, 'lastLogin'>) => void;
    onDeleteUser: (id: number) => void;
    onPasswordReset: (username: string, newPass: string) => void;
    backupKey: string | null;
    onBackupKeyChange: (newKey: string) => void;
    supabase: SupabaseClient;
    licenseId: string | null;
    onBackupLocal: () => void;
    onRestoreLocal: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBackupOnline: () => Promise<boolean>;
    onRestoreOnline: () => void;
    onPurgeData: (startDate: string, endDate: string) => void;
    documentSettings: DocumentSettings;
    onSetDocumentSettings: (settings: DocumentSettings) => void;
    rolePermissions: RolePermissions;
    onSetRolePermissions: (permissions: RolePermissions) => void;
    hasUnsavedChanges: boolean;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    showConfirmation: (title: string, message: React.ReactNode, onConfirm: () => void) => void;
    currentUser: User;
};

const Settings: React.FC<SettingsProps> = (props) => {
    return (
        <div className="p-8 space-y-8">
            <SettingsCard title="اطلاعات شرکت" description="تنظیمات اولیه و اطلاعات تماس شرکت خود را مدیریت کنید.">
                <CompanyInfoSection companyInfo={props.companyInfo} onSetCompanyInfo={props.onSetCompanyInfo} />
            </SettingsCard>

            <SettingsCard title="شخصی‌سازی فاکتور و گزارشات" description="ظاهر و چیدمان اسناد چاپی خود را مطابق با سلیقه و برند خود تنظیم کنید.">
                <DocumentCustomizerSection settings={props.documentSettings} onSetSettings={props.onSetDocumentSettings} companyInfo={props.companyInfo} />
            </SettingsCard>

            <SettingsCard title="مدیریت کاربران" description="کاربران جدید تعریف کرده و سطح دسترسی و رمز عبور آن‌ها را مشخص کنید.">
                <UserManagementSection users={props.users} onSaveUser={props.onSaveUser} onDeleteUser={props.onDeleteUser} onPasswordReset={props.onPasswordReset} showConfirmation={props.showConfirmation}/>
            </SettingsCard>

            {props.currentUser.role === 'مدیر کل' && (
                <SettingsCard title="مدیریت نقش‌ها و دسترسی‌ها" description="سطح دسترسی هر نقش کاربری به بخش‌های مختلف برنامه را به صورت دقیق تنظیم کنید.">
                    <RoleManagementSection permissions={props.rolePermissions} setPermissions={props.onSetRolePermissions} addToast={props.addToast} />
                </SettingsCard>
            )}
            
            {props.currentUser.role === 'مدیر کل' && (
                <SettingsCard title="تنظیمات امنیتی" description="شاه کلید پشتیبان برای بازیابی اضطراری رمزهای عبور استفاده می‌شود. آن را در جای امنی نگهداری کنید.">
                    <SecuritySettingsSection backupKey={props.backupKey} onBackupKeyChange={props.onBackupKeyChange} addToast={props.addToast} />
                </SettingsCard>
            )}

             <SettingsCard title="پشتیبان‌گیری و بازیابی" description="از اطلاعات خود نسخه پشتیبان تهیه کرده یا اطلاعات قبلی را بازیابی کنید.">
                <BackupAndRestoreSection 
                    onBackupLocal={props.onBackupLocal}
                    onRestoreLocal={props.onRestoreLocal}
                    onBackupOnline={props.onBackupOnline}
                    onRestoreOnline={props.onRestoreOnline}
                    supabase={props.supabase}
                    licenseId={props.licenseId}
                    hasUnsavedChanges={props.hasUnsavedChanges}
                    addToast={props.addToast}
                />
            </SettingsCard>

            <SettingsCard title="مدیریت پیشرفته داده‌ها" description="حذف دائمی داده‌های قدیمی برای سبک‌سازی برنامه و بهبود عملکرد.">
                <DataPurgeSection 
                    onPurgeData={props.onPurgeData} 
                    showConfirmation={props.showConfirmation} 
                    addToast={props.addToast} 
                />
            </SettingsCard>
        </div>
    );
};

export default Settings;