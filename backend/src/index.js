const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://hrms_user:hrms_password@hrms-lite-cluster.7x3s9.mongodb.net/hrms_lite?retryWrites=true&w=majority';

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
      .sort({ createdAt: -1 })
      .toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Unable to load employees.' });
  }
});

app.post('/api/employees', async (req, res) => {
  const error = validateEmployee(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { employeeId, fullName, email, department } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  try {
    await employeesCollection.insertOne({
      employeeId: employeeId.trim(),
      fullName: fullName.trim(),
      email: normalizedEmail,
      department: department.trim(),
      createdAt: new Date(),
    });
    return res.status(201).json({ message: 'Employee added.' });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.employeeId) {
      return res.status(409).json({ message: 'Employee ID already exists.' });
    }
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({ message: 'Email address already exists.' });
    }
    return res.status(500).json({ message: 'Unable to add employee.' });
  }
});

app.delete('/api/employees/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  try {
    const result = await employeesCollection.deleteOne({ employeeId });
    await attendanceCollection.deleteMany({ employeeId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    return res.json({ message: 'Employee removed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Unable to delete employee.' });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const rows = await attendanceCollection
      .find({}, { projection: { _id: 0 } })
      .sort({ date: -1, createdAt: -1 })
      .toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Unable to load attendance records.' });
  }
});

app.post('/api/attendance', async (req, res) => {
  const error = validateAttendance(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { employeeId, date, status } = req.body;
  try {
    const employee = await employeesCollection.findOne(
      { employeeId },
      { projection: { _id: 0, employeeId: 1 } }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    await attendanceCollection.insertOne({
      employeeId,
      date,
      status,
      createdAt: new Date(),
    });
    return res.status(201).json({ message: 'Attendance recorded.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Attendance already recorded for that date.' });
    }
    return res.status(500).json({ message: 'Unable to record attendance.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

const startServer = async () => {
  try {
    await client.connect();
    const db = client.db();
    employeesCollection = db.collection('employees');
    attendanceCollection = db.collection('attendance');

    await employeesCollection.createIndex({ employeeId: 1 }, { unique: true });
    await employeesCollection.createIndex({ email: 1 }, { unique: true });
    await attendanceCollection.createIndex({ employeeId: 1, date: 1 }, { unique: true });

    app.listen(PORT, () => {
      console.log(`HRMS Lite backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

startServer();
