require('dotenv').config();
const mongoose = require('mongoose');
const Result = require('../models/Result');
const connectDB = require('../config/db');

// Seed sample results
async function seedResults() {
  try {
    await connectDB();

    console.log('🌱 Seeding sample results...');

    // Generate results for last 30 days
    const today = new Date();
    const results = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateString = date.toISOString().split('T')[0];
      
      // Generate random results (some pending, some complete)
      let fr_result = null;
      let sr_result = null;
      let status = 'pending';

      if (i > 0) { // All past dates have complete results
        fr_result = Math.floor(Math.random() * 100);
        sr_result = Math.floor(Math.random() * 100);
        status = 'declared';
      } else if (i === 0) { // Today's result
        // 50% chance of having FR declared
        if (Math.random() > 0.5) {
          fr_result = Math.floor(Math.random() * 100);
          status = 'partial';
        }
      }

      results.push({
        date: dateString,
        fr_result,
        sr_result,
        fr_time: '15:15',
        sr_time: '16:15',
        status,
        locked: i > 0 // Lock all past results
      });
    }

    // Clear existing results
    await Result.deleteMany({});

    // Insert sample results
    await Result.insertMany(results);

    console.log(`✅ Successfully seeded ${results.length} results!`);
    console.log('📊 Results include last 30 days with varied statuses.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding results:', error.message);
    process.exit(1);
  }
}

seedResults();
