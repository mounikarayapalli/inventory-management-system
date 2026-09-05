import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { FileBarChart } from 'lucide-react';

export const ReportsPage = () => {
  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate stock valuation, ledger statements, transaction summaries, and audit reports"
        breadcrumbs={['Home', 'Reports']}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <Card title="Stock Valuation Report" subtitle="WAC valuation per item & category">
          <EmptyState
            title="Valuation Report Placeholder"
            description="Report parameters and downloadable exports will connect here."
            icon={FileBarChart}
          />
        </Card>

        <Card title="Movement Ledger Report" subtitle="Inward vs Outward summary statement">
          <EmptyState
            title="Ledger Summary Placeholder"
            description="Periodical transaction reports will connect here."
            icon={FileBarChart}
          />
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
