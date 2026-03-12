from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from datetime import datetime

from myapp.models.bill import Bill
from myapp.models.bill_item import BillItem
from myapp.models.bill_item_history import BillItemHistory
from myapp.models.item import Item
from myapp.models.sales import Sale
from myapp.models.udhar import Udhar
from myapp.models.udhaar_item import UdharItem
from myapp.models.user import User
from myapp.utils.urdu_date import convert_datetime_to_urdu

async def sync_bill_from_udhar(db: AsyncSession, customer_id: int, current_user: User) -> Bill:
    # fetch unpaid udhar scoped to user (or latest one if no unpaid)
    res = await db.execute(
        select(Udhar).where(
            Udhar.customer_id == customer_id, 
            Udhar.user_id == current_user.user_id,
            Udhar.status == "unpaid"
        )
    )
    udhar = res.scalar_one_or_none()
    
    # If no unpaid udhar, get the latest one
    if not udhar:
        res = await db.execute(
            select(Udhar).where(
                Udhar.customer_id == customer_id, 
                Udhar.user_id == current_user.user_id
            ).order_by(Udhar.udhar_id.desc())
        )
        udhar = res.scalar_one_or_none()

    # fetch udhar items scoped to user
    res = await db.execute(
        select(UdharItem)
        .options(selectinload(UdharItem.item))
        .where(UdharItem.customer_id == customer_id, UdharItem.user_id == current_user.user_id)
    )
    items = res.scalars().all()

    items_total = sum(float(i.total_amount) for i in items)
    direct_add = udhar.direct_addition if udhar else 0.0
    direct_ded = udhar.direct_deduction if udhar else 0.0
    effective_total = items_total + direct_add - direct_ded

    # fetch or create bill scoped to user
    res = await db.execute(select(Bill).where(Bill.customer_id == customer_id, Bill.user_id == current_user.user_id, Bill.status == 'unpaid'))
    bill = res.scalar_one_or_none()

    # Get current datetime for Urdu date/time
    now = datetime.now()
    bill_urdu = convert_datetime_to_urdu(now, "bill")

    if not bill:
        bill = Bill(
            customer_id=customer_id, 
            status="unpaid", 
            user_id=current_user.user_id,
            bill_day=bill_urdu["bill_day"],
            bill_month=bill_urdu["bill_month"],
            bill_year=bill_urdu["bill_year"],
            bill_time=bill_urdu["bill_time"],
            bill_day_name=bill_urdu["bill_day_name"]
        )
        db.add(bill)
        await db.flush()
    elif bill.status == "paid":
        bill = Bill(
            customer_id=customer_id, 
            status="unpaid", 
            user_id=current_user.user_id,
            bill_day=bill_urdu["bill_day"],
            bill_month=bill_urdu["bill_month"],
            bill_year=bill_urdu["bill_year"],
            bill_time=bill_urdu["bill_time"],
            bill_day_name=bill_urdu["bill_day_name"]
        )
        db.add(bill)
        await db.flush()

    # update bill totals
    bill.udhar_items_total = items_total
    bill.direct_addition = direct_add
    bill.direct_deduction = direct_ded
    bill.effective_total = effective_total
    bill.status = "paid" if effective_total == 0 else "unpaid"

    # rebuild bill items
    await db.execute(delete(BillItemHistory).where(BillItemHistory.bill_id == bill.bill_id, BillItemHistory.user_id == current_user.user_id))
    for item in items:
        db.add(BillItemHistory(
            bill_id=bill.bill_id,
            user_id=current_user.user_id,
            item_name=item.item.item_name,
            unit_price=item.unit_price,
            quantity=item.quantity,
            requested_unit=item.requested_unit,
            total_amount=item.total_amount,
        ))

    # Update udhar status to paid instead of deleting
    if bill.status == "paid" and udhar:
        udhar.status = "paid"
        await db.execute(delete(UdharItem).where(UdharItem.customer_id == customer_id, UdharItem.user_id == current_user.user_id))

    await db.commit()
    await db.refresh(bill)
    return bill


async def get_bills_by_customer(db: AsyncSession, customer_id: int, current_user: User):
    """Get all bills for a specific customer scoped to the logged-in user"""
    res = await db.execute(
        select(Bill)
        .options(selectinload(Bill.items))
        .where(Bill.customer_id == customer_id, Bill.user_id == current_user.user_id)
    )
    return res.scalars().all()

async def get_all_bills(db: AsyncSession, current_user: User):
    """Get all bills for the logged-in user"""
    res = await db.execute(
        select(Bill)
        .options(selectinload(Bill.items))
        .where(Bill.user_id == current_user.user_id)
    )
    return res.scalars().all()

