'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Property, Payment } from '@/lib/types';
import { generateId, getTodayString } from '@/lib/data';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  selectedPropertyId?: string;
  onSave: (payment: Payment) => void;
}

export default function AddPaymentModal({
  isOpen,
  onClose,
  properties,
  selectedPropertyId,
  onSave,
}: AddPaymentModalProps) {
  const [propertyId, setPropertyId] = useState(selectedPropertyId || properties[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [notes, setNotes] = useState('');

  // Sync propertyId when selectedPropertyId prop changes
  useEffect(() => {
    if (selectedPropertyId) {
      setPropertyId(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payment: Payment = {
      id: generateId(),
      propertyId,
      amount: parseFloat(amount),
      receivedDate: date,
      notes,
    };

    onSave(payment);

    // Reset form
    setAmount('');
    setNotes('');
    setDate(getTodayString());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
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

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Amount
          </label>
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
              style={{ paddingLeft: '1.75rem' }}
              placeholder="0.00"
              required
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Date Received
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Check #1234"
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
            Save Payment
          </button>
        </div>
      </form>
    </Modal>
  );
}
