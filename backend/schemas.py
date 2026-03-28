from pydantic import BaseModel, Field, validator, field_validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
import json

class FeedbackRequest(BaseModel):
    feedback_text: Optional[str] = None

class HabitCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    type: str = Field("basic", pattern="^(basic|smart)$")
    frequency: str = Field(..., pattern="^(daily|weekly|monthly)$")
    specific_time: Optional[str] = None
    frequency_config: Optional[List[str]] = []
    track_stats: bool = False
    push_notification_enabled: bool = False
    location: Optional[str] = Field(None, max_length=255)
    prompt_for_feedback: bool = False

    @validator('specific_time')
    def validate_time(cls, v):
        if v is not None:
            if not isinstance(v, str) or len(v) != 5 or v[2] != ':':
                raise ValueError('Time must be in HH:MM format')
            try:
                hours, minutes = v.split(':')
                h = int(hours)
                m = int(minutes)
                if not (0 <= h <= 23 and 0 <= m <= 59):
                    raise ValueError('Invalid time values')
            except (ValueError, AttributeError):
                raise ValueError('Time must be in HH:MM format')
        return v

class HabitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    type: Optional[str] = Field(None, pattern="^(basic|smart)$")
    frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly)$")
    specific_time: Optional[str] = None
    frequency_config: Optional[List[str]] = None
    track_stats: Optional[bool] = None
    push_notification_enabled: Optional[bool] = None
    location: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    prompt_for_feedback: Optional[bool] = None

    @validator('specific_time')
    def validate_time(cls, v):
        if v is not None:
            if not isinstance(v, str) or len(v) != 5 or v[2] != ':':
                raise ValueError('Time must be in HH:MM format')
            try:
                hours, minutes = v.split(':')
                h = int(hours)
                m = int(minutes)
                if not (0 <= h <= 23 and 0 <= m <= 59):
                    raise ValueError('Invalid time values')
            except (ValueError, AttributeError):
                raise ValueError('Time must be in HH:MM format')
        return v

class HabitResponse(BaseModel):
    id: int
    user_id: UUID
    name: str
    description: Optional[str]
    type: str
    frequency: str
    specific_time: Optional[str]
    frequency_config: Optional[List[str]]
    track_stats: bool
    push_notification_enabled: bool
    location: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    prompt_for_feedback: bool

    @field_validator('frequency_config', mode='before')
    @classmethod
    def parse_frequency_config(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        if isinstance(v, dict):
            return []
        return v or []

    class Config:
        from_attributes = True

class ReminderInstanceCreate(BaseModel):
    habit_id: int
    scheduled_date: Optional[date] = None

class ReminderInstanceResponse(BaseModel):
    id: int
    habit_id: int
    scheduled_date: date
    status: str
    completed_date: Optional[datetime] = None
    feedback_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True