import React, { useState, useMemo, useEffect, useRef } from 'react';
// FIX: Removed `SupabaseClient` and `RealtimeChannel` as they are not used in this file and caused an export error.
import { createClient } from '@supabase/supabase-js';
import { Order, OrderStatus, PaymentStatus, OrderItem } from './Sales';
import { Customer } from './Customers';
import { User } from './Settings';
import { Drug } from './Inventory';
// FIX: Import `RemoteLogin` from App.tsx where it is now defined and exported.
import { RemoteLogin } from './App';


// Declare global libraries
declare var Chart: any;


//=========== SUPABASE CLIENT ===========//
const supabaseUrl = 'https://uqokruakwmqfynszaine.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxb2tydWFrd21xZnluc3phaW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODg5ODYsImV4cCI6MjA3MzA2NDk4Nn0.6hAotsw9GStdteP4NWcqvFmjCq8_81Y9IpGVkJx2dT0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

//=========== ICONS ===========//
const Icon = ({ path, className = "w-6 h-6" }: { path: string, className?: string | null }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
  </svg>
);

const navIcons = {
    dashboard: <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
    inventory: <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
    sales: <Icon path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    customers: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    customer_accounts: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    menu: <Icon path="M4 6h16M4 12h16M4 18h16" />,
    logout: <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    reports: <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
};
const SearchIcon = ({ className = "w-5 h-5 text-gray-400" }) => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className={className} />;
const PlusIcon = () => <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" />;
const MinusIcon = ({ className = "w-5 h-5" }) => <Icon path="M20 12H4" className={className} />;
const TrashIcon = ({ className = "w-5 h-5" }) => <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className={className}/>;
const ShoppingCartIcon = ({ className = "w-6 h-6" }) => <Icon path="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" className={className}/>;
const WifiOffIcon = () => <Icon path="M18.364 5.636a9 9 0 010 12.728M12 18h.01M4.929 4.929a12.003 12.003 0 0114.142 0M1 1l22 22M8.465 8.465a5 5 0 017.07 0" />;


//=========== HELPERS ===========//
// ... (Helper functions like getOrderStatusStyle, getPaymentStatusStyle can be copied here if needed)

//=========== VIEWS / SCREENS ===========//

const PlaceholderView = ({ view }) => (
    <div className="text-center p-8">
        <div className="text-teal-500 opacity-20">{view?.icon && React.cloneElement(view.icon, { className: "w-32 h-32 mx-auto" })}</div>
        <h2 className="mt-4 text-2xl font-bold text-gray-400">صفحه {view?.label}</h2>
        <p className="text-gray-400">این قابلیت در حال توسعه است.</p>
    </div>
);

// --- NEW: Customer Management View for Remote ---
const NewCustomerView = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleSave = () => {
        if (name.trim() && phone.trim()) {
            onSave(name, phone);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-bold text-lg">افزودن مشتری جدید</h2>
                <button onClick={onCancel} className="text-gray-600 font-semibold">انصراف</button>
            </header>
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-bold mb-1">نام مشتری</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg" autoFocus />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">شماره تماس</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-lg" />
                </div>
            </div>
             <footer className="bg-white p-4 mt-auto">
                <button onClick={handleSave} className="w-full bg-teal-600 text-white p-3 rounded-lg font-bold">ذخیره مشتری</button>
            </footer>
        </div>
    );
};

const RemoteCustomersView = ({ customers, onAddCustomer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [customers, searchTerm]);

    return (
        <div className="flex flex-col h-full relative">
            <div className="p-4 bg-white border-b sticky top-0 z-10">
                <input type="text" placeholder="جستجوی مشتری..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border rounded-full bg-gray-100" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                ))}
            </div>
            <button onClick={onAddCustomer} className="absolute bottom-20 right-6 bg-teal-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-20">
                <PlusIcon />
            </button>
        </div>
    );
};


