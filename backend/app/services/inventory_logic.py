"""Pure, testable inventory business logic calculations and validations.

All monetary and quantity arithmetic uses Decimal to avoid floating-point inaccuracies.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Optional, Protocol, runtime_checkable

from app.core.exceptions import BadRequestException

# Precision constants
QUANTITY_EXPONENT = Decimal("0.01")
CURRENCY_EXPONENT = Decimal("0.01")
WAC_CALCULATION_EXPONENT = Decimal("0.0001")


def to_decimal(value: Optional[object], default: str = "0.00") -> Decimal:
    """Safely convert any numeric/string value to a Decimal."""
    if value is None:
        return Decimal(default)
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def quantize_currency(value: Decimal) -> Decimal:
    """Quantize currency to 2 decimal places with standard financial rounding."""
    return value.quantize(CURRENCY_EXPONENT, rounding=ROUND_HALF_UP)


def quantize_quantity(value: Decimal) -> Decimal:
    """Quantize stock quantity to 2 decimal places."""
    return value.quantize(QUANTITY_EXPONENT, rounding=ROUND_HALF_UP)


def calculate_wac(
    existing_stock_quantity: Decimal,
    existing_average_cost: Decimal,
    inward_quantity: Decimal,
    inward_unit_cost: Decimal,
) -> Decimal:
    """Calculate the new Weighted Average Cost (WAC) following an Inward receipt.

    Formula:
        new_average_cost = (
            existing_stock_quantity * existing_average_cost
            + inward_quantity * inward_unit_cost
        ) / (existing_stock_quantity + inward_quantity)

    Business rules:
    - If total resulting stock is <= 0, return the inward_unit_cost.
    - If existing stock quantity is <= 0 (e.g. initial intake), new WAC equals inward_unit_cost.
    - Uses exact Decimal arithmetic.
    """
    existing_qty = to_decimal(existing_stock_quantity)
    existing_cost = to_decimal(existing_average_cost)
    inward_qty = to_decimal(inward_quantity)
    inward_cost = to_decimal(inward_unit_cost)

    if inward_qty <= Decimal("0"):
        return quantize_currency(existing_cost)

    # If previous stock was zero or negative (baseline intake), the new WAC is simply the inward cost
    if existing_qty <= Decimal("0"):
        return quantize_currency(inward_cost)

    total_qty = existing_qty + inward_qty
    if total_qty <= Decimal("0"):
        return quantize_currency(inward_cost)

    existing_value = existing_qty * existing_cost
    inward_value = inward_qty * inward_cost
    total_value = existing_value + inward_value

    new_wac = total_value / total_qty
    return quantize_currency(new_wac)


def calculate_available_stock(
    opening_stock: Decimal,
    inward: Decimal,
    outward: Decimal,
    returns: Decimal,
    adjustments: Decimal,
) -> Decimal:
    """Calculate available on-hand stock for a single Item + Location.

    Formula:
        Available Stock = Opening Stock + Inward - Outward + Returns +/- Adjustments

    CRITICAL RULE:
        Distribution must NOT be subtracted separately because it is already
        represented by Outward.
    """
    opening = to_decimal(opening_stock)
    in_qty = to_decimal(inward)
    out_qty = to_decimal(outward)
    ret_qty = to_decimal(returns)
    adj_qty = to_decimal(adjustments)

    available = opening + in_qty - out_qty + ret_qty + adj_qty
    return quantize_quantity(available)


@runtime_checkable
class MovementLike(Protocol):
    movement_type: str
    quantity: Decimal


def calculate_stock_from_movements(movements: Iterable[MovementLike]) -> Decimal:
    """Calculate available stock by aggregating chronological stock movements.

    Movement types:
    - OPENING:    + quantity
    - INWARD:     + quantity
    - OUTWARD:    - quantity
    - RETURN:     + quantity
    - ADJUSTMENT: + quantity (positive or negative delta)
    """
    balance = Decimal("0.00")
    for m in movements:
        m_type = str(m.movement_type).upper()
        qty = to_decimal(m.quantity)
        if m_type in ("OPENING", "INWARD", "RETURN"):
            balance += qty
        elif m_type == "OUTWARD":
            balance -= qty
        elif m_type == "ADJUSTMENT":
            balance += qty
        else:
            raise BadRequestException(f"Unsupported stock movement type encountered: {m_type}")

    return quantize_quantity(balance)


def validate_positive_quantity(quantity: object, field_name: str = "quantity") -> Decimal:
    """Ensure quantity is strictly positive (> 0)."""
    qty = to_decimal(quantity)
    if qty <= Decimal("0"):
        raise BadRequestException(f"{field_name} must be strictly greater than zero.")
    return quantize_quantity(qty)


def validate_non_negative_cost(cost: object, field_name: str = "unit_cost") -> Decimal:
    """Ensure cost is non-negative (>= 0)."""
    c = to_decimal(cost)
    if c < Decimal("0"):
        raise BadRequestException(f"{field_name} cannot be negative.")
    return quantize_currency(c)


def validate_outward_stock(available_stock: Decimal, requested_quantity: Decimal) -> None:
    """Ensure outward dispatch does not breach available stock (no negative stock)."""
    avail = to_decimal(available_stock)
    req = to_decimal(requested_quantity)
    if req > avail:
        raise BadRequestException(
            f"Insufficient stock for outward issue. Requested: {req}, Available on-hand: {avail}."
        )


def validate_adjustment_stock(available_stock: Decimal, quantity_change: Decimal) -> None:
    """Ensure a negative stock adjustment does not drive available stock below zero."""
    avail = to_decimal(available_stock)
    change = to_decimal(quantity_change)
    if change == Decimal("0"):
        raise BadRequestException("Stock adjustment quantity change cannot be zero.")
    if avail + change < Decimal("0"):
        raise BadRequestException(
            f"Stock adjustment of {change} would cause negative stock. Current available: {avail}."
        )


def validate_distribution_quantity(
    outward_quantity: Decimal,
    already_distributed_quantity: Decimal,
    requested_distribution_quantity: Decimal,
) -> None:
    """Ensure distribution quantity does not exceed the associated outward issue quantity."""
    out_qty = to_decimal(outward_quantity)
    prev_dist = to_decimal(already_distributed_quantity)
    req_dist = to_decimal(requested_distribution_quantity)

    if prev_dist + req_dist > out_qty:
        remaining = out_qty - prev_dist
        raise BadRequestException(
            f"Distribution quantity ({req_dist}) exceeds the remaining undistributed quantity "
            f"({remaining}) for Outward Issue (Total: {out_qty}, Already Distributed: {prev_dist})."
        )


def compute_inward_total_cost(
    quantity: Decimal,
    unit_cost: Decimal,
    declared_total_cost: Optional[object] = None,
) -> Decimal:
    """Validate or compute inward total cost (quantity × unit_cost)."""
    qty = to_decimal(quantity)
    cost = to_decimal(unit_cost)
    calculated_total = quantize_currency(qty * cost)

    if declared_total_cost is not None:
        declared = quantize_currency(to_decimal(declared_total_cost))
        # Allow tolerance of 0.05 for rounding differences from legacy systems
        if abs(declared - calculated_total) > Decimal("0.05"):
            raise BadRequestException(
                f"Inward total_cost ({declared}) is inconsistent with quantity ({qty}) × unit_cost ({cost}) = {calculated_total}."
            )
        return declared

    return calculated_total


def determine_stock_status(current_quantity: Decimal, minimum_level: int) -> str:
    """Determine item stock health status."""
    qty = to_decimal(current_quantity)
    min_lvl = Decimal(str(minimum_level))

    if qty <= Decimal("0"):
        return "out_of_stock"
    if qty <= min_lvl:
        return "low_stock"
    return "in_stock"
