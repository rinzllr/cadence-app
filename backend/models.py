from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base
import uuid

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(20), default="basic")
    frequency = Column(String(50), nullable=False)
    specific_time = Column(String(5), nullable=True)
    frequency_config = Column(Text, nullable=True)
    track_stats = Column(Boolean, default=False)
    prompt_for_feedback = Column(Boolean, default=False)
    push_notification_enabled = Column(Boolean, default=False)
    location = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ReminderInstance(Base):
    __tablename__ = "reminder_instances"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    status = Column(String(20), default="pending")
    completed_date = Column(DateTime(timezone=True), nullable=True)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())