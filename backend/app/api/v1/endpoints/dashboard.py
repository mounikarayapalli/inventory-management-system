from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.dashboard import (
    CategoryStockResponse,
    DashboardSummaryResponse,
    LocationStockResponse,
    LowStockItemResponse,
    OutOfStockItemResponse,
    RecentTransactionResponse,
)
from app.services.dashboard_service import dashboard_service

router = APIRouter(dependencies=[Depends(require_roles("admin", "stock manager"))])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Dashboard summary KPIs",
    description="Retrieve high-level inventory totals and alert metrics.",
)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummaryResponse:
    """Get dashboard summary metrics."""
    return dashboard_service.get_summary(db)


@router.get(
    "/low-stock",
    response_model=List[LowStockItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Low stock alerts",
    description="Retrieve items whose on-hand quantity has breached minimum threshold.",
)
def get_low_stock(db: Session = Depends(get_db)) -> List[LowStockItemResponse]:
    """Get list of low-stock alert items."""
    return dashboard_service.get_low_stock_items(db)


@router.get(
    "/out-of-stock",
    response_model=List[OutOfStockItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Out of stock alerts",
    description="Retrieve items whose stock has been fully depleted.",
)
def get_out_of_stock(db: Session = Depends(get_db)) -> List[OutOfStockItemResponse]:
    """Get list of out-of-stock items."""
    return dashboard_service.get_out_of_stock_items(db)


@router.get(
    "/recent-transactions",
    response_model=List[RecentTransactionResponse],
    status_code=status.HTTP_200_OK,
    summary="Recent transaction feed",
    description="Retrieve most recent inventory transaction entries.",
)
def get_recent_transactions(
    limit: int = Query(10, ge=1, le=50, description="Max transactions to return"),
    db: Session = Depends(get_db),
) -> List[RecentTransactionResponse]:
    """Get recent transactions feed."""
    return dashboard_service.get_recent_transactions(db, limit=limit)


@router.get(
    "/category-stock",
    response_model=List[CategoryStockResponse],
    status_code=status.HTTP_200_OK,
    summary="Category stock breakdown",
    description="Retrieve inventory distribution across product categories.",
)
def get_category_stock(db: Session = Depends(get_db)) -> List[CategoryStockResponse]:
    """Get stock distribution by category."""
    return dashboard_service.get_category_stock(db)


@router.get(
    "/location-stock",
    response_model=List[LocationStockResponse],
    status_code=status.HTTP_200_OK,
    summary="Location stock breakdown",
    description="Retrieve inventory distribution across warehouse locations.",
)
def get_location_stock(db: Session = Depends(get_db)) -> List[LocationStockResponse]:
    """Get stock distribution by location."""
    return dashboard_service.get_location_stock(db)
