from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from myapp.schemas.udhaar_item import UdharCreateRequest, UdharRead, UdharItemDetailRead
from myapp.crud.udhaar_item import create_udhar, list_udharitems, list_udharitems_by_customer
from myapp.database.session import get_db
from myapp.utils.security import get_current_user
from myapp.models.user import User

router = APIRouter(prefix="/udhar-items", tags=["udhar items"])

@router.post("/", response_model=UdharRead)
async def create_new_udhar(
    udhar_data: UdharCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        udhar = await create_udhar(
            db=db,
            customer_name=udhar_data.customer_name,
            item_name=udhar_data.item_name,
            quantity=udhar_data.quantity,
            unit=udhar_data.unit,
            current_user=current_user
        )
        return udhar
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"سرور خرابی: {str(e)}")

@router.get("/", response_model=list[UdharRead])
async def get_all_udharitems(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    udhar_items = await list_udharitems(db, current_user)
    return udhar_items

@router.get("/customer/{customer_id}", response_model=list[UdharItemDetailRead])
async def get_udharitems_by_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    udhar_items = await list_udharitems_by_customer(db, customer_id, current_user)
    results = []
    for item in udhar_items:
        item_data = UdharItemDetailRead(
            udharitem_id=item.udharitem_id,
            customer_id=item.customer_id,
            item_id=item.item_id,
            item_name=item.item.item_name if item.item else "Unknown",
            unit_price=item.unit_price,
            quantity=item.quantity,
            requested_unit=item.requested_unit,
            total_amount=item.total_amount,
            created_date=item.created_date,
            udhar_day=item.udhar_day,
            udhar_month=item.udhar_month,
            udhar_year=item.udhar_year,
            udhar_time=item.udhar_time,
            udhar_day_name=item.udhar_day_name
        )
        results.append(item_data)
    return results
