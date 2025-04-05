const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the User schema
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Basic email validation
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  department: {
    type: String,
    enum: ["Engineering", "HR", "Finance", "Marketing", "Sales"],
    default: "Engineering"
  },
  employee_join_date: {
    type: Date,
    default: "2019-03-01"
  },
  employee_status: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Terminated"],
    default: "Part-time"
  },
  last_security_training: {
    type: String,
    default: "Never"
  },
  past_violations: {
    type: Number,
    min: 0,
    default: 0
  },
  resource_sensitivity: {
    type: String,
    enum: ["public", "internal", "restricted", "confidential", ""],
    default: ""
  },
  time_in_position: {
    type: String,
    default: "6 months"
  },
  user_role: {
    type: String,
    enum: ["Intern", "Employee", "Manager", "Admin"],
    default: "Intern"
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the `updated_at` field
userSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;