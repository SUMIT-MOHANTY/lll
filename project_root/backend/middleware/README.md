# Admin Authentication System

This module implements admin-only access control for protected routes.

## Files Overview

1. `middleware/admin.js`: Middleware to restrict routes to admin users only
2. `models/User.js`: User model with role support (admin/user)
3. `scripts/seeds/admins.js`: Script to create initial admin user

## Usage Instructions

### Protecting Admin Routes

To protect a route with admin authentication, use both the auth and admin middleware:
