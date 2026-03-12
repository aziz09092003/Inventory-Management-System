from myapp.database.session import Base
from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Customer(Base):
    __tablename__ = "customer"
    __table_args__ = (
        UniqueConstraint("customer_name", "user_id", name="uq_customer_name_per_user"),
    )

    customer_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(250), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)

    udharitems = relationship("UdharItem", back_populates="customer")
    udhar = relationship("Udhar", back_populates="customer", uselist=False)
    user = relationship("User", back_populates="customers")




