// FIX: Corrected type imports to point to their original source files.
import type { Drug } from './Inventory';
import type { Customer } from './Customers';
import type { Order, OrderItem } from './Sales';
import type { StockRequisitionItem } from './App';
import type { AlertSettings } from './Alerts';

// Define a context type for the handlers
export type HandlerContext = {
    dispatchUiAction: (action: any) => void;
    drugs: Drug[];
    customers: Customer[];
    customerBalances: Map<string, number>;
    orders: Order[];
    onSaveRequisition: (req: any) => void;
    alertSettings: AlertSettings;
    mainWarehouseDrugs: Drug[];
    activeItem: string;
    onNavigate: (page: string) => void;
    setIsAssistantOpen: (isOpen: boolean) => void;
};


// --- NEW: Smart Normalization Function ---
/**
 * Normalizes a drug name for robust, non-literal searching using a "skeleton" approach.
 * - Transliterates Farsi to English phonemes.
 * - Normalizes similar-sounding English characters.
 * - Removes all vowels to create a consonant skeleton.
 * - De-duplicates consecutive characters.
 * @param name The drug name string to normalize.
 * @returns A normalized, skeletonized string suitable for robust searching.
 */
const normalizeDrugName = (name: string): string => {
    if (!name) return '';

    // 1. Basic cleanup and Farsi-to-English transliteration
    const farsiToEnglishMap: { [key: string]: string } = {
        'ا': 'a', 'آ': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
        'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
        'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
        'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
        'ق': 'q', 'ک': 'k', 'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'و': 'o', 'ه': 'h', 'ی': 'i', 'ي': 'i', // Changed و to o, ی to i for better vowel removal
    };
    
    let normalized = name.toLowerCase().replace(/\s+/g, '');
    for (const farsiChar in farsiToEnglishMap) {
        normalized = normalized.replace(new RegExp(farsiChar, 'g'), farsiToEnglishMap[farsiChar]);
    }
    
    // 2. Normalize common English character variations
    normalized = normalized.replace(/c/g, 's').replace(/ph/g, 'f');

    // 3. Create skeleton: remove all vowels (the core of the robust matching)
    normalized = normalized.replace(/[aeiou]/g, '');
    
    // 4. De-duplicate consecutive characters (e.g., 'ss' -> 's')
    normalized = normalized.replace(/(.)\1+/g, '$1');

    return normalized;
};


// --- Handler Functions ---

const handleNavigateTo = (args: any, context: HandlerContext): string => {
    if (args.page) {
        context.onNavigate(args.page as string);
        context.setIsAssistantOpen(false);
        return 'باشه، به بخش مربوطه می‌روم.';
    }
    return 'متوجه نشدم به کدام صفحه بروم.';
};

const handleStartNewSale = (args: any, context: HandlerContext): string => {
    if (context.activeItem !== 'sales') context.onNavigate('sales');
    context.dispatchUiAction({ type: 'START_NEW_SALE' });
    return 'بسیار خب، یک فاکتور فروش جدید باز کردم. برای کدام مشتری ثبت کنم؟';
};

const handleSetSaleCustomer = (args: any, context: HandlerContext): string => {
    if (!args.customerName) return 'نام مشتری را مشخص نکردید.';
    const customerExists = context.customers.some(c => c.name.toLowerCase() === args.customerName.toLowerCase());
    if (customerExists) {
        context.dispatchUiAction({ type: 'SET_CUSTOMER', payload: { customerName: args.customerName } });
        return `مشتری ثبت شده «${args.customerName}» انتخاب شد. چه اقلامی به فاکتور اضافه کنم؟`;
    } else {
        context.dispatchUiAction({ type: 'SET_TEMPORARY_CUSTOMER', payload: { customerName: args.customerName } });
        return `مشتری «${args.customerName}» در لیست نبود، اما به صورت موقت برای این فاکتور ثبت شد. چه اقلامی اضافه کنم؟`;
    }
};