//=========== MOBILE SHELL & LOGIN ===========//
// ... (MobileShell component can be copied here)
const allViews = [
    { id: 'dashboard', label: 'داشبورد', icon: navIcons.dashboard },
    { id: 'sales', label: 'فروش', icon: navIcons.sales },
    { id: 'inventory', label: 'انبار', icon: navIcons.inventory },
    { id: 'customers', label: 'مشتریان', icon: navIcons.customers },
    { id: 'reports', label: 'گزارشات', icon: navIcons.reports },
];
const MobileShell = ({ currentUser, onLogout, activeView, setActiveView, children }) => {
    const activeViewDetails = allViews.find(v => v.id === activeView);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white shadow-md p-4 flex justify-between items-center flex-shrink-0 z-10">
                <h1 className="font-bold text-lg text-teal-700">{activeViewDetails?.label || 'ریموت کنترل'}</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{currentUser.username}</span>
                    <button onClick={onLogout} title="خروج">{navIcons.logout}</button>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

            <footer className="bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex-shrink-0 z-50">
                <nav className="flex justify-around items-center h-16">
                    {allViews.map(tab => (
                        <button key={tab.id} onClick={() => setActiveView(tab.id)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeView === tab.id ? 'text-teal-600' : 'text-gray-500'}`}>
                            {tab.icon}
                            <span className="text-xs font-semibold">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </footer>
        </div>
    );
};

// --- NEW: System Offline View ---
const SystemOfflineView = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-100">
        <div className="bg-white p-10 rounded-2xl shadow-lg border">
            <WifiOffIcon />
            <h2 className="mt-4 text-2xl font-bold text-gray-800">سیستم مرکزی آفلاین است</h2>
            <p className="mt-2 text-gray-600 max-w-sm">
                امکان استفاده از ریموت کنترل وجود ندارد زیرا برنامه اصلی به اینترنت متصل نیست. لطفاً با دفتر تماس بگیرید.
            </p>
        </div>
    </div>
);


//=========== MAIN COMPONENT (Entry Point) ===========//
const RemoteControl = ({ addToast }: { 
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) => {
    const [licenseId, setLicenseId] = useState<number | null>(null);
    const [remoteUser, setRemoteUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState('dashboard');
    
    // Remote data states
    const [remoteCustomers, setRemoteCustomers] = useState<Customer[]>([]);
    // ... other remote data states like remoteOrders, remoteDrugs would go here

    const [isSystemOnline, setIsSystemOnline] = useState<boolean | null>(null);
    const [waitingForCommandId, setWaitingForCommandId] = useState<number | null>(null);

    // Fetch initial data on successful login
    useEffect(() => {
        if (!licenseId) return;

        const fetchInitialData = async () => {
            addToast("در حال دریافت آخرین اطلاعات...", "info");
            try {
                const { data, error } = await supabase
                    .from('backups')
                    .select('backup_data')
                    .eq('license_id', licenseId)
                    .single();

                if (error || !data || !data.backup_data) {
                    throw new Error("خطا در دریافت اطلاعات. لطفاً مطمئن شوید یک پشتیبان آنلاین وجود دارد.");
                }

                const backup = data.backup_data;
                setRemoteCustomers(backup.customers || []);
                // setRemoteOrders(backup.orders || []);
                // setRemoteDrugs(backup.drugs || []);
                addToast("اطلاعات با موفقیت بارگذاری شد.", "success");
            } catch (error: any) {
                addToast(error.message, 'error');
                handleLogout(); // Log out if data fetch fails
            }
        };

        fetchInitialData();
    }, [licenseId]);

    // Check system status (heartbeat) periodically
    useEffect(() => {
        if (!licenseId) return;

        const checkStatus = async () => {
            const { data, error } = await supabase
                .from('company_status')
                .select('last_seen_at')
                .eq('license_id', licenseId)
                .single();

            if (error || !data) {
                console.error("Heartbeat check failed:", error);
                setIsSystemOnline(false);
                return;
            }
            
            const lastSeen = new Date(data.last_seen_at).getTime();
            const now = new Date().getTime();
            const minutesAgo = (now - lastSeen) / (1000 * 60);

            setIsSystemOnline(minutesAgo < 2); // Consider online if seen within the last 2 minutes
        };

        checkStatus(); // Check immediately
        const interval = setInterval(checkStatus, 15000); // And every 15 seconds
        
        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [licenseId]);
    
    // Listen for real-time data updates (when main app creates a new backup)
    useEffect(() => {
        if (!licenseId) return;
        const channel = supabase.channel(`backup-updates-for-${licenseId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'backups',
                filter: `license_id=eq.${licenseId}`
            }, payload => {
                addToast("داده‌های جدید از سیستم مرکزی دریافت شد.", "info");
                const backup = payload.new.backup_data;
                if (backup && Array.isArray(backup.customers)) {
                    setRemoteCustomers(backup.customers);
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [licenseId]);


    const handleLogout = () => {
        setRemoteUser(null);
        setLicenseId(null);
        addToast("شما از ریموت کنترل خارج شدید.", "info");
    };
    
    const handleLogin = async (companyUsername: string, user: User) => {
        try {
            const { data: licenseData } = await supabase
                .from('licenses').select('id').eq('username', companyUsername).single();
            if (!licenseData) throw new Error();

            setLicenseId(licenseData.id);
            setRemoteUser(user);
            addToast(`خوش آمدید، ${user.username}!`, 'success');
        } catch {
             addToast('خطا در دریافت شناسه شرکت.', 'error');
        }
    };

    const sendCommand = async (type: string, payload: any) => {
        if (!licenseId || !remoteUser) return;
        addToast("در حال ارسال فرمان...", "info");
        try {
            const { error } = await supabase.from('commands').insert({
                license_id: licenseId,
                type,
                payload,
                sent_by: remoteUser.username
            });
            if (error) throw error;
            addToast("فرمان با موفقیت ارسال شد.", "success");
        } catch (error: any) {
            addToast(`خطا در ارسال فرمان: ${error.message}`, 'error');
        }
    };
    
    // --- State for navigation inside a view ---
    const [customerView, setCustomerView] = useState<'list' | 'add'>('list');

    useEffect(() => {
        // Reset sub-view when changing main tab
        if (activeView !== 'customers') {
            setCustomerView('list');
        }
    }, [activeView]);

    const handleAddCustomer = (name: string, phone: string) => {
        const newCustomerData = {
            id: Date.now(), // Temporary ID
            name,
            phone,
            manager: '',
            address: '',
            registrationDate: new Date().toISOString(),
            status: 'فعال' as const
        };
        sendCommand('CREATE_CUSTOMER', newCustomerData);
        setCustomerView('list'); // Go back to list after saving
    };

    const renderActiveView = () => {
        const activeViewDetails = allViews.find(v => v.id === activeView);
        switch (activeView) {
            case 'dashboard':
                // Dashboard view to be implemented
                return <PlaceholderView view={activeViewDetails} />;
            case 'customers':
                if (customerView === 'add') {
                    return <NewCustomerView onSave={handleAddCustomer} onCancel={() => setCustomerView('list')} />;
                }
                return <RemoteCustomersView customers={remoteCustomers} onAddCustomer={() => setCustomerView('add')} />;
            case 'sales':
                // Sales view to be implemented
                return <PlaceholderView view={activeViewDetails} />;
            default:
                return <PlaceholderView view={activeViewDetails} />;
        }
    };

    if (!remoteUser) {
        return <RemoteLogin onLogin={handleLogin} addToast={addToast} />;
    }
    
    if (isSystemOnline === null) {
        return <div className="flex items-center justify-center h-screen">در حال بررسی وضعیت سیستم مرکزی...</div>;
    }
    
    if (isSystemOnline === false) {
        return <SystemOfflineView />;
    }

    return (
        <MobileShell currentUser={remoteUser} onLogout={handleLogout} activeView={activeView} setActiveView={setActiveView}>
            {renderActiveView()}
        </MobileShell>
    );
};

export default RemoteControl;