async def pay_bill(db: AsyncSession, customer_id: int, current_user: User) -> Bill | None:
    """Mark a bill as paid for a specific customer scoped to the logged-in user"""
    res = await db.execute(
        select(Bill)
        .options(selectinload(Bill.items))
        .where(Bill.customer_id == customer_id, Bill.user_id == current_user.user_id)
    )
    bill = res.scalar_one_or_none()
    if not bill:
        return None

    # Mark bill as paid
    bill.status = "paid"
    
    # Update Urdu date/time fields for bill
    now = datetime.now()
    bill_urdu = convert_datetime_to_urdu(now, "bill")
    bill.bill_day = bill_urdu["bill_day"]
    bill.bill_month = bill_urdu["bill_month"]
    bill.bill_year = bill_urdu["bill_year"]
    bill.bill_time = bill_urdu["bill_time"]
    bill.bill_day_name = bill_urdu["bill_day_name"]

    # Update unpaid udhar status to "paid" and set paid date fields
    res = await db.execute(
        select(Udhar).where(
            Udhar.customer_id == customer_id, 
            Udhar.user_id == current_user.user_id,
            Udhar.status == "unpaid"
        )
    )
    udhar = res.scalar_one_or_none()
    if udhar:
        udhar.status = "paid"
        udhar.paid_date = now.date()
        urdu_paid = convert_datetime_to_urdu(now, "paid")
        udhar.paid_day = urdu_paid["paid_day"]
        udhar.paid_month = urdu_paid["paid_month"]
        udhar.paid_year = urdu_paid["paid_year"]
        udhar.paid_time = urdu_paid["paid_time"]
        udhar.paid_day_name = urdu_paid["paid_day_name"]

    # Clear udhar items for this customer scoped to user
    await db.execute(
        delete(UdharItem).where(
            UdharItem.customer_id == customer_id,
            UdharItem.user_id == current_user.user_id
        )
    )

    await db.commit()
    await db.refresh(bill)
    return bill


async def delete_bill(db: AsyncSession, bill_id: int, current_user: User):
    """Delete a bill scoped to the logged-in user. Returns True if deleted, 'unpaid' if bill is unpaid, False if not found."""
    res = await db.execute(select(Bill).where(Bill.bill_id == bill_id, Bill.user_id == current_user.user_id))
    bill = res.scalar_one_or_none()
    
    if not bill:
        return False
    
    # Check if bill is unpaid - don't allow deletion of unpaid bills
    if bill.status == "unpaid":
        return "unpaid"

    # Delete related bill items scoped to user
    await db.execute(delete(BillItem).where(BillItem.bill_id == bill_id, BillItem.user_id == current_user.user_id))

    # Delete related item history scoped to user
    await db.execute(delete(BillItemHistory).where(BillItemHistory.bill_id == bill_id, BillItemHistory.user_id == current_user.user_id))

    # Delete the bill itself
    await db.execute(delete(Bill).where(Bill.bill_id == bill_id, Bill.user_id == current_user.user_id))

    await db.commit()
    return True


async def return_bill(db: AsyncSession, bill_id: int, data: dict, current_user: User):
    """Process a return for a bill. Restores inventory, removes sales records, and updates the bill."""
    res = await db.execute(
        select(Bill)
        .options(selectinload(Bill.items), selectinload(Bill.billitems))
        .where(Bill.bill_id == bill_id, Bill.user_id == current_user.user_id)
    )
    bill = res.scalar_one_or_none()
    if not bill:
        return None

    return_type = data["return_type"]
    return_items_data = {item["item_name"]: item["return_qty"] for item in data["items"]}
    refund_amount = 0.0

    # Process each item in the bill
    for history_item in bill.items:
        if return_type == "full":
            return_qty = history_item.quantity
        elif history_item.item_name in return_items_data:
            return_qty = return_items_data[history_item.item_name]
        else:
            continue

        if return_qty <= 0:
            continue

        refund_amount += return_qty * history_item.unit_price

        # Restore inventory - find item by name
        item_res = await db.execute(
            select(Item).where(Item.item_name == history_item.item_name, Item.user_id == current_user.user_id)
        )
        item = item_res.scalar_one_or_none()
        if item:
            item.stock_quantity = float(item.stock_quantity) + return_qty

            # Delete matching sale record for this item
            sale_res = await db.execute(
                select(Sale).where(
                    Sale.item_id == item.item_id,
                    Sale.user_id == current_user.user_id,
                    Sale.quantity_sold == return_qty,
                ).order_by(Sale.sale_id.desc())
            )
            sale = sale_res.scalar_one_or_none()
            if sale:
                await db.execute(delete(Sale).where(Sale.sale_id == sale.sale_id))

    # For full returns, delete all bill items/history and mark returned
    if return_type == "full":
        await db.execute(delete(BillItem).where(BillItem.bill_id == bill_id, BillItem.user_id == current_user.user_id))
        await db.execute(delete(BillItemHistory).where(BillItemHistory.bill_id == bill_id, BillItemHistory.user_id == current_user.user_id))
        bill.status = "returned"
        bill.effective_total = 0
    else:
        # Partial return - update bill total
        bill.effective_total = max(0, float(bill.effective_total) - refund_amount)

    await db.commit()
    return {"message": "واپسی کامیابی سے ہو گئی", "refund_amount": refund_amount, "bill_id": bill_id}
