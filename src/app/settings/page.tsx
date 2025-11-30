'use client';

import { useState, useEffect } from 'react';
import { AppData, BillingSettings } from '@/lib/types';
import { loadData, saveData } from '@/lib/data';
import { formatCurrency } from '@/lib/billing';
import { useTheme } from '@/lib/theme';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData()
      .then((loadedData) => {
        setData(loadedData);
        setSettings(loadedData.settings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!data || !settings) return;

    setSaving(true);
    try {
      const newData = { ...data, settings };
      await saveData(newData);
      setData(newData);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      setSettings(data.settings);
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!data || !settings) {
    return (
      <div className="p-4">
        <p className="text-red-600">Failed to load data</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-primary">
            Edit Rates
          </button>
        )}
      </div>

      {/* Appearance */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        <div className="flex justify-between items-center py-2">
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-[var(--muted)]">Use dark theme for the interface</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Billing Rates */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Billing Rates</h2>

        <div className="space-y-4">
          {/* Fixed Fee */}
          <div className="flex justify-between items-center py-2 border-b">
            <div>
              <p className="font-medium">Monthly Service Fee</p>
              <p className="text-sm text-[var(--muted)]">Fixed charge per month</p>
            </div>
            {editing ? (
              <div className="relative w-24">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={settings.fixedMonthlyFee}
                  onChange={(e) =>
                    setSettings({ ...settings, fixedMonthlyFee: parseFloat(e.target.value) || 0 })
                  }
                  className="pl-7 text-right"
                />
              </div>
            ) : (
              <p className="font-semibold">{formatCurrency(settings.fixedMonthlyFee)}</p>
            )}
          </div>

          {/* Tier 1 */}
          <div className="py-2 border-b">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Tier 1 Rate</p>
                <p className="text-sm text-[var(--muted)]">
                  0 - {settings.tier1Limit.toLocaleString()} gallons
                </p>
              </div>
              {editing ? (
                <div className="relative w-24">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tier1RatePerThousand}
                    onChange={(e) =>
                      setSettings({ ...settings, tier1RatePerThousand: parseFloat(e.target.value) || 0 })
                    }
                    className="pl-7 text-right"
                  />
                </div>
              ) : (
                <p className="font-semibold">${settings.tier1RatePerThousand.toFixed(2)}/1000 gal</p>
              )}
            </div>
            {editing && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-sm text-[var(--muted)]">Limit:</label>
                <input
                  type="number"
                  value={settings.tier1Limit}
                  onChange={(e) =>
                    setSettings({ ...settings, tier1Limit: parseInt(e.target.value) || 0 })
                  }
                  className="w-32"
                />
                <span className="text-sm text-[var(--muted)]">gallons</span>
              </div>
            )}
          </div>

          {/* Tier 2 */}
          <div className="py-2 border-b">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Tier 2 Rate</p>
                <p className="text-sm text-[var(--muted)]">
                  {settings.tier1Limit.toLocaleString()} - {settings.tier2Limit.toLocaleString()} gallons
                </p>
              </div>
              {editing ? (
                <div className="relative w-24">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tier2RatePerThousand}
                    onChange={(e) =>
                      setSettings({ ...settings, tier2RatePerThousand: parseFloat(e.target.value) || 0 })
                    }
                    className="pl-7 text-right"
                  />
                </div>
              ) : (
                <p className="font-semibold">${settings.tier2RatePerThousand.toFixed(2)}/1000 gal</p>
              )}
            </div>
            {editing && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-sm text-[var(--muted)]">Limit:</label>
                <input
                  type="number"
                  value={settings.tier2Limit}
                  onChange={(e) =>
                    setSettings({ ...settings, tier2Limit: parseInt(e.target.value) || 0 })
                  }
                  className="w-32"
                />
                <span className="text-sm text-[var(--muted)]">gallons</span>
              </div>
            )}
          </div>

          {/* Tier 3 */}
          <div className="py-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Tier 3 Rate</p>
                <p className="text-sm text-[var(--muted)]">
                  Above {settings.tier2Limit.toLocaleString()} gallons
                </p>
              </div>
              {editing ? (
                <div className="relative w-24">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tier3RatePerThousand}
                    onChange={(e) =>
                      setSettings({ ...settings, tier3RatePerThousand: parseFloat(e.target.value) || 0 })
                    }
                    className="pl-7 text-right"
                  />
                </div>
              ) : (
                <p className="font-semibold">${settings.tier3RatePerThousand.toFixed(2)}/1000 gal</p>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button onClick={handleCancel} className="flex-1 btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Data Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-[var(--border)] rounded-lg">
            <p className="text-2xl font-bold text-[var(--primary)]">{data.properties.length}</p>
            <p className="text-sm text-[var(--muted)]">Properties</p>
          </div>
          <div className="p-3 bg-[var(--border)] rounded-lg">
            <p className="text-2xl font-bold text-[var(--primary)]">{data.readings.length}</p>
            <p className="text-sm text-[var(--muted)]">Meter Readings</p>
          </div>
          <div className="p-3 bg-[var(--border)] rounded-lg">
            <p className="text-2xl font-bold text-[var(--primary)]">{data.payments.length}</p>
            <p className="text-sm text-[var(--muted)]">Payments</p>
          </div>
          <div className="p-3 bg-[var(--border)] rounded-lg">
            <p className="text-2xl font-bold text-[var(--primary)]">{data.invoices.length}</p>
            <p className="text-sm text-[var(--muted)]">Invoices</p>
          </div>
        </div>
      </div>
    </div>
  );
}
