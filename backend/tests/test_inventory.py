from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Optional, Protocol, runtime_checkable

from app.core.exceptions import BadRequestException


QUANTITY_EXPONENT =  Decimal("0.01")
CURRENCY_EXPONENT = Decimal("0.01")
WAC_CALCULATION_EXPONENT = Decimal("0.0001")


def to_decimal(value: Optional[object], default: str = "0.00") -> Decimal:
    """Safely convert numeric/string values to Decimal."""
    if value is None:
        return Decimal(default)

    if isinstance(value, Decimal):
        return value

    return Decimal(str(value))


def quantize_currency(value: Decimal) -> Decimal:
    """Round currency values to 2 decimal places."""
    return value.quantize(
        CURRENCY_EXPONENT,
        rounding=ROUND_HALF_UP,
    )


def quantize_quantity(value: Decimal) -> Decimal:
    """Round stock quantities to 2 decimal places."""
    return value.quantize(
        QUANTITY_EXPONENT,
        rounding=ROUND_HALF_UP,
    )


# ============================================================
# COSTING / WAC
# ============================================================

def calculate_wac(
    existing_stock_quantity: Decimal,
    existing_average_cost: Decimal,
    inward_quantity: Decimal,
    inward_unit_cost: Decimal,
) -> Decimal:
    """
    Calculate Weighted Average Cost after an inward transaction.
    """

    existing_qty = to_decimal(existing_stock_quantity)
    existing_cost = to_decimal(existing_average_cost)
    inward_qty = to_decimal(inward_quantity)
    inward_cost = to_decimal(inward_unit_cost)

    if inward_qty <= Decimal("0"):
        return quantize_currency(existing_cost)

    if existing_qty <= Decimal("0"):
        return quantize_currency(inward_cost)

    total_qty = existing_qty + inward_qty

    if total_qty <= Decimal("0"):
        return quantize_currency(inward_cost)

    existing_value = existing_qty * existing_cost
    inward_value = inward_qty * inward_cost

    total_value = existing_value + inward_value

    return quantize_currency(total_value / total_qty)


# ============================================================
# STOCK CALCULATION
# ============================================================

def calculate_available_stock(
    opening_stock: Decimal,
    inward: Decimal,
    outward: Decimal,
    returns: Decimal,
    adjustments: Decimal,
) -> Decimal:
    """
    Calculate available stock for one Item + Location.

    Opening
    + Inward
    + Returns
    + Adjustments
    - Outward

    Distribution is NOT deducted separately because
    Distribution belongs to Outward.
    """

    opening = to_decimal(opening_stock)
    in_qty = to_decimal(inward)
    out_qty = to_decimal(outward)
    ret_qty = to_decimal(returns)
    adj_qty = to_decimal(adjustments)

    available = (
        opening
        + in_qty
        + ret_qty
        + adj_qty
        - out_qty
    )

    return quantize_quantity(available)


# ============================================================
# STOCK MOVEMENT CALCULATION
# ============================================================

@runtime_checkable
class MovementLike(Protocol):
    movement_type: str
    quantity: Decimal


def calculate_stock_from_movements(
    movements: Iterable[MovementLike],
) -> Decimal:
    """
    Calculate stock from stock movement history.

    OPENING  -> +
    INWARD   -> +
    OUTWARD  -> -
    RETURN   -> +
    ADJUSTMENT -> signed quantity_change

    Distribution does not appear as a stock movement.
    """

    balance = Decimal("0.00")

    for movement in movements:

        movement_type = str(
            movement.movement_type
        ).upper()

        quantity = validate_stock_movement_quantity(
            movement_type,
            movement.quantity,
        )

        if movement_type in (
            "OPENING",
            "INWARD",
            "RETURN",
        ):
            balance += quantity

        elif movement_type == "OUTWARD":
            balance -= quantity

        elif movement_type == "ADJUSTMENT":
            balance += quantity

    return quantize_quantity(balance)


# ============================================================
# QUANTITY VALIDATION
# ============================================================

def validate_positive_quantity(
    quantity: object,
    field_name: str = "quantity",
) -> Decimal:
    """
    Quantity must be strictly greater than zero.
    """

    qty = to_decimal(quantity)

    if qty <= Decimal("0"):
        raise BadRequestException(
            f"{field_name} must be strictly greater than zero."
        )

    return quantize_quantity(qty)


def validate_non_negative_cost(
    cost: object,
    field_name: str = "unit_cost",
) -> Decimal:
    """
    Cost must be >= 0.
    """

    value = to_decimal(cost)

    if value < Decimal("0"):
        raise BadRequestException(
            f"{field_name} cannot be negative."
        )

    return quantize_currency(value)


# ============================================================
# OPENING STOCK BUSINESS RULE
# ============================================================

def validate_opening_stock(
    quantity: object,
    unit_cost: Optional[object] = None,
) -> tuple[Decimal, Optional[Decimal]]:
    """
    Validate opening stock.

    Rules:
    - Quantity must be > 0.
    - unit_cost is OPTIONAL because DB allows NULL.
    - If unit_cost is provided, it must be >= 0.
    """

    qty = validate_positive_quantity(
        quantity,
        "opening_stock_quantity",
    )

    if unit_cost is None:
        return qty, None

    cost = validate_non_negative_cost(
        unit_cost,
        "opening_stock_unit_cost",
    )

    return qty, cost


# ============================================================
# INWARD BUSINESS RULE
# ============================================================

