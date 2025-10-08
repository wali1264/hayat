import { FunctionDeclaration, Type } from "@google/genai";

// Copied from App.tsx to avoid circular dependencies
const navItems = [
    { id: 'dashboard', label: 'داشبورد' },
    { id: 'main_warehouse', label: 'انبار اصلی' },
    { id: 'inventory', label: 'انبار فروش' },
    { id: 'sales', label: 'فروش و سفارشات' },
    { id: 'fulfillment', label: 'آماده‌سازی سفارشات' },
    { id: 'customers', label: 'مشتریان' },
    { id: 'customer_accounts', label: 'حسابات مشتریان' },
    { id: 'suppliers', label: 'تامین کنندگان' },
    { id: 'purchasing', label: 'خرید و فاکتورها' },
    { id: 'supplier_accounts', label: 'حسابات شرکت‌ها' },
    { id: 'finance', label: 'مالی و هزینه‌ها' },
    { id: 'reports', label: 'گزارشات' },
    { id: 'alerts', label: 'مدیریت هشدارها' },
    { id: 'checkneh', label: 'بخش چکنه' },
];

export const navigateToDeclaration: FunctionDeclaration = {
  name: 'navigateTo',
  parameters: {
    type: Type.OBJECT,
    description: 'کاربر را به بخش مشخصی از اپلیکیشن هدایت می‌کند.',
    properties: {
      page: {
        type: Type.STRING,
        description: 'صفحه مقصد.',
        enum: navItems.map(item => item.id),
      },
    },
    required: ['page'],
  },
};

export const startNewSaleDeclaration: FunctionDeclaration = {
  name: 'startNewSale',
  parameters: {
    type: Type.OBJECT,
    description: 'یک فرآیند جدید برای ثبت سفارش فروش را آغاز می‌کند و پنجره مربوطه را باز می‌کند.',
    properties: {},
  },
};

export const setSaleCustomerDeclaration: FunctionDeclaration = {
  name: 'setSaleCustomer',
  parameters: {
    type: Type.OBJECT,
    description: 'مشتری را برای سفارش فروش در حال ثبت، تنظیم می‌کند. این تابع هم برای مشتریان ثبت شده و هم مشتریان جدید کاربرد دارد.',
    properties: {
      customerName: {
        type: Type.STRING,
        description: 'نام کامل مشتری.',
      },
    },
    required: ['customerName'],
  },
};

export const addOrderItemDeclaration: FunctionDeclaration = {
  name: 'addOrderItem',
  parameters: {
    type: Type.OBJECT,
    description: 'یک یا چند قلم دارو را به سفارش فروش فعلی اضافه می‌کند. میتواند شامل جزئیات قیمت، تخفیف و بونس باشد.',
    properties: {
      drugName: {
        type: Type.STRING,
        description: 'نام دارو به فارسی یا انگلیسی، حتی به صورت ناقص.',
      },
      quantity: {
        type: Type.NUMBER,
        description: 'تعداد دارو برای افزودن.',
      },
      bonus: {
        type: Type.NUMBER,
        description: 'تعداد بونس (اختیاری).',
      },
      price: {
        type: Type.NUMBER,
        description: 'قیمت فروش نهایی برای هر واحد از دارو (اختیاری).',
      },
      discount: {
        type: Type.NUMBER,
        description: 'درصد تخفیف برای اعمال روی دارو (اختیاری).',
      },
    },
    required: ['drugName', 'quantity'],
  },
};

export const setPaymentAmountDeclaration: FunctionDeclaration = {
    name: 'setPaymentAmount',
    parameters: {
        type: Type.OBJECT,
        description: 'مبلغ پرداخت شده برای سفارش فعلی را ثبت می‌کند.',
        properties: {
            amount: { type: Type.NUMBER, description: 'مبلغ پرداخت شده.' },
        },
        required: ['amount'],
    },
};

export const saveOrderDeclaration: FunctionDeclaration = {
    name: 'saveOrder',
    parameters: {
        type: Type.OBJECT,
        description: 'سفارش فروش فعلی را ذخیره و نهایی می‌کند.',
        properties: {},
    },
};

export const removeOrderItemDeclaration: FunctionDeclaration = {
    name: 'removeOrderItem',
    parameters: {
        type: Type.OBJECT,
        description: 'یک قلم دارو را از سفارش فعلی حذف می‌کند.',
        properties: {
            drugName: { type: Type.STRING, description: 'نام دارویی که باید حذف شود.' },
        },
        required: ['drugName'],
    },
};

export const editOrderItemQuantityDeclaration: FunctionDeclaration = {
    name: 'editOrderItemQuantity',
    parameters: {
        type: Type.OBJECT,
        description: 'تعداد یک قلم دارو در سفارش فعلی را ویرایش می‌کند.',
        properties: {
            drugName: { type: Type.STRING, description: 'نام دارویی که باید ویرایش شود.' },
            newQuantity: { type: Type.NUMBER, description: 'تعداد جدید.' },
        },
        required: ['drugName', 'newQuantity'],
    },
};

export const queryStockLevelDeclaration: FunctionDeclaration = {
    name: 'queryStockLevel',
    parameters: {
        type: Type.OBJECT,
        description: 'موجودی یک داروی خاص در انبار فروش را استعلام می‌کند.',
        properties: {
            drugName: { type: Type.STRING, description: 'نام داروی مورد نظر.' },
        },
        required: ['drugName'],
    },
};

export const queryCustomerBalanceDeclaration: FunctionDeclaration = {
    name: 'queryCustomerBalance',
    parameters: {
        type: Type.OBJECT,
        description: 'مانده حساب یک مشتری خاص را استعلام می‌کند.',
        properties: {
            customerName: { type: Type.STRING, description: 'نام مشتری مورد نظر.' },
        },
        required: ['customerName'],
    },
};

