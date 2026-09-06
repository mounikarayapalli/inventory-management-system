import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import UserFormModal from '../../components/users/UserFormModal';
import { useRole } from '../../context/RoleContext';
import usersAPI from '../../api/users';

import { Plus, Users, Shield, UserCheck, AlertCircle, Edit } from 'lucide-react';

export const UsersPage = () => {
  const { currentRole, ROLES } = useRole();
  const isAdmin = currentRole === ROLES.ADMIN;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersAPI.listUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message || 'Failed to load system users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingUser) {
        await usersAPI.updateUser(editingUser.id || editingUser.user_id, payload);
      } else {
        await usersAPI.createUser(payload);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'ID',
      key: 'id',
      render: (r) => <code>#{r.id || r.user_id}</code>,
    },
    {
      header: 'Username',
      key: 'username',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={16} style={{ color: 'var(--primary-600)' }} />
          <strong style={{ color: 'var(--neutral-900)' }}>{r.username}</strong>
        </div>
      ),
    },
    {
      header: 'Email',
      key: 'email',
      render: (r) => r.email,
    },
    {
      header: 'Role',
      key: 'role',
      render: (r) => {
        const roleStr = (r.role || '').toLowerCase();
        const isAdm = roleStr.includes('admin');
        return (
          <Badge variant={isAdm ? 'primary' : 'info'} icon={Shield}>
            {r.role ? r.role.toUpperCase() : 'USER'}
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (r) => (
        <Badge variant={r.is_active ? 'success' : 'neutral'}>
          {r.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Created At',
      key: 'created_at',
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (r) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Edit}
          disabled={!isAdmin}
          onClick={() => handleOpenEditModal(r)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts, roles (Admin / Stock Manager), and access permissions"
        breadcrumbs={['Home', 'Users']}
        actions={
          <Button
            variant="primary"
            icon={Plus}
            disabled={!isAdmin}
            onClick={handleOpenCreateModal}
          >
            Add New User
          </Button>
        }
      />

      {!isAdmin && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--info-50, #eff6ff)',
            border: '1px solid var(--info-200, #bfdbfe)',
            borderRadius: '8px',
            color: 'var(--info-800, #1e40af)',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}
        >
          <strong>Read-Only Mode:</strong> User account creation and updates are restricted to System Administrators.
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--error-50, #fef2f2)',
            border: '1px solid var(--error-200, #fecaca)',
            color: 'var(--error-700, #b91c1c)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <Card title="System Users Directory" subtitle="All registered product users and assigned roles">
        <Table
          columns={columns}
          data={users}
          emptyTitle="No system users found"
          emptyDescription="User account records will render here."
        />
      </Card>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingUser}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default UsersPage;
