import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { BusinessProfile, SavedProduct } from '../types';
import { productService } from '../services/storage';
import { formatCurrency } from '../utils/numberToWords';

interface ProductsViewProps {
  products: SavedProduct[];
  business: BusinessProfile;
  onRefreshProducts: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  business,
  onRefreshProducts,
}) => {
  const currency = business.currency || '₹';
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [targetProduct, setTargetProduct] = useState<SavedProduct | null>(null);

  const [formData, setFormData] = useState<Partial<SavedProduct>>({
    name: '',
    description: '',
    hsnCode: '',
    defaultPrice: 0,
    defaultGstRate: 18,
    unit: 'pcs',
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.hsnCode && p.hsnCode.includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, search]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      hsnCode: '',
      defaultPrice: 0,
      defaultGstRate: 18,
      unit: 'pcs',
    });
    setTargetProduct(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (p: SavedProduct) => {
    setFormData({ ...p });
    setTargetProduct(p);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    productService.saveProduct({
      id: targetProduct?.id,
      businessId: business.id,
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      hsnCode: formData.hsnCode?.trim() || '',
      defaultPrice: formData.defaultPrice || 0,
      defaultGstRate: formData.defaultGstRate || 0,
      unit: formData.unit?.trim() || 'pcs',
    });

    setIsEditing(false);
    setTargetProduct(null);
    onRefreshProducts();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete item "${name}" from catalog?`)) {
      productService.deleteProduct(id);
      onRefreshProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Items & Services Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Save frequent products and services with HSN codes, default rates, and GST percentages
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Catalog Item</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog items by name, HSN/SAC code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No items found</p>
            <p className="text-xs mt-1">Add items to quickly insert them when creating bills</p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Add Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">HSN / SAC</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Default Rate</th>
                  <th className="py-3 px-4 text-center">GST Rate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {p.description || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.hsnCode || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{p.unit}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(p.defaultPrice, currency)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {p.defaultGstRate}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-sm text-slate-900">
                {targetProduct ? 'Edit Catalog Item' : 'New Catalog Item'}
              </h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Optical Mouse / Consultation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item specifications or service scope"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="847160"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs / hrs / kg / box"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Rate ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.defaultPrice === 0 ? '' : formData.defaultPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Rate %</label>
                  <select
                    value={formData.defaultGstRate}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultGstRate: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none font-mono"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
