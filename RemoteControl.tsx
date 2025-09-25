import React, { useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

//=========== SUPABASE CLIENT ===========//
const supabaseUrl = 'https://uqokruakwmqfynszaine.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxb2tydWFrd21xZnluc3phaW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODg5ODYsImV4cCI6MjA3MzA2NDk4Nn0.6hAotsw9GStdteP4NWcqvFmjCq8_81Y9IpGVkJx2dT0';
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

//=========== ICONS ===========//
const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;


//=========== LOGIN SCREEN COMPONENT ===========//
const LoginScreen = ({ onLoginSuccess, addToast }: { onLoginSuccess: (username: string) => void, addToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: `${username}@example.com`,
                password,
            });

            if (error) throw error;
            if (data.user) {
                 onLoginSuccess(username);
                 addToast(`خوش آمدید, ${username}! اتصال ریموت برقرار شد.`, 'success');
            }
        } catch (err: any) {
             addToast('نام کاربری یا رمز عبور اشتباه است.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-teal-800">ورود به ریموت کنترل</h1>
                    <p className="mt-2 text-gray-500">از حساب کاربری اصلی برنامه استفاده کنید</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                     <div>
                        <label className="text-sm font-medium text-gray-700">نام کاربری</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">رمز عبور</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-teal-400">
                        {isLoading ? 'در حال ورود...' : 'ورود'}
                    </button>
                </form>
            </div>
        </div>
    );
};


//=========== MAIN REMOTE CONTROL COMPONENT ===========//
const RemoteControl = ({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
    const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('hayat_remote_user'));
    
    // State for the Quick Sale form
    const [customerName, setCustomerName] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [items, setItems] = useState<{ drugId: string; quantity: string }[]>([]);
    const [newItem, setNewItem] = useState({ drugId: '', quantity: '' });

    const handleSendCommand = async (type: string, payload: any) => {
        if (!currentUser) return;
        
        const { error } = await supabase.from('commands').insert({ sent_by: currentUser, type, payload });

        if (error) {
            addToast(`خطا در ارسال دستور: ${error.message}`, 'error');
        } else {
            addToast(`دستور با موفقیت به برنامه اصلی ارسال شد.`, 'success');
        }
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.drugId || !newItem.quantity) {
            addToast('لطفا شناسه و تعداد محصول را وارد کنید.', 'error');
            return;
        }
        setItems([...items, newItem]);
        setNewItem({ drugId: '', quantity: '' });
    };
    
    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmitSale = async () => {
        if (!customerName || items.length === 0) {
            addToast('لطفا نام مشتری و حداقل یک قلم را وارد کنید.', 'error');
            return;
        }
        const payload = {
            customerName,
            amountPaid: Number(amountPaid) || 0,
            items: items.map(item => ({
                drugId: Number(item.drugId),
                quantity: Number(item.quantity),
                bonusQuantity: 0
            }))
        };
        await handleSendCommand('CREATE_QUICK_SALE', payload);
        // Reset form after sending
        setCustomerName('');
        setAmountPaid('');
        setItems([]);
    };

    const handleLogout = () => {
        localStorage.removeItem('hayat_remote_user');
        setCurrentUser(null);
    };

    if (!currentUser) {
        return <LoginScreen onLoginSuccess={(username) => {
            localStorage.setItem('hayat_remote_user', username);
            setCurrentUser(username);
        }} addToast={addToast} />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-white shadow-md p-4 flex justify-between items-center flex-shrink-0">
                <h1 className="font-bold text-lg text-teal-700">ریموت کنترل حیات</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{currentUser}</span>
                    <button onClick={handleLogout} title="خروج"><LogoutIcon /></button>
                </div>
            </header>
            <main className="flex-1 p-4 flex flex-col items-center space-y-4 overflow-y-auto">
                <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">ثبت فاکتور سریع</h2>
                    
                    {/* Items List */}
                    <div className="space-y-2">
                         <h3 className="text-sm font-semibold text-gray-600">اقلام فاکتور:</h3>
                         {items.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm py-4">هیچ قلمی اضافه نشده است.</p>
                         ) : (
                            <ul className="divide-y max-h-40 overflow-y-auto pr-2">
                                {items.map((item, index) => (
                                    <li key={index} className="py-2 flex justify-between items-center">
                                        <p>محصول شناسه: <span className="font-mono font-bold">{item.drugId}</span> - تعداد: <span className="font-mono font-bold">{item.quantity}</span></p>
                                        <button onClick={() => handleRemoveItem(index)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon /></button>
                                    </li>
                                ))}
                            </ul>
                         )}
                    </div>

                    {/* Add Item Form */}
                    <form onSubmit={handleAddItem} className="p-3 bg-gray-50 rounded-lg flex items-end gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-700">شناسه محصول</label>
                            <input type="number" placeholder="مثال: 123" value={newItem.drugId} onChange={e => setNewItem({...newItem, drugId: e.target.value})} className="w-full p-2 border rounded-md mt-1" required />
                        </div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-gray-700">تعداد</label>
                            <input type="number" placeholder="مثال: 10" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full p-2 border rounded-md mt-1" required />
                        </div>
                        <button type="submit" className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 h-10 w-10 flex-shrink-0"><PlusIcon /></button>
                    </form>

                    {/* Customer and Payment */}
                    <div className="pt-4 border-t space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700">نام مشتری</label>
                            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="نام مشتری را وارد کنید..." className="w-full p-2 border rounded-md mt-1" required />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700">مبلغ پرداخت شده</label>
                            <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0" className="w-full p-2 border rounded-md mt-1" />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        onClick={handleSubmitSale}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                    >
                        <SendIcon />
                        ارسال دستور فروش
                    </button>
                </div>
            </main>
        </div>
    );
};

export default RemoteControl;