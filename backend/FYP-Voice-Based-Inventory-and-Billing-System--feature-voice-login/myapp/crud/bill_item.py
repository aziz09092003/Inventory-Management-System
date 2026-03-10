from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import date, datetime
from fastapi import HTTPException

from myapp.models.bill_item import BillItem
from myapp.models.bill_item_history import BillItemHistory
from myapp.models.bill import Bill
from myapp.models.item import Item
from myapp.models.sales import Sale
from myapp.models.user import User
from myapp.utils.units import UnitConverter
from myapp.utils.urdu_date import convert_datetime_to_urdu


async def create_bill_item(db: AsyncSession, data: dict, current_user: User):
    # Find item by name scoped to user
    res = await db.execute(
        select(Item).where(Item.item_name == data["item_name"], Item.user_id == current_user.user_id)
    )
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="آئٹم موجود نہیں ہے")

    # Unit conversion check
    converter = UnitConverter()
    if not converter.is_compatible(item.item_unit, data["requested_unit"]):
        raise HTTPException(
            status_code=400,
            detail=f"اکائی '{data['requested_unit']}' آئٹم کی اکائی '{item.item_unit}' کے ساتھ مطابقت نہیں رکھتی"
        )

    # Always convert requested unit → item base unit
    qty_in_base = converter.convert(data["requested_unit"], item.item_unit, data["quantity"])

    # Inventory check
    if qty_in_base > float(item.stock_quantity):
        raise HTTPException(
            status_code=400,
            detail=f"ذخیرہ ناکافی ہے۔ موجودہ: {item.stock_quantity} {item.item_unit}, درکار: {qty_in_base} {item.item_unit}"
        )

    # Calculate total
    unit_price_base = float(item.unit_price)
    total_amount = unit_price_base * qty_in_base

    # Get Urdu date/time fields separately for each entity
    urdu_bill = convert_datetime_to_urdu(datetime.now(), prefix="bill")
    urdu_billitem = convert_datetime_to_urdu(datetime.now(), prefix="billitem")
    urdu_sale = convert_datetime_to_urdu(datetime.now(), prefix="sale")

    # Create bill (direct paid bill)
    bill = Bill(
        customer_id=None,  # direct customer
        user_id=current_user.user_id,
        effective_total=total_amount,
        status="paid",
        bill_day=urdu_bill["bill_day"],
        bill_month=urdu_bill["bill_month"],
        bill_year=urdu_bill["bill_year"],
        bill_time=urdu_bill["bill_time"],
        bill_day_name=urdu_bill["bill_day_name"]
    )
    db.add(bill)
    await db.flush()  # ensures bill_id is available

    # Create bill item
    bill_item = BillItem(
        bill_id=bill.bill_id,
        item_id=item.item_id,
        unit_price=unit_price_base,
        quantity=data["quantity"],  # original requested quantity
        requested_unit=data["requested_unit"],
        total_amount=total_amount,
        created_date=date.today(),
        user_id=current_user.user_id,
        billitem_day=urdu_billitem["billitem_day"],
        billitem_month=urdu_billitem["billitem_month"],
        billitem_year=urdu_billitem["billitem_year"],
        billitem_time=urdu_billitem["billitem_time"],
        billitem_day_name=urdu_billitem["billitem_day_name"]
    )
    db.add(bill_item)

    # Also create bill item history so items appear in bill listing
    bill_item_history = BillItemHistory(
        bill_id=bill.bill_id,
        user_id=current_user.user_id,
        item_name=item.item_name,
        unit_price=unit_price_base,
        quantity=data["quantity"],
        requested_unit=data["requested_unit"],
        total_amount=total_amount,
    )
    db.add(bill_item_history)

    # Also create a sale record (always in base unit)
    sale = Sale(
        customer_name="نقد",  # Cash customer
        item_id=item.item_id,
        quantity_sold=float(data["quantity"]),  # keep float for fractional units
        sale_date=date.today(),
        user_id=current_user.user_id,
        sale_day=urdu_sale["sale_day"],
        sale_month=urdu_sale["sale_month"],
        sale_year=urdu_sale["sale_year"],
        sale_time=urdu_sale["sale_time"],
        sale_day_name=urdu_sale["sale_day_name"]
    )
    db.add(sale)

    # Deduct stock (in base unit)
    item.stock_quantity = float(item.stock_quantity) - qty_in_base

    await db.commit()
    await db.refresh(bill_item)
    return bill_item


