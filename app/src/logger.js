// src/logger.js
const LOG_KEY = 'nutrisafe_logs';

export function logEvent(eventType, details) {
  const log = {
    timestamp: new Date().toISOString(),
    eventType,
    details: JSON.stringify(details),
    userAgent: navigator.userAgent
  };
  
  const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  logs.push(log);
  if (logs.length > 100) logs.shift();
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  
  console.log(`[LOG] ${eventType}:`, details);
}

export function getLogs() {
  return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
}

export function clearLogs() {
  localStorage.removeItem(LOG_KEY);
}