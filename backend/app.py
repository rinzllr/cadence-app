import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'services'))

import json
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Habit, ReminderInstance
from schemas import HabitCreate, HabitUpdate, HabitResponse, ReminderInstanceCreate, ReminderInstanceResponse, FeedbackRequest
from datetime import date
from typing import Optional
import models
import jwt
from jwt import PyJWKClient
from stats_service import StatsService

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

SUPABASE_URL = os.getenv("SUPABASE_URL")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Auth ──────────────────────────────────────────────────
def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── DB ────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── Health ────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "Hello from Cadence!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ─── Habits ────────────────────────────────────────────────
@app.post("/habits", response_model=HabitResponse)
def create_habit(habit: HabitCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    try:
        habit_data = habit.dict()
        if habit_data.get("frequency_config"):
            habit_data["frequency_config"] = json.dumps(habit_data["frequency_config"])
        db_habit = Habit(**habit_data, user_id=user_id)
        db.add(db_habit)
        db.commit()
        db.refresh(db_habit)
        return db_habit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create habit: {str(e)}")

@app.get("/habits", response_model=list[HabitResponse])
def get_habits(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    habits = db.query(Habit).filter(Habit.user_id == user_id).all()
    return habits

@app.get("/habits/{habit_id}", response_model=HabitResponse)
def get_habit(habit_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit

@app.put("/habits/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: int, habit: HabitUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    try:
        db_habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
        if not db_habit:
            raise HTTPException(status_code=404, detail="Habit not found")

        update_data = habit.dict(exclude_unset=True)
        if "frequency_config" in update_data and update_data["frequency_config"]:
            update_data["frequency_config"] = json.dumps(update_data["frequency_config"])
        for key, value in update_data.items():
            setattr(db_habit, key, value)

        db.add(db_habit)
        db.commit()
        db.refresh(db_habit)
        return db_habit
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update habit: {str(e)}")

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    db_habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not db_habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.query(ReminderInstance).filter(ReminderInstance.habit_id == habit_id).delete()
    db.delete(db_habit)
    db.commit()
    return {"message": "Habit deleted successfully"}

# ─── Reminders ─────────────────────────────────────────────
@app.post("/reminders", response_model=ReminderInstanceResponse)
def create_reminder(reminder: ReminderInstanceCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    try:
        habit = db.query(Habit).filter(Habit.id == reminder.habit_id, Habit.user_id == user_id).first()
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        if not reminder.scheduled_date:
            reminder.scheduled_date = date.today()
        db_reminder = ReminderInstance(**reminder.dict())
        db.add(db_reminder)
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create reminder: {str(e)}")

@app.get("/reminders/today", response_model=list[ReminderInstanceResponse])
def get_today_reminders(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    today = date.today()
    reminders = db.query(ReminderInstance).join(Habit).filter(
        ReminderInstance.scheduled_date == today,
        ReminderInstance.status == "pending",
        Habit.user_id == user_id
    ).all()
    return reminders

@app.put("/reminders/{reminder_id}/complete", response_model=ReminderInstanceResponse)
def mark_reminder_complete(reminder_id: int, request: FeedbackRequest = None, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    try:
        from datetime import datetime
        db_reminder = db.query(ReminderInstance).join(Habit).filter(
            ReminderInstance.id == reminder_id,
            Habit.user_id == user_id
        ).first()
        if not db_reminder:
            raise HTTPException(status_code=404, detail="Reminder not found")
        db_reminder.status = "completed"
        db_reminder.completed_date = datetime.now()
        if request and request.feedback_text:
            if len(request.feedback_text.strip()) > 5000:
                raise HTTPException(status_code=400, detail="Feedback must be less than 5000 characters")
            db_reminder.feedback_text = request.feedback_text
        db.add(db_reminder)
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to mark reminder complete: {str(e)}")

@app.put("/reminders/{reminder_id}/skip", response_model=ReminderInstanceResponse)
def mark_reminder_skip(reminder_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    try:
        db_reminder = db.query(ReminderInstance).join(Habit).filter(
            ReminderInstance.id == reminder_id,
            Habit.user_id == user_id
        ).first()
        if not db_reminder:
            raise HTTPException(status_code=404, detail="Reminder not found")
        db_reminder.status = "skipped"
        db.add(db_reminder)
        db.commit()
        db.refresh(db_reminder)
        return db_reminder
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to mark reminder skipped: {str(e)}")

# ─── Stats ─────────────────────────────────────────────────
@app.get("/stats/habit/{habit_id}")
def get_habit_statistics(habit_id: int, timeframe: str = "weekly", db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    stats = StatsService.get_habit_stats(habit_id, timeframe, db)
    return stats

@app.get("/reminders/habit/{habit_id}")
def get_habit_reminders(habit_id: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    reminders = db.query(ReminderInstance).filter(ReminderInstance.habit_id == habit_id).all()
    return reminders

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)