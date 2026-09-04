// Documentation of Excel Workbook Data Mapping to Frontend Master Contracts
// Excel File: Stock_Register_AI Academy_Last update 23Jul2026.xlsx

export const DATA_MAPPING_NOTES = {
  excelFile: 'Stock_Register_AI Academy_Last update 23Jul2026.xlsx',
  sheetsInspected: [
    'Stock Register',
    'Sheet1',
    'Stock Register (2)',
  ],

  itemCodeMapping: {
    sourceSheet: 'Sheet1',
    description: 'Maps item names to actual SKU codes (S101 through S117).',
    examples: [
      { code: 'S101', name: 'Calibo Badges' },
      { code: 'S102', name: 'Calibo Branded Folders' },
      { code: 'S106', name: 'Diaries+Pens' },
      { code: 'S108', name: 'Laptop Bags + Water Bottles' },
      { code: 'S110', name: 'Staff T Shirts' },
      { code: 'S114', name: 'Student T Shirts' },
      { code: 'S116', name: 'USB Cables' },
    ],
  },

  conceptualMappings: [
    {
      excelField: 'Hub',
      backendField: 'location_name (Location entity)',
      note: 'Excel "Hub" values (Vijayawada, Vizag) map conceptually to storage Location master records. The backend schema name "Location" remains unchanged.',
    },
    {
      excelField: 'Received From',
      backendField: 'supplier_name (Supplier entity)',
      note: 'Excel "Received From" entries (Red Chariot, Local Print, Subin P) map conceptually to Supplier master records for UI display reference.',
    },
  ],

  unmappedExcelFields: [
    {
      excelField: 'Qty Received / Qty Utilised',
      reason: 'These are transaction quantities recorded during stock inward/outward activities, not master entity properties.',
    },
    {
      excelField: 'Issued To / Department / Purpose',
      reason: 'These belong to stock issue/distribution transaction logs (e.g. KL Event, RTIH Event, Admissions Team).',
    },
    {
      excelField: 'Balance Physical Stock / Unaccounted Stock',
      reason: 'Calculated inventory levels managed by the backend engine (source of truth). Frontend does not calculate or store these.',
    },
  ],
};

export default DATA_MAPPING_NOTES;
