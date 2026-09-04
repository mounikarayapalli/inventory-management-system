"""Services package initialization."""
from app.services.auth_service import auth_service
from app.services.user_service import user_service
from app.services.category_service import category_service
from app.services.supplier_service import supplier_service
from app.services.location_service import location_service
from app.services.item_service import item_service
from app.services.transaction_service import transaction_service
from app.services.stock_service import stock_service
from app.services.dashboard_service import dashboard_service
from app.services.report_service import report_service
from app.services import inventory_logic

__all__ = [
    "auth_service",
    "user_service",
    "category_service",
    "supplier_service",
    "location_service",
    "item_service",
    "transaction_service",
    "stock_service",
    "dashboard_service",
    "report_service",
    "inventory_logic",
]
