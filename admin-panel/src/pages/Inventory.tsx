import { useMemo, useState } from 'react';
import { ArrowRightLeft, Download, Package, Plus, Search, X } from 'lucide-react';
import { useAppStore, useCurrentSpa } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import { SpaWorkspaceFallback } from '../components/SpaWorkspaceFallback';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export const Inventory = () => {
  const spa = useCurrentSpa();
  const products = useAppStore((state) => state.products);
  const suppliers = useAppStore((state) => state.suppliers);
  const purchaseOrders = useAppStore((state) => state.purchaseOrders);
  const addProduct = useAppStore((state) => state.addProduct);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  const addSupplier = useAppStore((state) => state.addSupplier);
  const addPurchaseOrder = useAppStore((state) => state.addPurchaseOrder);

  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SUPPLIERS' | 'PURCHASES'>('PRODUCTS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productForm, setProductForm] = useState({ name: '', sku: '', stock: 0, price: 0, barcode: '' });
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    itemCount: 1,
    totalAmount: 0,
    status: 'PENDING' as 'PENDING' | 'RECEIVED' | 'CANCELLED',
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    stock: 0,
    price: 0,
  });

  const spaId = spa?.id ?? '';
  const spaProducts = useMemo(() => products.filter((item) => item.spaId === spaId), [products, spaId]);
  const spaSuppliers = useMemo(() => suppliers.filter((item) => item.spaId === spaId), [suppliers, spaId]);
  const spaPurchaseOrders = useMemo(
    () => purchaseOrders.filter((item) => item.spaId === spaId),
    [purchaseOrders, spaId],
  );

  const filteredProducts = useMemo(
    () =>
      spaProducts.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.barcode.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStock =
          stockFilter === 'ALL' ||
          (stockFilter === 'IN_STOCK' && item.stock > 10) ||
          (stockFilter === 'LOW_STOCK' && item.stock > 0 && item.stock <= 10) ||
          (stockFilter === 'OUT_OF_STOCK' && item.stock === 0);

        return matchesSearch && matchesStock;
      }),
    [searchTerm, spaProducts, stockFilter],
  );

  const filteredSuppliers = useMemo(
    () =>
      spaSuppliers.filter((item) =>
        `${item.name} ${item.contactPerson} ${item.email}`.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm, spaSuppliers],
  );

  const filteredPurchases = useMemo(
    () =>
      spaPurchaseOrders.filter((item) =>
        `${item.supplierName} ${item.status}`.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm, spaPurchaseOrders],
  );

  const inventorySummary = useMemo(
    () => ({
      totalProducts: spaProducts.length,
      lowStock: spaProducts.filter((item) => item.stock > 0 && item.stock <= 10).length,
      outOfStock: spaProducts.filter((item) => item.stock === 0).length,
      stockValue: spaProducts.reduce((sum, item) => sum + item.stock * item.price, 0),
    }),
    [spaProducts],
  );

  const openAdjustmentModal = (productId: string) => {
    const product = spaProducts.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    setAdjustmentForm({
      productId: product.id,
      stock: product.stock,
      price: product.price,
    });
    setSelectedProductId(product.id);
    setIsAdjustModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeTab === 'PRODUCTS') {
      addProduct(productForm);
      setProductForm({ name: '', sku: '', stock: 0, price: 0, barcode: '' });
    }

    if (activeTab === 'SUPPLIERS') {
      addSupplier(supplierForm);
      setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '' });
    }

    if (activeTab === 'PURCHASES') {
      const supplier = spaSuppliers.find((item) => item.id === purchaseForm.supplierId);
      if (!supplier) {
        return;
      }

      addPurchaseOrder({
        supplierId: supplier.id,
        supplierName: supplier.name,
        itemCount: purchaseForm.itemCount,
        totalAmount: purchaseForm.totalAmount,
        status: purchaseForm.status,
      });
      setPurchaseForm({ supplierId: spaSuppliers[0]?.id ?? '', itemCount: 1, totalAmount: 0, status: 'PENDING' });
    }

    setIsModalOpen(false);
  };

  const handleAdjustmentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProduct(adjustmentForm.productId, {
      stock: Number(adjustmentForm.stock),
      price: Number(adjustmentForm.price),
    });
    setIsAdjustModalOpen(false);
  };

  const exportProductsCsv = () => {
    const rows = [
      ['Name', 'SKU', 'Barcode', 'Stock', 'Price'],
      ...filteredProducts.map((item) => [
        item.name,
        item.sku,
        item.barcode,
        String(item.stock),
        item.price.toFixed(2),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-${spa?.name.toLowerCase().replace(/\s+/g, '-') ?? 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!spa) {
    return <SpaWorkspaceFallback title="Inventory unavailable" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Manage stock, suppliers, and purchase orders.</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'PRODUCTS' && (
            <>
              <button
                type="button"
                onClick={exportProductsCsv}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              <button
                type="button"
                onClick={() => selectedProductId && openAdjustmentModal(selectedProductId)}
                disabled={!selectedProductId}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4" /> Adjust Stock
              </button>
            </>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> Add {activeTab === 'PRODUCTS' ? 'Item' : activeTab === 'SUPPLIERS' ? 'Supplier' : 'Purchase'}
          </button>
        </div>
      </div>

      {activeTab === 'PRODUCTS' && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Total Products</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{inventorySummary.totalProducts}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Low Stock</div>
            <div className="mt-2 text-2xl font-bold text-amber-700">{inventorySummary.lowStock}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Out of Stock</div>
            <div className="mt-2 text-2xl font-bold text-red-700">{inventorySummary.outOfStock}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Inventory Value</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(inventorySummary.stockValue)}</div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex border-b border-gray-200 bg-gray-50/50 p-2 gap-2">
          <button onClick={() => setActiveTab('PRODUCTS')} className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'PRODUCTS' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>Products Stock</button>
          <button onClick={() => setActiveTab('SUPPLIERS')} className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'SUPPLIERS' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>Suppliers</button>
          <button onClick={() => setActiveTab('PURCHASES')} className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'PURCHASES' ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>Purchase Orders</button>
        </div>

        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'PRODUCTS' && (
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value as StockFilter)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">All Stock</option>
                <option value="IN_STOCK">Healthy Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            )}
            {activeTab !== 'PRODUCTS' && (
              <div className="text-sm text-gray-500">
                {activeTab === 'SUPPLIERS' ? `${filteredSuppliers.length} supplier(s)` : `${filteredPurchases.length} purchase(s)`}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'PRODUCTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">SKU</th>
                  <th className="p-4 font-semibold">Barcode</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-gray-50/50 ${selectedProductId === item.id ? 'bg-primary-50/40' : ''}`}
                    onClick={() => setSelectedProductId(item.id)}
                  >
                    <td className="p-4 font-medium text-gray-900">{item.name}</td>
                    <td className="p-4 text-gray-500 text-sm">{item.sku}</td>
                    <td className="p-4 text-gray-500 text-sm">{item.barcode || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.stock === 0
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : item.stock <= 10
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {item.stock} in stock
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{formatCurrency(item.price)}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openAdjustmentModal(item.id);
                          }}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteProduct(item.id);
                            if (selectedProductId === item.id) {
                              setSelectedProductId('');
                            }
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'SUPPLIERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Supplier</th>
                  <th className="p-4 font-semibold">Contact Person</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuppliers.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{item.name}</td>
                    <td className="p-4 text-gray-600">{item.contactPerson}</td>
                    <td className="p-4 text-gray-500 text-sm">{item.email}</td>
                    <td className="p-4 text-gray-500 text-sm">{item.phone}</td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">No suppliers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'PURCHASES' && (
          filteredPurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Supplier</th>
                    <th className="p-4 font-semibold">Items</th>
                    <th className="p-4 font-semibold">Amount</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPurchases.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{item.supplierName}</td>
                      <td className="p-4 text-gray-600">{item.itemCount}</td>
                      <td className="p-4 font-medium text-gray-900">{formatCurrency(item.totalAmount)}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.status === 'RECEIVED'
                            ? 'bg-green-50 text-green-700'
                            : item.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <Package className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-900">No data found</p>
              <p className="text-sm">Start by adding purchases to your inventory.</p>
            </div>
          )
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">{activeTab === 'PRODUCTS' ? 'Add New Product' : activeTab === 'SUPPLIERS' ? 'Add Supplier' : 'Add Purchase Order'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'PRODUCTS' && (
                  <>
                    <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Product name" />
                    <input required type="text" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="SKU" />
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="number" min="0" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Initial stock" />
                      <input required type="number" step="0.01" min="0" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Price" />
                    </div>
                    <input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Barcode" />
                  </>
                )}
                {activeTab === 'SUPPLIERS' && (
                  <>
                    <input required type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Supplier name" />
                    <input required type="text" value={supplierForm.contactPerson} onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Contact person" />
                    <input required type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Email" />
                    <input required type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Phone" />
                    <textarea required rows={3} value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Address" />
                  </>
                )}
                {activeTab === 'PURCHASES' && (
                  <>
                    <select value={purchaseForm.supplierId} onChange={e => setPurchaseForm({...purchaseForm, supplierId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">Select supplier</option>
                      {spaSuppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="number" min="1" value={purchaseForm.itemCount} onChange={e => setPurchaseForm({...purchaseForm, itemCount: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Item count" />
                      <input required type="number" min="0" step="0.01" value={purchaseForm.totalAmount} onChange={e => setPurchaseForm({...purchaseForm, totalAmount: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Total amount" />
                    </div>
                    <select value={purchaseForm.status} onChange={e => setPurchaseForm({...purchaseForm, status: e.target.value as 'PENDING' | 'RECEIVED' | 'CANCELLED'})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="PENDING">Pending</option>
                      <option value="RECEIVED">Received</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </>
                )}
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Adjust Product Stock</h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
                <select
                  value={adjustmentForm.productId}
                  onChange={(event) => {
                    const product = spaProducts.find((item) => item.id === event.target.value);
                    if (!product) {
                      return;
                    }
                    setAdjustmentForm({
                      productId: product.id,
                      stock: product.stock,
                      price: product.price,
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {spaProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">New Stock</label>
                    <input
                      required
                      min="0"
                      type="number"
                      value={adjustmentForm.stock}
                      onChange={(event) => setAdjustmentForm((current) => ({ ...current, stock: Number(event.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Unit Price</label>
                    <input
                      required
                      min="0"
                      step="0.01"
                      type="number"
                      value={adjustmentForm.price}
                      onChange={(event) => setAdjustmentForm((current) => ({ ...current, price: Number(event.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="rounded-lg px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700">
                    Save Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
