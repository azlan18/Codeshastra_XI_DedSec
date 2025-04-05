const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },
  password: {
    type: String,
    required: true,
    minlength: 8 
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

adminSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;