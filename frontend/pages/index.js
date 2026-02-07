import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

const initialEmployee = {
  employeeId: '',
  fullName: '',
  email: '',
  department: '',
};

const initialAttendance = {
  employeeId: '',
  date: '',
  status: 'Present',
};

export default function Home() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(initialEmployee);
  const [attendanceForm, setAttendanceForm] = useState(initialAttendance);
  const [loading, setLoading] = useState({ employees: false, attendance: false });
  const [error, setError] = useState({ employees: '', attendance: '' });
  const [formError, setFormError] = useState('');

  const hasEmployees = employees.length > 0;

  const attendanceByEmployee = useMemo(() => {
    return attendance.reduce((acc, record) => {
      if (!acc[record.employeeId]) {
        acc[record.employeeId] = [];
      }
      acc[record.employeeId].push(record);
      return acc;
    }, {});
  }, [attendance]);

  const fetchEmployees = async () => {
    setLoading((prev) => ({ ...prev, employees: true }));
    setError((prev) => ({ ...prev, employees: '' }));
    try {
      const response = await fetch(`${API_BASE}/api/employees`);
      if (!response.ok) {
        throw new Error('Unable to load employees.');
      }
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError((prev) => ({ ...prev, employees: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, employees: false }));
    }
  };

  const fetchAttendance = async () => {
    setLoading((prev) => ({ ...prev, attendance: true }));
    setError((prev) => ({ ...prev, attendance: '' }));
    try {
      const response = await fetch(`${API_BASE}/api/attendance`);
      if (!response.ok) {
        throw new Error('Unable to load attendance records.');
      }
      const data = await response.json();
      setAttendance(data);
    } catch (err) {
      setError((prev) => ({ ...prev, attendance: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, attendance: false }));
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const handleEmployeeChange = (event) => {
    const { name, value } = event.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttendanceChange = (event) => {
    const { name, value } = event.target;
    setAttendanceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    try {
      const response = await fetch(`${API_BASE}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Unable to add employee.');
      }
      setEmployeeForm(initialEmployee);
      fetchEmployees();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    setFormError('');
    try {
      const response = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Unable to delete employee.');
      }
      fetchEmployees();
      fetchAttendance();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleAttendanceSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    try {
      const response = await fetch(`${API_BASE}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceForm),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Unable to mark attendance.');
      }
      setAttendanceForm(initialAttendance);
      fetchAttendance();
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">HRMS Lite</p>
          <h1>Employee & Attendance Management</h1>
          <p className="subtitle">
            A lightweight HR console to onboard employees and track daily attendance with ease.
          </p>
        </div>
        <div className="hero-card">
          <div>
            <p className="card-label">Employees</p>
            <p className="card-value">{employees.length}</p>
          </div>
          <div>
            <p className="card-label">Attendance Records</p>
            <p className="card-value">{attendance.length}</p>
          </div>
        </div>
      </header>

      {formError && <div className="alert error">{formError}</div>}

      <section className="grid">
        <div className="panel">
          <h2>Add Employee</h2>
          <form onSubmit={handleEmployeeSubmit} className="form">
            <label>
              Employee ID
              <input
                name="employeeId"
                value={employeeForm.employeeId}
                onChange={handleEmployeeChange}
                placeholder="EMP-001"
                required
              />
            </label>
            <label>
              Full Name
              <input
                name="fullName"
                value={employeeForm.fullName}
                onChange={handleEmployeeChange}
                placeholder="Alex Johnson"
                required
              />
            </label>
            <label>
              Email Address
              <input
                type="email"
                name="email"
                value={employeeForm.email}
                onChange={handleEmployeeChange}
                placeholder="alex@company.com"
                required
              />
            </label>
            <label>
              Department
              <input
                name="department"
                value={employeeForm.department}
                onChange={handleEmployeeChange}
                placeholder="People Operations"
                required
              />
            </label>
            <button type="submit">Save Employee</button>
          </form>
        </div>

        <div className="panel">
          <h2>Mark Attendance</h2>
          <form onSubmit={handleAttendanceSubmit} className="form">
            <label>
              Employee
              <select
                name="employeeId"
                value={attendanceForm.employeeId}
                onChange={handleAttendanceChange}
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>
                    {employee.fullName} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                name="date"
                value={attendanceForm.date}
                onChange={handleAttendanceChange}
                required
              />
            </label>
            <label>
              Status
              <select
                name="status"
                value={attendanceForm.status}
                onChange={handleAttendanceChange}
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </label>
            <button type="submit" disabled={!hasEmployees}>
              Mark Attendance
            </button>
            {!hasEmployees && (
              <p className="helper">Add an employee before marking attendance.</p>
            )}
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Employee Directory</h2>
          {loading.employees && <span className="status">Loading...</span>}
        </div>
        {error.employees && <p className="alert error">{error.employees}</p>}
        {!loading.employees && employees.length === 0 && (
          <p className="empty">No employees yet. Add your first team member above.</p>
        )}
        {employees.length > 0 && (
          <div className="table">
            <div className="table-row table-header">
              <span>Employee</span>
              <span>Email</span>
              <span>Department</span>
              <span>Actions</span>
            </div>
            {employees.map((employee) => (
              <div className="table-row" key={employee.employeeId}>
                <span>
                  {employee.fullName}
                  <small>{employee.employeeId}</small>
                </span>
                <span>{employee.email}</span>
                <span>{employee.department}</span>
                <span>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => handleDeleteEmployee(employee.employeeId)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Attendance Records</h2>
          {loading.attendance && <span className="status">Loading...</span>}
        </div>
        {error.attendance && <p className="alert error">{error.attendance}</p>}
        {!loading.attendance && attendance.length === 0 && (
          <p className="empty">Attendance records will appear once you start marking days.</p>
        )}
        {attendance.length > 0 && (
          <div className="attendance-grid">
            {employees.map((employee) => (
              <div className="attendance-card" key={employee.employeeId}>
                <div className="attendance-header">
                  <div>
                    <h3>{employee.fullName}</h3>
                    <p>{employee.department}</p>
                  </div>
                  <span className="badge">{employee.employeeId}</span>
                </div>
                <div className="attendance-list">
                  {(attendanceByEmployee[employee.employeeId] || []).map((record) => (
                    <div className="attendance-row" key={`${record.employeeId}-${record.date}`}>
                      <span>{record.date}</span>
                      <span className={`pill ${record.status === 'Present' ? 'present' : 'absent'}`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                  {(attendanceByEmployee[employee.employeeId] || []).length === 0 && (
                    <p className="empty">No attendance recorded yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
