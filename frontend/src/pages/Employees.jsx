import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useT } from '../hooks/useT';
import EmployeeModal from '../components/EmployeeModal';

const ROLE_STYLES = {
  employee: 'bg-gray-100 text-gray-700',
  manager:  'bg-blue-100 text-blue-700',
  hr_admin: 'bg-purple-100 text-purple-700',
};

export default function Employees() {
  const t = useT();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [search, setSearch]       = useState('');
  const [managerFilter, setManagerFilter] = useState('');

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

  // Filtering
  const filtered = employees.filter(emp => {
    const matchName    = !search || emp.name.toLowerCase().includes(search.toLowerCase());
    const matchManager = !managerFilter
      || (managerFilter === '__none__' ? !emp.manager_id : emp.manager_id === managerFilter);
    return matchName && matchManager;
  });

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t.employeesTitle}</h1>
        <button
          onClick={() => setModal('add')}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#52B788' }}
        >
          {t.addEmployee}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder={t.searchName}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#52B788] min-w-48"
        />
        <select
          value={managerFilter}
          onChange={e => setManagerFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#52B788] text-gray-600"
        >
          <option value="">{t.colManager}: {t.tabAll}</option>
          <option value="__none__">{t.noneOption}</option>
          {managers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {(search || managerFilter) && (
          <button
            onClick={() => { setSearch(''); setManagerFilter(''); }}
            className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            ✕ {t.clearFilters}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">{t.colName}</th>
                <th className="px-5 py-3">{t.colRole}</th>
                <th className="px-5 py-3">{t.colDepartment}</th>
                <th className="px-5 py-3">{t.colManager}</th>
                <th className="px-5 py-3 text-center">{t.colSick}</th>
                <th className="px-5 py-3 text-center">{t.colUsedSick}</th>
                <th className="px-5 py-3 text-center">{t.colVacation}</th>
                <th className="px-5 py-3 text-center">{t.colUsedVacation}</th>
                <th className="px-5 py-3">{t.colSalary}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-gray-400">{t.loading}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-gray-400">
                    {employees.length === 0 ? t.noEmployees : t.noItems}
                  </td>
                </tr>
              ) : (
                filtered.map(emp => {
                  // manager name comes from the Supabase join: users!manager_id(name)
                  const managerName = emp.users?.name || null;
                  return (
                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {/* Name + email + LINE status */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 text-sm">{emp.name}</p>
                          {emp.line_user_id ? (
                            <span title={t.lineConnected}
                              className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                          ) : (
                            <span title={t.lineNotConnected}
                              className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
                          )}
                        </div>
                        {emp.email && <p className="text-xs text-gray-400">{emp.email}</p>}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${ROLE_STYLES[emp.role] || ''}`}>
                          {emp.role?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3 text-gray-500 text-sm">{emp.department || '—'}</td>

                      {/* Manager */}
                      <td className="px-5 py-3">
                        {managerName ? (
                          <button
                            onClick={() => {
                              const mgr = employees.find(e => e.id === emp.manager_id);
                              if (mgr) setModal(mgr);
                            }}
                            className="flex items-center gap-1.5 group"
                          >
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {managerName.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600 group-hover:text-blue-600 group-hover:underline transition-colors">
                              {managerName}
                            </span>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>

                      {/* Sick remaining */}
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm font-semibold text-green-700">{emp.leave_balance_sick}</span>
                        <span className="text-xs text-gray-400 ml-0.5">d</span>
                      </td>
                      {/* Sick used */}
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm font-semibold text-orange-500">{emp.used_sick ?? 0}</span>
                        <span className="text-xs text-gray-400 ml-0.5">d</span>
                      </td>

                      {/* Vacation remaining */}
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm font-semibold text-blue-600">{emp.leave_balance_vacation}</span>
                        <span className="text-xs text-gray-400 ml-0.5">d</span>
                      </td>
                      {/* Vacation used */}
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm font-semibold text-orange-500">{emp.used_vacation ?? 0}</span>
                        <span className="text-xs text-gray-400 ml-0.5">d</span>
                      </td>

                      {/* Salary */}
                      <td className="px-5 py-3 text-sm">
                        {emp.monthly_salary > 0 ? (
                          <div>
                            <p className="font-semibold text-gray-700">฿{Number(emp.monthly_salary).toLocaleString()}</p>
                            {emp.daily_rate && (
                              <p className="text-xs text-gray-400">
                                ฿{Number(emp.daily_rate).toLocaleString()}/d · ฿{Number(emp.hourly_rate).toLocaleString()}/h
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Edit */}
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setModal(emp)}
                          className="text-[#52B788] text-xs font-medium hover:underline"
                        >
                          {t.edit}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50 flex items-center justify-between">
          <span>{t.employeeCount(filtered.length)}</span>
          {filtered.length !== employees.length && (
            <span className="text-gray-300">{t.employeeCount(employees.length)} total</span>
          )}
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
