import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [habits, setHabits] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [newHabit, setNewHabit] = useState({
    name: '',
    frequency: 'daily',
    specific_time: '08:00',
    type: 'basic',
    track_stats: false
  });
  const [loading, setLoading] = useState(true);

  // Fetch on load
  useEffect(() => {
    fetchHabits();
    fetchTodayReminders();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('http://localhost:8000/habits');
      const data = await response.json();
      setHabits(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching habits:', error);
      setLoading(false);
    }
  };

  const fetchTodayReminders = async () => {
    try {
      const response = await fetch('http://localhost:8000/reminders/today');
      const data = await response.json();
      setTodayReminders(data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const createHabit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHabit),
      });
      const data = await response.json();
      setHabits([...habits, data]);
      
      // Create reminder for today
      const today = new Date().toISOString().split('T')[0];
      await fetch('http://localhost:8000/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habit_id: data.id,
          scheduled_date: today
        }),
      });
      
      fetchTodayReminders();
      setNewHabit({
        name: '',
        frequency: 'daily',
        specific_time: '08:00',
        type: 'basic',
        track_stats: false
      });
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const markComplete = async (reminderId) => {
    try {
      await fetch(`http://localhost:8000/reminders/${reminderId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      fetchTodayReminders();
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  };

  const markSkip = async (reminderId) => {
    try {
      await fetch(`http://localhost:8000/reminders/${reminderId}/skip`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      fetchTodayReminders();
    } catch (error) {
      console.error('Error marking skip:', error);
    }
  };

  const deleteHabit = async (id) => {
    try {
      await fetch(`http://localhost:8000/habits/${id}`, {
        method: 'DELETE',
      });
      setHabits(habits.filter(habit => habit.id !== id));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      <h1>Cadence</h1>
      
      <div className="today-section">
        <h2>Today's Habits to Complete</h2>
        {todayReminders.length === 0 ? (
          <p>All habits completed for today! 🎉</p>
        ) : (
          <ul>
            {todayReminders.map((reminder) => {
              const habit = habits.find(h => h.id === reminder.habit_id);
              return (
                <li key={reminder.id}>
                  <div>
                    <strong>{habit?.name}</strong>
                    <p>Time: {habit?.specific_time}</p>
                    <p>Status: {reminder.status}</p>
                  </div>
                  <div>
                    <button onClick={() => markComplete(reminder.id)}>✓ Done</button>
                    <button onClick={() => markSkip(reminder.id)}>✗ Skip</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="form-section">
        <h2>Create Habit</h2>
        <form onSubmit={createHabit}>
          <input
            type="text"
            placeholder="Habit name"
            value={newHabit.name}
            onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
            required
          />
          <select
            value={newHabit.frequency}
            onChange={(e) => setNewHabit({...newHabit, frequency: e.target.value})}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input
            type="time"
            value={newHabit.specific_time}
            onChange={(e) => setNewHabit({...newHabit, specific_time: e.target.value})}
          />
          <label>
            <input
              type="checkbox"
              checked={newHabit.track_stats}
              onChange={(e) => setNewHabit({...newHabit, track_stats: e.target.checked})}
            />
            Track Statistics
          </label>
          <button type="submit">Create Habit</button>
        </form>
      </div>

      <div className="habits-section">
        <h2>All Habits</h2>
        {habits.length === 0 ? (
          <p>No habits yet. Create one!</p>
        ) : (
          <ul>
            {habits.map((habit) => (
              <li key={habit.id}>
                <div>
                  <strong>{habit.name}</strong>
                  <p>Frequency: {habit.frequency} at {habit.specific_time}</p>
                  <p>Type: {habit.type}</p>
                  {habit.track_stats && <p>📊 Tracking stats</p>}
                </div>
                <button onClick={() => deleteHabit(habit.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
