import { useMemo, useState } from 'react';
import {
  Banknote,
  CreditCard,
  Minus,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { useAppStore, useCurrentSpa, type Combo, type ComboItem, type Product, type Service } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';

type POSCatalogTab = 'SERVICES' | 'PRODUCTS' | 'COMBOS';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'SERVICE' | 'PRODUCT' | 'COMBO';
}

interface ServiceFormState {
  name: string;
  duration: number;
  price: number;
}

interface ProductFormState {
  name: string;
  sku: string;
  barcode: string;
  stock: number;
  price: number;
}

interface ComboFormState {
  name: string;
  price: number;
  items: ComboItem[];
  customName: string;
  customPrice: number;
}

interface CatalogItemView {
  id: string;
  name: string;
  price: number;
  type: CartItem['type'];
  duration?: number;
  sku?: string;
  barcode?: string;
  stock?: number;
  raw: Service | Product | Combo;
}

const defaultServiceForm: ServiceFormState = {
  name: '',
  duration: 60,
  price: 0,
};

const defaultProductForm: ProductFormState = {
  name: '',
  sku: '',
  barcode: '',
  stock: 0,
  price: 0,
};

const defaultComboForm: ComboFormState = {
  name: '',
  price: 0,
  items: [],
  customName: '',
  customPrice: 0,
};

const buildComboItemId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? `combo-item-${crypto.randomUUID()}`
    : `combo-item-${Math.random().toString(36).slice(2, 10)}`;

