const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD format
  },
  fr_result: {
    type: Number,
    min: 0,
    max: 99,
    default: null
  },
  sr_result: {
    type: Number,
    min: 0,
    max: 99,
    default: null
  },
  fr_time: {
    type: String,
    default: '15:15'
  },
  sr_time: {
    type: String,
    default: '16:15'
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'declared'],
    default: 'pending'
  },
  locked: {
    type: Boolean,
    default: false
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updated_at field before saving
resultSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Method to check if result is complete
resultSchema.methods.isComplete = function() {
  return this.fr_result !== null && this.sr_result !== null;
};

// Method to update status based on results
resultSchema.methods.updateStatus = function() {
  if (this.fr_result !== null && this.sr_result !== null) {
    this.status = 'declared';
  } else if (this.fr_result !== null || this.sr_result !== null) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
};

module.exports = mongoose.model('Result', resultSchema);
