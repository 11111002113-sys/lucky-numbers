const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return formatDate(new Date());
};

// Validate result number (0-99)
const isValidResult = (num) => {
  return num !== null && num !== undefined && num >= 0 && num <= 99;
};

// Validate time format (HH:MM)
const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

module.exports = {
  generateToken,
  formatDate,
  getTodayDate,
  isValidResult,
  isValidTime
};
