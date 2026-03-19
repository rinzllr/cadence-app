from sqlalchemy.orm import Session
from models import ReminderInstance, Habit
from datetime import date, timedelta

class StatsService:
    """Calculate habit statistics"""
    
    TIMEFRAME_DAYS = {
        'weekly': 7,
        'monthly': 30,
        'quarterly': 90,
        'yearly': 365
    }
    
    @staticmethod
    def get_habit_stats(habit_id: int, timeframe: str, db: Session):
        """
        Calculate statistics for a habit over a timeframe.
        
        Args:
            habit_id: Which habit to analyze
            timeframe: 'weekly', 'monthly', 'quarterly', or 'yearly'
            db: Database session
            
        Returns:
            Dictionary with completion stats or None if habit not found
        """
        
        # Validate habit exists
        habit = db.query(Habit).filter(Habit.id == habit_id).first()
        if not habit:
            return None
        
        # Calculate date range
        today = date.today()
        days = StatsService.TIMEFRAME_DAYS.get(timeframe, 7)
        start_date = today - timedelta(days=days)
        
        # Query reminders in timeframe
        reminders = db.query(ReminderInstance).filter(
            ReminderInstance.habit_id == habit_id,
            ReminderInstance.scheduled_date >= start_date,
            ReminderInstance.scheduled_date <= today
        ).all()
        
        # Count statuses (single loop, not three)
        completed = 0
        skipped = 0
        for reminder in reminders:
            if reminder.status == "completed":
                completed += 1
            elif reminder.status == "skipped":
                skipped += 1
        
        total = len(reminders)
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        return {
            "habit_id": habit_id,
            "habit_name": habit.name,
            "timeframe": timeframe,
            "completed": completed,
            "skipped": skipped,
            "total": total,
            "completion_rate": round(completion_rate, 1)
        }