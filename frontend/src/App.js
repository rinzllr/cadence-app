import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import StatisticsView from './components/StatisticsView';
import FeedbackView from './components/FeedbackView';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      {type === 'success' && '✓ '}
      {type === 'error' && '✗ '}
      {message}
    </div>
  );
}

function App() {
  const [habits, setHabits] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [newHabit, setNewHabit] = useState({
    name: '',
    frequency: 'daily',
    specific_time: '08:00',
    type: 'basic',
    track_stats: false,
    frequency_config: [],
    prompt_for_feedback: false
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [viewingFeedbackHabitId, setViewingFeedbackHabitId] = useState(null);
  const [feedbackReminderId, setFeedbackReminderId] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchHabits = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/habits');
      const data = await response.json();
      setHabits(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching habits:', error);
      showToast('Failed to load habits', 'error');
      setLoading(false);
    }
  }, []);

  const fetchTodayReminders = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/reminders/today');
      const data = await response.json();
      setTodayReminders(data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
    fetchTodayReminders();
  }, [fetchHabits, fetchTodayReminders]);

  const createHabit = async (e) => {
    e.preventDefault();
    
    if (!newHabit.name.trim()) {
      showToast('Habit name is required', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHabit),
      });
      
      if (!response.ok) throw new Error('Failed to create habit');
      
      const data = await response.json();
      setHabits([...habits, data]);

      await fetch('http://localhost:8000/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: data.id }),
      });
      
      fetchTodayReminders();
      setNewHabit({
        name: '',
  frequency: 'daily',
  specific_time: '08:00',
  type: 'basic',
  track_stats: false,
  frequency_config: [],
  prompt_for_feedback: false
});
      
      showToast(`Habit "${data.name}" created! 🎉`, 'success');
    } catch (error) {
      console.error('Error creating habit:', error);
      showToast('Failed to create habit', 'error');
    }
  };

  const markComplete = async (reminderId, habitName, feedback = null) => {
  try {
    const body = feedback ? JSON.stringify({ feedback_text: feedback }) : JSON.stringify({});
    console.log('Sending body:', body);
    await fetch(`http://localhost:8000/reminders/${reminderId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });
    fetchTodayReminders();
    showToast(`"${habitName}" completed! ✨`, 'success');
  } catch (error) {
    console.error('Error marking complete:', error);
    showToast('Failed to mark complete', 'error');
  }
};

  const markSkip = async (reminderId, habitName) => {
    try {
      await fetch(`http://localhost:8000/reminders/${reminderId}/skip`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      fetchTodayReminders();
      showToast(`"${habitName}" skipped`, 'success');
    } catch (error) {
      console.error('Error marking skip:', error);
      showToast('Failed to mark skip', 'error');
    }
  };

  const deleteHabit = async (id, habitName) => {
    if (!window.confirm(`Delete "${habitName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await fetch(`http://localhost:8000/habits/${id}`, {
        method: 'DELETE',
      });
      setHabits(habits.filter(habit => habit.id !== id));
      showToast(`"${habitName}" deleted`, 'success');
    } catch (error) {
      console.error('Error deleting habit:', error);
      showToast('Failed to delete habit', 'error');
    }
  };

  const togglePauseHabit = async (id, habitName, isActive) => {
  try {
    await fetch(`http://localhost:8000/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    await fetchHabits();
    const action = isActive ? 'paused' : 'resumed';
    showToast(`"${habitName}" ${action}`, 'success');
  } catch (error) {
    console.error('Error toggling pause:', error);
    showToast('Failed to update habit', 'error');
  }
};

  if (selectedHabitId) {
  const habit = habits.find(h => h.id === selectedHabitId);
  return (
    <StatisticsView
      habit={habit}
      onBack={() => setSelectedHabitId(null)}
      onHome={() => setSelectedHabitId(null)}
    />
  );
}

if (viewingFeedbackHabitId) {
  const habit = habits.find(h => h.id === viewingFeedbackHabitId);
  return (
    <FeedbackView
      habit={habit}
      onBack={() => setViewingFeedbackHabitId(null)}
      onHome={() => setViewingFeedbackHabitId(null)}
    />
  );
}

  if (loading) {
    return (
      <div className="App">
        <h1>Cadence</h1>
        <div className="loading" aria-busy="true" aria-label="Loading habits">
          Loading your habits...
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Cadence</h1>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="today-section">
        <h2>Today's Habits</h2>
        {todayReminders.length === 0 ? (
          <p className="empty-state">All habits completed for today! 🎉</p>
        ) : (
          <ul>
            {todayReminders.map((reminder) => {
  const habit = habits.find(h => h.id === reminder.habit_id);
  const showingFeedback = feedbackReminderId === reminder.id;
  
  return (
    <li key={reminder.id} className="reminder-item">
      <div className="reminder-content">
        <strong>{habit?.name}</strong>
        <div className="reminder-meta">
          <span className="time">⏱️ {habit?.specific_time}</span>
          <span className="frequency">{habit?.frequency}</span>
        </div>
      </div>
      
      {showingFeedback && habit?.prompt_for_feedback && (
        <div className="feedback-input-container">
          <textarea
  placeholder="Add a note (optional)..."
  value={feedbackText}
  onChange={(e) => {
    console.log('Textarea changed:', e.target.value);
    setFeedbackText(e.target.value);
  }}
  className="feedback-input"
  rows="3"
/>
        </div>
      )}
      
      <div className="reminder-actions">
        {showingFeedback && habit?.prompt_for_feedback ? (
          <>
            <button
  onClick={() => {
    console.log('Confirm clicked, feedbackText:', feedbackText);
    markComplete(reminder.id, habit?.name, feedbackText);
    setFeedbackReminderId(null);
    setFeedbackText('');
  }}
  className="btn-success"
  aria-label={`Confirm ${habit?.name} as complete`}
>
  ✓ Confirm
</button>
            <button
              onClick={() => {
                setFeedbackReminderId(null);
                setFeedbackText('');
              }}
              className="btn-secondary"
              aria-label="Cancel"
            >
              ✗ Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                if (habit?.prompt_for_feedback) {
                  setFeedbackReminderId(reminder.id);
                } else {
                  markComplete(reminder.id, habit?.name);
                }
              }}
              className="btn-success"
              aria-label={`Mark ${habit?.name} as complete`}
            >
              ✓ Done
            </button>
            <button
              onClick={() => markSkip(reminder.id, habit?.name)}
              className="btn-danger"
              aria-label={`Skip ${habit?.name}`}
            >
              ✗ Skip
            </button>
          </>
        )}
      </div>
    </li>
  );
})}
          </ul>
        )}
      </div>

      <div className="form-section">
        <h2>Create Habit</h2>
        <form onSubmit={createHabit} aria-label="Create new habit form">
          <div className="form-group">
            <label htmlFor="habit-name">Habit Name</label>
            <input
              id="habit-name"
              type="text"
              placeholder="e.g., Take Vitamins"
              value={newHabit.name}
              onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
              required
              aria-required="true"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="frequency">Frequency</label>
              <select
                id="frequency"
                value={newHabit.frequency}
                onChange={(e) => setNewHabit({...newHabit, frequency: e.target.value})}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="time">Time</label>
              <input
                id="time"
                type="time"
                value={newHabit.specific_time}
                onChange={(e) => setNewHabit({...newHabit, specific_time: e.target.value})}
              />
            </div>
          </div>

          {newHabit.frequency === 'weekly' && (
            <div className="form-group">
              <label>Days of Week</label>
              <div className="days-selector">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <label key={day} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={newHabit.frequency_config?.includes(day) || false}
                      onChange={(e) => {
                        const days = newHabit.frequency_config || [];
                        if (e.target.checked) {
                          setNewHabit({...newHabit, frequency_config: [...days, day]});
                        } else {
                          setNewHabit({...newHabit, frequency_config: days.filter(d => d !== day)});
                        }
                      }}
                    />
                    <span>{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={newHabit.track_stats}
              onChange={(e) => setNewHabit({
                ...newHabit, 
                track_stats: e.target.checked,
                type: e.target.checked ? 'smart' : 'basic'
              })}
            />
            <span>Track Statistics</span>
          </label>

          <label className="checkbox-label">
  <input
    type="checkbox"
    checked={newHabit.prompt_for_feedback}
    onChange={(e) => setNewHabit({...newHabit, prompt_for_feedback: e.target.checked})}
  />
  <span>Prompt for Feedback</span>
</label>

          <button type="submit" className="btn-primary">
            Create Habit
          </button>
        </form>
      </div>

      <div className="habits-section">
        <h2>All Habits</h2>
        {habits.length === 0 ? (
          <p className="empty-state">No habits yet. Create one to get started! 🚀</p>
        ) : (
          <>
            {habits.filter(h => h.is_active).length > 0 && (
              <div className="habits-category">
                <h3>Active</h3>
                <ul>
                  {habits.filter(h => h.is_active).map((habit) => (
                    <li key={habit.id} className="habit-item">
                      <div className="habit-content">
                        <strong>{habit.name}</strong>
                        <div className="habit-meta">
                          <span className="badge">
                            {habit.type === 'smart' ? '🧠 Smart' : '📌 Basic'}
                          </span>
                          <span className="frequency">{habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</span>
                          {habit.track_stats && <span className="badge stats">📊 Tracked</span>}
                        </div>
                      </div>
                      <div className="habit-actions">
                        {habit.track_stats && (
                          <button
                            onClick={() => setSelectedHabitId(habit.id)}
                            className="btn-secondary"
                            aria-label={`View statistics for ${habit.name}`}
                          >
                            📊 Stats
                          </button>
                        )}
                        {habit.prompt_for_feedback && (
    <button
      onClick={() => setViewingFeedbackHabitId(habit.id)}
      className="btn-secondary"
      aria-label={`View feedback for ${habit.name}`}
    >
      📝 Feedback
    </button>
  )} 
                        <button
                          onClick={() => togglePauseHabit(habit.id, habit.name, habit.is_active)}
                          className="btn-secondary"
                          aria-label={`Pause ${habit.name}`}
                        >
                          ⏸️ Pause
                        </button>
                        <button
                          onClick={() => deleteHabit(habit.id, habit.name)}
                          className="btn-danger"
                          aria-label={`Delete ${habit.name}`}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {habits.filter(h => !h.is_active).length > 0 && (
              <div className="habits-category">
                <h3>Paused</h3>
                <ul>
                  {habits.filter(h => !h.is_active).map((habit) => (
                    <li key={habit.id} className="habit-item">
                      <div className="habit-content">
                        <strong>{habit.name}</strong>
                        <div className="habit-meta">
                          <span className="badge">
                            {habit.type === 'smart' ? '🧠 Smart' : '📌 Basic'}
                          </span>
                          <span className="frequency">{habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</span>
                          {habit.track_stats && <span className="badge stats">📊 Tracked</span>}
                          <span className="badge inactive">○ Paused</span>
                        </div>
                      </div>
                      <div className="habit-actions">
                        {habit.track_stats && (
                          <button
                            onClick={() => setSelectedHabitId(habit.id)}
                            className="btn-secondary"
                            aria-label={`View statistics for ${habit.name}`}
                          >
                            📊 Stats
                          </button>
                        )}
                        <button
                          onClick={() => togglePauseHabit(habit.id, habit.name, habit.is_active)}
                          className="btn-warning"
                          aria-label={`Resume ${habit.name}`}
                        >
                          ▶️ Resume
                        </button>
                        <button
                          onClick={() => deleteHabit(habit.id, habit.name)}
                          className="btn-danger"
                          aria-label={`Delete ${habit.name}`}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;