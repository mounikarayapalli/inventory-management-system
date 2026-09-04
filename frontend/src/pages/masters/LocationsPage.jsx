import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import LocationFormModal from '../../components/forms/LocationFormModal';
import { useRole, DevRoleSwitcher } from '../../context/RoleContext';

import { REAL_COMPANY_LOCATIONS } from '../../constants/companyInventoryData';

import { Plus, Search, Eye, Edit2 } from 'lucide-react';

export const LocationsPage = () => {
  const { isAdmin } = useRole();
  const [locations, setLocations] = useState(REAL_COMPANY_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedLocation, setSelectedLocation] = useState(null);

  const filteredLocations = locations.filter((loc) =>
    loc.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setSelectedLocation(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setSelectedLocation(loc);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleOpenView = (loc) => {
    setSelectedLocation(loc);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSaveLocation = (formData) => {
    if (modalMode === 'add') {
      const newLoc = {
        id: Date.now(),
        ...formData,
      };
      setLocations([newLoc, ...locations]);
    } else if (modalMode === 'edit' && selectedLocation) {
      setLocations(
        locations.map((l) => (l.id === selectedLocation.id ? { ...l, ...formData } : l))
      );
    }
  };

  const columns = [
    {
      header: 'Location Name',
      key: 'location_name',
      render: (row) => (
        <strong style={{ color: 'var(--neutral-900)' }}>{row.location_name}</strong>
      ),
    },
    {
      header: 'Description',
      key: 'description',
      render: (row) => <span>{row.description || '—'}</span>,
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'error'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenView(row)}
            title="View Details"
          >
            <Eye size={14} />
            <span>View</span>
          </Button>

          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Location"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <DevRoleSwitcher />

      <PageHeader
        title="Locations"
        subtitle="Manage inventory storage locations."
        actions={
          isAdmin && (
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Add Location
            </Button>
          )
        }
      />

      <Card>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
          <div style={{ maxWidth: '360px' }}>
            <Input
              placeholder="Search location name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredLocations}
          emptyTitle="No locations found"
          emptyDescription="Try adjusting your search filter or add a new location."
        />
      </Card>

      <LocationFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveLocation}
        location={selectedLocation}
        mode={modalMode}
      />
    </div>
  );
};

export default LocationsPage;
