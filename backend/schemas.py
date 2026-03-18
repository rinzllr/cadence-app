from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from datetime import date

class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "basic"  # "basic" or "smart"
    frequency: str  # "daily", "weekly", "monthly", etc
    specific_time: Optional[str] = None  # "08:00"
    track_stats: bool = False
    push_notification_enabled: bool = False
    location: Optional[str] = None

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    frequency: Optional[str] = None
    specific_time: Optional[str] = None
    track_stats: Optional[bool] = None
    push_notification_enabled: Optional[bool] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class HabitResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    type: str
    frequency: str
    specific_time: Optional[str]
    track_stats: bool
    push_notification_enabled: bool
    location: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReminderInstanceCreate(BaseModel):
    habit_id: int
    scheduled_date: date
    feedback_text: Optional[str] = None

class ReminderInstanceResponse(BaseModel):
    id: int
    habit_id: int
    scheduled_date: date
    status: str
    completed_date: Optional[datetime]
    feedback_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
