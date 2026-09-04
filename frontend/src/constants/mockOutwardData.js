// Static Mock Data for Outward Stock Transactions (/api/transactions/outward)

export const MOCK_OUTWARD_DATA = [
  {
    id: 1,
    outward_no: 'OUT-2026-101',
    item_id: 108,
    item_code: 'S108',
    item_name: 'Laptop Bags + Water Bottles',
    location_id: 1,
    location_name: 'Vijayawada Hub',
    quantity: 38,
    issued_to: 'Admissions Team',
    purpose: 'KL Event Dispatches',
    outward_date: '2026-07-05',
    remarks: 'Dispatched 38 units for KL Event',
    already_distributed: 30, // 30 of 38 distributed
  },
  {
    id: 2,
    outward_no: 'OUT-2026-102',
    item_id: 114,
    item_code: 'S114',
    item_name: 'Student T Shirts',
    location_id: 1,
    location_name: 'Vijayawada Hub',
    quantity: 33,
    issued_to: 'Jagan',
    purpose: 'KL Event Student Volunteers',
    outward_date: '2026-07-06',
    remarks: 'Issued to student volunteer team',
    already_distributed: 33, // Fully distributed
  },
  {
    id: 3,
    outward_no: 'OUT-2026-103',
    item_id: 113,
    item_code: 'S113',
    item_name: 'Student Brouchures',
    location_id: 1,
    location_name: 'Vijayawada Hub',
    quantity: 500,
    issued_to: 'Avinash',
    purpose: 'KKR KSR College Drive',
    outward_date: '2026-07-10',
    remarks: 'College event recruitment drive',
    already_distributed: 200, // 200 of 500 distributed
  },
];
