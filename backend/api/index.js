const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);
let employeesCollection;
let attendanceCollection;

app.use(cors());
app.use(express.json());

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmployee = (payload) => {
  const { employeeId, fullName, email, department } = payload;
  if (!employeeId || !fullName || !email || !department) {
    return 'Employee ID, full name, email, and department are required.';
  }
  if (!emailRegex.test(email)) {
    return 'Please provide a valid email address.';
  }
  return null;
};

const validateAttendance = (payload) => {
  const { employeeId, date, status } = payload;
  if (!employeeId || !date || !status) {
    return 'Employee, date, and status are required.';
  }
  if (!['Present', 'Absent'].includes(status)) {
    return 'Attendance status must be Present or Absent.';
  }
  return null;
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/employees', async (req, res) => {
  try {
    const rows = await employeesCollection
      .find({}, { projection: { _id: 0 } })
      .toArray();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const validationError = validateEmployee(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await employeesCollection.insertOne(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

app.put('/api/employees/:employeeId', async (req, res) => {
  try {
    const validationError = validateEmployee(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await employeesCollection.updateOne(
      { employeeId: req.params.employeeId },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:employeeId', async (req, res) => {
  try {
    const result = await employeesCollection.deleteOne({
      employeeId: req.params.employeeId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const rows = await attendanceCollection
      .find({}, { projection: { _id: 0 } })
      .toArray();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const validationError = validateAttendance(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await attendanceCollection.insertOne(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error adding attendance:', error);
    res.status(500).json({ error: 'Failed to add attendance' });
  }
});

app.put('/api/attendance/:attendanceId', async (req, res) => {
  try {
    const validationError = validateAttendance(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const result = await attendanceCollection.updateOne(
      { _id: new (require('mongodb')).ObjectId(req.params.attendanceId) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

app.delete('/api/attendance/:attendanceId', async (req, res) => {
  try {
    const result = await attendanceCollection.deleteOne({
      _id: new (require('mongodb')).ObjectId(req.params.attendanceId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
});

// Initialize MongoDB connection and start listening for serverless handler
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await client.connect();
    const db = client.db('hrms');
    employeesCollection = db.collection('employees');
    attendanceCollection = db.collection('attendance');
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Export for Vercel serverless
module.exports = app;
