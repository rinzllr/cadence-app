import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Habit
from schemas import HabitCreate, HabitUpdate, HabitResponse, ReminderInstanceCreate, ReminderInstanceResponse
from models import Habit, ReminderInstance
from datetime import date
from typing import Optional
import models

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Health check endpoints
@app.get("/")
def read_root():
    return {"message": "Hello from Cadence!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Habit CRUD endpoints

@app.post("/habits", response_model=HabitResponse)
def create_habit(habit: HabitCreate, db: Session = Depends(get_db)):
    """Create a new habit"""
    db_habit = Habit(**habit.dict())
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

@app.get("/habits", response_model=list[HabitResponse])
def get_habits(db: Session = Depends(get_db)):
    """Get all habits"""
    habits = db.query(Habit).filter(Habit.is_active == True).all()
    return habits

@app.get("/habits/{habit_id}", response_model=HabitResponse)
def get_habit(habit_id: int, db: Session = Depends(get_db)):
    """Get a specific habit"""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit

@app.put("/habits/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: int, habit: HabitUpdate, db: Session = Depends(get_db)):
    """Update a habit"""
    db_habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    update_data = habit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_habit, key, value)
    
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    """Delete a habit"""
    db_habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    db.delete(db_habit)
    db.commit()
    return {"message": "Habit deleted successfully"}

# Reminder Instance endpoints

@app.post("/reminders", response_model=ReminderInstanceResponse)
def create_reminder(reminder: ReminderInstanceCreate, db: Session = Depends(get_db)):
    """Create a reminder instance"""
    db_reminder = ReminderInstance(**reminder.dict())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@app.get("/reminders/today", response_model=list[ReminderInstanceResponse])
def get_today_reminders(db: Session = Depends(get_db)):
    """Get today's reminders"""
    from datetime import date
    today = date.today()
    reminders = db.query(ReminderInstance).filter(
        ReminderInstance.scheduled_date == today,
        ReminderInstance.status == "pending"
    ).all()
    return reminders

@app.put("/reminders/{reminder_id}/complete", response_model=ReminderInstanceResponse)
def mark_reminder_complete(reminder_id: int, feedback: Optional[str] = None, db: Session = Depends(get_db)):
    """Mark reminder as completed"""
    from datetime import datetime
    db_reminder = db.query(ReminderInstance).filter(ReminderInstance.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db_reminder.status = "completed"
    db_reminder.completed_date = datetime.now()
    if feedback:
        db_reminder.feedback_text = feedback
    
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@app.put("/reminders/{reminder_id}/skip", response_model=ReminderInstanceResponse)
def mark_reminder_skip(reminder_id: int, db: Session = Depends(get_db)):
    """Mark reminder as skipped"""
    db_reminder = db.query(ReminderInstance).filter(ReminderInstance.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db_reminder.status = "skipped"
    
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder