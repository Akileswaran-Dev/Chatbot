import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import useAuth from '../hooks/useAuth';

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.70);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/users/me/settings')
      .then((res) => {
        setTheme(res.data.theme);
        setModelName(res.data.model_name);
        setTemperature(res.data.temperature);
        setSystemPrompt(res.data.system_prompt);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load settings');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setUpdating(true);

    try {
      const res = await apiClient.put('/users/me/settings', {
        theme,
        model_name: modelName,
        temperature: parseFloat(temperature),
        system_prompt: systemPrompt
      });
      setTheme(res.data.theme);
      setModelName(res.data.model_name);
      setTemperature(res.data.temperature);
      setSystemPrompt(res.data.system_prompt);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update settings');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-teal-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Placeholder */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div>
          <div className="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent mb-6">
            Gemini Chatbot SaaS
          </div>
          <button 
            onClick={() => navigate('/chat')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 rounded-lg font-medium transition duration-200 mb-2"
          >
            ← Back to Chat
          </button>
        </div>
        <div className="space-y-4">
          <div className="text-xs text-slate-400 truncate">
            User: {user?.email}
          </div>
          <button 
            onClick={logout}
            className="w-full bg-red-950/20 hover:bg-red-950/40 border border-red-900/50 text-red-400 py-2 rounded-lg text-sm font-medium transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
        <header className="h-16 border-b border-slate-800 flex items-center px-6">
          <div className="font-semibold text-slate-200">SaaS Configuration</div>
        </header>

        <main className="flex-1 max-w-2xl w-full mx-auto p-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-2 text-slate-100">Preferences</h3>
            <p className="text-slate-400 text-sm mb-8 font-light">
              Customize layout colors and Gemini model parameters.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-400 text-sm">
                Settings saved successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Theme Mode</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500 transition duration-200"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="dark">Dark Theme (Recommended)</option>
                  <option value="light">Light Theme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gemini Model</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500 transition duration-200"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Temperature: <span className="text-teal-400 font-bold">{temperature}</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Creative (1.0)</span>
                  <span>Balanced (0.7)</span>
                  <span>Precise (0.0)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">System Prompt</label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500 transition duration-200 h-28 resize-none"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium rounded-lg shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 transition duration-200"
              >
                {updating ? 'Saving changes...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