def validate_inward_transaction(
    quantity: object,
    unit_cost: object,
) -> tuple[Decimal, Decimal]:
    """
    Validate Inward transaction.

    Quantity > 0
    Unit cost >= 0
    """

    qty = validate_positive_quantity(
        quantity,
        "inward_quantity",
    )

    cost = validate_non_negative_cost(
        unit_cost,
        "unit_cost",
    )

    return qty, cost


def compute_inward_total_cost(
    quantity: Decimal,
    unit_cost: Decimal,
    declared_total_cost: Optional[object] = None,
) -> Decimal:
    """
    Calculate/validate:

        total_cost = quantity × unit_cost
    """

    qty = validate_positive_quantity(
        quantity,
        "inward_quantity",
    )

    cost = validate_non_negative_cost(
        unit_cost,
        "unit_cost",
    )

    calculated_total = quantize_currency(
        qty * cost
    )

    if declared_total_cost is not None:

        declared = quantize_currency(
            to_decimal(declared_total_cost)
        )

        if declared < Decimal("0"):
            raise BadRequestException(
                "total_cost cannot be negative."
            )

        if abs(declared - calculated_total) > Decimal("0.05"):
            raise BadRequestException(
                f"Inward total_cost ({declared}) is inconsistent "
                f"with quantity ({qty}) × unit_cost ({cost}) "
                f"= {calculated_total}."
            )

        return declared

    return calculated_total


# ============================================================
# OUTWARD BUSINESS RULE
# ============================================================

def validate_outward_stock(
    available_stock: Decimal,
    requested_quantity: Decimal,
) -> None:
    """
    Outward quantity must not exceed available stock.
    """

    available = to_decimal(available_stock)

    requested = validate_positive_quantity(
        requested_quantity,
        "outward_quantity",
    )

    if requested > available:
        raise BadRequestException(
            f"Insufficient stock for outward issue. "
            f"Requested: {requested}, "
            f"Available on-hand: {available}."
        )


# ============================================================
# RETURN BUSINESS RULE
# ============================================================

def validate_return_transaction(
    quantity: object,
) -> Decimal:
    """
    Return quantity must be > 0.
    """

    return validate_positive_quantity(
        quantity,
        "return_quantity",
    )


# ============================================================
# ADJUSTMENT BUSINESS RULE
# ============================================================

def validate_adjustment_stock(
    available_stock: Decimal,
    quantity_change: Decimal,
) -> None:
    """
    Validate Admin-created stock adjustment.

    quantity_change:
        +10 -> increase stock
        -5  -> decrease stock

    Zero is not allowed.
    Adjustment must not create negative stock.
    """

    available = to_decimal(available_stock)
    change = to_decimal(quantity_change)

    if change == Decimal("0"):
        raise BadRequestException(
            "Stock adjustment quantity change cannot be zero."
        )

    change = quantize_quantity(change)

    if available + change < Decimal("0"):
        raise BadRequestException(
            f"Stock adjustment of {change} would cause "
            f"negative stock. Current available: {available}."
        )


# ============================================================
# DISTRIBUTION BUSINESS RULE
# ============================================================

def validate_distribution_quantity(
    outward_quantity: Decimal,
    already_distributed_quantity: Decimal,
    requested_distribution_quantity: Decimal,
) -> None:
    """
    Distribution is a detail of Outward.

    Rules:
    - Distribution quantity > 0.
    - Already distributed quantity cannot be negative.
    - Total distributed quantity cannot exceed Outward quantity.
    - Distribution does NOT cause another stock deduction.
    """

    outward_qty = to_decimal(outward_quantity)
    already_distributed = to_decimal(
        already_distributed_quantity
    )

    requested_distribution = validate_positive_quantity(
        requested_distribution_quantity,
        "distribution_quantity",
    )

    if already_distributed < Decimal("0"):
        raise BadRequestException(
            "Already distributed quantity cannot be negative."
        )

    if already_distributed > outward_qty:
        raise BadRequestException(
            "Already distributed quantity cannot exceed "
            "outward quantity."
        )

    if (
        already_distributed
        + requested_distribution
        > outward_qty
    ):
        remaining = (
            outward_qty
            - already_distributed
        )

        raise BadRequestException(
            f"Distribution quantity "
            f"({requested_distribution}) exceeds the "
            f"remaining undistributed quantity ({remaining}) "
            f"for Outward Issue."
        )


# ============================================================
# STOCK MOVEMENT VALIDATION
# ============================================================

def validate_stock_movement_quantity(
    movement_type: str,
    quantity: object,
) -> Decimal:
    """
    Validate quantity according to movement type.

    OPENING / INWARD / OUTWARD / RETURN:
        quantity > 0

    ADJUSTMENT:
        quantity cannot be zero and may be positive/negative.
    """

    movement = str(movement_type).upper()

    if movement in (
        "OPENING",
        "INWARD",
        "OUTWARD",
        "RETURN",
    ):
        return validate_positive_quantity(
            quantity,
            f"{movement.lower()}_quantity",
        )

    if movement == "ADJUSTMENT":

        change = to_decimal(quantity)

        if change == Decimal("0"):
            raise BadRequestException(
                "Adjustment quantity change cannot be zero."
            )

        return quantize_quantity(change)

    raise BadRequestException(
        f"Unsupported stock movement type: {movement}"
    )


# ============================================================
# STOCK STATUS
# ============================================================

def determine_stock_status(
    current_quantity: Decimal,
    minimum_level: int,
) -> str:
    """
    Determine deterministic stock status.
    """

    quantity = to_decimal(current_quantity)
    minimum = Decimal(str(minimum_level))

    if quantity <= Decimal("0"):
        return "out_of_stock"

    if quantity <= minimum:
        return "low_stock"

    return "in_stock"
