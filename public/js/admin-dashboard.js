// API Configuration
const API_URL = window.location.origin;

// Check authentication
const token = localStorage.getItem('adminToken');
const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');

if (!token) {
  window.location.href = '/admin/login.html';
}

// Set admin name
document.getElementById('adminName').textContent = adminInfo.name || 'Admin';

// Elements
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const todayDate = document.getElementById('todayDate');

// Current result data
let currentResult = null;

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Show success message
function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
  
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 5000);
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
  
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

// API request helper
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = '/admin/login.html';
    throw new Error('Session expired. Please login again.');
  }

  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// Load today's result
async function loadTodayResult() {
  try {
    const today = getTodayDate();
    todayDate.textContent = formatDate(today);

    const data = await apiRequest(`/api/results/today`);
    currentResult = data.data;

    // Update form fields
    document.getElementById('frTime').value = currentResult.fr_time || '15:15';
    document.getElementById('srTime').value = currentResult.sr_time || '16:15';
    
    if (currentResult.fr_result !== null && currentResult.fr_result !== undefined) {
      document.getElementById('frResult').value = currentResult.fr_result;
    }
    
    if (currentResult.sr_result !== null && currentResult.sr_result !== undefined) {
      document.getElementById('srResult').value = currentResult.sr_result;
    }

    // Update status display
    document.getElementById('currentFR').textContent = 
      currentResult.fr_result !== null ? String(currentResult.fr_result).padStart(2, '0') : 'Not Declared';
    
    document.getElementById('currentSR').textContent = 
      currentResult.sr_result !== null ? String(currentResult.sr_result).padStart(2, '0') : 'Not Declared';
    
    const statusBadge = document.getElementById('currentStatus');
    statusBadge.textContent = currentResult.status;
    statusBadge.className = `status-badge ${currentResult.status}`;

    document.getElementById('lockStatus').textContent = currentResult.locked ? '🔒 Locked' : '🔓 Unlocked';

    // Toggle lock/unlock buttons
    if (currentResult.locked) {
      document.getElementById('lockBtn').style.display = 'none';
      document.getElementById('unlockBtn').style.display = 'inline-block';
      document.getElementById('declareFRBtn').disabled = true;
      document.getElementById('declareSRBtn').disabled = true;
    } else {
      document.getElementById('lockBtn').style.display = 'inline-block';
      document.getElementById('unlockBtn').style.display = 'none';
      document.getElementById('declareFRBtn').disabled = false;
      document.getElementById('declareSRBtn').disabled = false;
    }
  } catch (error) {
    console.error('Error loading today result:', error);
    showError(error.message);
  }
}

// Declare First Round
async function declareFR() {
  const frResult = document.getElementById('frResult').value;

  if (!frResult || frResult < 0 || frResult > 99) {
    showError('Please enter a valid F/R result (0-99)');
    return;
  }

  try {
    const today = getTodayDate();
    await apiRequest(`/api/admin/results/${today}/declare/fr`, 'POST', {
      result: parseInt(frResult)
    });

    showSuccess('First Round result declared successfully!');
    await loadTodayResult();
    await loadRecentResults();
  } catch (error) {
    showError(error.message);
  }
}

// Declare Second Round
async function declareSR() {
  const srResult = document.getElementById('srResult').value;

  if (!srResult || srResult < 0 || srResult > 99) {
    showError('Please enter a valid S/R result (0-99)');
    return;
  }

  try {
    const today = getTodayDate();
    await apiRequest(`/api/admin/results/${today}/declare/sr`, 'POST', {
      result: parseInt(srResult)
    });

    showSuccess('Second Round result declared successfully!');
    await loadTodayResult();
    await loadRecentResults();
  } catch (error) {
    showError(error.message);
  }
}

// Update today's result
async function updateTodayResult(event) {
  event.preventDefault();

  const frResult = document.getElementById('frResult').value;
  const srResult = document.getElementById('srResult').value;
  const frTime = document.getElementById('frTime').value;
  const srTime = document.getElementById('srTime').value;

  const body = {
    date: getTodayDate(),
    fr_time: frTime,
    sr_time: srTime
  };

  if (frResult) body.fr_result = parseInt(frResult);
  if (srResult) body.sr_result = parseInt(srResult);

  try {
    await apiRequest('/api/admin/results', 'POST', body);
    showSuccess('Results updated successfully!');
    await loadTodayResult();
    await loadRecentResults();
  } catch (error) {
    showError(error.message);
  }
}

// Lock result
async function lockResult() {
  if (!confirm('Are you sure you want to lock today\'s result? It cannot be modified until unlocked.')) {
    return;
  }

  try {
    const today = getTodayDate();
    await apiRequest(`/api/admin/results/${today}/lock`, 'POST');
    showSuccess('Result locked successfully!');
    await loadTodayResult();
  } catch (error) {
    showError(error.message);
  }
}

// Unlock result
async function unlockResult() {
  if (!confirm('Are you sure you want to unlock this result?')) {
    return;
  }

  try {
    const today = getTodayDate();
    await apiRequest(`/api/admin/results/${today}/unlock`, 'POST');
    showSuccess('Result unlocked successfully!');
    await loadTodayResult();
  } catch (error) {
    showError(error.message);
  }
}

// Load result by date
async function loadResultByDate() {
  const date = document.getElementById('editDate').value;

  if (!date) {
    showError('Please select a date');
    return;
  }

  try {
    const data = await apiRequest(`/api/results/${date}`);
    const result = data.data;

    // Show edit fields
    document.getElementById('editResultFields').style.display = 'block';

    // Populate fields
    document.getElementById('editFrTime').value = result.fr_time || '15:15';
    document.getElementById('editSrTime').value = result.sr_time || '16:15';
    document.getElementById('editFrResult').value = result.fr_result !== null ? result.fr_result : '';
    document.getElementById('editSrResult').value = result.sr_result !== null ? result.sr_result : '';

    if (result.locked) {
      showError('This result is locked. Unlock it first to make changes.');
    }
  } catch (error) {
    showError(error.message || 'Result not found for this date');
    document.getElementById('editResultFields').style.display = 'none';
  }
}

// Edit past result
async function editPastResult(event) {
  event.preventDefault();

  const date = document.getElementById('editDate').value;
  const frResult = document.getElementById('editFrResult').value;
  const srResult = document.getElementById('editSrResult').value;
  const frTime = document.getElementById('editFrTime').value;
  const srTime = document.getElementById('editSrTime').value;

  const body = {
    fr_time: frTime,
    sr_time: srTime
  };

  if (frResult !== '') body.fr_result = parseInt(frResult);
  if (srResult !== '') body.sr_result = parseInt(srResult);

  try {
    await apiRequest(`/api/admin/results/${date}`, 'PUT', body);
    showSuccess('Past result updated successfully!');
    clearEditForm();
    await loadRecentResults();
  } catch (error) {
    showError(error.message);
  }
}

// Clear edit form
function clearEditForm() {
  document.getElementById('editDate').value = '';
  document.getElementById('editResultFields').style.display = 'none';
  document.getElementById('editFrTime').value = '';
  document.getElementById('editSrTime').value = '';
  document.getElementById('editFrResult').value = '';
  document.getElementById('editSrResult').value = '';
}

// Load recent results
async function loadRecentResults() {
  try {
    const data = await apiRequest('/api/results?limit=10');
    const results = data.data;

    const tableBody = document.getElementById('recentResultsTable');
    tableBody.innerHTML = '';

    results.forEach(result => {
      const row = document.createElement('tr');
      
      const frDisplay = result.fr_result !== null ? String(result.fr_result).padStart(2, '0') : '-';
      const srDisplay = result.sr_result !== null ? String(result.sr_result).padStart(2, '0') : '-';

      row.innerHTML = `
        <td><strong>${formatDate(result.date)}</strong></td>
        <td><span class="result-value">${frDisplay}</span></td>
        <td><span class="result-value">${srDisplay}</span></td>
        <td><span class="status-badge ${result.status}">${result.status}</span></td>
        <td>${result.locked ? '🔒' : '🔓'}</td>
      `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading recent results:', error);
  }
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = '/admin/login.html';
  }
}

// Initialize
loadTodayResult();
loadRecentResults();
