import { useState, useRef, DragEvent } from 'react';
import type { SchemaField } from '../../lib/types';
import { downloadCsvTemplate } from '../../lib/csv';
import { MAX_CSV_FILE_SIZE_BYTES, MAX_CSV_FILE_SIZE_DISPLAY } from '../../lib/constants';

interface CsvUploadProps {
  onUpload: (content: string) => void;
  schemaFields?: SchemaField[];
  contactSchemaFields?: SchemaField[];
}

export function CsvUpload({ onUpload, schemaFields, contactSchemaFields }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeDescriptions, setIncludeDescriptions] = useState(true);
  const [includeContacts, setIncludeContacts] = useState(true);
  const [simpleTemplate, setSimpleTemplate] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = () => {
    const files = fileInputRef.current?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    setError(null);

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_CSV_FILE_SIZE_DISPLAY}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onUpload(content);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    if (!schemaFields) return;
    downloadCsvTemplate(
      schemaFields,
      {
        includeDescriptionRow: includeDescriptions,
        includeContactFields: includeContacts,
        contactSchemaFields: contactSchemaFields,
        simple: simpleTemplate,
      },
      simpleTemplate ? 'sevanta-simple-template.csv' : 'sevanta-full-template.csv'
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-sm">
        <div
          className={`relative p-8 transition-all ${
            isDragging
              ? 'bg-accent-50 border-2 border-dashed border-accent-400'
              : 'hover:bg-warm-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-center">
            <div
              className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                isDragging ? 'bg-accent-100' : 'bg-warm-100'
              }`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${isDragging ? 'text-accent-600' : 'text-warm-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <p className="text-warm-700 font-medium mb-1">
              {isDragging ? 'Drop your CSV file here' : 'Drop your CSV file here'}
            </p>
            <p className="text-warm-400 text-sm mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-accent-500 text-white text-base font-medium rounded-xl hover:bg-accent-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Browse Files
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-danger-700 text-sm">{error}</p>
        </div>
      )}

      {/* Format Help */}
      <div className="bg-white rounded-2xl border border-warm-200 p-5 shadow-sm">
        <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-warm-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          CSV Format
        </h3>
        <ul className="space-y-2 text-sm text-warm-600">
          <li className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            First row should contain column headers
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>
              <strong>CompanyName</strong> is required for each row
            </span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Columns will be auto-mapped to CRM fields
          </li>
        </ul>
      </div>

      {/* Template Download */}
      {schemaFields && schemaFields.length > 0 && (
        <div className="bg-gradient-to-r from-warm-50 to-warm-100 rounded-2xl border border-warm-200 p-5">
          <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-warm-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Template
          </h3>

          {/* Template Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSimpleTemplate(true)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                simpleTemplate
                  ? 'bg-accent-500 text-white'
                  : 'bg-white border border-warm-300 text-warm-700 hover:bg-warm-50'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setSimpleTemplate(false)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                !simpleTemplate
                  ? 'bg-accent-500 text-white'
                  : 'bg-white border border-warm-300 text-warm-700 hover:bg-warm-50'
              }`}
            >
              Full
            </button>
          </div>

          <p className="text-sm text-warm-600 mb-4">
            {simpleTemplate
              ? 'Common fields: CompanyName, Description, Website, Source, and Contact info.'
              : 'All CRM fields included in the template.'}
          </p>

          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 text-sm text-warm-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDescriptions}
                onChange={(e) => setIncludeDescriptions(e.target.checked)}
                className="w-4 h-4 rounded border-warm-300 text-accent-500 focus:ring-accent-500"
              />
              Include field descriptions row
            </label>
            {contactSchemaFields && contactSchemaFields.length > 0 && (
              <label className="flex items-center gap-3 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeContacts}
                  onChange={(e) => setIncludeContacts(e.target.checked)}
                  className="w-4 h-4 rounded border-warm-300 text-accent-500 focus:ring-accent-500"
                />
                Include contact/founder fields
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-warm-700 bg-white border border-warm-300 rounded-xl hover:bg-warm-50 hover:border-warm-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download {simpleTemplate ? 'Simple' : 'Full'} Template
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className="px-3 py-2.5 text-sm font-medium text-warm-500 bg-white border border-warm-300 rounded-xl hover:bg-warm-50 hover:border-warm-400 transition-colors"
              title="How to use the template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div
          className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-warm-800">
                  How to Use the CSV Template
                </h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-warm-400 hover:text-warm-600 text-xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 text-sm text-warm-600">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Download the template and fill in company details</li>
                  <li>
                    <strong>One row per contact</strong> - repeat the company name for multiple
                    contacts
                  </li>
                  <li>Only the first row needs company details (Description, Website, etc.)</li>
                  <li>Subsequent rows for the same company only need contact fields</li>
                </ol>

                <div className="bg-warm-50 rounded-xl p-4 overflow-x-auto">
                  <div className="text-xs font-medium text-warm-500 mb-2">Example:</div>
                  <table className="text-xs border-collapse w-full min-w-[400px]">
                    <thead>
                      <tr className="bg-warm-100">
                        <th className="border border-warm-300 px-2 py-1 text-left">CompanyName</th>
                        <th className="border border-warm-300 px-2 py-1 text-left">Description</th>
                        <th className="border border-warm-300 px-2 py-1 text-left">Website</th>
                        <th className="border border-warm-300 px-2 py-1 text-left">Contact_Name</th>
                        <th className="border border-warm-300 px-2 py-1 text-left">
                          Contact_Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-warm-300 px-2 py-1">Acme Corp</td>
                        <td className="border border-warm-300 px-2 py-1">AI startup</td>
                        <td className="border border-warm-300 px-2 py-1">acme.com</td>
                        <td className="border border-warm-300 px-2 py-1">John Doe</td>
                        <td className="border border-warm-300 px-2 py-1">john@acme.com</td>
                      </tr>
                      <tr className="bg-accent-50/50">
                        <td className="border border-warm-300 px-2 py-1">Acme Corp</td>
                        <td className="border border-warm-300 px-2 py-1 text-warm-400"></td>
                        <td className="border border-warm-300 px-2 py-1 text-warm-400"></td>
                        <td className="border border-warm-300 px-2 py-1">Jane Smith</td>
                        <td className="border border-warm-300 px-2 py-1">jane@acme.com</td>
                      </tr>
                      <tr>
                        <td className="border border-warm-300 px-2 py-1">Beta Inc</td>
                        <td className="border border-warm-300 px-2 py-1">Fintech</td>
                        <td className="border border-warm-300 px-2 py-1">beta.io</td>
                        <td className="border border-warm-300 px-2 py-1">Bob Wilson</td>
                        <td className="border border-warm-300 px-2 py-1">bob@beta.io</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-warm-500">
                  This creates <strong>2 companies</strong>: Acme Corp (2 contacts) and Beta Inc (1
                  contact).
                </p>

                <div className="bg-accent-50 border border-accent-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-accent-700 text-xs">
                      Companies are grouped by <strong>CompanyName + Website</strong>. Rows with the
                      same combination become multiple contacts for one company.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-white bg-accent-500 rounded-xl hover:bg-accent-600 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
