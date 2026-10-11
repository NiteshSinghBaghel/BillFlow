import React, { useState } from 'react';
import {
  Building2,
  Upload,
  Check,
  CreditCard,
  QrCode,
  FileText,
  Download,
  UploadCloud,
  RefreshCw,
  Trash2,
  FileSignature,
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { backupService } from '../services/storage';

interface BusinessProfileViewProps {
  business: BusinessProfile;
  onUpdateBusiness: (updated: BusinessProfile) => void;
  onRefreshAllData: () => void;
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  business,
  onUpdateBusiness,
  onRefreshAllData,
}) => {
  const [profile, setProfile] = useState<BusinessProfile>({ ...business });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmResetDemo, setConfirmResetDemo] = useState(false);

  // File logo upload to base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        setUploadError('Logo file size must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setProfile((prev) => ({ ...prev, logoUrl: '' }));
  };

  // Signature upload to base64
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        setUploadError('Signature file size must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, signatureUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setProfile((prev) => ({ ...prev, signatureUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusiness(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Import JSON Backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const res = backupService.importData(content);
        if (res.success) {
          setBackupMsg('Data successfully restored!');
          onRefreshAllData();
        } else {
          setBackupMsg('Failed: ' + res.message);
        }
        setTimeout(() => setBackupMsg(null), 4000);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Business Profile & Tax Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business identity, location, GST registration, bank accounts, and UPI scan-to-pay
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Card 1: Business Identity & Logo */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h2 className="font-bold text-sm text-slate-900">1. Business Identity & Logo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Logo preview and upload */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
              {profile.logoUrl ? (
                <div className="relative group w-32 h-32 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-2 mb-3">
                  <img
                    src={profile.logoUrl}
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md"
                    title="Remove logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-slate-200 text-slate-500 flex flex-col items-center justify-center mb-3">
                  <Building2 className="w-8 h-8 text-slate-400" />
                  <span className="text-[10px] mt-1">No Logo</span>
                </div>
              )}

              <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG up to 2MB</span>
            </div>

            {/* Business info fields */}
            <div className="md:col-span-8 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business / Trading Name *
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Apex Hardware & Technologies"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={profile.tagline || ''}
                  onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                  placeholder="e.g. Authorized Distributor & IT Solutions"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98201 54321"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="billing@apextech.in"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="text"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://apextech.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Location & Address */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            2. Business Address & Location
          </h2>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Shop / Office / Street Address *
            </label>
            <input
              type="text"
              required
              value={profile.address.street}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  address: { ...profile.address, street: e.target.value },
                })
              }
              placeholder="e.g. Shop No. 12, Ground Floor, Diamond Mall, MG Road"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={profile.address.city}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    address: { ...profile.address, city: e.target.value },
                  })
                }
                placeholder="Mumbai"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={profile.address.state}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    address: { ...profile.address, state: e.target.value },
                  })
                }
                placeholder="Maharashtra"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode *</label>
              <input
                type="text"
                required
                value={profile.address.pincode}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    address: { ...profile.address, pincode: e.target.value },
                  })
                }
                placeholder="400069"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={profile.address.country}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    address: { ...profile.address, country: e.target.value },
                  })
                }
                placeholder="India"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Card 3: GST & Tax Identification */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-slate-700" />
            <h2 className="font-bold text-sm text-slate-900">3. GST & Tax Identification</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                GSTIN (Goods and Services Tax Number)
              </label>
              <input
                type="text"
                value={profile.gstNumber}
                onChange={(e) =>
                  setProfile({ ...profile, gstNumber: e.target.value.toUpperCase() })
                }
                placeholder="27AABCA5432K1Z8"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                15-character GST identification number printed on tax invoices
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                PAN / Business Reg Number
              </label>
              <input
                type="text"
                value={profile.panNumber || ''}
                onChange={(e) =>
                  setProfile({ ...profile, panNumber: e.target.value.toUpperCase() })
                }
                placeholder="AABCA5432K"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Bank Details & UPI QR Configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h2 className="font-bold text-sm text-slate-900">
              4. Bank Account & UPI Payment Details
            </h2>
          </div>

          <p className="text-slate-500 text-[11px]">
            These details appear on your printed invoices and generate dynamic UPI QR codes for instant customer payment via PhonePe, Google Pay, Paytm, or BHIM.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Account Holder / Beneficiary Name *
              </label>
              <input
                type="text"
                required
                value={profile.bankDetails.accountHolderName}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bankDetails: {
                      ...profile.bankDetails,
                      accountHolderName: e.target.value,
                    },
                  })
                }
                placeholder="Apex Infotech Solutions"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                required
                value={profile.bankDetails.bankName}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bankDetails: { ...profile.bankDetails, bankName: e.target.value },
                  })
                }
                placeholder="HDFC Bank / State Bank of India / ICICI"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                required
                value={profile.bankDetails.accountNumber}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bankDetails: { ...profile.bankDetails, accountNumber: e.target.value },
                  })
                }
                placeholder="50200087451299"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                IFSC Code *
              </label>
              <input
                type="text"
                required
                value={profile.bankDetails.ifscCode}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bankDetails: { ...profile.bankDetails, ifscCode: e.target.value.toUpperCase() },
                  })
                }
                placeholder="HDFC0000240"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank Branch Name
              </label>
              <input
                type="text"
                value={profile.bankDetails.branchName || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bankDetails: { ...profile.bankDetails, branchName: e.target.value },
                  })
                }
                placeholder="Andheri East Branch"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">UPI ID / VPA</label>
                <span className="text-[10px] text-indigo-700 font-semibold flex items-center gap-1">
                  <QrCode className="w-3 h-3" /> Generates Instant QR Code
                </span>
              </div>
              <input
                type="text"
                value={profile.bankDetails.upiId}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bankDetails: { ...profile.bankDetails, upiId: e.target.value },
                  })
                }
                placeholder="business@okhdfcbank"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-indigo-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Card 5: Invoice Numbering & Currency Defaults */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            5. Invoice Sequence & Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={profile.invoicePrefix}
                onChange={(e) => setProfile({ ...profile, invoicePrefix: e.target.value })}
                placeholder="INV-2026-"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Next Sequence Number
              </label>
              <input
                type="number"
                value={profile.invoiceNextSeq}
                onChange={(e) =>
                  setProfile({ ...profile, invoiceNextSeq: parseInt(e.target.value) || 1001 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <select
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="₹">₹ - Indian Rupee (INR)</option>
                <option value="$">$ - US Dollar (USD)</option>
                <option value="€">€ - Euro (EUR)</option>
                <option value="£">£ - British Pound (GBP)</option>
                <option value="AED">AED - UAE Dirham</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={profile.defaultTerms}
              onChange={(e) => setProfile({ ...profile, defaultTerms: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Notes to Customer
            </label>
            <textarea
              rows={2}
              value={profile.defaultNotes}
              onChange={(e) => setProfile({ ...profile, defaultNotes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
            />
          </div>
        </div>

        {/* Card 6: Authorized Signature / Stamp */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileSignature className="w-4 h-4 text-slate-700" />
            <div>
              <h2 className="font-bold text-sm text-slate-900">6. Authorised Signature / Company Stamp</h2>
              <p className="text-[11px] text-slate-500">
                Upload your digital signature or stamp. This will be automatically printed on every bill in the signature space.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Signature preview / upload box */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
              {profile.signatureUrl ? (
                <div className="relative group w-48 h-24 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-2 mb-3">
                  <img
                    src={profile.signatureUrl}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    title="Remove Signature"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-48 h-24 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 mb-3 p-2">
                  <FileSignature className="w-6 h-6 mb-1 text-slate-300" />
                  <span className="text-[10px] italic">No signature uploaded</span>
                </div>
              )}

              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{profile.signatureUrl ? 'Change Signature' : 'Upload Signature'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-400 mt-2">
                PNG or JPG with transparent or clean white background (max 2MB)
              </span>
            </div>

            {/* Bill Preview box */}
            <div className="md:col-span-7 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Live Preview (How it will appear on every bill):
              </span>
              <div className="bg-white p-4 rounded-lg border border-slate-200 text-right max-w-xs ml-auto shadow-2xs">
                <p className="text-[11px] font-semibold text-slate-800">
                  For {profile.name || 'Your Business Name'}
                </p>
                <div className="h-16 flex items-end justify-end my-1">
                  {profile.signatureUrl ? (
                    <img
                      src={profile.signatureUrl}
                      alt="Signature Preview"
                      className="max-h-14 max-w-[150px] object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic pb-1">
                      Authorised Signatory
                    </span>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-1 text-[9px] text-slate-600 font-semibold text-center">
                  Authorised Signatory
                </div>
                <div className="text-[8px] text-slate-400 text-center mt-0.5">
                  This is a computer generated invoice
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-xs"
          >
            Save All Business Profile Settings
          </button>
        </div>
      </form>

      {/* Free Database Backup & Restore section */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Free Local Database & Offline Backup
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Your data is safely stored in your browser storage. You can download an offline JSON backup at any time or restore data on any device.
          </p>
        </div>

        {backupMsg && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-medium">
            {backupMsg}
          </div>
        )}

        {uploadError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {uploadError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => backupService.downloadBackupFile()}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium rounded-lg inline-flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download Backup (JSON)</span>
          </button>

          <label className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium rounded-lg inline-flex items-center gap-2 cursor-pointer shadow-2xs">
            <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
            <span>Restore From File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          <div className="ml-auto flex items-center gap-2">
            {confirmResetDemo ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                <span className="text-xs text-rose-700 font-medium">Overwrite data with demo?</span>
                <button
                  type="button"
                  onClick={() => {
                    backupService.resetDemoData();
                    onRefreshAllData();
                    setConfirmResetDemo(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetDemo(false)}
                  className="px-2 py-1 text-slate-600 hover:text-slate-800 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmResetDemo(true)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