export const POS = () => {
  const spa = useCurrentSpa();
  const products = useAppStore((state) => state.products);
  const services = useAppStore((state) => state.services);
  const combos = useAppStore((state) => state.combos);
  const customers = useAppStore((state) => state.customers);
  const createInvoice = useAppStore((state) => state.createInvoice);
  const invoices = useAppStore((state) => state.invoices);
  const addService = useAppStore((state) => state.addService);
  const updateService = useAppStore((state) => state.updateService);
  const deleteService = useAppStore((state) => state.deleteService);
  const addProduct = useAppStore((state) => state.addProduct);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  const addCombo = useAppStore((state) => state.addCombo);
  const updateCombo = useAppStore((state) => state.updateCombo);
  const deleteCombo = useAppStore((state) => state.deleteCombo);
  const [activeTab, setActiveTab] = useState<POSCatalogTab>('SERVICES');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'WALLET'>('CASH');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(defaultServiceForm);
  const [productForm, setProductForm] = useState<ProductFormState>(defaultProductForm);
  const [comboForm, setComboForm] = useState<ComboFormState>(defaultComboForm);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [recentInvoice, setRecentInvoice] = useState<any>(null);

  if (!spa) {
    return <SpaWorkspaceFallback title="POS unavailable" />;
  }

  const spaProducts = products.filter((item) => item.spaId === spa.id);
  const spaServices = services.filter((item) => item.spaId === spa.id);
  const spaCombos = combos.filter((item) => item.spaId === spa.id);
  const spaCustomers = customers.filter((customer) => customer.spaId === spa.id);

  const addToCart = (item: { id: string; name: string; price: number }, type: 'SERVICE' | 'PRODUCT' | 'COMBO') => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, type }];
    });
  };

  const addCustomItem = () => {
    setCart((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: 'Custom Item',
        price: 0,
        quantity: 1,
        type: 'SERVICE',
      },
    ]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const resetCatalogForm = (tab: POSCatalogTab) => {
    if (tab === 'SERVICES') {
      setServiceForm(defaultServiceForm);
      return;
    }

    if (tab === 'PRODUCTS') {
      setProductForm(defaultProductForm);
      return;
    }

    setComboForm(defaultComboForm);
  };

  const openCreateModal = () => {
    setEditingItemId(null);
    resetCatalogForm(activeTab);
    setIsCatalogModalOpen(true);
  };

  const addPresetItemToCombo = (item: Service | Product, sourceType: 'SERVICE' | 'PRODUCT') => {
    setComboForm((current) => {
      const existing = current.items.find(
        (comboItem) => comboItem.sourceType === sourceType && comboItem.sourceId === item.id,
      );

      if (existing) {
        return {
          ...current,
          items: current.items.map((comboItem) =>
            comboItem.id === existing.id ? { ...comboItem, quantity: comboItem.quantity + 1 } : comboItem,
          ),
        };
      }

      return {
        ...current,
        items: [
          ...current.items,
          {
            id: buildComboItemId(),
            sourceType,
            sourceId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            duration: sourceType === 'SERVICE' ? (item as Service).duration : undefined,
          },
        ],
      };
    });
  };

  const addCustomComboItem = () => {
    if (!comboForm.customName.trim()) {
      return;
    }

    setComboForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: buildComboItemId(),
          sourceType: 'CUSTOM',
          name: current.customName.trim(),
          price: Number(current.customPrice),
          quantity: 1,
        },
      ],
      customName: '',
      customPrice: 0,
    }));
  };

  const updateComboItem = (itemId: string, updates: Partial<ComboItem>) => {
    setComboForm((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    }));
  };

  const removeComboItem = (itemId: string) => {
    setComboForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  };

  const openEditModal = (item: Service | Product | Combo) => {
    setEditingItemId(item.id);

    if (activeTab === 'SERVICES') {
      const service = item as Service;
      setServiceForm({
        name: service.name,
        duration: service.duration,
        price: service.price,
      });
    } else if (activeTab === 'PRODUCTS') {
      const product = item as Product;
      setProductForm({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        stock: product.stock,
        price: product.price,
      });
    } else {
      const combo = item as Combo;
      setComboForm({
        name: combo.name,
        price: combo.price,
        items: (combo.items || []).map((comboItem) => ({ ...comboItem })),
        customName: '',
        customPrice: 0,
      });
    }

    setIsCatalogModalOpen(true);
  };

  const removeDeletedItemFromCart = (id: string, type: CartItem['type']) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.type === type)));
  };

  const handleDeleteCatalogItem = (item: Service | Product | Combo) => {
    const confirmed = window.confirm(`Delete "${item.name}" from ${activeTab.toLowerCase()}?`);
    if (!confirmed) {
      return;
    }

    if (activeTab === 'SERVICES') {
      deleteService(item.id);
      removeDeletedItemFromCart(item.id, 'SERVICE');
      return;
    }

    if (activeTab === 'PRODUCTS') {
      deleteProduct(item.id);
      removeDeletedItemFromCart(item.id, 'PRODUCT');
      return;
    }

    deleteCombo(item.id);
    removeDeletedItemFromCart(item.id, 'COMBO');
  };

  const handleCatalogSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeTab === 'SERVICES') {
      const payload = {
        name: serviceForm.name.trim(),
        duration: Number(serviceForm.duration),
        price: Number(serviceForm.price),
      };

      if (editingItemId) {
        updateService(editingItemId, payload);
      } else {
        addService(payload);
      }
    } else if (activeTab === 'PRODUCTS') {
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim(),
        barcode: productForm.barcode.trim(),
        stock: Number(productForm.stock),
        price: Number(productForm.price),
      };

      if (editingItemId) {
        updateProduct(editingItemId, payload);
      } else {
        addProduct(payload);
      }
    } else {
      if (comboForm.items.length === 0) {
        window.alert('Add at least one service, product, or custom item to the combo.');
        return;
      }

      const payload = {
        name: comboForm.name.trim(),
        price: Number(comboForm.price),
        items: comboForm.items.map((item) => ({
          ...item,
          name: item.name.trim(),
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),
      };

      if (editingItemId) {
        updateCombo(editingItemId, payload);
      } else {
        addCombo(payload);
      }
    }

    setIsCatalogModalOpen(false);
    setEditingItemId(null);
    resetCatalogForm(activeTab);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax - discount;

  const handleCheckout = () => {
    setShowPayment(true);
  };

  const handlePayment = () => {
    const selectedCustomer = spaCustomers.find((customer) => customer.id === selectedCustomerId);
    
    // Generate invoice data locally for preview and print
    const spaInvoicesCount = invoices.filter((invoice) => invoice.spaId === spa.id).length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(spaInvoicesCount).padStart(3, '0')}`;
    
    const invoiceData = {
      id: `invoice-${Math.random().toString(36).substring(2, 10)}`,
      spaId: spa.id,
      invoiceNumber,
      customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Walk-in Customer',
      customerId: selectedCustomer?.id,
      items: cart.map((item) => ({
        id: `${item.type}-${item.id}`,
        itemType: item.type,
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      })),
      subtotal,
      discount,
      taxAmount: tax,
      totalAmount: total,
      status: 'PAID' as const,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    createInvoice({
      customerId: invoiceData.customerId,
      customerName: invoiceData.customerName,
      items: invoiceData.items,
      subtotal: invoiceData.subtotal,
      discount: invoiceData.discount,
      taxAmount: invoiceData.taxAmount,
      totalAmount: invoiceData.totalAmount,
      status: invoiceData.status,
      paymentMethod: invoiceData.paymentMethod,
    });

    setRecentInvoice(invoiceData);
    setShowReceiptPreview(true);
    setCart([]);
    setShowPayment(false);
    setDiscount(0);
    setSelectedCustomerId('');
  };

  const handlePrint = (invoiceToPrint?: any) => {
    const target = invoiceToPrint || recentInvoice;
    if (!target) return;

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      alert('Please allow popups to print the receipt.');
      return;
    }

    const itemsHtml = target.items.map((item: any) => `
      <tr>
        <td style="padding: 4px 0; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${item.name}
        </td>
        <td style="padding: 4px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 4px 0; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 4px 0; text-align: right;">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join('');

    const formattedDate = new Date(target.createdAt || new Date()).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const discountRow = target.discount > 0 
      ? `<tr><td>Discount:</td><td class="right">-${formatCurrency(target.discount)}</td></tr>` 
      : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${target.invoiceNumber}</title>
          <style>
            @page {
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              margin: 0;
              padding: 10px;
              box-sizing: border-box;
              font-size: 11px;
              color: #000;
              background: #fff;
            }
            .center {
              text-align: center;
            }
            .right {
              text-align: right;
            }
            .bold {
              font-weight: bold;
            }
            .title {
              font-size: 14px;
              font-weight: bold;
              margin: 4px 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
            }
            .items-table th {
              border-bottom: 1px dashed #000;
              padding: 4px 0;
              font-weight: bold;
            }
            .totals-table {
              width: 100%;
              margin-top: 4px;
            }
            .totals-table td {
              padding: 2px 0;
            }
            .footer {
              margin-top: 15px;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="title">${spa.name}</div>
            <div>${spa.address || spa.settings?.address || ''}</div>
            <div>Ph: ${spa.phone || spa.settings?.phone || ''}</div>
            <div>Email: ${spa.email || spa.settings?.email || ''}</div>
          </div>
          
          <div class="divider"></div>
          
          <div><strong>Invoice:</strong> ${target.invoiceNumber}</div>
          <div><strong>Date:</strong> ${formattedDate}</div>
          <div><strong>Customer:</strong> ${target.customerName}</div>
          <div><strong>Payment:</strong> ${target.paymentMethod}</div>
          ${target.paymentMethod === 'UPI' ? `<div><strong>UPI Ref:</strong> UPI-${Math.floor(100000000000 + Math.random() * 900000000000)}</div>` : ''}
          
          <div class="divider"></div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">Item</th>
                <th style="text-align: center; width: 30px;">Qty</th>
                <th style="text-align: right; width: 60px;">Price</th>
                <th style="text-align: right; width: 60px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td class="right">${formatCurrency(target.subtotal)}</td>
            </tr>
            <tr>
              <td>Tax (18% GST):</td>
              <td class="right">${formatCurrency(target.taxAmount)}</td>
            </tr>
            ${discountRow}
            <tr class="bold" style="font-size: 13px;">
              <td style="padding-top: 6px;">Total:</td>
              <td class="right" style="padding-top: 6px;">${formatCurrency(target.totalAmount)}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="center footer">
            <div>Thank you for your visit!</div>
            <div>Please visit us again soon.</div>
            <div style="margin-top: 10px; font-size: 8px; color: #555;">Powered by SpaPOS</div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredItems = useMemo<CatalogItemView[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    if (activeTab === 'SERVICES') {
      return spaServices
        .filter((item) => item.name.toLowerCase().includes(query))
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          type: 'SERVICE' as const,
          duration: item.duration,
          raw: item,
        }));
    }

    if (activeTab === 'PRODUCTS') {
      return spaProducts
        .filter((item) => `${item.name} ${item.sku} ${item.barcode}`.toLowerCase().includes(query))
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          type: 'PRODUCT' as const,
          sku: item.sku,
          barcode: item.barcode,
          stock: item.stock,
          raw: item,
        }));
    }

    return spaCombos
      .filter((item) => item.name.toLowerCase().includes(query))
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        type: 'COMBO' as const,
        raw: item,
      }));
  }, [activeTab, searchQuery, spaCombos, spaProducts, spaServices]);

  const comboItemsTotal = comboForm.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const renderItems = () => {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if (item.type === 'PRODUCT' && (item.stock ?? 0) <= 0) {
                return;
              }
              addToCart(item, item.type);
            }}
            className={`rounded-xl border bg-white p-4 transition-all flex flex-col ${
              item.type === 'PRODUCT' && (item.stock ?? 0) <= 0
                ? 'cursor-not-allowed border-gray-200 opacity-70'
                : 'cursor-pointer border-gray-200 hover:border-primary-500 hover:shadow-md'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  {item.type === 'SERVICE' && <span className="font-semibold text-xs">{item.duration}m</span>}
                  {item.type === 'PRODUCT' && <ShoppingCart className="h-6 w-6" />}
                  {item.type === 'COMBO' && <Receipt className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-semibold text-gray-800 break-words" title={item.name}>{item.name}</h3>
                  <p className="mt-1 text-sm font-bold text-primary-600">{formatCurrency(item.price)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditModal(item.raw);
                  }}
                  className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteCatalogItem(item.raw);
                  }}
                  className="rounded-md p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-500 flex-1">
              {item.type === 'SERVICE' && <p>Duration: {item.duration} mins</p>}
              {item.type === 'PRODUCT' && <p>SKU: {item.sku || 'N/A'}</p>}
              {item.type === 'PRODUCT' && <p>Barcode: {item.barcode || 'N/A'}</p>}
              {item.type === 'PRODUCT' && (
                <p className={(item.stock ?? 0) <= 0 ? 'font-medium text-red-600' : ''}>Stock: {item.stock}</p>
              )}
              {item.type === 'COMBO' && <p>Includes {((item.raw as Combo).items || []).length} item(s)</p>}
              {item.type === 'COMBO' && ((item.raw as Combo).items || []).length > 0 && (
                <p className="line-clamp-2">
                  {((item.raw as Combo).items || [])
                    .map((comboItem) => `${comboItem.name} x${comboItem.quantity}`)
                    .join(', ')}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Tap card to add</span>
              {item.type === 'PRODUCT' && (item.stock ?? 0) <= 0 && (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                  Out of stock
                </span>
              )}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            No {activeTab.toLowerCase()} found. Create one to start billing from POS.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50 -m-8">
      {/* Main Content (Items) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items, scan barcode..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('SERVICES')}
                className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${activeTab === 'SERVICES' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'}`}
              >
                Services
              </button>
              <button
                onClick={() => setActiveTab('PRODUCTS')}
                className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${activeTab === 'PRODUCTS' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'}`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('COMBOS')}
                className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${activeTab === 'COMBOS' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'}`}
              >
                Combos
              </button>
              <button
                onClick={addCustomItem}
                className="px-4 py-1.5 rounded-md font-medium text-sm transition-colors text-gray-600 hover:text-primary-600 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Custom
              </button>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="mr-1 inline h-4 w-4" />
              Add {activeTab === 'SERVICES' ? 'Service' : activeTab === 'PRODUCTS' ? 'Product' : 'Combo'}
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div>
              <h2 className="font-semibold text-gray-800">
                {activeTab === 'SERVICES' ? 'Service' : activeTab === 'PRODUCTS' ? 'Product' : 'Combo'} Catalog
              </h2>
              <p className="text-sm text-gray-500">
                Manage items here and click any card to add it to the bill.
              </p>
            </div>
            <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              {filteredItems.length} items
            </div>
          </div>
          {renderItems()}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-10">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Bill
          </h2>
          <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {cart.length} Items
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateCartItem(item.id, { name: e.target.value })}
                    className="font-medium text-gray-800 text-sm bg-transparent border-b border-transparent focus:border-gray-300 hover:border-gray-200 outline-none w-full transition-colors"
                  />
                  <div className="text-xs text-gray-500 mt-1">{item.type}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateCartItem(item.id, { price: Number(e.target.value) })}
                      className="font-bold text-primary-600 bg-transparent border-b border-transparent focus:border-primary-300 hover:border-primary-200 outline-none w-20 transition-colors"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 mt-2 bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
              >
                <option value="">Walk-in Customer</option>
                {spaCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (18% GST)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20 p-1 text-right border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                  placeholder="Amount"
                />
              </div>
            </div>
            <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between font-bold text-lg text-gray-800">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            Checkout <Receipt className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Complete Payment</h2>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-1">Total Amount Due</p>
                <h1 className="text-4xl font-bold text-gray-900">{formatCurrency(total)}</h1>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-primary-200 text-gray-600'}`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="font-semibold text-sm">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'UPI' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-primary-200 text-gray-600'}`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="font-semibold text-sm">UPI</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-primary-200 text-gray-600'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="font-semibold text-sm">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'WALLET' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-primary-200 text-gray-600'}`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="font-semibold text-sm">Wallet</span>
                </button>
              </div>
 
              {paymentMethod === 'UPI' && (
                <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-center flex flex-col items-center">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Scan QR with GooglePay, PhonePe, or any UPI App</p>
                  <div className="w-36 h-36 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-1.5 shadow-sm">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=spa-${spa.id}@upi&pn=${encodeURIComponent(spa.name)}&am=${total}&cu=INR`)}`} 
                      alt="UPI QR Code" 
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-700 mt-2">Amount: {formatCurrency(total)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">UPI ID: spa-{spa.id}@upi</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2"
                >
                  <Printer className="w-5 h-5" /> Pay & Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceiptPreview && recentInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-8">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary-600" /> Receipt Preview
              </h2>
              <button onClick={() => setShowReceiptPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* The Thermal Roll Container */}
            <div className="p-6 overflow-y-auto bg-gray-100 flex-1 flex justify-center">
              <div 
                id="thermal-receipt-preview"
                className="bg-white w-[80mm] p-4 shadow-md font-mono text-[11px] text-black border border-gray-200 leading-tight relative"
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
              >
                <div className="text-center mb-4">
                  <div className="text-sm font-bold uppercase tracking-wider mb-1">{spa.name}</div>
                  <div className="text-[10px] text-gray-600 leading-normal">
                    <div>{spa.address || spa.settings?.address || ''}</div>
                    <div>Ph: {spa.phone || spa.settings?.phone || ''}</div>
                    <div>Email: {spa.email || spa.settings?.email || ''}</div>
                  </div>
                </div>
                
                <div className="border-t border-dashed border-black my-2"></div>
                
                <div className="space-y-1">
                  <div><span className="font-bold">Invoice:</span> {recentInvoice.invoiceNumber}</div>
                  <div><span className="font-bold">Date:</span> {new Date(recentInvoice.createdAt).toLocaleString()}</div>
                  <div><span className="font-bold">Customer:</span> {recentInvoice.customerName}</div>
                  <div><span className="font-bold">Payment:</span> {recentInvoice.paymentMethod}</div>
                  {recentInvoice.paymentMethod === 'UPI' && (
                    <div><span className="font-bold">UPI Ref:</span> UPI-{Math.floor(100000000000 + Math.random() * 900000000000)}</div>
                  )}
                </div>
                
                <div className="border-t border-dashed border-black my-2"></div>
                
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dashed border-black">
                      <th className="pb-1 font-bold">Item</th>
                      <th className="pb-1 font-bold text-center w-8">Qty</th>
                      <th className="pb-1 font-bold text-right w-14">Price</th>
                      <th className="pb-1 font-bold text-right w-14">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoice.items.map((item: any, idx: number) => (
                      <tr key={idx} className="align-top">
                        <td className="py-1 pr-1 break-words">{item.name}</td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-1 text-right">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="border-t border-dashed border-black my-2"></div>
                
                <div className="space-y-1 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(recentInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18% GST):</span>
                    <span>{formatCurrency(recentInvoice.taxAmount)}</span>
                  </div>
                  {recentInvoice.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(recentInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-gray-300">
                    <span>Total:</span>
                    <span>{formatCurrency(recentInvoice.totalAmount)}</span>
                  </div>
                </div>
                
                <div className="border-t border-dashed border-black my-4"></div>
                
                <div className="text-center text-[10px] text-gray-600 leading-normal space-y-1">
                  <div>Thank you for your visit!</div>
                  <div>Please visit us again.</div>
                  <div className="text-[8px] mt-2 text-gray-400">Powered by SpaPOS</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={() => handlePrint()}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold py-2.5 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItemId ? 'Edit' : 'Create'}{' '}
                {activeTab === 'SERVICES' ? 'Service' : activeTab === 'PRODUCTS' ? 'Product' : 'Combo'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsCatalogModalOpen(false);
                  setEditingItemId(null);
                }}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCatalogSubmit} className="flex flex-col overflow-hidden flex-1">
              <div className="space-y-4 p-6 overflow-y-auto flex-1">
                {activeTab === 'SERVICES' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Service Name</label>
                    <input
                      type="text"
                      required
                      value={serviceForm.name}
                      onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Duration (mins)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={serviceForm.duration}
                        onChange={(event) =>
                          setServiceForm((current) => ({ ...current, duration: Number(event.target.value) }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={serviceForm.price}
                        onChange={(event) =>
                          setServiceForm((current) => ({ ...current, price: Number(event.target.value) }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'PRODUCTS' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">SKU</label>
                      <input
                        type="text"
                        value={productForm.sku}
                        onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Barcode</label>
                      <input
                        type="text"
                        value={productForm.barcode}
                        onChange={(event) =>
                          setProductForm((current) => ({ ...current, barcode: event.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Stock</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={productForm.stock}
                        onChange={(event) => setProductForm((current) => ({ ...current, stock: Number(event.target.value) }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={productForm.price}
                        onChange={(event) => setProductForm((current) => ({ ...current, price: Number(event.target.value) }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'COMBOS' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Combo Name</label>
                    <input
                      type="text"
                      required
                      value={comboForm.name}
                      onChange={(event) => setComboForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Combo Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={comboForm.price}
                        onChange={(event) =>
                          setComboForm((current) => ({ ...current, price: Number(event.target.value) }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500"
                      />
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items Total</div>
                      <div className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(comboItemsTotal)}</div>
                      <div className="text-xs text-gray-500">{comboForm.items.length} item(s) in this combo</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200">
                    <div className="border-b border-gray-200 px-4 py-3">
                      <h3 className="font-semibold text-gray-800">Selected Combo Items</h3>
                      <p className="text-sm text-gray-500">
                        Edit the combo in one place by adjusting items, quantity, price, and custom lines here.
                      </p>
                    </div>
                    <div className="max-h-64 space-y-3 overflow-auto p-4">
                      {comboForm.items.length === 0 && (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                          Add services, products, or a custom item below to build the combo.
                        </div>
                      )}
                      {comboForm.items.map((comboItem) => (
                        <div key={comboItem.id} className="rounded-lg border border-gray-200 p-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                              {comboItem.sourceType}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeComboItem(comboItem.id)}
                              className="rounded-md p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.7fr_0.7fr]">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
                              {comboItem.sourceType === 'CUSTOM' ? (
                                <input
                                  type="text"
                                  value={comboItem.name}
                                  onChange={(event) => updateComboItem(comboItem.id, { name: event.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                                />
                              ) : (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                  {comboItem.name}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-500">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={comboItem.quantity}
                                onChange={(event) =>
                                  updateComboItem(comboItem.id, {
                                    quantity: Math.max(1, Number(event.target.value) || 1),
                                  })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-500">Price</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={comboItem.price}
                                onChange={(event) =>
                                  updateComboItem(comboItem.id, { price: Number(event.target.value) })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                              />
                            </div>
                          </div>
                          {comboItem.duration && (
                            <p className="mt-2 text-xs text-gray-500">Service duration: {comboItem.duration} mins</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-200">
                      <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-800">Add Services</h3>
                      </div>
                      <div className="max-h-56 space-y-2 overflow-auto p-3">
                        {spaServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => addPresetItemToCombo(service, 'SERVICE')}
                            className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left transition-colors hover:border-primary-400 hover:bg-primary-50"
                          >
                            <div>
                              <div className="font-medium text-gray-800">{service.name}</div>
                              <div className="text-xs text-gray-500">{service.duration} mins</div>
                            </div>
                            <div className="text-sm font-semibold text-primary-600">{formatCurrency(service.price)}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200">
                      <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-800">Add Products</h3>
                      </div>
                      <div className="max-h-56 space-y-2 overflow-auto p-3">
                        {spaProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            disabled={product.stock <= 0}
                            onClick={() => addPresetItemToCombo(product, 'PRODUCT')}
                            className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left transition-colors hover:border-primary-400 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <div>
                              <div className="font-medium text-gray-800">{product.name}</div>
                              <div className="text-xs text-gray-500">Stock: {product.stock}</div>
                            </div>
                            <div className="text-sm font-semibold text-primary-600">{formatCurrency(product.price)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-800">Add Custom Item</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_0.8fr_auto]">
                      <input
                        type="text"
                        value={comboForm.customName}
                        onChange={(event) =>
                          setComboForm((current) => ({ ...current, customName: event.target.value }))
                        }
                        placeholder="Custom item name"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={comboForm.customPrice}
                        onChange={(event) =>
                          setComboForm((current) => ({ ...current, customPrice: Number(event.target.value) }))
                        }
                        placeholder="Price"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={addCustomComboItem}
                        className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary/90"
                      >
                        Add Custom
                      </button>
                    </div>
                  </div>
                </>
              )}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCatalogModalOpen(false);
                    setEditingItemId(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  {editingItemId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
