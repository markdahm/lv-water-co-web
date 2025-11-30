'use client';

import { useState, useEffect } from 'react';
import { AppData, Payment, MeterReading } from '@/lib/types';
import { loadData, saveData } from '@/lib/data';
import BalanceCard from '@/components/BalanceCard';
import ActivityTable from '@/components/ActivityTable';
import AddPaymentModal from '@/components/AddPaymentModal';
import AddReadingModal from '@/components/AddReadingModal';

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();

  useEffect(() => {
    loadData()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAddPayment = async (payment: Payment) => {
    if (!data) return;

    const newData = {
      ...data,
      payments: [...data.payments, payment],
    };

    setData(newData);
    await saveData(newData);
  };

  const handleAddReading = async (reading: MeterReading) => {
    if (!data) return;

    const newData = {
      ...data,
      readings: [...data.readings, reading],
    };

    setData(newData);
    await saveData(newData);
  };

  const openPaymentModal = (propertyId?: string) => {
    setSelectedPropertyId(propertyId);
    setShowPaymentModal(true);
  };

  const openReadingModal = (propertyId?: string) => {
    setSelectedPropertyId(propertyId);
    setShowReadingModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3366AA]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load data</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if we should show billing reminder (1st-5th of month)
  const today = new Date();
  const dayOfMonth = today.getDate();
  const showBillingReminder = dayOfMonth >= 1 && dayOfMonth <= 5;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:hidden">Dashboard</h1>
        <h1 className="text-2xl font-bold hidden md:block">Account Balances</h1>
      </div>

      {/* Billing Reminder */}
      {showBillingReminder && (
        <div className="mb-6 p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[var(--primary)]/20 rounded-full">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Billing Reminder</h3>
              <p className="text-[var(--muted)] text-sm mt-1">
                It&apos;s the beginning of the month. Time to log meter readings and generate bills!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {data.properties.map((property) => (
          <BalanceCard
            key={property.id}
            property={property}
            readings={data.readings}
            payments={data.payments}
            settings={data.settings}
            onRecordPayment={() => openPaymentModal(property.id)}
            onLogReading={() => openReadingModal(property.id)}
          />
        ))}
      </div>

      {/* Activity History */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <ActivityTable
          properties={data.properties}
          readings={data.readings}
          payments={data.payments}
        />
      </div>

      {/* Modals */}
      <AddPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        properties={data.properties}
        selectedPropertyId={selectedPropertyId}
        onSave={handleAddPayment}
      />

      <AddReadingModal
        isOpen={showReadingModal}
        onClose={() => setShowReadingModal(false)}
        properties={data.properties}
        readings={data.readings}
        selectedPropertyId={selectedPropertyId}
        onSave={handleAddReading}
      />
    </div>
  );
}
