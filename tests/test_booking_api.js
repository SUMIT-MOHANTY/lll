// Manual test script for the booking API
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000'; // Change to your actual API URL
const TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid token

// Test creating a booking
async function testCreateBooking() {
  try {
    console.log('Testing booking creation...');

    const booking = {
      officeId: '60d21b4667d0d8992e610c85', // Replace with valid ObjectId
      slotId: '60d21b4667d0d8992e610c86',   // Replace with valid ObjectId
      date: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    };

    const response = await axios.post(`${API_URL}/api/bookings`, booking, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    console.log('Success! Booking created:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.booking;
  } catch (error) {
    console.error('Error creating booking:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

// Test duplicate booking (should fail with 409)
async function testDuplicateBooking(existingBooking) {
  try {
    console.log('Testing duplicate booking (should fail)...');

    const booking = {
      officeId: existingBooking.officeId,
      slotId: existingBooking.slotId,
      date: existingBooking.date
    };

    const response = await axios.post(`${API_URL}/api/bookings`, booking, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    console.error('Error: Duplicate booking should have failed but succeeded:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log('Success! Duplicate booking correctly rejected with 409 Conflict.');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error with duplicate booking test:');
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(error.message);
      }
    }
  }
}

// Run tests
async function runTests() {
  console.log('=== BOOKING API TEST SCRIPT ===');
  const booking = await testCreateBooking();
  if (booking) {
    await testDuplicateBooking(booking);
  }
  console.log('=== TEST SCRIPT COMPLETE ===');
}

runTests();

console.log('\nTo run this test:');
console.log('1. Make sure your server is running');
console.log('2. Update the API_URL if needed');
console.log('3. Replace YOUR_AUTH_TOKEN with a valid token');
console.log('4. Replace the ObjectIds with valid IDs from your database');
console.log('5. Run: node tests/test_booking_api.js');
