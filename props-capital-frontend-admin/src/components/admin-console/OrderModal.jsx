import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";

export default function OrderModal({ order, mode, onClose, onSuccess, loading: orderLoading }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    orderId: '',
    email: '',
    totalAmount: 0,
    status: 'unpaid',
    items: [],
    brandId: null,
    cardHolderName: '',
    phone: '',
    paymentMessage: '',
    createdAt: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [showStatusWarning, setShowStatusWarning] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'package',
    id: '',
    name: '',
    price: '',
    quantity: 1,
    currency: '$',
    credits: '',
    unlimited: false
  });

  // Load brands for manual transaction mode and edit mode
  useEffect(() => {
    if (mode === 'create' || mode === 'edit') {
      loadBrands();
    }
  }, [mode]);

  useEffect(() => {
    if (order && mode !== 'create') {
      // Ensure brandId is properly converted to string for the select element
      const brandId = order.brand_id != null ? String(order.brand_id) : null;
      
      setFormData({
        orderId: order.order_id || '',
        email: order.email || '',
        totalAmount: order.total_amount || 0,
        status: order.payment_status || 'paid',
        items: order.items || [],
        brandId: brandId,
        cardHolderName: order.card_holder_name || '',
        phone: order.phone || '',
        paymentMessage: order.payment_message || '',
        createdAt: order.created_at ? order.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [order, mode]);

  // Calculate commission when brand or amount changes
  useEffect(() => {
    if (formData.brandId && formData.totalAmount) {
      const brand = brands.find(b => b.id === Number(formData.brandId));
      if (brand) {
        setSelectedBrand(brand);
        const rate = Number(brand.commission_rate || 10) / 100;
        const commission = Number(formData.totalAmount) * rate;
        setCalculatedCommission(commission);
      }
    } else {
      setSelectedBrand(null);
      setCalculatedCommission(0);
    }
  }, [formData.brandId, formData.totalAmount, brands]);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const data = await adminConsoleApi.brands.list({ page: '1', pageSize: '1000' });
      setBrands(data.brands || []);
    } catch (error) {
      console.error('Failed to load brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    const currentStatus = formData.status.toLowerCase();
    const newStatusLower = newStatus.toLowerCase();
    
    // Show warning if changing to refund or chargeback
    if ((newStatusLower === 'refund' || newStatusLower === 'chargeback') && 
        currentStatus !== 'refund' && currentStatus !== 'chargeback') {
      setShowStatusWarning(true);
      setFormData({ ...formData, status: newStatus });
    } else {
      setFormData({ ...formData, status: newStatus });
      setShowStatusWarning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'view') {
      onClose();
      return;
    }

    // Confirmation for refund/chargeback
    if (mode === 'edit' && (formData.status.toLowerCase() === 'refund' || formData.status.toLowerCase() === 'chargeback')) {
      const originalStatus = order?.payment_status?.toLowerCase() || '';
      if (originalStatus !== 'refund' && originalStatus !== 'chargeback') {
        if (!confirm(t("adminConsole.orderModal.statusChangeConfirm", {
              status: formData.status.toUpperCase(),
              defaultValue: "⚠️ WARNING: Changing status to {{status}} will:\n\n" +
                "• Revert any credits granted to the customer\n" +
                "• Revert any subscription/package granted\n" +
                "• Mark commission as cancelled\n\n" +
                "Are you sure you want to continue?",
            }))) {
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (mode === 'edit') {
        const payload = {
          email: formData.email.toLowerCase(),
          total_amount: Number(formData.totalAmount),
          payment_status: formData.status,
          items: formData.items,
          brand_id: formData.brandId || null
        };
        await adminConsoleApi.orders.update(formData.orderId, payload);
      } else if (mode === 'create') {
        // Manual transaction creation
        const payload = {
          email: formData.email.toLowerCase(),
          items: formData.items,
          total_amount: Number(formData.totalAmount),
          payment_status: formData.status,
          brand_id: formData.brandId ? Number(formData.brandId) : undefined,
          card_holder_name: formData.cardHolderName || undefined,
          phone: formData.phone || undefined,
          payment_message: formData.paymentMessage || undefined,
          created_at: formData.createdAt ? new Date(formData.createdAt).toISOString() : undefined
        };
        await adminConsoleApi.orders.createManual(payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save order:', error);
      alert(t("adminConsole.orderModal.saveErrorAlert", { message: error.message, defaultValue: "❌ Failed to save order: {{message}}" }));
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  const resetItemForm = () => {
    setNewItem({
      type: 'package',
      id: '',
      name: '',
      price: '',
      quantity: 1,
      currency: '$',
      credits: '',
      unlimited: false
    });
  };

  const handleAddItem = () => {
    // Validate
    if (!newItem.id || !newItem.name || !newItem.price) {
      alert(t("adminConsole.orderModal.fillItemFields", { defaultValue: "Please fill in Item ID, Name, and Price" }));
      return;
    }

    const itemToAdd = {
      type: newItem.type,
      id: newItem.id,
      name: newItem.name,
      price: Number(newItem.price),
      quantity: Number(newItem.quantity) || 1,
      currency: newItem.currency
    };

    if (newItem.type === 'credits') {
      if (newItem.unlimited) {
        itemToAdd.unlimited = true;
      } else {
        itemToAdd.credits = Number(newItem.credits) || 0;
      }
    }

    // Add to items array
    const updatedItems = [...formData.items, itemToAdd];
    
    // Calculate total
    const total = updatedItems.reduce((sum, item) => 
      sum + (Number(item.price) * Number(item.quantity || 1)), 0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: total
    });

    resetItemForm();
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    
    // Recalculate total
    const total = updatedItems.reduce((sum, item) => 
      sum + (Number(item.price) * Number(item.quantity || 1)), 0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: total
    });
  };

  // Show loading state while order is loading or brands are loading
  if (orderLoading || ((mode === 'create' || mode === 'edit') && loadingBrands)) {
    const loadingMessage = orderLoading
      ? t("adminConsole.orderModal.loadingOrderDetails", { defaultValue: "Loading order details..." })
      : t("adminConsole.orderModal.loadingBrandInfo", { defaultValue: "Loading brand information..." });
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
        <div className="glass-card w-full max-w-4xl p-6 rounded-xl relative z-10 flex flex-col items-center justify-center py-12">
          <i className="fas fa-spinner fa-spin text-5xl text-cyan-400 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {orderLoading
              ? t("adminConsole.orderModal.loadingOrderTitle", { defaultValue: "Loading Order" })
              : t("adminConsole.orderModal.loadingBrandTitle", { defaultValue: "Loading Brand Data" })}
          </h3>
          <p className="text-gray-400 text-center">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="glass-card w-full max-w-4xl p-6 rounded-xl relative z-10 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {mode === 'view'
            ? t("adminConsole.orderModal.viewOrder", { defaultValue: "View Order" })
            : mode === 'edit'
              ? t("adminConsole.orderModal.editOrder", { defaultValue: "Edit Order" })
              : t("adminConsole.orderModal.createManualTransaction", { defaultValue: "Create Manual Transaction" })}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            {mode !== 'create' && (
              <div>
                <label className="text-sm text-gray-300 block mb-2">{t("adminConsole.orderModal.orderId", { defaultValue: "Order ID" })}</label>
                <input
                  type="text"
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.orderId}
                  readOnly
                />
              </div>
            )}

            {/* Brand Selection (Manual Transaction & Edit Mode) */}
            {(mode === 'create' || mode === 'edit') && (
              <div>
                <label className="text-sm text-gray-300 block mb-2">
                  {mode === 'edit'
                    ? t("adminConsole.orderModal.brandAssignment", { defaultValue: "Brand Assignment" })
                    : t("adminConsole.orderModal.brandOptional", { defaultValue: "Brand (Optional)" })}
                  {formData.brandId && selectedBrand && (
                    <span className="ml-2 text-xs text-blue-400">
                      {t("adminConsole.orderModal.commissionRate", { rate: selectedBrand.commission_rate || 10, defaultValue: "• Commission Rate: {{rate}}%" })}
                    </span>
                  )}
                </label>
                <select
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.brandId || ''}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value || null })}
                >
                  <option value="">{t("adminConsole.orderModal.noBrandDirectSale", { defaultValue: "No Brand (Direct Sale)" })}</option>
                  {loadingBrands ? (
                    <option disabled>{t("adminConsole.orderModal.loadingBrands", { defaultValue: "Loading brands..." })}</option>
                  ) : (
                    brands.map(brand => (
                      <option key={brand.id} value={String(brand.id)}>
                        {t("adminConsole.orderModal.brandOption", {
                          name: brand.name || brand.username,
                          email: brand.email,
                          rate: brand.commission_rate || 10,
                          defaultValue: "{{name}} ({{email}}) - {{rate}}% commission",
                        })}
                      </option>
                    ))
                  )}
                </select>
                {calculatedCommission > 0 && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-sm text-blue-300">
                      <i className="fas fa-info-circle mr-2"></i>
                      {mode === 'edit'
                        ? t("adminConsole.orderModal.newCommission", { defaultValue: "New Commission:" })
                        : t("adminConsole.orderModal.calculatedCommission", { defaultValue: "Calculated Commission:" })} <strong>${calculatedCommission.toFixed(2)}</strong>
                    </div>
                  </div>
                )}
                {mode === 'edit' && order?.brand_id && Number(formData.brandId) !== Number(order.brand_id) && (
                  <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="text-sm text-yellow-300">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      {formData.brandId
                        ? t("adminConsole.orderModal.brandWillBeChanged", { defaultValue: "Brand will be changed" })
                        : t("adminConsole.orderModal.brandWillBeRemoved", { defaultValue: "Brand assignment will be removed" })}
                    </div>
                  </div>
                )}
                {mode === 'edit' && !order?.brand_id && formData.brandId && (
                  <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="text-sm text-green-300">
                      <i className="fas fa-check-circle mr-2"></i>
                      {t("adminConsole.orderModal.brandWillBeAssigned", { defaultValue: "Brand will be assigned to this order" })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2">
                  {t("adminConsole.orderModal.customerEmail", { defaultValue: "Customer Email" })} {!isReadOnly && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="email"
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  readOnly={isReadOnly}
                  required={!isReadOnly}
                />
              </div>

              {mode === 'create' && (
                <div>
                  <label className="text-sm text-gray-300 block mb-2">
                    {t("adminConsole.orderModal.cardholderName", { defaultValue: "Cardholder Name (Optional)" })}
                  </label>
                  <input
                    type="text"
                    className="search-input p-3 rounded-lg w-full"
                    value={formData.cardHolderName}
                    onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                    placeholder={t("adminConsole.orderModal.cardholderPlaceholder", { defaultValue: "John Doe" })}
                  />
                </div>
              )}
            </div>

            {mode === 'create' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 block mb-2">
                    {t("adminConsole.orderModal.phone", { defaultValue: "Phone (Optional)" })}
                  </label>
                  <input
                    type="tel"
                    className="search-input p-3 rounded-lg w-full"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 block mb-2">
                    {t("adminConsole.orderModal.transactionDate", { defaultValue: "Transaction Date" })}
                  </label>
                  <input
                    type="date"
                    className="search-input p-3 rounded-lg w-full"
                    value={formData.createdAt}
                    onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Decline Reason / Payment Message */}
            {mode === 'view' && order?.payment_message && (
              <div className={`glass-card p-4 rounded-lg border ${
                ['failed', 'refund', 'chargeback'].includes(formData.status?.toLowerCase()) 
                  ? 'border-red-500/30 bg-red-500/10' 
                  : 'border-blue-500/30 bg-blue-500/10'
              }`}>
                <label className={`text-sm font-semibold block mb-2 ${
                  ['failed', 'refund', 'chargeback'].includes(formData.status?.toLowerCase())
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}>
                  <i className={`fas ${
                    ['failed', 'refund', 'chargeback'].includes(formData.status?.toLowerCase())
                      ? 'fa-exclamation-triangle'
                      : 'fa-info-circle'
                  } mr-2`}></i>{t("adminConsole.orderModal.paymentMessage", { defaultValue: "Payment Message" })}
                </label>
                <div className="text-gray-300 text-sm whitespace-pre-wrap">
                  {order.payment_message}
                </div>
              </div>
            )}

            {mode === 'create' && (
              <div>
                <label className="text-sm text-gray-300 block mb-2">
                  {t("adminConsole.orderModal.paymentMessageNotes", { defaultValue: "Payment Message / Notes (Optional)" })}
                </label>
                <textarea
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.paymentMessage}
                  onChange={(e) => setFormData({ ...formData, paymentMessage: e.target.value })}
                  placeholder={t("adminConsole.orderModal.paymentMessagePlaceholder", { defaultValue: "Optional notes about this transaction..." })}
                  rows="2"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2">
                  {t("adminConsole.orderModal.totalAmount", { defaultValue: "Total Amount" })} {!isReadOnly && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  readOnly={isReadOnly}
                  required={!isReadOnly}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 block mb-2">{t("adminConsole.orderModal.status", { defaultValue: "Status" })}</label>
                <select
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="pending">{t("adminConsole.orderModal.statusPending", { defaultValue: "Pending" })}</option>
                  <option value="unpaid">{t("adminConsole.orderModal.statusUnpaid", { defaultValue: "Unpaid (Customer Paid)" })}</option>
                  <option value="paid">{t("adminConsole.orderModal.statusPaid", { defaultValue: "Paid (Brand Paid)" })}</option>
                  <option value="failed">{t("adminConsole.orderModal.statusFailed", { defaultValue: "Failed / Declined" })}</option>
                  <option value="refund">{t("adminConsole.orderModal.statusRefund", { defaultValue: "Refund" })}</option>
                  <option value="chargeback">{t("adminConsole.orderModal.statusChargeback", { defaultValue: "Chargeback" })}</option>
                </select>
              </div>
            </div>

            {/* Status Change Warning */}
            {mode === 'edit' && showStatusWarning && (
              <div className="glass-card p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                <div className="flex items-start gap-3">
                  <i className="fas fa-exclamation-triangle text-yellow-400 text-xl mt-1"></i>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-300 mb-2">
                      {t("adminConsole.orderModal.statusChangeWarningTitle", { status: formData.status, defaultValue: "Warning: Status Change to {{status}}" })}
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>{t("adminConsole.orderModal.warningRevertCredits", { defaultValue: "Any credits granted will be reverted from the customer" })}</li>
                      <li>{t("adminConsole.orderModal.warningRevertPackage", { defaultValue: "Any subscription/package will be reverted to Free" })}</li>
                      <li>{t("adminConsole.orderModal.warningCommissionCancelled", { defaultValue: "Commission status will be marked as cancelled" })}</li>
                      <li>{t("adminConsole.orderModal.warningLogged", { defaultValue: "This action will be logged in the payment message" })}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-200 mb-2 block">{t("adminConsole.orderModal.orderItems", { defaultValue: "Order Items" })}</label>
              <div className="glass-card p-4 rounded-lg">
                {/* Items List */}
                {formData.items.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-white/10 rounded-lg">
                    <i className="fas fa-box-open mb-2 text-2xl block"></i>
                    {isReadOnly
                      ? t("adminConsole.orderModal.noItemsReadonly", { defaultValue: "No items in this order" })
                      : t("adminConsole.orderModal.noItemsYet", { defaultValue: "No items added yet. Add items using the form below." })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, idx) => {
                      const typeIcon = item.type === 'credits' ? '⭐' : '📦';
                      const typeBadge = item.type === 'credits'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-blue-500/20 text-blue-300';
                      
                      return (
                        <div key={idx} className="glass-card p-3 rounded-lg border border-white/10">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{typeIcon}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-white">{item.name || item.id || t("adminConsole.orderModal.unnamedItem", { defaultValue: "Unnamed Item" })}</h4>
                                    <span className={`px-2 py-1 ${typeBadge} rounded text-xs font-semibold`}>
                                      {item.type?.toUpperCase() || t("adminConsole.orderModal.itemBadgeDefault", { defaultValue: "ITEM" })}
                                    </span>
                                  </div>
                                  {item.id && <span className="text-gray-500 text-xs">{t("adminConsole.orderModal.itemIdLabel", { id: item.id, defaultValue: "ID: {{id}}" })}</span>}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div className="flex items-center gap-1 text-gray-400">
                                  <i className="fas fa-dollar-sign"></i>
                                  <span>{t("adminConsole.orderModal.priceLabel", { defaultValue: "Price:" })} <strong className="text-white">{item.currency || '$'}{Number(item.price || 0).toFixed(2)}</strong></span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                  <i className="fas fa-times"></i>
                                  <span>{t("adminConsole.orderModal.qtyLabel", { defaultValue: "Qty:" })} <strong className="text-white">{item.quantity || 1}</strong></span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                  <i className="fas fa-calculator"></i>
                                  <span>{t("adminConsole.orderModal.totalLabel", { defaultValue: "Total:" })} <strong className="text-green-400">{item.currency || '$'}{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</strong></span>
                                </div>
                                {item.type === 'credits' && (
                                  <div className="text-sm">
                                    {item.unlimited ? (
                                      <span className="text-yellow-400"><i className="fas fa-infinity mr-1"></i>{t("adminConsole.orderModal.unlimited", { defaultValue: "Unlimited" })}</span>
                                    ) : (
                                      <span className="text-gray-300"><i className="fas fa-coins mr-1"></i>{t("adminConsole.orderModal.creditsCount", { count: item.credits || 0, defaultValue: "{{count}} Credits" })}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="action-btn btn-danger text-xs px-3 py-1.5 hover:scale-105 transition-transform"
                                title={t("adminConsole.orderModal.removeItemTooltip", { defaultValue: "Remove item" })}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Summary */}
                    <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center text-sm">
                      <div className="text-gray-400">
                        <i className="fas fa-box mr-1"></i> {t("adminConsole.orderModal.totalItems", { defaultValue: "Total Items:" })} <strong className="text-white">{formData.items.length}</strong>
                      </div>
                      <div className="text-gray-400">
                        <i className="fas fa-receipt mr-1"></i> {t("adminConsole.orderModal.totalCost", { defaultValue: "Total Cost:" })} <strong className="text-green-400 text-lg">${Number(formData.totalAmount).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Item Form */}
                {!isReadOnly && (
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-200 mb-3">{t("adminConsole.orderModal.addItem", { defaultValue: "Add Item" })}</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t("adminConsole.orderModal.itemType", { defaultValue: "Item Type" })}</label>
                          <select
                            className="search-input p-2.5 rounded-lg w-full text-sm"
                            value={newItem.type}
                            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                          >
                            <option value="package">{t("adminConsole.orderModal.itemTypePackage", { defaultValue: "📦 Package" })}</option>
                            <option value="credits">{t("adminConsole.orderModal.itemTypeCredits", { defaultValue: "⭐ Credits" })}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t("adminConsole.orderModal.itemId", { defaultValue: "Item ID" })} <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            className="search-input p-2.5 rounded-lg w-full text-sm"
                            placeholder={t("adminConsole.orderModal.itemIdPlaceholder", { defaultValue: "e.g. professional" })}
                            value={newItem.id}
                            onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">{t("adminConsole.orderModal.displayName", { defaultValue: "Display Name" })} <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          className="search-input p-2.5 rounded-lg w-full text-sm"
                          placeholder={t("adminConsole.orderModal.displayNamePlaceholder", { defaultValue: "e.g. Professional Package" })}
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t("adminConsole.orderModal.priceField", { defaultValue: "Price ($)" })} <span className="text-red-400">*</span></label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="search-input p-2.5 rounded-lg w-full text-sm"
                            placeholder="0.00"
                            value={newItem.price}
                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t("adminConsole.orderModal.quantity", { defaultValue: "Quantity" })}</label>
                          <input
                            type="number"
                            min="1"
                            className="search-input p-2.5 rounded-lg w-full text-sm"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t("adminConsole.orderModal.currency", { defaultValue: "Currency" })}</label>
                          <select
                            className="search-input p-2.5 rounded-lg w-full text-sm"
                            value={newItem.currency}
                            onChange={(e) => setNewItem({ ...newItem, currency: e.target.value })}
                          >
                            <option value="$">$ USD</option>
                            <option value="€">€ EUR</option>
                            <option value="£">£ GBP</option>
                          </select>
                        </div>
                      </div>

                      {newItem.type === 'credits' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t("adminConsole.orderModal.creditsAmount", { defaultValue: "Credits Amount" })}</label>
                            <input
                              type="number"
                              min="0"
                              className="search-input p-2.5 rounded-lg w-full text-sm"
                              placeholder="0"
                              value={newItem.credits}
                              onChange={(e) => setNewItem({ ...newItem, credits: e.target.value })}
                              disabled={newItem.unlimited}
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer p-2.5">
                              <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={newItem.unlimited}
                                onChange={(e) => setNewItem({ ...newItem, unlimited: e.target.checked, credits: '' })}
                              />
                              <span>{t("adminConsole.orderModal.unlimitedCredits", { defaultValue: "Unlimited Credits" })}</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          className="action-btn btn-secondary text-sm"
                          onClick={resetItemForm}
                        >
                          {t("adminConsole.orderModal.clear", { defaultValue: "Clear" })}
                        </button>
                        <button
                          type="button"
                          className="action-btn btn-primary text-sm"
                          onClick={handleAddItem}
                        >
                          <i className="fas fa-plus mr-1"></i> {t("adminConsole.orderModal.addItem", { defaultValue: "Add Item" })}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {order?.created_at && (
              <div className="text-sm text-gray-400">
                <i className="fas fa-clock mr-2"></i>
                {t("adminConsole.orderModal.createdAt", { date: new Date(order.created_at).toLocaleString(), defaultValue: "Created: {{date}}" })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="action-btn btn-secondary"
              onClick={onClose}
            >
              {isReadOnly
                ? t("adminConsole.orderModal.close", { defaultValue: "Close" })
                : t("adminConsole.orderModal.cancel", { defaultValue: "Cancel" })}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="action-btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>{t("adminConsole.orderModal.saving", { defaultValue: "Saving..." })}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>{mode === 'create'
                      ? t("adminConsole.orderModal.createTransaction", { defaultValue: "Create Transaction" })
                      : t("adminConsole.orderModal.saveOrder", { defaultValue: "Save Order" })}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
