import React, { useState } from 'react';
import { FaTimes, FaFileAlt, FaUpload, FaPercent, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';

const InvestmentDetailsModal = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    title: '',
    roiPercent: '',
    durationUnit: 'monthly', // monthly | annually
    durationValue: '',
    minAmount: '',
    payoutSchedule: 'monthly',
    riskLevel: 'medium', // low | medium | high
    redemptionTerms: '',
    startDate: '',
    maturityDate: '',
    summary: ''
  });
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDocsChange = (e) => {
    const files = Array.from(e.target.files);
    const processed = files.map((file, index) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setDocuments(prev => [...prev, ...processed]);
  };

  const removeDoc = (idx) => {
    setDocuments(prev => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const v = {};
    if (!form.title) v.title = 'Investment title is required';
    if (!form.roiPercent) v.roiPercent = 'ROI is required';
    if (!form.durationValue) v.durationValue = 'Duration is required';
    if (!form.minAmount) v.minAmount = 'Minimum amount is required';
    if (!form.summary) v.summary = 'Summary is required';
    return v;
  };

  const submit = () => {
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    onSubmit({ investment: {
      title: form.title,
      roiPercent: Number(form.roiPercent),
      durationUnit: form.durationUnit,
      durationValue: Number(form.durationValue),
      minAmount: Number(form.minAmount),
      payoutSchedule: form.payoutSchedule,
      riskLevel: form.riskLevel,
      redemptionTerms: form.redemptionTerms,
      startDate: form.startDate || null,
      maturityDate: form.maturityDate || null,
      summary: form.summary
    }, investmentDocuments: documents });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Investment Details</h2>
        <p className="text-sm text-gray-600 mb-6">Provide investment information for this collateralized property.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Investment Title</label>
            <input name="title" value={form.title} onChange={handleChange} className={`w-full px-4 py-3 border-2 rounded-xl ${errors.title ? 'border-red-300' : 'border-gray-200'}`} placeholder="e.g., Greenwood Estate Fixed Income" />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ROI (%)</label>
            <div className="relative">
              <input type="number" name="roiPercent" value={form.roiPercent} onChange={handleChange} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl ${errors.roiPercent ? 'border-red-300' : 'border-gray-200'}`} placeholder="12" />
              <FaPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.roiPercent && <p className="text-sm text-red-600 mt-1">{errors.roiPercent}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" name="durationValue" value={form.durationValue} onChange={handleChange} className={`col-span-2 w-full px-4 py-3 border-2 rounded-xl ${errors.durationValue ? 'border-red-300' : 'border-gray-200'}`} placeholder="12" />
              <select name="durationUnit" value={form.durationUnit} onChange={handleChange} className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl">
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            {errors.durationValue && <p className="text-sm text-red-600 mt-1">{errors.durationValue}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Amount</label>
            <div className="relative">
              <input type="number" name="minAmount" value={form.minAmount} onChange={handleChange} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl ${errors.minAmount ? 'border-red-300' : 'border-gray-200'}`} placeholder="500000" />
              <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.minAmount && <p className="text-sm text-red-600 mt-1">{errors.minAmount}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payout Schedule</label>
            <select name="payoutSchedule" value={form.payoutSchedule} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
              <option value="end-of-term">End of Term</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Risk Level</label>
            <select name="riskLevel" value={form.riskLevel} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date (optional)</label>
            <div className="relative">
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl" />
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Maturity Date (optional)</label>
            <div className="relative">
              <input type="date" name="maturityDate" value={form.maturityDate} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl" />
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Investment Summary</label>
          <textarea name="summary" value={form.summary} onChange={handleChange} rows={4} className={`w-full px-4 py-3 border-2 rounded-xl ${errors.summary ? 'border-red-300' : 'border-gray-200'}`} placeholder="Briefly explain the investment, collateral structure, and terms." />
          {errors.summary && <p className="text-sm text-red-600 mt-1">{errors.summary}</p>}
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><FaFileAlt className="mr-2 text-green-600" /> Investment Documents</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <input type="file" multiple accept=".pdf,.doc,.docx" id="investment-docs" className="hidden" onChange={handleDocsChange} />
            <label htmlFor="investment-docs" className="cursor-pointer">
              <FaUpload className="mx-auto text-3xl text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload investment documents</p>
            </label>
          </div>
          {documents.length > 0 && (
            <div className="mt-3 space-y-2">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                  <button type="button" onClick={() => removeDoc(idx)} className="text-red-500 hover:text-red-700">
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700">Save & Publish</button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailsModal;


