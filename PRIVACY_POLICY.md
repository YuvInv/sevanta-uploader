# Privacy Policy — Sevanta Uploader

**Last updated:** February 2026

Sevanta Uploader is a Chrome Extension that helps users bulk-upload companies to the Sevanta Dealflow CRM. This policy explains what data the extension accesses, how it is used, and what is stored.

## Data Collection & Usage

### CRM Schema Caching

The extension fetches the CRM field schema (field names, types, and dropdown options) from the Sevanta Dealflow API and caches it in `chrome.storage.local`. This cache is used to validate CSV data before upload. No personal or deal-specific data is included in the schema cache.

### CSV Parsing

CSV files are parsed entirely in-memory within the browser. File contents are never transmitted to any server other than the Sevanta Dealflow API during the upload step. CSV data is not persisted after the browser tab or side panel is closed.

### Dealigence Page Extraction

When the user navigates to dealigence.vc, the extension can extract publicly visible company data from the page to pre-fill CRM fields. This extraction happens locally in the browser and no data is sent to third parties.

### Authentication

The extension authenticates with the Sevanta Dealflow API using the browser's existing session cookies (`credentials: 'include'`). **No usernames, passwords, API keys, or tokens are collected or stored by the extension.**

## Permissions Justification

| Permission | Reason |
|---|---|
| `storage` | Cache CRM field schema locally to avoid repeated API calls |
| `sidePanel` | Display the extension UI in Chrome's side panel |
| `activeTab` | Access the current tab for Dealigence data extraction |
| `webNavigation` | Detect SPA navigation on Dealigence pages |
| `scripting` | Inject content scripts for Dealigence data extraction |
| Host: `https://run.mydealflow.com/*` | Communicate with the Sevanta Dealflow CRM API |
| Host: `https://dealigence.vc/*` | Extract company data from Dealigence pages |

## What Is NOT Collected

- No analytics or telemetry data
- No browsing history or activity tracking
- No personal information beyond what the user explicitly enters
- No data is shared with third parties
- No advertising or marketing data collection

## Data Storage

All locally stored data (schema cache) can be cleared by removing the extension or clearing extension data in Chrome settings.

## Contact

For privacy questions or concerns, contact: **yuval@in-venture.com**
