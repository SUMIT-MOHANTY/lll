# Duplicate Booking Prevention Testing

This directory contains test scripts for validating the duplicate booking prevention feature.

## k6 Load Testing

The `duplicate_booking_test.js` script tests the application's ability to handle concurrent booking requests
and prevent duplicate bookings from the same user on the same day.

### Requirements

- k6 load testing tool (https://k6.io/)
- Running backend API server

### Running the test
