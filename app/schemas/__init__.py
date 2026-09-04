"""Schemas package initialization."""
from app.schemas.health import HealthResponse
from app.schemas.common import ApiResponse, ErrorDetail, ErrorResponse
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserBase, UserCreate, UserUpdate, UserResponse
from app.schemas.category import CategoryBase, CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.supplier import SupplierBase, SupplierCreate, SupplierUpdate, SupplierResponse
from app.schemas.location import LocationBase, LocationCreate, LocationUpdate, LocationResponse
from app.schemas.item import ItemBase, ItemCreate, ItemUpdate, ItemResponse
from app.schemas.transaction import (
    OpeningStockRequest,
    InwardRequest,
    OutwardRequest,
    DistributionRequest,
    ReturnRequest,
    AdjustmentRequest,
    AdjustmentResponse,
    AdjustmentUpdate,
    TransactionResponse,
)
from app.schemas.stock import StockResponse, StockDetailResponse, StockMovementResponse
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    LowStockItemResponse,
    OutOfStockItemResponse,
    RecentTransactionResponse,
    CategoryStockResponse,
    LocationStockResponse,
)
from app.schemas.report import (
    StockReportItem,
    MovementReportItem,
    InwardReportItem,
    OutwardReportItem,
)

__all__ = [
    "HealthResponse",
    "ApiResponse",
    "ErrorDetail",
    "ErrorResponse",
    "LoginRequest",
    "TokenResponse",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "SupplierBase",
    "SupplierCreate",
    "SupplierUpdate",
    "SupplierResponse",
    "LocationBase",
    "LocationCreate",
    "LocationUpdate",
    "LocationResponse",
    "ItemBase",
    "ItemCreate",
    "ItemUpdate",
    "ItemResponse",
    "OpeningStockRequest",
    "InwardRequest",
    "OutwardRequest",
    "DistributionRequest",
    "ReturnRequest",
    "AdjustmentRequest",
    "TransactionResponse",
    "StockResponse",
    "StockDetailResponse",
    "StockMovementResponse",
    "DashboardSummaryResponse",
    "LowStockItemResponse",
    "OutOfStockItemResponse",
    "RecentTransactionResponse",
    "CategoryStockResponse",
    "LocationStockResponse",
    "StockReportItem",
    "MovementReportItem",
    "InwardReportItem",
    "OutwardReportItem",
]
