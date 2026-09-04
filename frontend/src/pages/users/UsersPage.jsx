import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { Plus, Users } from 'lucide-react';

export const UsersPage = () => {
  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts, roles (Admin / Stock Manager), and access permissions"
        breadcrumbs={['Home', 'Users']}
        actions={
          <Button variant="primary" icon={Plus} disabled>
            Add New User
          </Button>
        }
      />

      <Card title="System Users Directory" subtitle="All registered product users and assigned roles">
        <EmptyState
          title="Users Placeholder"
          description="User account administration, role assignments, and status toggles will render here."
          icon={Users}
        />
      </Card>
    </div>
  );
};

export default UsersPage;
