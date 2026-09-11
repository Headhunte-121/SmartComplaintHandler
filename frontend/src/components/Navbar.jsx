/**
 * SmartComplaintHandler - Navbar Component
 * Blueprint Reference: V1/M1/frontend/03_layout_and_navigation.md
 * Role: Top navigation bar with active route highlighting and live health indicator.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-6xl flex justify-between items-center h-16">
        <div className="font-bold text-lg text-slate-800 tracking-tight">
          Smart Complaint Handler
        </div>
        <nav className="flex space-x-4 text-sm font-medium">
          <NavLink to="/submit" className={({ isActive }) => isActive ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-600 hover:text-slate-900'}>Submit</NavLink>
          <NavLink to="/track" className={({ isActive }) => isActive ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-600 hover:text-slate-900'}>Track</NavLink>
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-600 hover:text-slate-900'}>Admin Desk</NavLink>
        </nav>
      </div>
    </header>
  );
}
