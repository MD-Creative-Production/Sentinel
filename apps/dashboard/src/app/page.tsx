import type { Metadata } from 'next';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { AlertHistoryTable } from '@/components/dashboard/AlertHistoryTable';
import { SecurityReportingDashboard } from '@/components/dashboard/SecurityReportingDashboard';

export const metadata: Metadata = {
  title: 'Overview',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
        <p className="mt-1 text-sm text-gray-400">
          Real-time monitoring across Stellar/EVM networks
        </p>
      </div>

      {/* KPI row */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Alerts" value={27} trend="+3 today" variant="default" />
        <KpiCard label="Critical Unresolved" value={2} trend="Needs attention" variant="danger" />
        <KpiCard label="Resolved" value={20} trend="74% resolution rate" variant="success" />
        <KpiCard label="Monitored Contracts" value={14} trend="Across 3 chains" variant="info" />
      </section>

      {/* Alert history */}
      <section aria-label="Alert history">
        <AlertHistoryTable />
      </section>

      {/* Security report */}
      <section aria-label="Security report">
        <SecurityReportingDashboard />
      </section>
    </div>
  );
}
