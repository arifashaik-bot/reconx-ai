import React from 'react';
import { AuditLogList } from '../components/settings/AuditLogList.js';
import { SettingsForm } from '../components/settings/SettingsForm.js';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
          System Configuration & Governance
        </span>
        <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">Settings & Audit Trail</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure financial tolerances, matching sensitivities, currency display, and view the immutable audit history.
        </p>
      </div>

      {/* Settings Form */}
      <SettingsForm />

      {/* Audit Log Trail */}
      <AuditLogList />
    </div>
  );
};
