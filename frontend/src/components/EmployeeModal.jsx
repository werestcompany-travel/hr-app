import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../api/client';

export default function EmployeeModal({ employee, managers, onClose, onSaved }) {
  const isEdit = !!employee;
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (employee) {
      reset({
        name:       employee.name,
        email:      employee.email || '',
        role:       employee.role,
        department: employee.department || '',
        manager_id: employee.manager_id || '',
        leave_balance_sick:     employee.leave_balance_sick,
        leave_balance_vacation: employee.leave_balance_vacation,
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data) => {
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
            {isEdit ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button onClick={onClose} className="text-[#B7E4C7] hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
            />
          </div>

          {/* Role + Department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Role *</label>
              <select
                {...register('role', { required: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr_admin">HR Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                {...register('department')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
              />
            </div>
          </div>

          {/* Manager */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Manager</label>
            <select
              {...register('manager_id')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="">— None —</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Leave balances */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Sick Leave Days</label>
              <input
                type="number"
                min="0"
                {...register('leave_balance_sick')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Vacation Days</label>
              <input
                type="number"
                min="0"
                {...register('leave_balance_vacation')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
              />
            </div>
          </div>

          {/* Password (new hr_admin only) */}
          {!isEdit && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Password <span className="text-gray-400 text-xs">(required for HR Admin role)</span>
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#52B788' }}
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
