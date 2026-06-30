import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Users, Calendar, Mail, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get<UserRecord[]>(`${BACKEND_URL}/api/admin/users`);
      setUsers(response.data);
    } catch (err: any) {
      setErrorMsg("Failed to load registered users from database.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/admin/users/${userId}`);
      if (response.data.success) {
        setActionMsg(`User "${userName}" deleted successfully.`);
        fetchUsers();
        setTimeout(() => setActionMsg(null), 3000);
      } else {
        setErrorMsg("Failed to delete user account.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Error deleting user account.");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-dark-950 min-h-[calc(100vh-4rem)]">
      {/* Welcome & Dashboard header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-accent-purple" />
            ADMINISTRATOR <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">DASHBOARD</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Audit system operations and manage LISS-IV satellite console access credentials.
          </p>
        </div>
        
        {/* Simple counter badges */}
        <div className="mt-4 md:mt-0 flex gap-4">
          <div className="flex items-center gap-3 bg-dark-900 border border-white/5 px-4.5 py-2.5 rounded-xl">
            <Users className="h-5 w-5 text-accent-cyan" />
            <div>
              <div className="text-xl font-bold text-white">{users.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Active Users</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-dark-900 border border-white/5 px-4.5 py-2.5 rounded-xl">
            <Shield className="h-5 w-5 text-accent-purple" />
            <div>
              <div className="text-xl font-bold text-white">2</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">System Admins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-dark-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-6">User Database Registry</h2>
        
        {actionMsg && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
            {actionMsg}
          </div>
        )}
        
        {errorMsg && (
          <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent"></div>
            <span className="text-sm text-slate-400">Querying registry database...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/5">
            <AlertTriangle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-md font-bold text-slate-300">No registered users found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Standard user accounts will show here once they register via the Sign Up screen. Predefined admins are excluded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3.5 pl-4">ID</th>
                  <th className="pb-3.5">Name</th>
                  <th className="pb-3.5">Email / Username</th>
                  <th className="pb-3.5">Role</th>
                  <th className="pb-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="text-sm hover:bg-white/2 transition-colors">
                    <td className="py-4 pl-4 text-slate-500 font-semibold">{u.id}</td>
                    <td className="py-4 font-semibold text-white">{u.name}</td>
                    <td className="py-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center rounded-full bg-accent-cyan/10 px-2.5 py-0.5 text-xs font-semibold text-accent-cyan">
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-all hover:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
