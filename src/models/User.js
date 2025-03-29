const mongoose = require('mongoose');
const { generateToken } = require('../../../shared/utils/tokenUtils');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  dob: { 
    type: Date,
    required: false
  },
  contact: { 
    type: String,
    required: false,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date 
  }
});

// Method to generate auth token
UserSchema.methods.generateAuthToken = function() {
  try {
    const payload = {
      id: this._id,
      name: this.name,
      email: this.email,
      roles: this.roles || ['user'] // Add roles if you have them
    };
    
    return generateToken(payload);
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Error generating authentication token');
  }
};

module.exports = mongoose.model('User', UserSchema);
