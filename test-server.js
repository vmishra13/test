#!/usr/bin/env node

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock user for testing
const mockUser = {
  id: 1,
  loginName: 'test.user',
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user@example.com',
  dob: '1990-01-15',
  gender: 'Male',
  phoneNumber: '+1-555-0123',
  emergencyContact: 'Jane User',
  emergencyPhoneNumber: '+1-555-0124',
  isOnboardingCompleted: true,
  profilePictureUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Test authentication middleware
const mockAuth = (req, res, next) => {
  // Add mock user to request
  req.user = mockUser;
  next();
};

// Test profile endpoint
app.get('/api/v1/users/profile', mockAuth, (req, res) => {
  try {
    const profile = {
      ...mockUser,
      message: 'Profile retrieved successfully'
    };
    
    res.status(200).json({
      success: true,
      data: profile,
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: error.message
    });
  }
});

// Test health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test profile endpoint: http://localhost:${PORT}/api/v1/users/profile`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
