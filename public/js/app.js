// API Configuration
const API_URL = window.location.origin;

// Socket.io connection
const socket = io(API_URL);

// Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const resultsContainer = document.getElementById('resultsContainer');
const dateDisplay = document.getElementById('dateDisplay');
const frResult = document.getElementById('frResult');
const srResult = document.getElementById('srResult');
const frTime = document.getElementById('frTime');
const srTime = document.getElementById('srTime');
const frStatus = document.getElementById('frStatus');
const srStatus = document.getElementById('srStatus');
const lastUpdated = document.getElementById('lastUpdated');
const connectionStatus = document.getElementById('connectionStatus');
const displayFrTime = document.getElementById('displayFrTime');
const displaySrTime = document.getElementById('displaySrTime');
const frCountdown = document.getElementById('frCountdown');
const srCountdown = document.getElementById('srCountdown');

// Countdown timers
let countdownInterval;

function updateCountdown(targetTime, element, isCompleted) {
  if (isCompleted) {
    element.textContent = 'Declared ✓';
    element.style.color = '#10b981';
    return;
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const targetDateTime = new Date(`${today}T${targetTime}`);
  
  const diff = targetDateTime - now;
  
  if (diff <= 0) {
    element.textContent = 'Time Passed';
    element.style.color = '#fbbf24';
    return;
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  element.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  element.style.color = 'white';
}

function startCountdown(frTime, srTime, frDeclared, srDeclared) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(() => {
    updateCountdown(frTime, frCountdown, frDeclared);
    updateCountdown(srTime, srCountdown, srDeclared);
  }, 1000);
  
  // Initial update
  updateCountdown(frTime, frCountdown, frDeclared);
  updateCountdown(srTime, srCountdown, srDeclared);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Format day
function formatDay(dateString) {
  const date = new Date(dateString);
  const options = { weekday: 'long' };
  return date.toLocaleDateString('en-US', options);
}

// Format time (24h to 12h)
function formatTime(time24) {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Format updated time
function formatUpdatedTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Update UI with result data
function updateUI(data) {
  // Update date display
  dateDisplay.querySelector('.date').textContent = formatDate(data.date);
  dateDisplay.querySelector('.day').textContent = formatDay(data.date);

  // Update times
  frTime.textContent = formatTime(data.fr_time);
  srTime.textContent = formatTime(data.sr_time);
  displayFrTime.textContent = formatTime(data.fr_time);
  displaySrTime.textContent = formatTime(data.sr_time);

  // Start countdown timers
  const frDeclared = (data.fr_result !== null && data.fr_result !== undefined);
  const srDeclared = (data.sr_result !== null && data.sr_result !== undefined);
  startCountdown(data.fr_time, data.sr_time, frDeclared, srDeclared);

  // Update First Round result
  if (data.fr_result !== null && data.fr_result !== undefined) {
    frResult.textContent = String(data.fr_result).padStart(2, '0');
    frResult.classList.remove('pending');
    frResult.classList.add('result-number-table');
    frStatus.textContent = 'Declared';
    frStatus.className = 'status-badge declared';
  } else {
    frResult.textContent = 'Pending';
    frResult.classList.add('pending', 'result-number-table');
    frStatus.textContent = 'Pending';
    frStatus.className = 'status-badge pending';
  }

  // Update Second Round result
  if (data.sr_result !== null && data.sr_result !== undefined) {
    srResult.textContent = String(data.sr_result).padStart(2, '0');
    srResult.classList.remove('pending');
    srResult.classList.add('result-number-table');
    srStatus.textContent = 'Declared';
    srStatus.className = 'status-badge declared';
  } else {
    srResult.textContent = 'Pending';
    srResult.classList.add('pending', 'result-number-table');
    srStatus.textContent = 'Pending';
    srStatus.className = 'status-badge pending';
  }

  // Update last updated time
  lastUpdated.textContent = formatUpdatedTime(data.updated_at);

  // Show results container
  loadingState.style.display = 'none';
  errorState.style.display = 'none';
  resultsContainer.style.display = 'block';
}

// Fetch today's results
async function fetchTodayResults() {
  try {
    const response = await fetch(`${API_URL}/api/results/today`);
    const data = await response.json();

    if (data.success) {
      updateUI(data.data);
    } else {
      throw new Error(data.message || 'Failed to load results');
    }
  } catch (error) {
    console.error('Error fetching results:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
}

// Socket.io event listeners
socket.on('connect', () => {
  console.log('Connected to server');
  connectionStatus.textContent = '● Connected';
  connectionStatus.style.color = '#16a34a';
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  connectionStatus.textContent = '● Disconnected';
  connectionStatus.style.color = '#dc2626';
});

socket.on('resultUpdate', (data) => {
  console.log('Result update received:', data);
  // Only update if it's today's result
  const today = new Date().toISOString().split('T')[0];
  if (data.date === today) {
    updateUI(data);
    // Show a subtle notification
    showNotification('Result Updated!');
  }
});

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #16a34a;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize
fetchTodayResults();

// Auto-refresh fallback (every 30 seconds)
setInterval(() => {
  if (!socket.connected) {
    console.log('Auto-refreshing results...');
    fetchTodayResults();
  }
}, 30000);