async def create_bill_items_batch(db: AsyncSession, items_data: list[dict], current_user: User):
    """Create a single bill with multiple items."""
    converter = UnitConverter()
    now = datetime.now()
    urdu_bill = convert_datetime_to_urdu(now, prefix="bill")

    # Validate all items first before making any changes
    resolved_items = []
    total_bill_amount = 0.0
    for data in items_data:
        res = await db.execute(
            select(Item).where(Item.item_name == data["item_name"], Item.user_id == current_user.user_id)
        )
        item = res.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail=f"آئٹم '{data['item_name']}' موجود نہیں ہے")

        if not converter.is_compatible(item.item_unit, data["requested_unit"]):
            raise HTTPException(
                status_code=400,
                detail=f"اکائی '{data['requested_unit']}' آئٹم '{data['item_name']}' کی اکائی '{item.item_unit}' کے ساتھ مطابقت نہیں رکھتی"
            )

        qty_in_base = converter.convert(data["requested_unit"], item.item_unit, data["quantity"])
        if qty_in_base > float(item.stock_quantity):
            raise HTTPException(
                status_code=400,
                detail=f"ذخیرہ ناکافی ہے۔ آئٹم: {data['item_name']}, موجودہ: {item.stock_quantity} {item.item_unit}, درکار: {qty_in_base} {item.item_unit}"
            )

        unit_price_base = float(item.unit_price)
        total_amount = unit_price_base * qty_in_base
        total_bill_amount += total_amount
        resolved_items.append({
            "item": item,
            "data": data,
            "qty_in_base": qty_in_base,
            "unit_price_base": unit_price_base,
            "total_amount": total_amount,
        })

    # Create single bill
    bill = Bill(
        customer_id=None,
        user_id=current_user.user_id,
        effective_total=total_bill_amount,
        status="paid",
        bill_day=urdu_bill["bill_day"],
        bill_month=urdu_bill["bill_month"],
        bill_year=urdu_bill["bill_year"],
        bill_time=urdu_bill["bill_time"],
        bill_day_name=urdu_bill["bill_day_name"]
    )
    db.add(bill)
    await db.flush()

    # Create bill items, history, and sales for each item
    created_bill_items = []
    for entry in resolved_items:
        item = entry["item"]
        data = entry["data"]
        urdu_billitem = convert_datetime_to_urdu(datetime.now(), prefix="billitem")
        urdu_sale = convert_datetime_to_urdu(datetime.now(), prefix="sale")

        bill_item = BillItem(
            bill_id=bill.bill_id,
            item_id=item.item_id,
            unit_price=entry["unit_price_base"],
            quantity=data["quantity"],
            requested_unit=data["requested_unit"],
            total_amount=entry["total_amount"],
            created_date=date.today(),
            user_id=current_user.user_id,
            billitem_day=urdu_billitem["billitem_day"],
            billitem_month=urdu_billitem["billitem_month"],
            billitem_year=urdu_billitem["billitem_year"],
            billitem_time=urdu_billitem["billitem_time"],
            billitem_day_name=urdu_billitem["billitem_day_name"]
        )
        db.add(bill_item)

        db.add(BillItemHistory(
            bill_id=bill.bill_id,
            user_id=current_user.user_id,
            item_name=item.item_name,
            unit_price=entry["unit_price_base"],
            quantity=data["quantity"],
            requested_unit=data["requested_unit"],
            total_amount=entry["total_amount"],
        ))

        db.add(Sale(
            customer_name="نقد",
            item_id=item.item_id,
            quantity_sold=float(data["quantity"]),
            sale_date=date.today(),
            user_id=current_user.user_id,
            sale_day=urdu_sale["sale_day"],
            sale_month=urdu_sale["sale_month"],
            sale_year=urdu_sale["sale_year"],
            sale_time=urdu_sale["sale_time"],
            sale_day_name=urdu_sale["sale_day_name"]
        ))

        # Deduct stock
        item.stock_quantity = float(item.stock_quantity) - entry["qty_in_base"]
        created_bill_items.append(bill_item)

    await db.commit()
    for bi in created_bill_items:
        await db.refresh(bi)
    return created_bill_items


async def list_bill_items(db: AsyncSession, current_user: User):
    # Fetch all bill items scoped to the current user
    res = await db.execute(
        select(BillItem).where(BillItem.user_id == current_user.user_id)
    )
    return res.scalars().all()
