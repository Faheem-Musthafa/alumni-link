/**
 * Data Export Utilities for Admin Panel
 * Supports CSV and Excel exports
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], columns: ExportColumn[]): string {
  if (data.length === 0) return '';

  // Create header row
  const headers = columns.map(col => col.label).join(',');

  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      
      // Apply custom formatting if provided
      if (col.format && value !== undefined && value !== null) {
        value = col.format(value);
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string and escape
      const stringValue = String(value);
      
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: any[], columns: ExportColumn[], filename: string) {
  const csv = convertToCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data: any[], filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | any): string {
  if (!date) return '';
  
  try {
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return String(date);
  }
}

/**
 * Format boolean for export
 */
export function formatBooleanForExport(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Prepare verification data for export
 */
export function prepareVerificationExport(verifications: any[]): any[] {
  return verifications.map(v => ({
    id: v.id,
    userName: v.userName || '',
    userEmail: v.userEmail || '',
    userRole: v.userRole || '',
    status: v.status || '',
    createdAt: formatDateForExport(v.createdAt),
    updatedAt: formatDateForExport(v.updatedAt),
    documentType: v.documentType || '',
    documentUrl: v.documentUrl || '',
  }));
}

/**
 * Prepare users data for export
 */
export function prepareUsersExport(users: any[]): any[] {
  return users.map(u => ({
    id: u.id,
    name: u.name || '',
    email: u.email || '',
    role: u.role || '',
    verified: formatBooleanForExport(u.verified),
    createdAt: formatDateForExport(u.createdAt),
    graduationYear: u.graduationYear || '',
    department: u.department || '',
    company: u.company || '',
  }));
}

/**
 * Prepare reports data for export
 */
export function prepareReportsExport(reports: any[]): any[] {
  return reports.map(r => ({
    id: r.id,
    reportedUserName: r.reportedUserName || '',
    reportedByName: r.reportedByName || '',
    reason: r.reason || '',
    description: r.description || '',
    status: r.status || '',
    createdAt: formatDateForExport(r.createdAt),
    resolvedAt: formatDateForExport(r.resolvedAt),
  }));
}

/**
 * Prepare job posts data for export
 */
export function prepareJobsExport(jobs: any[]): any[] {
  return jobs.map(j => ({
    id: j.id,
    title: j.title || '',
    company: j.company || '',
    location: j.location || '',
    type: j.type || '',
    isReferral: formatBooleanForExport(j.isReferral),
    applicationsCount: j.applicationsCount || 0,
    createdAt: formatDateForExport(j.createdAt),
    postedBy: j.postedBy || '',
    salaryMin: j.salary?.min || '',
    salaryMax: j.salary?.max || '',
    salaryCurrency: j.salary?.currency || '',
  }));
}