const handleAddOrderItem = (args: any, context: HandlerContext): string => {
    if (!args.drugName || args.quantity === undefined) return 'نام دارو و تعداد آن را مشخص نکردید.';

    const searchTerm = normalizeDrugName(args.drugName);
    if (!searchTerm) {
        return `نام داروی معتبری برای جستجو ارائه نشده است.`;
    }

    // 1. Search in Sales Warehouse first
    const matchingSalesDrugs = context.drugs.filter(d =>
        normalizeDrugName(d.name).includes(searchTerm)
    );

    if (matchingSalesDrugs.length > 0) {
        if (matchingSalesDrugs.length > 1) {
            return `MULTIPLE_MATCHES_FOUND: ${matchingSalesDrugs.map(d => d.name).join(', ')}`;
        }

        const drug = matchingSalesDrugs[0];
        const totalStock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
        const quantityNeeded = (args.quantity || 0) + (args.bonus || 0);

        if (totalStock < quantityNeeded) {
            return `موجودی «${drug.name}» (${totalStock}) برای فروش (${quantityNeeded}) کافی نیست.`;
        }

        context.dispatchUiAction({ type: 'ADD_ORDER_ITEM', payload: { ...args, drugName: drug.name } });
        let result = `آیتم «${drug.name}» اضافه شد.`;

        const { alertSettings } = context;
        if (alertSettings.lowStock.enabled && (totalStock - quantityNeeded) < alertSettings.lowStock.quantity) {
            result += ` هشدار: موجودی این کالا به کمتر از ${alertSettings.lowStock.quantity} عدد رسید.`;
        }
        const expiryLimitDate = new Date();
        expiryLimitDate.setMonth(expiryLimitDate.getMonth() + alertSettings.expiry.months);
        const hasNearExpiryBatch = drug.batches.some(b => b.quantity > 0 && new Date(b.expiryDate) < expiryLimitDate);
        if (alertSettings.expiry.enabled && hasNearExpiryBatch) {
            result += ` هشدار: این کالا دارای بچ نزدیک به انقضا است.`;
        }
        return result;
    } 
    // 2. If not found in sales, search in Main Warehouse
    else if (context.mainWarehouseDrugs.some(d => normalizeDrugName(d.name).includes(searchTerm))) {
        const matchingMainDrugs = context.mainWarehouseDrugs.filter(d =>
            normalizeDrugName(d.name).includes(searchTerm)
        );
        
        if (matchingMainDrugs.length > 1) {
             return `MULTIPLE_MATCHES_FOUND: ${matchingMainDrugs.map(d => d.name).join(', ')}`;
        }
        const drug = matchingMainDrugs[0];
        return `داروی «${drug.name}» در انبار فروش موجود نیست، اما در انبار اصلی پیدا شد. برای فروش، ابتدا باید از انبار اصلی درخواست داده شود.`;
    } 
    // 3. If not found anywhere
    else {
        return `داروی «${args.drugName}» در هیچکدام از انبارها یافت نشد.`;
    }
};


const handleSetPaymentAmount = (args: any, context: HandlerContext): string => {
    if (args.amount !== undefined) {
        context.dispatchUiAction({ type: 'SET_PAYMENT_AMOUNT', payload: { amount: args.amount } });
        return `مبلغ پرداختی ${args.amount} ثبت شد.`;
    }
    return 'مبلغ پرداختی مشخص نشد.';
};

const handleSaveOrder = (args: any, context: HandlerContext): string => {
    context.dispatchUiAction({ type: 'SAVE_ORDER' });
    return 'سفارش ذخیره شد.';
};

const handleSaveAndPrintOrder = (args: any, context: HandlerContext): string => {
    context.dispatchUiAction({ type: 'SAVE_AND_PRINT_ORDER' });
    return 'سفارش ذخیره و برای چاپ آماده شد.';
};

const handleAddExtraCharge = (args: any, context: HandlerContext): string => {
    if (args.description && args.amount) {
        context.dispatchUiAction({ type: 'ADD_EXTRA_CHARGE', payload: { ...args } });
        return `هزینه «${args.description}» به مبلغ ${args.amount} اضافه شد.`;
    }
    return 'شرح و مبلغ هزینه مشخص نشد.';
};

const handleRemoveOrderItem = (args: any, context: HandlerContext): string => {
    if (args.drugName) {
        context.dispatchUiAction({ type: 'REMOVE_ORDER_ITEM', payload: { drugName: args.drugName } });
        return `آیتم «${args.drugName}» حذف شد.`;
    }
    return 'نام داروی مورد نظر برای حذف مشخص نشد.';
};

const handleEditOrderItemQuantity = (args: any, context: HandlerContext): string => {
    if (args.drugName && args.newQuantity !== undefined) {
        context.dispatchUiAction({ type: 'EDIT_ORDER_ITEM_QUANTITY', payload: { drugName: args.drugName, newQuantity: args.newQuantity } });
        return `تعداد «${args.drugName}» به ${args.newQuantity} تغییر کرد.`;
    }
    return 'نام دارو و تعداد جدید مشخص نشد.';
};

