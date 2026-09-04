"""API endpoints for inventory transactions and material movement tracking."""

from typing import List
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.transaction import (
    AdjustmentRequest,
    AdjustmentResponse,
    AdjustmentUpdate,
    DistributionRequest,
    InwardRequest,
    OpeningStockRequest,
    OutwardRequest,
    ReturnRequest,
    TransactionResponse,
)
from app.services.transaction_service import transaction_service

router = APIRouter()


@router.post(
    "/opening-stock",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record opening stock",
    description="Initialize baseline stock quantity for an item at a specific location.",
)
def create_opening_stock(
    payload: OpeningStockRequest,
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    """Record initial opening stock."""
    return transaction_service.record_opening_stock(db, payload, created_by=current_user.user_id)


@router.post(
    "/inward",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record inward transaction",
    description="Record received goods/inventory from suppliers or purchases.",
)
def create_inward(
    payload: InwardRequest,
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    """Record inward stock."""
    return transaction_service.record_inward(db, payload, created_by=current_user.user_id)


@router.post(
    "/outward",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record outward transaction",
    description="Record stock dispatch, issues, or sales outward.",
)
def create_outward(
    payload: OutwardRequest,
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    """Record outward stock dispatch."""
    return transaction_service.record_outward(db, payload, created_by=current_user.user_id)


@router.post(
    "/distributions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record stock distribution",
    description="Record internal stock distribution breakdown attached to an outward issue.",
)
def create_distribution(
    payload: DistributionRequest,
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    """Record inter-location distribution."""
    return transaction_service.record_distribution(db, payload, created_by=current_user.user_id)


@router.post(
    "/returns",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record return transaction",
    description="Process return of goods into inventory from customers or outward flows.",
)
def create_return(
    payload: ReturnRequest,
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    """Record stock return."""
    return transaction_service.record_return(db, payload, created_by=current_user.user_id)


@router.post(
    "/adjustments",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record stock adjustment",
    description="Record stock discrepancy corrections, damage write-offs, or audit reconciliations (Admin only).",
)
def create_adjustment(
    payload: AdjustmentRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    """Record stock adjustment."""
    return transaction_service.record_adjustment(db, payload, created_by=current_user.user_id)


@router.get(
    "/adjustments",
    response_model=List[AdjustmentResponse],
    status_code=status.HTTP_200_OK,
    summary="List stock adjustments",
    description="Retrieve paginated list of stock adjustments (Admin & Stock Manager).",
)
def list_adjustments(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> List[AdjustmentResponse]:
    """List stock adjustments."""
    return transaction_service.list_adjustments(db, skip=skip, limit=limit)


@router.get(
    "/adjustments/{adjustment_id}",
    response_model=AdjustmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get stock adjustment by ID",
    description="Retrieve single stock adjustment details (Admin & Stock Manager).",
)
def get_adjustment(
    adjustment_id: int = Path(..., ge=1, description="Adjustment identifier"),
    current_user: User = Depends(require_roles("admin", "stock manager")),
    db: Session = Depends(get_db),
) -> AdjustmentResponse:
    """Get stock adjustment by ID."""
    return transaction_service.get_adjustment(db, adjustment_id=adjustment_id)


@router.patch(
    "/adjustments/{adjustment_id}",
    response_model=AdjustmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update stock adjustment",
    description="Update an existing stock adjustment reason/audit note (Admin only).",
)
def update_adjustment(
    adjustment_id: int = Path(..., ge=1, description="Adjustment identifier"),
    payload: AdjustmentUpdate = ...,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> AdjustmentResponse:
    """Update stock adjustment details."""
    return transaction_service.update_adjustment(db, adjustment_id=adjustment_id, payload=payload)
