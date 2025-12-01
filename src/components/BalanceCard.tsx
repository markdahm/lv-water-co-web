'use client';

import { Property, MeterReading, Payment, BillingSettings } from '@/lib/types';
import { calculatePropertyBalance, formatCurrency } from '@/lib/billing';

interface BalanceCardProps {
  property: Property;
  readings: MeterReading[];
  payments: Payment[];
  settings: BillingSettings;
  onRecordPayment?: () => void;
  onLogReading?: () => void;
  onNameClick?: () => void;
  isSelected?: boolean;
}

export default function BalanceCard({
  property,
  readings,
  payments,
  settings,
  onRecordPayment,
  onLogReading,
  onNameClick,
  isSelected,
}: BalanceCardProps) {
  const balance = calculatePropertyBalance(property, readings, payments, settings);
  const isPositive = balance >= 0;

  return (
    <div className={`card transition-all ${isSelected ? 'ring-2 ring-[var(--primary)]' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3
            className={`font-semibold text-lg cursor-pointer hover:text-[var(--primary)] transition-colors ${isSelected ? 'text-[var(--primary)]' : ''}`}
            onClick={onNameClick}
          >
            {property.name}
          </h3>
          <p className="text-sm text-[var(--muted)]">{property.address.split('\n')[0]}</p>
        </div>
        <div className={`text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          <p className="text-2xl font-bold">{formatCurrency(Math.abs(balance))}</p>
          <p className="text-sm">{isPositive ? 'Credit' : 'Due'}</p>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onRecordPayment}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-green-500/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
        >
          <DollarIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Payment</span>
        </button>
        <button
          onClick={onLogReading}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-[var(--primary)]/30 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
        >
          <MeterIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Reading</span>
        </button>
      </div>
    </div>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MeterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
