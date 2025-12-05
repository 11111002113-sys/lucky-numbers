const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Result = require('../models/Result');
const { protect } = require('../middleware/auth');
const { loginLimiter, adminLimiter } = require('../middleware/rateLimiter');
const { generateToken, isValidResult, isValidTime } = require('../utils/helpers');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { 
  checkBlockedIP, 
  trackFailedLogin, 
  resetFailedAttempts, 
  getClientIP, 
  logAdminAccess 
} = require('../middleware/security');

// Apply security middleware to all admin routes
router.use(checkBlockedIP);
router.use(logAdminAccess);

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', loginLimiter, async (req, res) => {
  const clientIP = getClientIP(req);
  
  try {
    const { email, password, token } = req.body;

    // Validate input
    if (!email || !password) {
      trackFailedLogin(clientIP);
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email }).select('+password +twoFactorSecret');

    if (!admin) {
      trackFailedLogin(clientIP);
      console.warn(`❌ Failed login attempt from IP ${clientIP}: Invalid email`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      trackFailedLogin(clientIP);
      console.warn(`❌ Failed login attempt from IP ${clientIP}: Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if 2FA is enabled
    if (admin.twoFactorEnabled) {
      if (!token) {
        return res.status(200).json({
          success: false,
          requires2FA: true,
          message: 'Please enter your 6-digit 2FA code'
        });
      }

      // Verify 2FA token
      const verified = speakeasy.totp.verify({
        secret: admin.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        trackFailedLogin(clientIP);
        console.warn(`❌ Failed 2FA verification from IP ${clientIP} for ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }
    }

    // Successful login - reset failed attempts
    resetFailedAttempts(clientIP);
    console.log(`✅ Successful admin login from IP ${clientIP}: ${email}`);

    // Generate token
    const authToken = generateToken(admin._id);

    res.json({
      success: true,
      token: authToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        twoFactorEnabled: admin.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error(error);
    trackFailedLogin(clientIP);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/2fa/setup
// @desc    Setup 2FA for admin
// @access  Private (Admin)
router.post('/2fa/setup', protect, adminLimiter, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('+twoFactorSecret');

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Lucky Numbers (${admin.email})`
    });

    // Save secret to admin
    admin.twoFactorSecret = secret.base32;
    await admin.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan this QR code with Google Authenticator or Authy'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/2fa/enable
// @desc    Enable 2FA after verifying token
// @access  Private (Admin)
router.post('/2fa/enable', protect, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide 2FA token'
      });
    }

    const admin = await Admin.findById(req.admin.id).select('+twoFactorSecret');

    if (!admin.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please setup 2FA first'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }

    // Enable 2FA
    admin.twoFactorEnabled = true;
    await admin.save();

    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/2fa/disable
// @desc    Disable 2FA
// @access  Private (Admin)
router.post('/2fa/disable', protect, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide 2FA token to disable'
      });
    }

    const admin = await Admin.findById(req.admin.id).select('+twoFactorSecret');

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }

    // Disable 2FA
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    await admin.save();

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/results
// @desc    Add or update result
// @access  Private (Admin)
router.post('/results', protect, async (req, res) => {
  try {
    const { date, fr_result, sr_result, fr_time, sr_time } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Check if result exists
    let result = await Result.findOne({ date });

    // Check if locked
    if (result && result.locked) {
      return res.status(403).json({
        success: false,
        message: 'Result is locked and cannot be modified'
      });
    }

    // Validate results
    if (fr_result !== undefined && fr_result !== null && !isValidResult(fr_result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid First Round result (must be 0-99)'
      });
    }

    if (sr_result !== undefined && sr_result !== null && !isValidResult(sr_result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Second Round result (must be 0-99)'
      });
    }

    // Validate times
    if (fr_time && !isValidTime(fr_time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid First Round time format (use HH:MM)'
      });
    }

    if (sr_time && !isValidTime(sr_time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Second Round time format (use HH:MM)'
      });
    }

    if (result) {
      // Update existing result
      if (fr_result !== undefined) result.fr_result = fr_result;
      if (sr_result !== undefined) result.sr_result = sr_result;
      if (fr_time) result.fr_time = fr_time;
      if (sr_time) result.sr_time = sr_time;

      result.updateStatus();
      await result.save();
    } else {
      // Create new result
      result = await Result.create({
        date,
        fr_result: fr_result || null,
        sr_result: sr_result || null,
        fr_time: fr_time || '15:15',
        sr_time: sr_time || '16:15'
      });
      result.updateStatus();
      await result.save();
    }

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('resultUpdate', result);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/results/:date/declare/fr
// @desc    Declare First Round result
// @access  Private (Admin)
router.post('/results/:date/declare/fr', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const { result: fr_result } = req.body;

    if (!isValidResult(fr_result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result (must be 0-99)'
      });
    }

    let result = await Result.findOne({ date });

    if (!result) {
      result = await Result.create({ date });
    }

    if (result.locked) {
      return res.status(403).json({
        success: false,
        message: 'Result is locked'
      });
    }

    result.fr_result = fr_result;
    result.updateStatus();
    await result.save();

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('resultUpdate', result);
    }

    res.json({
      success: true,
      message: 'First Round result declared',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/results/:date/declare/sr
// @desc    Declare Second Round result
// @access  Private (Admin)
router.post('/results/:date/declare/sr', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const { result: sr_result } = req.body;

    if (!isValidResult(sr_result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result (must be 0-99)'
      });
    }

    let result = await Result.findOne({ date });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found. Please declare First Round first.'
      });
    }

    if (result.locked) {
      return res.status(403).json({
        success: false,
        message: 'Result is locked'
      });
    }

    result.sr_result = sr_result;
    result.updateStatus();
    await result.save();

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('resultUpdate', result);
    }

    res.json({
      success: true,
      message: 'Second Round result declared',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/results/:date/lock
// @desc    Lock result to prevent changes
// @access  Private (Admin)
router.post('/results/:date/lock', protect, async (req, res) => {
  try {
    const { date } = req.params;

    const result = await Result.findOne({ date });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    result.locked = true;
    await result.save();

    res.json({
      success: true,
      message: 'Result locked successfully',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/results/:date/unlock
// @desc    Unlock result to allow changes
// @access  Private (Admin)
router.post('/results/:date/unlock', protect, async (req, res) => {
  try {
    const { date } = req.params;

    const result = await Result.findOne({ date });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    result.locked = false;
    await result.save();

    res.json({
      success: true,
      message: 'Result unlocked successfully',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/results/:date
// @desc    Edit existing result
// @access  Private (Admin)
router.put('/results/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const { fr_result, sr_result, fr_time, sr_time } = req.body;

    const result = await Result.findOne({ date });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    if (result.locked) {
      return res.status(403).json({
        success: false,
        message: 'Result is locked. Unlock it first to make changes.'
      });
    }

    // Update fields
    if (fr_result !== undefined) result.fr_result = fr_result;
    if (sr_result !== undefined) result.sr_result = sr_result;
    if (fr_time) result.fr_time = fr_time;
    if (sr_time) result.sr_time = sr_time;

    result.updateStatus();
    await result.save();

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('resultUpdate', result);
    }

    res.json({
      success: true,
      message: 'Result updated successfully',
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/me
// @desc    Get current admin info
// @access  Private (Admin)
router.get('/me', protect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      email: admin.email,
      twoFactorEnabled: admin.twoFactorEnabled || false
    });
  } catch (error) {
    console.error('Error fetching admin info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/change-email
// @desc    Change admin email
// @access  Private (Admin)
router.post('/change-email', protect, async (req, res) => {
  const clientIP = getClientIP(req);
  
  try {
    const { newEmail, currentPassword } = req.body;

    // Validate input
    if (!newEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new email and current password'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin.id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      trackFailedLogin(clientIP);
      console.warn(`❌ Failed email change attempt from IP ${clientIP}: Invalid password`);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new email is already in use
    const existingAdmin = await Admin.findOne({ email: newEmail });
    if (existingAdmin && existingAdmin._id.toString() !== admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Update email
    admin.email = newEmail;
    await admin.save();

    console.log(`✅ Email changed successfully from IP ${clientIP} for admin ${admin._id}`);

    res.json({
      success: true,
      message: 'Email updated successfully'
    });
  } catch (error) {
    console.error('Error changing email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.post('/change-password', protect, async (req, res) => {
  const clientIP = getClientIP(req);
  
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin.id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      trackFailedLogin(clientIP);
      console.warn(`❌ Failed password change attempt from IP ${clientIP}: Invalid current password`);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    console.log(`✅ Password changed successfully from IP ${clientIP} for admin ${admin._id}`);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
