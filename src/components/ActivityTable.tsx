'use client';

import { useMemo, useState } from 'react';
import { Property, MeterReading, Payment } from '@/lib/types';
import { formatDate } from '@/lib/data';
import { formatCurrency } from '@/lib/billing';

export type SortField = 'date' | 'property' | 'type' | 'amount';
export type SortDirection = 'asc' | 'desc';

interface ActivityTableProps {
  properties: Property[];
  readings: MeterReading[];
  payments: Payment[];
  onEdit?: (activity: ActivityItem) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
}

export interface ActivityItem {
  id: string;
  originalId: string;
  date: string;
  type: 'payment' | 'reading';
  propertyId: string;
  propertyName: string;
  description: string;
  amount?: number;
  usage?: number;
  readingValue?: number;
}

export default function ActivityTable({
  properties,
  readings,
  payments,
  onEdit,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
}: ActivityTableProps) {
  const [internalSortField, setInternalSortField] = useState<SortField>('date');
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>('desc');

  // Use external props if provided, otherwise use internal state
  const sortField = externalSortField ?? internalSortField;
  const sortDirection = externalSortDirection ?? internalSortDirection;

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
        readingValue: reading.readingValue,
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
    // Only allow internal sorting if not externally controlled
    if (externalSortField !== undefined) return;

    if (internalSortField === field) {
      setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setInternalSortField(field);
      setInternalSortDirection('desc');
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
          {onEdit && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => onEdit(activity)}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
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
            {onEdit && <th className="w-16"></th>}
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
              {onEdit && (
                <td className="text-right">
                  <button
                    onClick={() => onEdit(activity)}
                    className="p-1 text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
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