export const queryPurchaseHistoryDeclaration: FunctionDeclaration = {
    name: 'queryPurchaseHistory',
    parameters: {
        type: Type.OBJECT,
        description: 'آخرین قیمت فروش و تخفیف یک داروی خاص به یک مشتری خاص را استعلام می‌کند.',
        properties: {
            drugName: { type: Type.STRING, description: 'نام داروی مورد نظر.' },
            customerName: { type: Type.STRING, description: 'نام مشتری مورد نظر.' },
        },
        required: ['drugName', 'customerName'],
    },
};

export const addExtraChargeDeclaration: FunctionDeclaration = {
    name: 'addExtraCharge',
    parameters: {
        type: Type.OBJECT,
        description: 'یک هزینه اضافی مانند کرایه حمل را به فاکتور اضافه می‌کند.',
        properties: {
            description: { type: Type.STRING, description: 'شرح هزینه.' },
            amount: { type: Type.NUMBER, description: 'مبلغ هزینه.' },
        },
        required: ['description', 'amount'],
    },
};

export const saveAndPrintOrderDeclaration: FunctionDeclaration = {
    name: 'saveAndPrintOrder',
    parameters: {
        type: Type.OBJECT,
        description: 'سفارش فروش فعلی را ذخیره کرده و بلافاصله پنجره چاپ را باز می‌کند.',
        properties: {},
    },
};

export const startNewPurchaseBillDeclaration: FunctionDeclaration = {
    name: 'startNewPurchaseBill',
    parameters: {
        type: Type.OBJECT,
        description: 'یک فرآیند جدید برای ثبت فاکتور خرید را آغاز می‌کند.',
        properties: {},
    },
};

export const setPurchaseSupplierDeclaration: FunctionDeclaration = {
    name: 'setPurchaseSupplier',
    parameters: {
        type: Type.OBJECT,
        description: 'تامین کننده (شرکت) را برای فاکتور خرید فعلی تنظیم می‌کند.',
        properties: {
            supplierName: { type: Type.STRING, description: 'نام شرکت تامین کننده.' },
            billNumber: { type: Type.STRING, description: 'شماره فاکتور خرید (اختیاری).' },
        },
        required: ['supplierName'],
    },
};

export const addPurchaseItemDeclaration: FunctionDeclaration = {
    name: 'addPurchaseItem',
    parameters: {
        type: Type.OBJECT,
        description: 'یک قلم دارو را به فاکتور خرید فعلی اضافه می‌کند.',
        properties: {
            drugName: { type: Type.STRING, description: 'نام دارو.' },
            lotNumber: { type: Type.STRING, description: 'شماره لات دارو.' },
            expiryDate: { type: Type.STRING, description: 'تاریخ انقضا به فرمت "ماه/سال" (مثال: "12/2028").' },
            quantity: { type: Type.NUMBER, description: 'تعداد خریداری شده.' },
            bonus: { type: Type.NUMBER, description: 'تعداد بونس (اختیاری).' },
            price: { type: Type.NUMBER, description: 'قیمت خرید هر واحد.' },
        },
        required: ['drugName', 'lotNumber', 'expiryDate', 'quantity', 'price'],
    },
};

export const savePurchaseBillDeclaration: FunctionDeclaration = {
    name: 'savePurchaseBill',
    parameters: {
        type: Type.OBJECT,
        description: 'فاکتور خرید فعلی را ذخیره می‌کند.',
        properties: {},
    },
};

export const createStockRequisitionDeclaration: FunctionDeclaration = {
    name: 'createStockRequisition',
    parameters: {
        type: Type.OBJECT,
        description: 'یک درخواست کالا از انبار اصلی ایجاد می‌کند.',
        properties: {
            items: {
                type: Type.ARRAY,
                description: 'لیستی از اقلام درخواستی.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        drugName: { type: Type.STRING, description: 'نام دارو.' },
                        quantity: { type: Type.NUMBER, description: 'تعداد درخواستی.' },
                    },
                    required: ['drugName', 'quantity'],
                },
            },
        },
        required: ['items'],
    },
};

export const listInventoryItemsDeclaration: FunctionDeclaration = {
  name: 'listInventoryItems',
  parameters: {
    type: Type.OBJECT,
    description: 'لیست کردن داروهای موجود در انبار. اگر انبار مشخص نشود، انبار فروش را لیست می‌کند.',
    properties: {
      warehouse: {
        type: Type.STRING,
        description: 'انباری که باید لیست شود. می‌تواند «فروش» یا «اصلی» باشد.',
        enum: ['فروش', 'اصلی'],
      },
    },
    required: [],
  },
};


export const allFunctionDeclarations = [
    // Sales
    navigateToDeclaration, 
    startNewSaleDeclaration, 
    setSaleCustomerDeclaration, 
    addOrderItemDeclaration,
    setPaymentAmountDeclaration,
    saveOrderDeclaration,
    removeOrderItemDeclaration,
    editOrderItemQuantityDeclaration,
    addExtraChargeDeclaration,
    saveAndPrintOrderDeclaration,
    // Queries
    queryStockLevelDeclaration,
    queryCustomerBalanceDeclaration,
    queryPurchaseHistoryDeclaration,
    // Purchasing
    startNewPurchaseBillDeclaration,
    setPurchaseSupplierDeclaration,
    addPurchaseItemDeclaration,
    savePurchaseBillDeclaration,
    // Inventory
    createStockRequisitionDeclaration,
    listInventoryItemsDeclaration,
];