const handleStartNewPurchaseBill = (args: any, context: HandlerContext): string => {
    if (context.activeItem !== 'purchasing') context.onNavigate('purchasing');
    context.dispatchUiAction({ type: 'START_NEW_PURCHASE_BILL' });
    return 'بسیار خب، یک فاکتور خرید جدید باز کردم. از کدام شرکت خریداری شده؟';
};

const handleSetPurchaseSupplier = (args: any, context: HandlerContext): string => {
    if (args.supplierName) {
        context.dispatchUiAction({ type: 'SET_PURCHASE_SUPPLIER', payload: { ...args } });
        return `شرکت «${args.supplierName}» انتخاب شد. چه اقلامی به فاکتور اضافه کنم؟`;
    }
    return 'نام شرکت تامین کننده مشخص نشد.';
};

const handleAddPurchaseItem = (args: any, context: HandlerContext): string => {
    const { drugs, mainWarehouseDrugs, dispatchUiAction } = context;
    if (args.drugName) {
        const drugExists = [...drugs, ...mainWarehouseDrugs].some(d => d.name.toLowerCase().includes(args.drugName.toLowerCase()));
        if (!drugExists) {
            return `داروی «${args.drugName}» در سیستم تعریف نشده است.`;
        }
        dispatchUiAction({ type: 'ADD_PURCHASE_ITEM', payload: { ...args } });
        return `آیتم «${args.drugName}» به فاکتور خرید اضافه شد.`;
    }
    return 'اطلاعات قلم خرید ناقص است.';
};

const handleSavePurchaseBill = (args: any, context: HandlerContext): string => {
    context.dispatchUiAction({ type: 'SAVE_PURCHASE_BILL' });
    return 'فاکتور خرید ذخیره شد.';
};

const handleCreateStockRequisition = (args: any, context: HandlerContext): string => {
    if (!args.items || args.items.length === 0) return 'هیچ آیتمی برای درخواست مشخص نشده است.';
    
    const { mainWarehouseDrugs, onSaveRequisition } = context;
    const requisitionItems: StockRequisitionItem[] = [];
    let allItemsFound = true;
    let result = '';

    for (const item of args.items) {
        const searchTerm = normalizeDrugName(item.drugName);
        const drug = mainWarehouseDrugs.find(d => normalizeDrugName(d.name).includes(searchTerm));
        if (drug) {
            requisitionItems.push({ drugId: drug.id, drugName: drug.name, quantityRequested: item.quantity, quantityFulfilled: 0 });
        } else {
            result = `داروی «${item.drugName}» در انبار اصلی یافت نشد.`;
            allItemsFound = false;
            break;
        }
    }

    if (allItemsFound) {
        onSaveRequisition({ items: requisitionItems, notes: 'ایجاد شده توسط دستیار صوتی' });
        result = `درخواست کالا با ${requisitionItems.length} قلم با موفقیت ثبت شد.`;
    }
    return result;
};

const handleQueryStockLevel = (args: any, context: HandlerContext): string => {
    if (!args.drugName) return 'نام دارو مشخص نشده است.';
    
    const searchTerm = normalizeDrugName(args.drugName);
    if (!searchTerm) return 'نام داروی معتبری برای جستجو ارائه نشده است.';

    // Search in sales warehouse
    const matchingSalesDrugs = context.drugs.filter(d => normalizeDrugName(d.name).includes(searchTerm));
    
    if (matchingSalesDrugs.length > 1) {
        return `MULTIPLE_MATCHES_FOUND: ${matchingSalesDrugs.map(d => d.name).join(', ')}`;
    }
    
    if (matchingSalesDrugs.length === 1) {
        const drug = matchingSalesDrugs[0];
        const stock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
        return `در حال حاضر ${stock} عدد از داروی «${drug.name}» در انبار فروش موجود است.`;
    }

    // Search in main warehouse
    const matchingMainDrugs = context.mainWarehouseDrugs.filter(d => normalizeDrugName(d.name).includes(searchTerm));
    
    if (matchingMainDrugs.length > 0) {
        const drug = matchingMainDrugs[0]; // Just pick the first for the info message
        const stock = drug.batches.reduce((sum, b) => sum + b.quantity, 0);
        return `این دارو در انبار فروش موجود نیست، اما ${stock} عدد از «${drug.name}» در انبار اصلی موجود است.`;
    }

    return `متاسفانه داروی «${args.drugName}» در هیچکدام از انبارها یافت نشد.`;
};

