// Isolated Mock Stock Data Layer (Item + Location wise stock balances)
// Used for UI availability checks and stock impact previews.
// Note: Production backend GET /api/stock will be the source of truth.

export const MOCK_STOCK_BALANCES = [
  { item_id: 101, location_id: 1, available_stock: 650 }, // Calibo Badges @ Vijayawada
  { item_id: 101, location_id: 2, available_stock: 1000 }, // Calibo Badges @ Vizag
  { item_id: 102, location_id: 1, available_stock: 99 },  // Calibo Branded Folders @ Vijayawada
  { item_id: 106, location_id: 1, available_stock: 7 },   // Diaries+Pens @ Vijayawada
  { item_id: 107, location_id: 1, available_stock: 160 }, // Key Chains @ Vijayawada
  { item_id: 108, location_id: 1, available_stock: 67 },  // Laptop Bags + Water Bottles @ Vijayawada
  { item_id: 108, location_id: 2, available_stock: 50 },  // Laptop Bags + Water Bottles @ Vizag
  { item_id: 109, location_id: 1, available_stock: 3 },   // Lepakshi Gifts @ Vijayawada
  { item_id: 110, location_id: 1, available_stock: 1 },   // Staff T Shirts @ Vijayawada
  { item_id: 113, location_id: 1, available_stock: 700 }, // Student Brouchures @ Vijayawada
  { item_id: 114, location_id: 1, available_stock: 18 },  // Student T Shirts @ Vijayawada
  { item_id: 116, location_id: 1, available_stock: 124 }, // USB Cables @ Vijayawada
  { item_id: 116, location_id: 2, available_stock: 150 }, // USB Cables @ Vizag
];

// Helper to query available stock for a specific Item + Location pair
export const getMockAvailableStock = (itemId, locationId) => {
  if (!itemId || !locationId) return 0;
  const found = MOCK_STOCK_BALANCES.find(
    (s) => s.item_id === Number(itemId) && s.location_id === Number(locationId)
  );
  return found ? found.available_stock : 0;
};
