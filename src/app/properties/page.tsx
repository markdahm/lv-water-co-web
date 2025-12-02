'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppData, Property } from '@/lib/types';
import { loadData, saveData } from '@/lib/data';
import { getLastSixMonthsUsage, formatShortPeriod, calculatePropertyBalance, formatCurrency } from '@/lib/billing';
import ActivityTable from '@/components/ActivityTable';

export default function PropertiesPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');
  const [editingBalanceAdjustment, setEditingBalanceAdjustment] = useState(false);
  const [balanceAdjustmentDraft, setBalanceAdjustmentDraft] = useState('');

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

  const propertyReadings = useMemo(() => {
    if (!data || !selectedPropertyId) return [];
    return data.readings.filter((r) => r.propertyId === selectedPropertyId);
  }, [data, selectedPropertyId]);

  const propertyPayments = useMemo(() => {
    if (!data || !selectedPropertyId) return [];
    return data.payments.filter((p) => p.propertyId === selectedPropertyId);
  }, [data, selectedPropertyId]);

  const balance = useMemo(() => {
    if (!data || !selectedProperty) return 0;
    return calculatePropertyBalance(selectedProperty, data.readings, data.payments, data.settings);
  }, [data, selectedProperty]);

  const handleSaveName = async () => {
    if (!data || !selectedProperty || !nameDraft.trim()) return;

    const updatedProperties = data.properties.map((p) =>
      p.id === selectedProperty.id ? { ...p, name: nameDraft.trim() } : p
    );

    const newData = { ...data, properties: updatedProperties };
    setData(newData);
    await saveData(newData);
    setEditingName(false);
  };

  const startEditName = () => {
    if (selectedProperty) {
      setNameDraft(selectedProperty.name);
      setEditingName(true);
    }
  };

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

  const handleSaveBalanceAdjustment = async () => {
    if (!data || !selectedProperty) return;

    const newAdjustment = parseFloat(balanceAdjustmentDraft) || 0;
    const updatedProperties = data.properties.map((p) =>
      p.id === selectedProperty.id ? { ...p, balanceAdjustment: newAdjustment } : p
    );

    const newData = { ...data, properties: updatedProperties };
    setData(newData);
    await saveData(newData);
    setEditingBalanceAdjustment(false);
  };

  const startEditBalanceAdjustment = () => {
    if (selectedProperty) {
      setBalanceAdjustmentDraft(selectedProperty.balanceAdjustment.toString());
      setEditingBalanceAdjustment(true);
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
                          : propBalance < 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(propBalance))} {propBalance < 0 ? 'credit' : 'due'}
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
            {/* Header with name and address */}
            <div className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editingName ? (
                    <div className="space-y-2 mb-2">
                      <input
                        type="text"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="text-xl font-bold w-full"
                        placeholder="Property name..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveName} className="btn-primary text-sm py-1 px-3">
                          Save
                        </button>
                        <button
                          onClick={() => setEditingName(false)}
                          className="btn-secondary text-sm py-1 px-3"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-bold">{selectedProperty.name}</h2>
                      <button
                        onClick={startEditName}
                        className="p-1 text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                        title="Edit name"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
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
                <div className={`text-right ${balance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="text-2xl font-bold">{formatCurrency(Math.abs(balance))}</p>
                  <p className="text-sm">{balance < 0 ? 'Credit' : 'Amount Due'}</p>
                </div>
              </div>
            </div>

            {/* Usage History Chart */}
            <div className="card">
              <h3 className="font-semibold mb-4">Usage History</h3>
              {usageHistory.length > 0 ? (
                <div className="flex items-end gap-2">
                  {usageHistory.map((item, index) => {
                    const maxUsage = Math.max(...usageHistory.map((h) => h.usage));
                    const heightPercent = maxUsage > 0 ? (item.usage / maxUsage) * 100 : 0;
                    const barHeight = Math.max(heightPercent, 5) * 1.2; // Max ~120px
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
                          style={{ height: `${barHeight}px` }}
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

            {/* Recent Activity */}
            <div className="card">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              {(propertyReadings.length > 0 || propertyPayments.length > 0) ? (
                <ActivityTable
                  properties={data.properties}
                  readings={propertyReadings}
                  payments={propertyPayments}
                  settings={data.settings}
                  initialBalance={selectedProperty.balanceAdjustment}
                  isFiltered={true}
                />
              ) : (
                <p className="text-[var(--muted)]">No activity recorded</p>
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

            {/* Balance Adjustment */}
            <div className="card">
              <h3 className="font-semibold mb-4">Balance Adjustment</h3>
              <p className="text-sm text-[var(--muted)] mb-3">
                Use this to correct the balance when historical data doesn&apos;t match your records.
                Positive values increase amount due, negative values add credit.
              </p>
              {editingBalanceAdjustment ? (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={balanceAdjustmentDraft}
                      onChange={(e) => setBalanceAdjustmentDraft(e.target.value)}
                      className="w-full"
                      style={{ paddingLeft: '1.75rem' }}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveBalanceAdjustment} className="btn-primary text-sm py-1 px-3">
                      Save
                    </button>
                    <button
                      onClick={() => setEditingBalanceAdjustment(false)}
                      className="btn-secondary text-sm py-1 px-3"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-medium">
                      {formatCurrency(selectedProperty.balanceAdjustment)}
                    </span>
                    <span className="text-sm text-[var(--muted)] ml-2">
                      {selectedProperty.balanceAdjustment < 0 ? '(adds credit)' : selectedProperty.balanceAdjustment > 0 ? '(adds to due)' : ''}
                    </span>
                  </div>
                  <button
                    onClick={startEditBalanceAdjustment}
                    className="text-[var(--primary)] hover:underline text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
