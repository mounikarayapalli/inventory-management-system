from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.report import (
    InwardReportItem,
    MovementReportItem,
    OutwardReportItem,
    StockReportItem,
)
from app.services.report_service import report_service

router = APIRouter(dependencies=[Depends(require_roles("admin", "stock manager"))])


@router.get(
    "/stock",
    response_model=List[StockReportItem],
    status_code=status.HTTP_200_OK,
    summary="Stock report",
    description="Generate comprehensive stock audit report across all items and locations.",
)
def get_stock_report(
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db),
) -> List[StockReportItem]:
    """Generate stock status report."""
    return report_service.get_stock_report(db, location_id=location_id, category_id=category_id)


@router.get(
    "/movements",
    response_model=List[MovementReportItem],
    status_code=status.HTTP_200_OK,
    summary="Movements report",
    description="Generate historical stock movement audit trail report with optional date filtering.",
)
def get_movements_report(
    from_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    item_id: Optional[int] = Query(None, description="Filter by item ID"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    movement_type: Optional[str] = Query(None, description="Filter by movement type (OPENING, INWARD, OUTWARD, RETURN, ADJUSTMENT)"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Max rows to return"),
    db: Session = Depends(get_db),
) -> List[MovementReportItem]:
    """Generate stock movements audit report."""
    return report_service.get_movements_report(
        db,
        from_date=from_date,
        to_date=to_date,
        item_id=item_id,
        location_id=location_id,
        movement_type=movement_type,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/inward",
    response_model=List[InwardReportItem],
    status_code=status.HTTP_200_OK,
    summary="Inward stock report",
    description="Generate inbound receipts and procurement intake report with optional date filtering.",
)
def get_inward_report(
    from_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    supplier_id: Optional[int] = Query(None, description="Filter by supplier ID"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Max rows to return"),
    db: Session = Depends(get_db),
) -> List[InwardReportItem]:
    """Generate inbound receiving report."""
    return report_service.get_inward_report(
        db,
        from_date=from_date,
        to_date=to_date,
        supplier_id=supplier_id,
        location_id=location_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/outward",
    response_model=List[OutwardReportItem],
    status_code=status.HTTP_200_OK,
    summary="Outward stock report",
    description="Generate outbound dispatch and stock issue report with optional date filtering.",
)
def get_outward_report(
    from_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Max rows to return"),
    db: Session = Depends(get_db),
) -> List[OutwardReportItem]:
    """Generate outbound dispatch report."""
    return report_service.get_outward_report(
        db,
        from_date=from_date,
        to_date=to_date,
        location_id=location_id,
        skip=skip,
        limit=limit,
    )
