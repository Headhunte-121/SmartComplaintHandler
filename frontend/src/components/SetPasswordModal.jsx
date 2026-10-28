/**
 * SmartComplaintHandler - Set / Change Account Password Modal
 * High-Density Obsidian Command Desk Standard:
 *  - Translucent obsidian glassmorphic dialog with specular sheen
 *  - 4-Bar segmented password telemetry gauge
 *  - Supports dual Google SSO / Email-Password authentication
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Shield, CheckCircle2, AlertTriangle, X } from 'lucide-react';

function evaluatePasswordStrength(pw) {
  if (!pw) return { score: 0, label: 'Minimum 6 characters', color: 'bg-white/10' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

  const map = {
    1: { label: 'Fair', color: 'bg-amber-500' },
    2: { label: 'Good', color: 'bg-zinc-400' },
    3: { label: 'Strong', color: 'bg-white' },
    4: { label: 'Institutional Grade', color: 'bg-emerald-400' },
  };
  return { score, ...(map[score] || map[1]) };
}

export default function SetPasswordModal({ isOpen, onClose }) {
  const { currentUser, updatePassword } = useAuth();

  const isGoogleOnly = !currentUser?.has_password || currentUser?.auth_provider === 'google';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const pwStrength = evaluatePasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isGoogleOnly && !currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(
        isGoogleOnly ? undefined : currentPassword,
        newPassword
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1600);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Failed to update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-white/[0.14] bg-[#0c0d12]/95 text-zinc-100 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden">
        {/* Top Specular Rim */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/[0.15] bg-white/[0.05] text-zinc-300">
                {isGoogleOnly ? 'Dual Sign-In Setup' : 'Security Settings'}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">
              {isGoogleOnly ? 'Set Account Password' : 'Change Account Password'}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {isGoogleOnly
                ? 'Create a password to enable direct Email & Password sign-in alongside your Google SSO.'
                : 'Update your current password for direct institutional access.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl border border-rose-800/80 bg-rose-950/60 text-xs font-semibold text-rose-300 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-3 rounded-xl border border-emerald-800/80 bg-emerald-950/60 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            <span>Password updated successfully! Dual sign-in enabled.</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isGoogleOnly && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Current Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 px-3.5 py-2.5 text-xs font-mono focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                {isGoogleOnly ? 'Create Password' : 'New Password'}
              </label>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-[11px] font-mono font-medium text-zinc-400 hover:text-white cursor-pointer transition-colors"
              >
                {showPasswords ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 px-3.5 py-2.5 text-xs font-mono focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
            />

            {/* Strength meter */}
            {newPassword && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        pwStrength.score >= i ? pwStrength.color : 'bg-white/[0.08]'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-mono">Password Security</span>
                  <span className="font-bold text-zinc-300 font-mono">{pwStrength.label}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              placeholder="Repeat password"
              className="w-full rounded-xl border border-white/[0.1] bg-[#050608] text-white placeholder-zinc-500 px-3.5 py-2.5 text-xs font-mono focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-[0_2px_12px_rgba(255,255,255,0.12)] border border-white/30 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : isGoogleOnly ? 'Create Password' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
