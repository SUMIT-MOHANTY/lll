/**
 * User Model Definition
 *
 * Defines the schema for users in the system, with support for
 * standard and admin roles.
 *
 * @module models/user
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Pre-save hook to hash password before saving
 */
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password for login
 *
 * @param {string} candidatePassword - The plain text password to check
 * @returns {boolean} - True if passwords match, false otherwise
 */
UserSchema.methods.matchPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Virtual field for returning user data safely without sensitive fields
 */
UserSchema.virtual('safeObject').get(function() {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt
  };
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
