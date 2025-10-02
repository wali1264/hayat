import React, { useState, useMemo, useEffect } from 'react';
import { User } from './Settings';
import { Order } from './Sales';

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
const IncomeIcon = () => <Icon path="M12 8c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1-5h2v2h-2v-2z" className="w-8 h-8"/>;
const ExpenseIcon = () => <Icon path="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" className="w-8 h-8"/>;
const ProfitIcon = () => <Icon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" className="w-8 h-8" />;


//=========== TYPES ===========//
export type ExpenseCategory = 'حقوق' | 'کرایه' | 'حمل و نقل' | 'بازاریابی' | 'سایر';
export type Expense = {
    id: number;
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
};
export type Income = {
    id: number;
    description: string;
    amount: number;
    date: string;
};

//=========== HELPERS ===========//
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
type ExpenseModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Expense) => void;
    initialData: Expense | null;
};

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [expense, setExpense] = useState({
        description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'سایر' as ExpenseCategory
    });
    const isEditMode = initialData !== null;

    useEffect(() => {
        if (isOpen) {
            setExpense(initialData ? { ...initialData, amount: String(initialData.amount) } : {
                description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'سایر'
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setExpense(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const expenseToSave: Expense = {
            id: isEditMode ? initialData!.id : Date.now(),
            description: expense.description,
            amount: Number(expense.amount) || 0,
            date: expense.date,
            category: expense.category,
        };
        onSave(expenseToSave);
        onClose();
    };

    const inputStyles = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500";
    const labelStyles = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="description" className={labelStyles}>شرح هزینه</label>
                        <input type="text" name="description" value={expense.description} onChange={handleChange} className={inputStyles} required autoFocus />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="amount" className={labelStyles}>مبلغ (افغانی)</label>
                            <input type="number" name="amount" value={expense.amount} onChange={handleChange} className={inputStyles} min="1" required placeholder="مثلا: 50000" />
                        </div>
                        <div>
                           <label htmlFor="date" className={labelStyles}>تاریخ</label>
                           <input type="date" name="date" value={expense.date} onChange={handleChange} className={inputStyles} required />
                        </div>
                    </div>
                     <div className="mb-6">
                        <label htmlFor="category" className={labelStyles}>دسته‌بندی</label>
                        <select name="category" value={expense.category} onChange={handleChange} className={inputStyles}>
                            <option value="حقوق">حقوق</option>
                            <option value="کرایه">کرایه</option>
                            <option value="حمل و نقل">حمل و نقل</option>
                            <option value="بازاریابی">بازاریابی</option>
                            <option value="سایر">سایر</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t">
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
type AccountingProps = {
    orders: Order[];
    expenses: Expense[];
    onSave: (expense: Expense) => void;
    onDelete: (id: number) => void;
    currentUser: User;
};


const FinanceAndExpenses: React.FC<AccountingProps> = ({ orders, expenses, onSave, onDelete, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const canManageExpenses = useMemo(() => 
        currentUser.role === 'مدیر کل' || currentUser.role === 'حسابدار',
    [currentUser.role]);

    const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
        const totalIncome = orders
            .filter(o => o.type === 'sale')
            .reduce((sum, item) => sum + item.totalAmount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const netProfit = totalIncome - totalExpenses;
        return { totalIncome, totalExpenses, netProfit };
    }, [orders, expenses]);

    const handleSaveExpense = (expenseData: Expense) => {
        onSave(expenseData);
        setIsModalOpen(false);
    };

    const handleDeleteExpense = (id: number) => {
        onDelete(id);
    };
    
    const filteredExpenses = expenses.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const SummaryCard = ({ title, value, icon, colorClass }: { title: string, value: number, icon: React.ReactNode, colorClass: string }) => (
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{Math.round(value).toLocaleString()} <span className="text-lg font-normal">افغانی</span></p>
            </div>
            <div className={`p-4 rounded-full ${colorClass}`}>
                {icon}
            </div>
        </div>
    );

    return (
        <div className="p-8">
             {canManageExpenses && <ExpenseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveExpense}
                initialData={editingExpense}
            />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <SummaryCard title="مجموع درآمد" value={totalIncome} icon={<IncomeIcon/>} colorClass="bg-green-100 text-green-600" />
                <SummaryCard title="مجموع هزینه‌ها" value={totalExpenses} icon={<ExpenseIcon />} colorClass="bg-red-100 text-red-600" />
                <SummaryCard title="سود خالص" value={netProfit} icon={<ProfitIcon />} colorClass="bg-blue-100 text-blue-600" />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">مدیریت هزینه‌های داخلی</h2>
                        <p className="text-gray-500">ثبت و بررسی هزینه‌های عملیاتی شرکت</p>
                    </div>
                     <div className="flex items-center space-x-2 space-x-reverse">
                         <div className="relative">
                            <input
                                type="text"
                                placeholder="جستجوی هزینه..."
                                className="pl-10 pr-4 py-2 border rounded-lg"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                               <SearchIcon />
                            </div>
                        </div>
                        {canManageExpenses && (
                            <button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md">
                                <PlusIcon />
                                <span className="mr-2">ثبت هزینه</span>
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b-2">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600">شرح</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">دسته‌بندی</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">تاریخ</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">مبلغ (افغانی)</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-800 font-medium">{expense.description}</td>
                                    <td className="p-4 text-gray-500">{expense.category}</td>
                                    <td className="p-4 whitespace-nowrap text-gray-500 text-sm">
                                        {new Date(expense.date).toLocaleDateString('fa-IR')}
                                        <div className="font-mono text-xs text-gray-400">{formatGregorianForDisplay(expense.date)}</div>
                                    </td>
                                    <td className="p-4 text-gray-800 font-semibold">{Math.round(expense.amount).toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            {canManageExpenses && (
                                                <>
                                                    <button onClick={() => { setEditingExpense(expense); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-1"><EditIcon /></button>
                                                    <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinanceAndExpenses;