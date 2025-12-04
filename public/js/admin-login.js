// API Configuration
const API_URL = window.location.origin;

// Check if already logged in
if (localStorage.getItem('adminToken')) {
  window.location.href = '/admin/dashboard.html';
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginBtnSpinner = document.getElementById('loginBtnSpinner');

  // Clear previous errors
  errorMessage.style.display = 'none';

  // Disable button and show spinner
  loginBtn.disabled = true;
  loginBtnText.textContent = 'Logging in...';
  loginBtnSpinner.style.display = 'inline-block';

  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store token and admin info
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminInfo', JSON.stringify(data.admin));

      // Show success message
      showSuccess('Login successful! Redirecting...');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/admin/dashboard.html';
      }, 1000);
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.textContent = error.message || 'Invalid email or password. Please try again.';
    errorMessage.style.display = 'block';

    // Re-enable button
    loginBtn.disabled = false;
    loginBtnText.textContent = 'Login';
    loginBtnSpinner.style.display = 'none';
  }
}

// Show success message
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success';
  successDiv.textContent = message;
  
  const form = document.getElementById('loginForm');
  form.parentNode.insertBefore(successDiv, form);
}
