import React from 'react';
import { Customer } from './Customers';

//=========== PERSISTENCE HOOK (Copied for isolation) ===========//
// This is a simplified version. The main app uses the one from App.tsx
const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = React.useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    React.useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(error);
        }
    }, [key, state]);

    return [state, setState];
};

//=========== TYPES ===========//
export type AlertSettings = {
    expiry: { enabled: boolean; months: number };
    lowStock: { enabled: boolean; quantity: number };
    customerDebt: { enabled: boolean; limits: { [customerId: number]: number } };
    totalDebt: { enabled: boolean; threshold: number };
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

const ToggleSwitch = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-teal-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
        onClick={onChange}
    >
        <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
    </button>
);

//=========== MAIN COMPONENT ===========//
type AlertsProps = {
    settings: AlertSettings;
    setSettings: React.Dispatch<React.SetStateAction<AlertSettings>>;
    customers: Customer[];
};

const Alerts: React.FC<AlertsProps> = ({ settings, setSettings, customers }) => {

    const handleToggle = (key: keyof AlertSettings) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }));
    };
    
    const handleValueChange = (key: keyof AlertSettings, field: string, value: string | number) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: Number(value) }
        }));
    };
    
    const handleCustomerLimitChange = (customerId: number, value: string) => {
        const limit = Number(value);
        setSettings(prev => {
            const newLimits = { ...prev.customerDebt.limits };
            if (limit > 0) {
                newLimits[customerId] = limit;
            } else {
                delete newLimits[customerId];
            }
            return {
                ...prev,
                customerDebt: { ...prev.customerDebt, limits: newLimits }
            };
        });
    };

    const inputStyles = "w-full text-center px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow disabled:bg-gray-100";
    const labelStyles = "font-semibold text-gray-700";

    return (
        <div className="p-8 space-y-8">
            <div className="text-center">
                 <h2 className="text-3xl font-bold text-gray-800">مدیریت هشدارها</h2>
                 <p className="text-gray-500 mt-2">سیستم را برای نظارت هوشمند و پیشگیرانه بر کسب‌وکار خود تنظیم کنید.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Inventory Alerts */}
                <div className="space-y-8">
                    <SettingsCard title="هشدارهای انبار" description="نظارت بر تاریخ انقضا و سطح موجودی داروها.">
                         <div className="space-y-6">
                            {/* Expiry Alert */}
                            <div className="flex items-center justify-between">
                                <label className={labelStyles}>هشدار انقضای دارو</label>
                                <ToggleSwitch enabled={settings.expiry.enabled} onChange={() => handleToggle('expiry')} />
                            </div>
                            <div className={`flex items-center gap-4 transition-opacity ${!settings.expiry.enabled && 'opacity-50'}`}>
                                <span className="flex-shrink-0">هشدار بده اگر تاریخ انقضای دارو کمتر از</span>
                                <input 
                                    type="number" 
                                    value={settings.expiry.months} 
                                    onChange={(e) => handleValueChange('expiry', 'months', e.target.value)}
                                    disabled={!settings.expiry.enabled}
                                    className={inputStyles}
                                />
                                <span className="flex-shrink-0">ماه دیگر بود.</span>
                            </div>
                             <hr />
                             {/* Low Stock Alert */}
                             <div className="flex items-center justify-between">
                                <label className={labelStyles}>هشدار کمبود موجودی</label>
                                <ToggleSwitch enabled={settings.lowStock.enabled} onChange={() => handleToggle('lowStock')} />
                            </div>
                             <div className={`flex items-center gap-4 transition-opacity ${!settings.lowStock.enabled && 'opacity-50'}`}>
                                <span className="flex-shrink-0">هشدار بده اگر تعداد موجودی کمتر از</span>
                                <input 
                                    type="number"
                                    value={settings.lowStock.quantity}
                                    onChange={(e) => handleValueChange('lowStock', 'quantity', e.target.value)}
                                    disabled={!settings.lowStock.enabled}
                                    className={inputStyles}
                                />
                                <span className="flex-shrink-0">عدد شد.</span>
                            </div>
                         </div>
                    </SettingsCard>
                </div>
                
                 {/* Financial Alerts */}
                 <div className="space-y-8">
                    <SettingsCard title="هشدارهای مالی" description="کنترل بدهی مشتریان برای بهبود جریان نقدینگی.">
                        <div className="space-y-6">
                             {/* Total Debt Alert */}
                            <div className="flex items-center justify-between">
                                <label className={labelStyles}>هشدار سقف کل بدهی‌ها</label>
                                <ToggleSwitch enabled={settings.totalDebt.enabled} onChange={() => handleToggle('totalDebt')} />
                            </div>
                             <div className={`flex items-center gap-4 transition-opacity ${!settings.totalDebt.enabled && 'opacity-50'}`}>
                                <span className="flex-shrink-0">هشدار بده اگر مجموع بدهی‌ها بیشتر از</span>
                                <input 
                                    type="number"
                                    value={settings.totalDebt.threshold}
                                    onChange={(e) => handleValueChange('totalDebt', 'threshold', e.target.value)}
                                    disabled={!settings.totalDebt.enabled}
                                    className={inputStyles}
                                />
                                <span className="flex-shrink-0">افغانی شد.</span>
                            </div>
                             <hr />
                             {/* Customer Debt Alert */}
                             <div className="flex items-center justify-between">
                                <label className={labelStyles}>هشدار بدهی مشتری خاص</label>
                                <ToggleSwitch enabled={settings.customerDebt.enabled} onChange={() => handleToggle('customerDebt')} />
                            </div>
                             <div className={`space-y-2 transition-opacity ${!settings.customerDebt.enabled && 'opacity-50'}`}>
                                <p className="text-sm text-gray-500">برای هر مشتری سقف بدهی مشخصی تعیین کنید. اگر کادر خالی باشد، هشداری برای آن مشتری فعال نخواهد بود.</p>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                     {customers.map(customer => (
                                        <div key={customer.id} className="flex items-center justify-between gap-4">
                                            <span className="flex-1">{customer.name}</span>
                                            <input
                                                type="number"
                                                placeholder="بدون محدودیت"
                                                value={settings.customerDebt.limits[customer.id] || ''}
                                                onChange={(e) => handleCustomerLimitChange(customer.id, e.target.value)}
                                                disabled={!settings.customerDebt.enabled}
                                                className={`${inputStyles} max-w-[150px]`}
                                            />
                                        </div>
                                     ))}
                                </div>
                            </div>
                        </div>
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};

export default Alerts;