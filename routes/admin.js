const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Result = require('../models/Result');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { generateToken, isValidResult, isValidTime } = require('../utils/helpers');

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
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

module.exports = router;
