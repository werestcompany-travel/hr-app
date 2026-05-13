import { useEffect, useState } from 'react';
import { api } from '../api/client';
import EmployeeModal from '../components/EmployeeModal';

const ROLE_STYLES = {
  employee:  'bg-gray-100 text-gray-700',
  manager:   'bg-blue-100 text-blue-700',
  hr_admin:  'bg-purple-100 text-purple-700',
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // null | 'add' | employee object

  const managers = employees.filter(e => e.role === 'manager' || e.role === 'hr_admin');

  const fetchEmployees = () => {
    setLoading(true);
    api.get('/admin/employees')
      .then(r => setEmployees(r.data.employees || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSaved = () => {
    setModal(null);
    fetchEmployees();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
        <button
          onClick={() => setModal('add')}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#52B788' }}
        >
          + Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Manager</th>
                <th className="px-5 py-3">Sick</th>
                <th className="px-5 py-3">Vacation</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">Loading...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">No employees yet.</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{emp.name}</td>
                    <td className="px-5 py-3 text-gray-500">{emp.email || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${ROLE_STYLES[emp.role] || ''}`}>
                        {emp.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{emp.department || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{emp.users?.name || '—'}</td>
                    <td className="px-5 py-3 text-gray-600 font-medium">{emp.leave_balance_sick}d</td>
                    <td className="px-5 py-3 text-gray-600 font-medium">{emp.leave_balance_vacation}d</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setModal(emp)}
                        className="text-[#52B788] text-xs font-medium hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50">
          {employees.length} employee{employees.length !== 1 ? 's' : ''}
        </div>
      </div>

      {modal && (
        <EmployeeModal
          employee={modal === 'add' ? null : modal}
          managers={managers}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
