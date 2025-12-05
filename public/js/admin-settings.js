// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/admin/login.html';
    return;
  }
  
  // Load admin info and 2FA status
  loadAdminInfo();
});

// Load current admin information
async function loadAdminInfo() {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
        return;
      }
      throw new Error('Failed to load admin info');
    }

    const data = await response.json();
    
    // Update UI
    document.getElementById('currentEmail').textContent = data.email || 'N/A';
    
    // Update 2FA status
    const twoFactorStatusEl = document.getElementById('twoFactorStatus');
    if (data.twoFactorEnabled) {
      twoFactorStatusEl.innerHTML = '<span style="color: #16a34a; font-weight: 600;">✓ Enabled</span>';
      document.getElementById('2faEnabled').style.display = 'block';
      document.getElementById('2faDisabled').style.display = 'none';
    } else {
      twoFactorStatusEl.innerHTML = '<span style="color: #dc2626; font-weight: 600;">✗ Disabled</span>';
      document.getElementById('2faEnabled').style.display = 'none';
      document.getElementById('2faDisabled').style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading admin info:', error);
    showError('Failed to load admin information');
  }
}

// Change Email
async function changeEmail(e) {
  e.preventDefault();
  
  const newEmail = document.getElementById('newEmail').value;
  const currentPassword = document.getElementById('currentPasswordEmail').value;
  
  const btn = document.getElementById('emailBtn');
  const btnText = document.getElementById('emailBtnText');
  const btnSpinner = document.getElementById('emailBtnSpinner');
  
  try {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    btn.disabled = true;
    
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/change-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newEmail, currentPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change email');
    }

    showSuccess('Email updated successfully! Please log in again with your new email.');
    document.getElementById('emailForm').reset();
    
    // Update displayed email
    document.getElementById('currentEmail').textContent = newEmail;
    
    // Optionally logout after email change
    setTimeout(() => {
      logout();
    }, 2000);

  } catch (error) {
    console.error('Error changing email:', error);
    showError(error.message || 'Failed to change email');
  } finally {
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    btn.disabled = false;
  }
}

// Change Password
async function changePassword(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    showError('New passwords do not match');
    return;
  }
  
  // Validate password length
  if (newPassword.length < 6) {
    showError('New password must be at least 6 characters');
    return;
  }
  
  const btn = document.getElementById('passwordBtn');
  const btnText = document.getElementById('passwordBtnText');
  const btnSpinner = document.getElementById('passwordBtnSpinner');
  
  try {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    btn.disabled = true;
    
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }

    showSuccess('Password updated successfully! Please log in again with your new password.');
    document.getElementById('passwordForm').reset();
    
    // Logout after password change
    setTimeout(() => {
      logout();
    }, 2000);

  } catch (error) {
    console.error('Error changing password:', error);
    showError(error.message || 'Failed to change password');
  } finally {
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    btn.disabled = false;
  }
}

// Setup 2FA
async function setup2FA() {
  const btn = document.getElementById('setup2FABtn');
  const btnText = document.getElementById('setup2FAText');
  const btnSpinner = document.getElementById('setup2FASpinner');
  
  try {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    btn.disabled = true;
    
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/2fa/setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to setup 2FA');
    }

    // Display QR code and secret
    document.getElementById('qrCodeImage').src = data.qrCode;
    document.getElementById('manualSecret').textContent = data.secret;
    document.getElementById('2faSetupModal').style.display = 'block';

  } catch (error) {
    console.error('Error setting up 2FA:', error);
    showError(error.message || 'Failed to setup 2FA');
  } finally {
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    btn.disabled = false;
  }
}

// Verify and Enable 2FA
async function verify2FA(e) {
  e.preventDefault();
  
  const token = document.getElementById('verifyToken').value;
  
  const btn = document.getElementById('verify2FABtn');
  const btnText = document.getElementById('verify2FAText');
  const btnSpinner = document.getElementById('verify2FASpinner');
  
  try {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    btn.disabled = true;
    
    const authToken = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/2fa/enable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid verification code');
    }

    showSuccess('2FA enabled successfully!');
    document.getElementById('2faSetupModal').style.display = 'none';
    document.getElementById('verifyToken').value = '';
    
    // Update status
    loadAdminInfo();

  } catch (error) {
    console.error('Error verifying 2FA:', error);
    showError(error.message || 'Invalid verification code');
  } finally {
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    btn.disabled = false;
  }
}

// Cancel 2FA Setup
function cancel2FASetup() {
  document.getElementById('2faSetupModal').style.display = 'none';
  document.getElementById('verifyToken').value = '';
}

// Disable 2FA
async function disable2FA() {
  if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
    return;
  }
  
  const btn = document.getElementById('disable2FABtn');
  const btnText = document.getElementById('disable2FAText');
  const btnSpinner = document.getElementById('disable2FASpinner');
  
  try {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    btn.disabled = true;
    
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/2fa/disable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to disable 2FA');
    }

    showSuccess('2FA disabled successfully');
    
    // Update status
    loadAdminInfo();

  } catch (error) {
    console.error('Error disabling 2FA:', error);
    showError(error.message || 'Failed to disable 2FA');
  } finally {
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    btn.disabled = false;
  }
}

// Show success message
function showSuccess(message) {
  const successEl = document.getElementById('successMessage');
  const errorEl = document.getElementById('errorMessage');
  
  errorEl.style.display = 'none';
  successEl.textContent = message;
  successEl.style.display = 'block';
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    successEl.style.display = 'none';
  }, 5000);
}

// Show error message
function showError(message) {
  const successEl = document.getElementById('successMessage');
  const errorEl = document.getElementById('errorMessage');
  
  successEl.style.display = 'none';
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}

// Logout
function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/login.html';
}
