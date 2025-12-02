'use client';

import { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { Property, MeterReading, BillingSettings } from '@/lib/types';
import { generateId, getTodayString } from '@/lib/data';
import { getCurrentBillingPeriod, calculateBill, formatCurrency } from '@/lib/billing';

interface AddReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  readings: MeterReading[];
  settings?: BillingSettings;
  selectedPropertyId?: string;
  onSave: (reading: MeterReading) => void;
}

export default function AddReadingModal({
  isOpen,
  onClose,
  properties,
  readings,
  settings,
  selectedPropertyId,
  onSave,
}: AddReadingModalProps) {
  const [propertyId, setPropertyId] = useState(selectedPropertyId || properties[0]?.id || '');
  const [meterId, setMeterId] = useState('');
  const [readingValue, setReadingValue] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [billingPeriod, setBillingPeriod] = useState(getCurrentBillingPeriod());

  // Sync propertyId when selectedPropertyId prop changes
  useEffect(() => {
    if (selectedPropertyId) {
      setPropertyId(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === propertyId),
    [properties, propertyId]
  );

  const meters = selectedProperty?.meters || [];

  // Set first meter when property changes
  useMemo(() => {
    if (meters.length > 0 && !meters.find((m) => m.id === meterId)) {
      setMeterId(meters[0].id);
    }
  }, [meters, meterId]);

  const previousReading = useMemo(() => {
    if (!meterId) return null;
    return readings
      .filter((r) => r.meterId === meterId)
      .sort((a, b) => b.billingPeriod.localeCompare(a.billingPeriod))[0];
  }, [readings, meterId]);

  // Calculate cost preview based on entered reading value
  const costPreview = useMemo(() => {
    if (!settings || !readingValue) return null;
    const newValue = parseInt(readingValue, 10);
    if (isNaN(newValue)) return null;
    const previousValue = previousReading?.readingValue || 0;
    const usage = Math.max(0, (newValue - previousValue) * 10);
    return calculateBill(usage, settings);
  }, [settings, readingValue, previousReading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newValue = parseInt(readingValue, 10);
    const previousValue = previousReading?.readingValue || 0;
    const rawUsage = newValue - previousValue;

    const reading: MeterReading = {
      id: generateId(),
      meterId,
      propertyId,
      readingDate: date,
      billingPeriod,
      readingValue: newValue,
      rawUsage,
      usage: rawUsage * 10,
    };

    onSave(reading);

    // Reset form
    setReadingValue('');
    setDate(getTodayString());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Meter Reading">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Property
          </label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        {meters.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Meter
            </label>
            <select
              value={meterId}
              onChange={(e) => setMeterId(e.target.value)}
              required
            >
              {meters.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Billing Period
          </label>
          <input
            type="month"
            value={billingPeriod}
            onChange={(e) => setBillingPeriod(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Reading Value
          </label>
          <input
            type="number"
            value={readingValue}
            onChange={(e) => setReadingValue(e.target.value)}
            placeholder={previousReading ? `Previous: ${previousReading.readingValue.toLocaleString()}` : 'Enter meter reading'}
            required
            inputMode="numeric"
          />
          {previousReading && (
            <p className="text-sm text-[var(--muted)] mt-1">
              Previous reading: {previousReading.readingValue.toLocaleString()}
            </p>
          )}
          {costPreview && (
            <div className="mt-2 p-2 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg">
              <p className="text-sm">
                <span className="text-[var(--muted)]">Usage:</span>{' '}
                <span className="font-medium">{costPreview.totalGallons.toLocaleString()} gal</span>
              </p>
              <p className="text-sm">
                <span className="text-[var(--muted)]">Estimated cost:</span>{' '}
                <span className="font-semibold text-[var(--primary)]">{formatCurrency(costPreview.totalAmount)}</span>
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Reading Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary"
          >
            Save Reading
          </button>
        </div>
      </form>
    </Modal>
  );
}
