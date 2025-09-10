
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
    const defaultState = { username: '', role: 'فروشنده' as UserRole };
    const [user, setUser] = useState(defaultState);
    const isEditMode = initialData !== null;

    useEffect(() => {
        if (isOpen) {
            setUser(initialData ? { username: initialData.username, role: initialData.role } : defaultState);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: isEditMode ? initialData!.id : Date.now(), ...user });
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


const CompanyInfoSection = ({ companyInfo, setCompanyInfo }) => {
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
        setCompanyInfo(info);
        alert('اطلاعات شرکت با موفقیت ذخیره شد.');
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

const UserManagementSection = ({ users, onSaveUser, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };
    
    return (
        <>
        <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onSaveUser} initialData={editingUser} />
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
                                <td className="p-3"><div className="flex gap-2"><button onClick={() => handleEdit(user)} className="text-blue-500 p-1"><EditIcon /></button><button onClick={() => onDeleteUser(user.id)} className="text-red-500 p-1"><TrashIcon /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        </>
    );
};


const BackupAndRestoreSection = ({ onBackupLocal, onRestoreLocal, onBackupOnline, onRestoreOnline, supabase, licenseId }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [onlineBackups, setOnlineBackups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const fetchBackups = async () => {
        setIsLoading(true);
        try {
            if (!licenseId) return;
            const { data, error } = await supabase
                .from('backups')
                .select('id, created_at')
                .eq('license_id', licenseId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setOnlineBackups(data || []);
        } catch (error: any) {
            console.error("Error fetching backups:", error);
            alert(`خطا در دریافت لیست پشتیبان‌ها: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, [licenseId, supabase]);
    
    const handleCreateOnlineBackup = async () => {
        setIsUploading(true);
        const success = await onBackupOnline();
        if (success) {
            await fetchBackups(); // Refresh the list
        }
        setIsUploading(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Local Backup */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-bold text-lg">پشتیبان‌گیری محلی</h4>
                <p className="text-sm text-gray-600">یک فایل از تمام اطلاعات برنامه روی کامپیوتر شما ذخیره می‌شود. این فایل برای بازیابی در آینده ضروری است.</p>
                <button onClick={onBackupLocal} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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
                    <button onClick={fetchBackups} title="بارگذاری مجدد لیست" className="p-1 text-gray-500 hover:text-gray-800"><RefreshIcon /></button>
                </div>
                <p className="text-sm text-gray-600">یک نسخه امن از اطلاعات شما در فضای ابری ذخیره می‌شود تا از هر سیستمی قابل دسترس باشد.</p>
                <button onClick={handleCreateOnlineBackup} disabled={isUploading} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:bg-teal-300">
                    <CloudUploadIcon /> {isUploading ? 'در حال آپلود...' : 'ایجاد پشتیبان آنلاین جدید'}
                </button>
                <div className="space-y-2 pt-2 border-t">
                     <h5 className="font-semibold text-sm">نسخه‌های موجود:</h5>
                     {isLoading ? <p>در حال بارگذاری...</p> : (
                         onlineBackups.length > 0 ? (
                            <div className="max-h-32 overflow-y-auto pr-2">
                            {onlineBackups.map(backup => (
                                <div key={backup.id} className="flex justify-between items-center text-sm py-1">
                                    <span>{new Date(backup.created_at).toLocaleString('fa-IR')}</span>
                                    <button onClick={() => onRestoreOnline(backup.id)} className="font-semibold text-blue-600 hover:underline">بازیابی</button>
                                </div>
                            ))}
                            </div>
                         ) : <p className="text-xs text-gray-500">هیچ نسخه پشتیبان آنلاینی یافت نشد.</p>
                     )}
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
    supabase: SupabaseClient;
    licenseId: string | null;
    onBackupLocal: () => void;
    onRestoreLocal: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBackupOnline: () => Promise<boolean>;
    onRestoreOnline: (backupId: string) => void;
};

const Settings: React.FC<SettingsProps> = (props) => {
    return (
        <div className="p-8 space-y-8">
            <SettingsCard title="اطلاعات شرکت" description="تنظیمات اولیه و اطلاعات تماس شرکت خود را مدیریت کنید.">
                <CompanyInfoSection companyInfo={props.companyInfo} setCompanyInfo={props.setCompanyInfo} />
            </SettingsCard>

            <SettingsCard title="مدیریت کاربران" description="کاربران جدید تعریف کرده و سطح دسترسی آن‌ها را مشخص کنید.">
                <UserManagementSection users={props.users} onSaveUser={props.onSaveUser} onDeleteUser={props.onDeleteUser} />
            </SettingsCard>

             <SettingsCard title="پشتیبان‌گیری و بازیابی" description="از اطلاعات خود نسخه پشتیبان تهیه کرده یا اطلاعات قبلی را بازیابی کنید.">
                <BackupAndRestoreSection 
                    onBackupLocal={props.onBackupLocal}
                    onRestoreLocal={props.onRestoreLocal}
                    onBackupOnline={props.onBackupOnline}
                    onRestoreOnline={props.onRestoreOnline}
                    supabase={props.supabase}
                    licenseId={props.licenseId}
                />
            </SettingsCard>
        </div>
    );
};

export default Settings;
