import React, { useState, useEffect } from 'react';

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
const UploadIcon = () => <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />;
const DownloadIcon = () => <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />;


//=========== TYPES ===========//
export type UserRole = 'مدیر کل' | 'انباردار' | 'فروشنده' | 'حسابدار';
export type User = {
    id: number;
    username: string;
    role: UserRole;
    lastLogin: string;
};

export type CompanyInfo = {
    name: string;
    address: string;
    phone: string;
    logo: string | null;
};

//=========== MOCK DATA ===========//
export const mockUsers: User[] = [
    { id: 1, username: 'admin', role: 'مدیر کل', lastLogin: '1403/05/01 10:30' },
    { id: 2, username: 'ahmad', role: 'انباردار', lastLogin: '1403/05/01 09:15' },
    { id: 3, username: 'farid', role: 'فروشنده', lastLogin: '1403/04/30 14:00' },
    { id: 4, username: 'zohra', role: 'حسابدار', lastLogin: '1403/05/01 11:05' },
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

//=========== MODAL COMPONENT (USERS) ===========//
type UserModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'lastLogin'>) => void;
    initialData: User | null;
};

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [user, setUser] = useState({ username: '', role: 'فروشنده' as UserRole });
    const [password, setPassword] = useState('');
    const isEditMode = initialData !== null;

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setUser({ username: initialData.username, role: initialData.role });
            } else {
                setUser({ username: '', role: 'فروشنده' });
            }
            setPassword('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user.username) {
            alert("لطفاً نام کاربری را وارد کنید.");
            return;
        }
        // In a real app, password handling would be more secure.
        // if (!isEditMode && !password) {
        //     alert("لطفاً رمز عبور را برای کاربر جدید وارد کنید.");
        //     return;
        // }
        onSave({ ...user, id: isEditMode ? initialData.id : Date.now() });
        onClose();
    };

    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className={labelStyles}>نام کاربری</label>
                        <input type="text" name="username" value={user.username} onChange={e => setUser(u => ({ ...u, username: e.target.value }))} className={inputStyles} required autoFocus />
                    </div>
                    {/* Simplified: No password field in this version for simplicity */}
                    {/* <div className="mb-4">
                        <label htmlFor="password" className={labelStyles}>رمز عبور</label>
                        <input type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} className={inputStyles} placeholder={isEditMode ? "برای تغییر، رمز جدید را وارد کنید" : ""} />
                    </div> */}
                    <div className="mb-6">
                        <label htmlFor="role" className={labelStyles}>نقش کاربر</label>
                        <select name="role" value={user.role} onChange={e => setUser(u => ({ ...u, role: e.target.value as UserRole }))} className={inputStyles}>
                            <option value="مدیر کل">مدیر کل</option>
                            <option value="انباردار">انباردار</option>
                            <option value="فروشنده">فروشنده</option>
                            <option value="حسابدار">حسابدار</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold">انصراف</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md">
                           {isEditMode ? 'ذخیره تغییرات' : 'ایجاد کاربر'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


//=========== COMPANY INFO COMPONENT ===========//
type CompanyInfoProps = {
    companyInfo: CompanyInfo;
    setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
};

const CompanyInfoSection: React.FC<CompanyInfoProps> = ({ companyInfo, setCompanyInfo }) => {
    
    const [logoPreview, setLogoPreview] = useState<string | null>(companyInfo.logo);

    useEffect(() => {
        setLogoPreview(companyInfo.logo);
    }, [companyInfo.logo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCompanyInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                setCompanyInfo(prev => ({...prev, logo: result}));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = () => {
        // The state is already saved by the persistent hook, this is just for user feedback.
        alert("اطلاعات شرکت با موفقیت ذخیره شد.");
    }

    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">اطلاعات شرکت</h3>
            <p className="text-gray-500 text-sm mb-6">این اطلاعات در فاکتورها و گزارشات استفاده خواهد شد.</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                     <div>
                        <label htmlFor="name" className={labelStyles}>نام شرکت</label>
                        <input type="text" name="name" id="name" value={companyInfo.name} onChange={handleChange} className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="address" className={labelStyles}>آدرس</label>
                        <textarea name="address" id="address" value={companyInfo.address} onChange={handleChange} className={`${inputStyles} h-24 resize-none`} />
                    </div>
                    <div>
                        <label htmlFor="phone" className={labelStyles}>شماره تماس</label>
                        <input type="tel" name="phone" id="phone" value={companyInfo.phone} onChange={handleChange} className={inputStyles} />
                    </div>
                </div>
                <div className="space-y-4">
                    <label className={labelStyles}>لوگوی شرکت</label>
                    <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                       {logoPreview ? (
                            <img src={logoPreview} alt="پیش‌نمایش لوگو" className="max-h-full max-w-full object-contain p-2"/>
                       ) : (
                            <div className="text-center text-gray-500">
                                <UploadIcon />
                                <p className="mt-2">برای آپلود کلیک کنید</p>
                                <p className="text-xs">PNG, JPG</p>
                            </div>
                       )}
                    </div>
                     <input type="file" id="logo-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoChange} />
                     <button onClick={() => document.getElementById('logo-upload')?.click()} className="w-full py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors">
                        انتخاب فایل
                    </button>
                </div>
            </div>
             <div className="flex justify-end mt-8 pt-4 border-t">
                <button onClick={handleSave} className="px-8 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md transition-all">
                    ذخیره تغییرات
                </button>
            </div>
        </div>
    );
}

//=========== BACKUP & RESTORE COMPONENT ===========//
const BackupRestoreSection: React.FC = () => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleBackup = () => {
        try {
            const keysToBackup = [
                'hayat_users', 
                'hayat_drugs', 
                'hayat_orders', 
                'hayat_customers', 
                'hayat_expenses', 
                'hayat_companyInfo',
                'hayat_suppliers',
                'hayat_purchaseBills',
                'hayat_trash'
            ];
            
            const backupData: { [key: string]: any } = {};

            keysToBackup.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    backupData[key] = JSON.parse(item);
                }
            });

            const fullBackup = {
                backupDate: new Date().toISOString(),
                appVersion: 'HayatV1.0',
                data: backupData
            };

            const jsonString = JSON.stringify(fullBackup, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.download = `hayat-backup-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert("فایل پشتیبان با موفقیت ایجاد شد.");

        } catch (error) {
            console.error("Error creating backup:", error);
            alert("خطایی در هنگام ایجاد فایل پشتیبان رخ داد.");
        }
    };

    const handleRestoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const confirmation = window.confirm(
            "هشدار: بازگردانی اطلاعات تمام داده‌های فعلی شما را پاک کرده و اطلاعات فایل پشتیبان را جایگزین می‌کند. این عمل غیرقابل بازگشت است. آیا مطمئن هستید؟"
        );

        if (!confirmation) {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const backup = JSON.parse(text);

                if (!backup.data || !backup.appVersion) {
                    throw new Error("فایل پشتیبان نامعتبر است.");
                }
                
                Object.keys(backup.data).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(backup.data[key]));
                });

                alert("اطلاعات با موفقیت بازگردانی شد. برنامه مجدداً راه‌اندازی می‌شود.");
                window.location.reload();

            } catch (error) {
                console.error("Error restoring data:", error);
                alert(`خطا در بازگردانی اطلاعات: ${error.message}`);
            } finally {
                 if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">پشتیبان‌گیری و بازیابی اطلاعات</h3>
            <p className="text-gray-500 text-sm mb-6">از تمام اطلاعات سیستم یک فایل پشتیبان تهیه کنید یا اطلاعات را از یک فایل بازگردانی نمایید.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Backup Card */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg text-gray-700 mb-2">ایجاد فایل پشتیبان</h4>
                    <p className="text-sm text-gray-600 mb-4">با کلیک روی دکمه زیر، یک فایل با فرمت JSON شامل تمام اطلاعات داروها، مشتریان، سفارشات و تنظیمات شما دانلود خواهد شد. این فایل را در مکانی امن نگهداری کنید.</p>
                    <button 
                        onClick={handleBackup} 
                        className="w-full flex items-center justify-center bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors shadow-md font-semibold">
                        <DownloadIcon />
                        <span className="mr-2">دانلود فایل پشتیبان</span>
                    </button>
                </div>
                {/* Restore Card */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                     <h4 className="font-bold text-lg text-gray-700 mb-2">بازیابی از فایل پشتیبان</h4>
                    <p className="text-sm text-gray-600 mb-4">
                        <span className="font-bold text-red-600">هشدار:</span>
                        این عمل تمام اطلاعات فعلی سیستم را پاک کرده و داده‌های فایل پشتیبان را جایگزین می‌کند.
                    </p>
                    <input type="file" ref={fileInputRef} onChange={handleRestoreChange} className="hidden" accept="application/json" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md font-semibold">
                        <UploadIcon />
                        <span className="mr-2">انتخاب و بازیابی فایل</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


//=========== MAIN COMPONENT ===========//
type SettingsProps = {
    companyInfo: CompanyInfo;
    setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
    users: User[];
    onSaveUser: (user: Omit<User, 'lastLogin'>) => void;
    onDeleteUser: (id: number) => void;
};

const Settings: React.FC<SettingsProps> = ({ companyInfo, setCompanyInfo, users, onSaveUser, onDeleteUser }) => {
    const [activeTab, setActiveTab] = useState('company');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSaveUser = (userData: Omit<User, 'lastLogin'>) => {
        onSaveUser(userData);
        setIsModalOpen(false);
    };

    const handleDeleteUser = (id: number) => {
        onDeleteUser(id);
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8">
            <UserModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                initialData={editingUser}
            />
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">تنظیمات سیستم</h2>
                <p className="text-gray-500 mt-2">مدیریت کاربران، اطلاعات شرکت و سایر تنظیمات اصلی</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-2">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 space-x-reverse px-4" aria-label="Tabs">
                        {/* User management is temporarily disabled */}
                        {/* <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            مدیریت کاربران
                        </button> */}
                         <button onClick={() => setActiveTab('company')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'company' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            اطلاعات شرکت
                        </button>
                        <button onClick={() => setActiveTab('backup')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'backup' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            پشتیبان‌گیری و بازیابی
                        </button>
                    </nav>
                </div>
                
                <div className="p-6">
                    {activeTab === 'users' && (
                        <div>
                             <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">لیست کاربران</h3>
                                    <p className="text-gray-500 text-sm">کاربران سیستم و سطح دسترسی آن‌ها را مدیریت کنید.</p>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="relative">
                                        <input type="text" placeholder="جستجوی کاربر..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg" />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                                    </div>
                                    <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md">
                                        <PlusIcon />
                                        <span className="mr-2">کاربر جدید</span>
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-gray-50 border-b-2">
                                        <tr>
                                            <th className="p-4 text-sm font-semibold text-gray-600">نام کاربری</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">نقش</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">آخرین ورود</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-800 font-medium">{user.username}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRoleStyle(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500">{user.lastLogin}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                        <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-1"><EditIcon /></button>
                                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 p-1" disabled={user.id === 1}><TrashIcon /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'company' && (
                        <CompanyInfoSection companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />
                    )}
                    {activeTab === 'backup' && (
                        <BackupRestoreSection />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;