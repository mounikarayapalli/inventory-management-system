from typing import List
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.stock import StockDetailResponse, StockMovementResponse, StockResponse
from app.services.stock_service import stock_service

router = APIRouter(dependencies=[Depends(require_roles("admin", "stock manager"))])


@router.get(
    "",
    response_model=List[StockResponse],
    status_code=status.HTTP_200_OK,
    summary="List inventory stock levels",
    description="Retrieve aggregate stock levels and WAC valuations across all catalog items.",
)
async def list_stock(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    db: Session = Depends(get_db),
) -> List[StockResponse]:
    """List stock balances."""
    return stock_service.list_stock(db, skip=skip, limit=limit)


@router.get(
    "/movements",
    response_model=List[StockMovementResponse],
    status_code=status.HTTP_200_OK,
    summary="List stock movements",
    description="Retrieve chronological log of all stock ledger movements.",
)
async def list_movements(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    db: Session = Depends(get_db),
) -> List[StockMovementResponse]:
    """List stock movements."""
    return stock_service.list_movements(db, skip=skip, limit=limit)


@router.get(
    "/{item_id}",
    response_model=StockDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get item stock details",
    description="Retrieve stock breakdown and WAC valuation for a specific item across all locations.",
)
async def get_item_stock(
    item_id: int = Path(..., ge=1, description="Item identifier"),
    db: Session = Depends(get_db),
) -> StockDetailResponse:
    """Get stock details for a single item."""
    return stock_service.get_stock_by_item(db, item_id)
