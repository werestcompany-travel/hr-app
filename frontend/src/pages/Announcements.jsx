import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { api } from '../api/client';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [form, setForm]                   = useState({ title: '', content: '', pinned: false });
  const [submitting, setSubmitting]       = useState(false);

  const fetch = () => {
    setLoading(true);
    api.get('/announcements')
      .then(r => setAnnouncements(r.data.announcements || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/announcements', form);
      setForm({ title: '', content: '', pinned: false });
      setShowForm(false);
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    fetch();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Announcements</h1>
        <button
          onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#52B788' }}
        >
          {showForm ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">New Announcement</h2>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Announcement title"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Content</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#52B788] resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
              className="w-4 h-4 accent-[#52B788]"
            />
            <span className="text-sm text-gray-600">Pin to top</span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#52B788' }}
          >
            {submitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
            No announcements yet.
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 text-sm">{a.title}</h3>
                    {a.pinned && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.content}</p>
                  <p className="text-xs text-gray-400">
                    {a.users?.name && `${a.users.name} · `}
                    {format(new Date(a.created_at), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
