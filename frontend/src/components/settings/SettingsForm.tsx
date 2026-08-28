import React, { useState, useEffect } from 'react';
import { Save, Check, Shield } from 'lucide-react';
import { SystemSettings } from '../../types/index.js';
import { api } from '../../services/api.js';

export const SettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    amountTolerance: 0.01,
    dateToleranceDays: 3,
    sensitivity: 'balanced',
    currency: 'USD',
    currencySymbol: '$',
    reducedMotion: false,
    hasOpenAiKey: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100">Reconciliation Engine Tolerances</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure matching thresholds, rounding tolerances, and financial parameters.
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg font-mono">
            <Check className="w-4 h-4" /> Settings Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Amount Tolerance */}
        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Amount Tolerance Variance ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.amountTolerance}
            onChange={(e) => setSettings({ ...settings, amountTolerance: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Allowed rounding difference before flagging as AMOUNT_MISMATCH (default: 0.01).
          </p>
        </div>

        {/* Date Tolerance */}
        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Settlement Date Tolerance (Days)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            max="30"
            value={settings.dateToleranceDays}
            onChange={(e) => setSettings({ ...settings, dateToleranceDays: parseInt(e.target.value, 10) || 0 })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Maximum days between order date and payout before flagging TIMING_DISCREPANCY.
          </p>
        </div>

        {/* Matching Sensitivity */}
        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Matching Algorithm Sensitivity
          </label>
          <select
            value={settings.sensitivity}
            onChange={(e) => setSettings({ ...settings, sensitivity: e.target.value as any })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="strict">Strict (Exact IDs & Zero tolerance only)</option>
            <option value="balanced">Balanced (Exact + Strong Sub-References + Same Date)</option>
            <option value="relaxed">Relaxed (Composite Metadata & Fuzzy References enabled)</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Determines how aggressively candidate pairs are matched across files.
          </p>
        </div>

        {/* Currency Display */}
        <div>
          <label className="block font-semibold text-slate-200 mb-1.5">
            Display Currency & Symbol
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={settings.currency}
              onChange={(e) => {
                const map: Record<string, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
                setSettings({ ...settings, currency: e.target.value, currencySymbol: map[e.target.value] || '$' });
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
            <input
              type="text"
              value={settings.currencySymbol}
              onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-center focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>AI Status: {settings.hasOpenAiKey ? 'OpenAI GPT-4o-mini Connected' : 'Deterministic Grounded Engine (Active)'}</span>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
};
