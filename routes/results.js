const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const { getTodayDate } = require('../utils/helpers');

// @route   GET /api/results/today
// @desc    Get today's result
// @access  Public
router.get('/today', async (req, res) => {
  try {
    const today = getTodayDate();
    let result = await Result.findOne({ date: today });

    // If today's result doesn't exist, create a pending one
    if (!result) {
      result = await Result.create({
        date: today,
        status: 'pending'
      });
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

// @route   GET /api/results/:date
// @desc    Get result by date
// @access  Public
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const result = await Result.findOne({ date });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found for this date'
      });
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

// @route   GET /api/results
// @desc    Get results history with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { from, to, limit = 30, page = 1 } = req.query;

    let query = {};

    // Date range filter
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const results = await Result.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Result.countDocuments(query);

    res.json({
      success: true,
      count: results.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: results
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
