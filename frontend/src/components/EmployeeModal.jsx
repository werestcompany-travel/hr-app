import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { api } from '../api/client';
import { useT } from '../hooks/useT';

export default function EmployeeModal({ employee, managers, onClose, onSaved }) {
  const t = useT();
  const isEdit = !!employee;
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  // Watch role to conditionally show LINE User ID field
  const roleValue   = useWatch({ control, name: 'role',           defaultValue: employee?.role || 'employee' });
  const salaryValue = useWatch({ control, name: 'monthly_salary', defaultValue: 0 });

  const isManager  = roleValue === 'manager';
  const salary     = parseFloat(salaryValue) || 0;
  const dailyRate  = salary > 0 ? (salary / 26).toFixed(2) : null;
  const hourlyRate = salary > 0 ? (salary / 26 / 8).toFixed(2) : null;

  useEffect(() => {
    if (employee) {
      reset({
        name:                   employee.name,
        email:                  employee.email || '',
        role:                   employee.role,
        department:             employee.department || '',
        manager_id:             employee.manager_id || '',
        line_user_id:           employee.line_user_id || '',
        leave_balance_sick:     employee.leave_balance_sick,
        leave_balance_vacation: employee.leave_balance_vacation,
        monthly_salary:         employee.monthly_salary || '',
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data) => {
    // Clear LINE User ID if the role is not Manager
    if (data.role !== 'manager') {
      data.line_user_id = '';
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/admin/employees/${employee.id}`, data);
      } else {
        await api.post('/admin/employees', data);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ backgroundColor: '#1B4332' }}>
          <h2 className="text-white font-semibold">
            {isEdit ? t.editEmployeeTitle : t.addEmployeeTitle}
          </h2>
          <button onClick={onClose} className="text-[#B7E4C7] hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{t.fullName}</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{t.email}</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
            />
          </div>

          {/* Role + Department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{t.role}</label>
              <select
                {...register('role', { required: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
              >
                <option value="employee">{t.roleEmployee}</option>
                <option value="manager">{t.roleManager}</option>
                {/* hr_admin is intentionally excluded — manage admins separately */}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{t.department}</label>
              <input
                {...register('department')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
              />
            </div>
          </div>

          {/* LINE User ID — shown only for Manager role */}
          {isManager && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {t.lineUserId}
                <span className="ml-1.5 text-xs font-normal text-gray-400">{t.lineUserIdNote}</span>
              </label>
              <div className="relative">
                <input
                  {...register('line_user_id')}
                  placeholder={t.lineUserIdPlaceholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788] pr-24 font-mono"
                />
                {employee?.line_user_id && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {t.lineConnected}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Starts with <code className="bg-gray-100 px-1 rounded">U</code> followed by 32 hex characters. Found in LINE webhook events or LINE Developer Console.
              </p>
            </div>
          )}

          {/* Manager */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{t.manager}</label>

            {/* Current manager badge */}
            {(() => {
              const currentManager = managers.find(m => m.id === employee?.manager_id);
              if (!currentManager) return null;
              return (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {currentManager.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800 truncate">{currentManager.name}</p>
                    <p className="text-xs text-blue-500 capitalize">{currentManager.role?.replace('_', ' ')}</p>
                  </div>
                  <span className="text-xs text-blue-400 flex-shrink-0">{t.manager}</span>
                </div>
              );
            })()}

            <select
              {...register('manager_id')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
            >
              <option value="">{t.noneOption}</option>
              {managers.filter(m => m.role === 'manager').length > 0 && (
                <optgroup label={t.roleManager}>
                  {managers.filter(m => m.role === 'manager').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              )}
              {managers.filter(m => m.role === 'hr_admin').length > 0 && (
                <optgroup label={t.roleHRAdmin}>
                  {managers.filter(m => m.role === 'hr_admin').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Leave balances */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{t.sickLeaveDays}</label>
              <input
                type="number"
                min="0"
                {...register('leave_balance_sick')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{t.vacationDays}</label>
              <input
                type="number"
                min="0"
                {...register('leave_balance_vacation')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
              />
            </div>
          </div>

          {/* Monthly Salary */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{t.monthlySalary}</label>
            <input
              type="number"
              min="0"
              step="100"
              {...register('monthly_salary')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
            />
            {dailyRate && (
              <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 flex gap-4 text-xs text-gray-600">
                <span>
                  <span className="text-gray-400">{t.dailyRate}: </span>
                  <span className="font-semibold text-gray-700">฿{parseFloat(dailyRate).toLocaleString()}</span>
                </span>
                <span>
                  <span className="text-gray-400">{t.hourlyRate}: </span>
                  <span className="font-semibold text-gray-700">฿{parseFloat(hourlyRate).toLocaleString()}</span>
                </span>
                <span className="text-gray-400 ml-auto">{t.computedRates}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#52B788' }}
            >
              {saving ? t.saving : isEdit ? t.saveChanges : t.addEmployeeTitle}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
