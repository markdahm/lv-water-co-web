'use client';

import { useMemo, useState } from 'react';
import { Property, MeterReading, Payment } from '@/lib/types';
import { formatDate } from '@/lib/data';
import { formatCurrency } from '@/lib/billing';

interface ActivityTableProps {
  properties: Property[];
  readings: MeterReading[];
  payments: Payment[];
  onDeletePayment?: (paymentId: string) => void;
  onDeleteReading?: (readingId: string) => void;
}

type SortField = 'date' | 'property' | 'type' | 'amount';
type SortDirection = 'asc' | 'desc';

interface ActivityItem {
  id: string;
  originalId: string;
  date: string;
  type: 'payment' | 'reading';
  propertyId: string;
  propertyName: string;
  description: string;
  amount?: number;
  usage?: number;
}

export default function ActivityTable({ properties, readings, payments, onDeletePayment, onDeleteReading }: ActivityTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (activity: ActivityItem) => {
    if (activity.type === 'payment' && onDeletePayment) {
      onDeletePayment(activity.originalId);
    } else if (activity.type === 'reading' && onDeleteReading) {
      onDeleteReading(activity.originalId);
    }
    setDeleteConfirm(null);
  };

  const propertyMap = useMemo(() => {
    return new Map(properties.map(p => [p.id, p.name]));
  }, [properties]);

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add payments
    for (const payment of payments) {
      items.push({
        id: `payment-${payment.id}`,
        originalId: payment.id,
        date: payment.receivedDate,
        type: 'payment',
        propertyId: payment.propertyId,
        propertyName: propertyMap.get(payment.propertyId) || 'Unknown',
        description: payment.notes || 'Payment received',
        amount: payment.amount,
      });
    }

    // Add readings
    for (const reading of readings) {
      items.push({
        id: `reading-${reading.id}`,
        originalId: reading.id,
        date: reading.readingDate,
        type: 'reading',
        propertyId: reading.propertyId,
        propertyName: propertyMap.get(reading.propertyId) || 'Unknown',
        description: `Meter reading: ${reading.readingValue.toLocaleString()}`,
        usage: reading.usage,
      });
    }

    // Sort
    items.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'property':
          comparison = a.propertyName.localeCompare(b.propertyName);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'amount':
          const aVal = a.amount || a.usage || 0;
          const bVal = b.amount || b.usage || 0;
          comparison = aVal - bVal;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [payments, readings, propertyMap, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Mobile card view
  const MobileActivityList = () => (
    <div className="md:hidden space-y-3">
      {activities.slice(0, 20).map((activity) => (
        <div key={activity.id} className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{activity.propertyName}</p>
              <p className="text-sm text-[var(--muted)]">{formatDate(activity.date)}</p>
            </div>
            <div className="text-right">
              {activity.type === 'payment' ? (
                <p className="text-green-500 font-semibold">
                  +{formatCurrency(activity.amount!)}
                </p>
              ) : (
                <p className="text-[var(--primary)] font-semibold">
                  {activity.usage?.toLocaleString()} gal
                </p>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activity.type === 'payment'
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-[var(--primary)]/20 text-[var(--primary)]'
              }`}>
                {activity.type === 'payment' ? 'Payment' : 'Reading'}
              </span>
            </div>
          </div>
          {activity.description && activity.type === 'payment' && activity.description !== 'Payment received' && (
            <p className="text-sm text-[var(--muted)] mt-2">{activity.description}</p>
          )}
          {(onDeletePayment || onDeleteReading) && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              {deleteConfirm === activity.id ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Delete this {activity.type}?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1 text-sm rounded-lg bg-[var(--border)] hover:bg-[var(--border)]/80"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(activity)}
                      className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(activity.id)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Desktop table view
  const DesktopActivityTable = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th
              className="cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => handleSort('date')}
            >
              Date <SortIcon field="date" />
            </th>
            <th
              className="cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => handleSort('property')}
            >
              Property <SortIcon field="property" />
            </th>
            <th
              className="cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => handleSort('type')}
            >
              Type <SortIcon field="type" />
            </th>
            <th>Description</th>
            <th
              className="cursor-pointer hover:text-[var(--foreground)] text-right"
              onClick={() => handleSort('amount')}
            >
              Amount <SortIcon field="amount" />
            </th>
            {(onDeletePayment || onDeleteReading) && <th className="w-24"></th>}
          </tr>
        </thead>
        <tbody>
          {activities.slice(0, 50).map((activity) => (
            <tr key={activity.id}>
              <td>{formatDate(activity.date)}</td>
              <td>{activity.propertyName}</td>
              <td>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.type === 'payment'
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-[var(--primary)]/20 text-[var(--primary)]'
                }`}>
                  {activity.type === 'payment' ? 'Payment' : 'Reading'}
                </span>
              </td>
              <td className="text-[var(--muted)]">{activity.description}</td>
              <td className="text-right font-medium">
                {activity.type === 'payment' ? (
                  <span className="text-green-500">+{formatCurrency(activity.amount!)}</span>
                ) : (
                  <span className="text-[var(--primary)]">{activity.usage?.toLocaleString()} gal</span>
                )}
              </td>
              {(onDeletePayment || onDeleteReading) && (
                <td className="text-right">
                  {deleteConfirm === activity.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs rounded bg-[var(--border)] hover:bg-[var(--border)]/80"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(activity)}
                        className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(activity.id)}
                      className="p-1 text-[var(--muted)] hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <MobileActivityList />
      <DesktopActivityTable />
    </div>
  );
}
