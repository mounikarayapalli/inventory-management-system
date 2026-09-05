// Static Mock Data for Stock Adjustments (/api/transactions/adjustments)

export const MOCK_ADJUSTMENTS_DATA = [
  {
    id: 1,
    item_id: 109,
    item_code: 'S109',
    item_name: 'Lepakshi Gifts',
    location_id: 1,
    location_name: 'Vijayawada Hub',
    quantity_change: -1,
    reason: 'Damaged gift item found during physical count',
    adjustment_date: '2026-07-14',
    created_by: 'Admin User',
    status: 'Completed',
  },
  {
    id: 2,
    item_id: 101,
    item_code: 'S101',
    item_name: 'Calibo Badges',
    location_id: 1,
    location_name: 'Vijayawada Hub',
    quantity_change: +20,
    reason: 'Found extra uncounted badge stock in storage box',
    adjustment_date: '2026-07-16',
    created_by: 'Admin User',
    status: 'Completed',
  },
];
