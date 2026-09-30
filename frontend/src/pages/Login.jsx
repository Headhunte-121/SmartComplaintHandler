/**
 * SmartComplaintHandler - Campus SSO & Portal Authentication Page
 * Blueprint Reference: V1/M1/frontend/04_app_router.md
 * Role: Institutional Single Sign-On (SSO) gateway allowing students, field technicians,
 *       and facility supervisors to authenticate and access role-tailored workstations.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { currentPersona, personas, switchPersona, isStudent, isTechnician, isAdmin } = useAuth();
  const [selectedPersonaId, setSelectedPersonaId] = useState(currentPersona.id);
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const selected = personas.find((p) => p.id === selectedPersonaId) || personas[0];

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      switchPersona(selectedPersonaId);
      setLoading(false);
      setLoginSuccess(true);

      setTimeout(() => {
        if (selected.role === 'ADMIN' || selected.role === 'TECHNICIAN') {
          navigate('/admin');
        } else {
          navigate('/submit');
        }
      }, 700);
    }, 400);
  };

  return (
    <div className="max-w-xl mx-auto py-8 animate-fade-in space-y-6">
      {/* Institutional Branding */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-indigo-600/30">
          🏛️
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Campus Single Sign-On (SSO)
        </h1>
        <p className="text-xs text-slate-500">
          Authenticate using your institutional credentials or select your designated campus persona.
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        {loginSuccess ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Authenticated Successfully!
            </h3>
            <p className="text-xs text-slate-500">
              Redirecting to {selected.role === 'ADMIN' ? 'Operations Desk' : selected.role === 'TECHNICIAN' ? 'Squad Work Order Queue' : 'Grievance Portal'}...
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Persona Quick Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Your Campus Role / Account:
              </label>
              <div className="space-y-2">
                {personas.map((persona) => {
                  const isChecked = persona.id === selectedPersonaId;
                  return (
                    <div
                      key={persona.id}
                      onClick={() => setSelectedPersonaId(persona.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-3.5 ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{persona.avatar}</span>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {persona.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${persona.badgeClass}`}>
                            {persona.roleLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {persona.email} • {persona.identifier}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <span className="text-[9px] font-black">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email / Username Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Institutional Email ID:
              </label>
              <input
                type="text"
                value={selected.email}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 font-mono"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password:
                </label>
                <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline">
                  Forgot Password?
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Authenticating with Campus Directory...</span>
              ) : (
                <>
                  <span>Sign In as {selected.roleLabel}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Notice */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center leading-relaxed">
          Protected by Central Institutional Identity & Access Management (IAM). Unauthorized access attempts are monitored and logged.
        </div>
      </div>
    </div>
  );
}
