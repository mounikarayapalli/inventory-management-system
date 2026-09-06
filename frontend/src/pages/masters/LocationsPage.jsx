import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import LocationFormModal from '../../components/forms/LocationFormModal';
import { useRole } from '../../context/RoleContext';
import locationsAPI from '../../api/locations';
import { Plus, Search, Eye, Edit2 } from 'lucide-react';

export const LocationsPage = () => {
  const { isAdmin } = useRole();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedLocation, setSelectedLocation] = useState(null);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await locationsAPI.listLocations();
      setLocations(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const filteredLocations = locations.filter((loc) =>
    (loc.location_name || loc.name || '').toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSaveLocation = async (formData) => {
    try {
      const locId = selectedLocation?.id || selectedLocation?.location_id;
      if (modalMode === 'add') {
        await locationsAPI.createLocation(formData);
      } else if (modalMode === 'edit' && locId) {
        await locationsAPI.updateLocation(locId, formData);
      }
      setModalOpen(false);
      await loadLocations();
    } catch (err) {
      alert(err.message || 'Failed to save location');
    }
  };

  const columns = [
    {
      header: 'Location Name',
      key: 'location_name',
      render: (row) => (
        <strong style={{ color: 'var(--neutral-900)' }}>{row.location_name || row.name}</strong>
      ),
    },
    {
      header: 'Code',
      key: 'code',
      render: (row) => (row.code ? <code>{row.code}</code> : <span>—</span>),
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

        {loading ? (
          <LoadingState message="Loading locations..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadLocations} />
        ) : (
          <Table
            columns={columns}
            data={filteredLocations}
            emptyTitle="No locations found"
            emptyDescription="Try adjusting your search filter or add a new location."
          />
        )}
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
