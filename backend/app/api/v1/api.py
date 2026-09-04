from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    categories,
    dashboard,
    health,
    items,
    locations,
    reports,
    stock,
    suppliers,
    transactions,
    users,
)

api_router = APIRouter()

# Core health endpoint
api_router.include_router(health.router, tags=["Health"])

# 1. Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# 2. Users
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# 3. Items
api_router.include_router(items.router, prefix="/items", tags=["Items"])

# 4. Categories
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])

# 5. Suppliers
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])

# 6. Locations
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])

# 7. Inventory Transactions
api_router.include_router(transactions.router, tags=["Inventory Transactions"])

# 8. Stock
api_router.include_router(stock.router, prefix="/stock", tags=["Stock"])

# 9. Dashboard
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

# 10. Reports
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
