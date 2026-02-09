/**
 * Main Controller
 * Handles basic API endpoints and health checks
 */

// Get server status
const getStatus = (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
};

// Get health check
const getHealth = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Node.js Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};

// Post data example
const postData = (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      status: 'error',
      message: 'Name and email are required'
    });
  }

  res.json({
    status: 'success',
    message: 'Data received successfully',
    data: {
      name,
      email,
      message: message || 'No message provided',
      receivedAt: new Date().toISOString()
    }
  });
};

module.exports = {
  getStatus,
  getHealth,
  postData
};
