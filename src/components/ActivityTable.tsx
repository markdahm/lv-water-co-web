'use client';

import { useMemo, useState } from 'react';
import { Property, MeterReading, Payment } from '@/lib/types';
import { formatDate } from '@/lib/data';
import { formatCurrency } from '@/lib/billing';

interface ActivityTableProps {
  properties: Property[];
  readings: MeterReading[];
  payments: Payment[];
}

type SortField = 'date' | 'property' | 'type' | 'amount';
type SortDirection = 'asc' | 'desc';

interface ActivityItem {
  id: string;
  date: string;
  type: 'payment' | 'reading';
  propertyId: string;
  propertyName: string;
  description: string;
  amount?: number;
  usage?: number;
}

export default function ActivityTable({ properties, readings, payments }: ActivityTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const propertyMap = useMemo(() => {
    return new Map(properties.map(p => [p.id, p.name]));
  }, [properties]);

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add payments
    for (const payment of payments) {
      items.push({
        id: `payment-${payment.id}`,
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
