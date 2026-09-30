import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function PersonaSwitcherModal() {
  const { isPersonaModalOpen, closePersonaModal, currentPersona, personas, switchPersona } = useAuth();

  if (!isPersonaModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Role-Based Access
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Select Campus Persona / Role
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch roles to experience the application as a Student, Field Technician, or Facility Supervisor.
            </p>
          </div>
          <button
            onClick={closePersonaModal}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Persona Cards List */}
        <div className="p-6 space-y-3">
          {personas.map((persona) => {
            const isSelected = currentPersona.id === persona.id;
            return (
              <div
                key={persona.id}
                onClick={() => switchPersona(persona.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-4 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="text-3xl p-2 rounded-xl bg-white shadow-xs border border-slate-100 shrink-0">
                  {persona.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {persona.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${persona.badgeClass}`}>
                      {persona.roleLabel}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
                    <span>{persona.identifier}</span>
                    <span>•</span>
                    <span>{persona.department}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                    {persona.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Active Role: <strong className="text-slate-800 font-bold">{currentPersona.roleLabel}</strong></span>
          <button
            onClick={closePersonaModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-xs transition-colors"
          >
            Confirm & Close
          </button>
        </div>
      </div>
    </div>
  );
}
