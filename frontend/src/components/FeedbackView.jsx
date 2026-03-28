import React, { useState, useEffect, useCallback } from 'react';
import '../styles/FeedbackView.css';

function FeedbackView({ habit, onBack, onHome, session }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const response = await fetch(
  `${API_URL}/reminders/habit/${habit.id}`,
  { headers: { 'Authorization': `Bearer ${session?.access_token}` } }
);
      const data = await response.json();
      // Filter for completed reminders with feedback
      const withFeedback = data.filter(r => r.status === 'completed' && r.feedback_text);
      setFeedback(withFeedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  }, [habit.id]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (loading) {
    return (
      <div className="feedback-view">
        <p className="loading">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="feedback-view">
      <div className="feedback-header">
        <h2>{habit.name} - Feedback</h2>
        <div className="feedback-buttons">
          <button onClick={onBack} className="btn-secondary">← Back</button>
          <button onClick={onHome} className="btn-secondary">🏠 Home</button>
        </div>
      </div>

      {feedback.length === 0 ? (
        <p className="empty-state">No feedback yet for this habit 📝</p>
      ) : (
        <div className="feedback-list">
          {feedback.map((item) => (
            <div key={item.id} className="feedback-item">
              <div className="feedback-date">
                {new Date(item.completed_date).toLocaleDateString()}
              </div>
              <div className="feedback-text">
                {item.feedback_text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedbackView;