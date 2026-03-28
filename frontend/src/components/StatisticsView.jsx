import React, { useState, useEffect, useCallback } from 'react';
import '../styles/StatisticsView.css';

function StatisticsView({ habit, onBack, onHome, session }) {
  const [stats, setStats] = useState(null);
  const [timeframe, setTimeframe] = useState('weekly');
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(
  `${API_URL}/stats/habit/${habit.id}?timeframe=${timeframe}`,
  { headers: { 'Authorization': `Bearer ${session?.access_token}` } }
);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [habit.id, timeframe]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="stats-view">
        <p className="loading">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2>{habit.name} Statistics</h2>
        <div className="stats-buttons">
          <button onClick={onBack} className="btn-secondary">← Back</button>
          <button onClick={onHome} className="btn-secondary">🏠 Home</button>
        </div>
      </div>

      <div className="timeframe-selector">
        <label htmlFor="timeframe">Timeframe:</label>
        <select
          id="timeframe"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="weekly">Weekly (7 days)</option>
          <option value="monthly">Monthly (30 days)</option>
          <option value="quarterly">Quarterly (90 days)</option>
          <option value="yearly">Yearly (365 days)</option>
        </select>
      </div>

      {stats && (
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{stats.completed}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Missed</div>
              <div className="stat-value">{stats.skipped}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Completion Rate</div>
              <div className="stat-value">{stats.completion_rate}%</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsView;