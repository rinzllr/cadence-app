from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(20), default="basic")  # "basic" or "smart"
    frequency = Column(String(50), nullable=False)  # "daily", "weekly", etc
    specific_time = Column(String(5), nullable=True)  # "08:00" format
    track_stats = Column(Boolean, default=False)
    push_notification_enabled = Column(Boolean, default=False)
    location = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())