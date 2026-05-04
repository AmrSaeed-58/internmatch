import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  CalendarDays,
  BarChart2,
  Users,
  Briefcase,
  Star,
  Building2,
  Shield,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import * as adminAPI from '../../api/admin';

const REPORT_TYPES = [
  { value: 'user_activity',            label: 'User Activity',           icon: Users },
  { value: 'internship_applications',  label: 'Internship Applications', icon: Briefcase },
  { value: 'student_match_ranking',    label: 'Student Match Ranking',   icon: Star },
  { value: 'employer_performance',     label: 'Employer Performance',    icon: Building2 },
  { value: 'system_audit',            label: 'System Audit',            icon: Shield },
];

function exportCSV(type, rows) {
  if (!rows || rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const csvRows = [columns.join(',')];
  rows.forEach((row) => {
    csvRows.push(columns.map((col) => {
      const val = String(row[col] ?? '');
      return val.includes(',') || val.includes('"')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(','));
  });
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [reportType, setReportType] = useState('user_activity');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await adminAPI.generateReport({
        reportType,
        startDate: dateFrom,
        endDate: dateTo,
      });
      const report = res.data.data;
      setGenerated({
        type: report.reportType,
        dateFrom,
        dateTo,
        generatedAt: report.generatedAt,
        rowCount: report.rowCount,
        rows: report.data,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }

  const columns = generated?.rows?.length > 0 ? Object.keys(generated.rows[0]) : [];

  return (
    <DashboardLayout role="admin">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
        className="mb-8 relative rounded-xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-600/15 via-transparent to-primary-400/10" />
        <div className="absolute -bottom-16 right-1/4 w-48 h-48 rounded-full bg-accent-400/10 blur-2xl" />
        <div className="relative p-7 md:p-10">
          <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">ANALYTICS</p>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">Reports</h1>
          <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">Generate, view, and download platform reports.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Generate form */}
        <div className="xl:col-span-1 space-y-6">
          <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
            <div className="relative">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-surface-100 dark:border-surface-700">
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
                  <BarChart2 size={16} className="text-white" />
                </div>
                <h2 className="font-heading font-bold text-surface-900 dark:text-white tracking-tight">
                  Generate Report
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none cursor-pointer transition-colors duration-150"
                    >
                      {REPORT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-glow-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generating && <Loader2 size={16} className="animate-spin" />}
                    {generating ? 'Generating...' : 'Generate Report'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Report output */}
        <div className="xl:col-span-2 space-y-6">
          {!generated ? (
            <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
              <div className="relative flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileText size={28} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-bold text-surface-900 dark:text-white text-lg tracking-tight mb-2">No report generated</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 max-w-xs leading-relaxed">
                  Select a report type and date range, then click Generate to view the output here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Report header */}
              <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
                <div className="relative p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading font-bold text-surface-900 dark:text-white text-xl tracking-tight">
                        {REPORT_TYPES.find((t) => t.value === generated.type)?.label}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5 text-sm text-surface-500 dark:text-surface-400 font-medium">
                        <CalendarDays size={14} />
                        <span>{generated.dateFrom} -- {generated.dateTo}</span>
                        <span className="text-surface-300 dark:text-surface-600">·</span>
                        <span>{generated.rowCount} records</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => exportCSV(generated.type, generated.rows)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-glow-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <Download size={13} /> CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data table */}
              <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
                <div className="relative overflow-x-auto">
                  {columns.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30">
                          {columns.map((col) => (
                            <th key={col} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100 dark:divide-surface-700/30">
                        {generated.rows.map((row, ri) => (
                          <tr key={ri} className="hover:bg-surface-50 dark:hover:bg-surface-700/40 transition-colors duration-100">
                            {columns.map((col) => (
                              <td key={col} className="px-5 py-3.5 text-surface-700 dark:text-surface-200 whitespace-nowrap">
                                {row[col] != null ? String(row[col]) : '--'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-10 text-center text-sm text-surface-500 dark:text-surface-400">
                      No data returned for this report.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
