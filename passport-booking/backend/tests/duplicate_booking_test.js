import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  iterations: 200, // Each VU will run this many iterations
};

// Test authentication function to get a token
function getAuthToken() {
  const loginRes = http.post('http://localhost:8000/api/auth/login', JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'logged in successfully': (resp) => resp.json('token') !== '',
  });

  return loginRes.json('token');
}

export default function() {
  // Get auth token
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // All VUs try to book the same slot (to test concurrency handling)
  const payload = JSON.stringify({
    slotId: '6b86b273-ff34-4f22-b70b-d3e886fc33bc', // Example slot ID
  });

  const bookingRes = http.post('http://localhost:8000/api/bookings', payload, {
    headers: headers,
  });

  // Check that we either get a successful booking (201) or a duplicate error (409)
  // We don't expect any other responses
  check(bookingRes, {
    'status is either 201 or 409': (r) => r.status === 201 || r.status === 409,
  });

  // If we got a 409, verify it's because of our duplicate booking constraint
  if (bookingRes.status === 409) {
    check(bookingRes, {
      'error message mentions duplicate booking': (r) =>
        r.json('detail').includes('already have a booking on this date'),
    });
  }

  // Slight delay between iterations
  sleep(0.1);
}