const handleQueryCustomerBalance = (args: any, context: HandlerContext): string => {
    if (!args.customerName) return 'نام مشتری مشخص نشده است.';
    const customer = context.customers.find(c => c.name.toLowerCase().includes(args.customerName.toLowerCase()));
    if (customer) {
        const balance = context.customerBalances.get(customer.name);
        if (balance !== undefined) {
            if (balance > 0) return `مشتری ${customer.name} در حال حاضر ${Math.round(balance).toLocaleString()} افغانی بدهکار است.`;
            if (balance < 0) return `مشتری ${customer.name} در حال حاضر ${Math.round(Math.abs(balance)).toLocaleString()} افغانی بستانکار است.`;
            return `حساب مشتری ${customer.name} تسویه شده است.`;
        }
        return `برای مشتری ${customer.name} هیچ حساب مالی ثبت نشده است.`;
    }
    return 'مشتری با این نام یافت نشد.';
};

const handleQueryPurchaseHistory = (args: any, context: HandlerContext): string => {
    if (!args.drugName || !args.customerName) return 'نام دارو و مشتری مشخص نشده است.';
    
    const customerOrders = context.orders
        .filter(o => o.customerName.toLowerCase().includes(args.customerName.toLowerCase()))
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        
    let lastPurchase: OrderItem | null = null;
    for (const order of customerOrders) {
        const searchTerm = normalizeDrugName(args.drugName);
        const foundItem = order.items.find(i => normalizeDrugName(i.drugName).includes(searchTerm));
        if (foundItem) {
            lastPurchase = foundItem;
            break;
        }
    }

    if (lastPurchase) {
        return `آخرین بار این دارو با قیمت نهایی ${Math.round(lastPurchase.finalPrice)} و تخفیف ${lastPurchase.discountPercentage}% فروخته شده است.`;
    }
    return 'سابقه خریدی برای این دارو از این مشتری یافت نشد.';
};

const handleListInventoryItems = (args: any, context: HandlerContext): string => {
    const warehouse = args.warehouse === 'اصلی' ? 'اصلی' : 'فروش';
    const drugList = warehouse === 'اصلی' ? context.mainWarehouseDrugs : context.drugs;

    const availableDrugs = drugList.filter(d => d.batches.reduce((sum, b) => sum + b.quantity, 0) > 0);

    if (availableDrugs.length === 0) {
        return `هیچ دارویی در انبار «${warehouse}» موجود نیست.`;
    }

    const itemsToList = availableDrugs.slice(0, 10);
    const drugNames = itemsToList.map(d => d.name).join('، ');
    
    let response = `بسیار خب. ${itemsToList.length} قلم اول موجود در انبار «${warehouse}» عبارتند از: ${drugNames}.`;
    
    if (availableDrugs.length > 10) {
        response += ' آیا می‌خواهید ادامه لیست را برایتان بخوانم؟';
    }

    return response;
};


// --- Handler Map ---

export const handlerMap: { [key: string]: (args: any, context: HandlerContext) => string } = {
    navigateTo: handleNavigateTo,
    startNewSale: handleStartNewSale,
    setSaleCustomer: handleSetSaleCustomer,
    addOrderItem: handleAddOrderItem,
    setPaymentAmount: handleSetPaymentAmount,
    saveOrder: handleSaveOrder,
    removeOrderItem: handleRemoveOrderItem,
    editOrderItemQuantity: handleEditOrderItemQuantity,
    addExtraCharge: handleAddExtraCharge,
    saveAndPrintOrder: handleSaveAndPrintOrder,
    queryStockLevel: handleQueryStockLevel,
    queryCustomerBalance: handleQueryCustomerBalance,
    queryPurchaseHistory: handleQueryPurchaseHistory,
    startNewPurchaseBill: handleStartNewPurchaseBill,
    setPurchaseSupplier: handleSetPurchaseSupplier,
    addPurchaseItem: handleAddPurchaseItem,
    savePurchaseBill: handleSavePurchaseBill,
    createStockRequisition: handleCreateStockRequisition,
    listInventoryItems: handleListInventoryItems,
};