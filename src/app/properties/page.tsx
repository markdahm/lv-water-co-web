'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppData, Property } from '@/lib/types';
import { loadData, saveData } from '@/lib/data';
import { getLastSixMonthsUsage, formatShortPeriod, calculatePropertyBalance, formatCurrency } from '@/lib/billing';

export default function PropertiesPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');

  useEffect(() => {
    loadData()
      .then((loadedData) => {
        setData(loadedData);
        if (loadedData.properties.length > 0) {
          setSelectedPropertyId(loadedData.properties[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedProperty = useMemo(() => {
    if (!data || !selectedPropertyId) return null;
    return data.properties.find((p) => p.id === selectedPropertyId) || null;
  }, [data, selectedPropertyId]);

  const usageHistory = useMemo(() => {
    if (!data || !selectedPropertyId) return [];
    return getLastSixMonthsUsage(selectedPropertyId, data.readings);
  }, [data, selectedPropertyId]);

  const propertyPayments = useMemo(() => {
    if (!data || !selectedPropertyId) return [];
    return data.payments
      .filter((p) => p.propertyId === selectedPropertyId)
      .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
      .slice(0, 10);
  }, [data, selectedPropertyId]);

  const balance = useMemo(() => {
    if (!data || !selectedProperty) return 0;
    return calculatePropertyBalance(selectedProperty, data.readings, data.payments, data.settings);
  }, [data, selectedProperty]);

  const handleSaveAddress = async () => {
    if (!data || !selectedProperty) return;

    const updatedProperties = data.properties.map((p) =>
      p.id === selectedProperty.id ? { ...p, address: addressDraft } : p
    );

    const newData = { ...data, properties: updatedProperties };
    setData(newData);
    await saveData(newData);
    setEditingAddress(false);
  };

  const startEditAddress = () => {
    if (selectedProperty) {
      setAddressDraft(selectedProperty.address);
      setEditingAddress(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <p className="text-red-600">Failed to load data</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Properties</h1>

      {/* Mobile: Property selector dropdown */}
      <div className="md:hidden mb-4">
        <select
          value={selectedPropertyId || ''}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="w-full"
        >
          {data.properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop: Property list sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="card">
            <h3 className="font-semibold mb-3">Properties</h3>
            <div className="space-y-1">
              {data.properties.map((property) => {
                const propBalance = calculatePropertyBalance(
                  property,
                  data.readings,
                  data.payments,
                  data.settings
                );
                return (
                  <button
                    key={property.id}
                    onClick={() => setSelectedPropertyId(property.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedPropertyId === property.id
                        ? 'bg-[var(--primary)] text-white'
                        : 'hover:bg-[var(--border)]'
                    }`}
                  >
                    <div className="font-medium">{property.name}</div>
                    <div
                      className={`text-sm ${
                        selectedPropertyId === property.id
                          ? 'text-white/80'
                          : propBalance >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(propBalance))} {propBalance >= 0 ? 'credit' : 'due'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Property details */}
        {selectedProperty && (
          <div className="flex-1 space-y-6">
            {/* Header with address */}
            <div className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{selectedProperty.name}</h2>
                  {editingAddress ? (
                    <div className="space-y-2">
                      <textarea
                        value={addressDraft}
                        onChange={(e) => setAddressDraft(e.target.value)}
                        className="w-full h-20"
                        placeholder="Enter address..."
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveAddress} className="btn-primary text-sm py-1 px-3">
                          Save
                        </button>
                        <button
                          onClick={() => setEditingAddress(false)}
                          className="btn-secondary text-sm py-1 px-3"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="text-[var(--muted)] whitespace-pre-line">{selectedProperty.address}</p>
                      <button
                        onClick={startEditAddress}
                        className="text-[var(--primary)] hover:underline text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <div className={`text-right ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="text-2xl font-bold">{formatCurrency(Math.abs(balance))}</p>
                  <p className="text-sm">{balance >= 0 ? 'Credit' : 'Amount Due'}</p>
                </div>
              </div>
            </div>

            {/* Usage History Chart */}
            <div className="card">
              <h3 className="font-semibold mb-4">Usage History</h3>
              {usageHistory.length > 0 ? (
                <div className="h-48 flex items-end gap-2">
                  {usageHistory.map((item, index) => {
                    const maxUsage = Math.max(...usageHistory.map((h) => h.usage));
                    const height = maxUsage > 0 ? (item.usage / maxUsage) * 100 : 0;
                    const isLast = index === usageHistory.length - 1;

                    return (
                      <div key={item.period} className="flex-1 flex flex-col items-center">
                        <span className="text-xs text-[var(--muted)] mb-1">
                          {(item.usage / 1000).toFixed(1)}k
                        </span>
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            isLast ? 'bg-[var(--primary)]' : 'bg-[var(--primary)]/40'
                          }`}
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                        <span className={`text-xs mt-2 ${isLast ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted)]'}`}>
                          {formatShortPeriod(item.period)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[var(--muted)]">No usage history available</p>
              )}
            </div>

            {/* Recent Payments */}
            <div className="card">
              <h3 className="font-semibold mb-4">Recent Payments</h3>
              {propertyPayments.length > 0 ? (
                <div className="space-y-2">
                  {propertyPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center py-2 border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-[var(--muted)]">{payment.notes || 'Payment'}</p>
                      </div>
                      <p className="text-sm text-[var(--muted)]">{payment.receivedDate}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--muted)]">No payments recorded</p>
              )}
            </div>

            {/* Meters */}
            <div className="card">
              <h3 className="font-semibold mb-4">Meters</h3>
              <div className="space-y-2">
                {selectedProperty.meters.map((meter) => (
                  <div key={meter.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="font-medium">{meter.label}</span>
                    <span className="text-[var(--muted)] text-sm">ID: {meter.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
