import type { ContactLookupResult } from './types';

/**
 * Export contact lookup results to a CSV file and trigger download
 */
export function exportContactResults(results: ContactLookupResult[]): void {
  const headers = [
    'Input Name',
    'Input Email',
    'Match Type',
    'CRM Contact Name',
    'CRM Contact Email',
    'CRM Company',
    'CRM Contact ID',
    'CRM Contact URL',
  ];

  const rows = results.map((result) => [
    result.input.name,
    result.input.email || '',
    result.matchType,
    result.bestMatch?.name || '',
    result.bestMatch?.email || '',
    result.bestMatch?.company || '',
    result.bestMatch?.contactId || '',
    result.bestMatch
      ? `https://run.mydealflow.com/inv/#/Contact.php?ContactID=${result.bestMatch.contactId}`
      : '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = String(cell).replace(/"/g, '""');
          if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
            return `"${escaped}"`;
          }
          return escaped;
        })
        .join(',')
    )
    .join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `contact-lookup-${formatDate(new Date())}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
