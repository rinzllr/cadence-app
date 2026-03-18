import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Loading...');
  const [health, setHealth] = useState('Loading...');

  useEffect(() => {
    // Fetch from FastAPI backend
    fetch('http://localhost:8000/')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error:', error));

    fetch('http://localhost:8000/health')
      .then(response => response.json())
      .then(data => setHealth(data.status))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="App">
      <h1>Cadence</h1>
      <p>Message from backend: {message}</p>
      <p>Health status: {health}</p>
    </div>
  );
}

export default App;