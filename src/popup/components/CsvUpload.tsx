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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div
          className={`relative p-8 transition-all ${
            isDragging ? 'bg-blue-50 border-2 border-dashed border-blue-400' : 'hover:bg-gray-50'
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
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
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

            <p className="text-gray-700 font-medium mb-1">
              {isDragging ? 'Drop your CSV file here' : 'Drop your CSV file here'}
            </p>
            <p className="text-gray-400 text-sm mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Browse Files
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
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
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Format Help */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-400"
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
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
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
              className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
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
              className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
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
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-5">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-400"
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
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setSimpleTemplate(false)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                !simpleTemplate
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Full
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {simpleTemplate
              ? 'Common fields: CompanyName, Description, Website, Source, and Contact info.'
              : 'All CRM fields included in the template.'}
          </p>

          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDescriptions}
                onChange={(e) => setIncludeDescriptions(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Include field descriptions row
            </label>
            {contactSchemaFields && contactSchemaFields.length > 0 && (
              <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeContacts}
                  onChange={(e) => setIncludeContacts(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Include contact/founder fields
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
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
              className="px-3 py-2.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-lg text-gray-800">How to Use the CSV Template</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Download the template and fill in company details</li>
                  <li>
                    <strong>One row per contact</strong> - repeat the company name for multiple
                    contacts
                  </li>
                  <li>Only the first row needs company details (Description, Website, etc.)</li>
                  <li>Subsequent rows for the same company only need contact fields</li>
                </ol>

                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <div className="text-xs font-medium text-gray-500 mb-2">Example:</div>
                  <table className="text-xs border-collapse w-full min-w-[400px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-left">CompanyName</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Website</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Contact_Name</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">
                          Contact_Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">Acme Corp</td>
                        <td className="border border-gray-300 px-2 py-1">AI startup</td>
                        <td className="border border-gray-300 px-2 py-1">acme.com</td>
                        <td className="border border-gray-300 px-2 py-1">John Doe</td>
                        <td className="border border-gray-300 px-2 py-1">john@acme.com</td>
                      </tr>
                      <tr className="bg-purple-50">
                        <td className="border border-gray-300 px-2 py-1">Acme Corp</td>
                        <td className="border border-gray-300 px-2 py-1 text-gray-400"></td>
                        <td className="border border-gray-300 px-2 py-1 text-gray-400"></td>
                        <td className="border border-gray-300 px-2 py-1">Jane Smith</td>
                        <td className="border border-gray-300 px-2 py-1">jane@acme.com</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">Beta Inc</td>
                        <td className="border border-gray-300 px-2 py-1">Fintech</td>
                        <td className="border border-gray-300 px-2 py-1">beta.io</td>
                        <td className="border border-gray-300 px-2 py-1">Bob Wilson</td>
                        <td className="border border-gray-300 px-2 py-1">bob@beta.io</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-gray-500">
                  This creates <strong>2 companies</strong>: Acme Corp (2 contacts) and Beta Inc (1
                  contact).
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
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
                    <p className="text-blue-700 text-xs">
                      Companies are grouped by <strong>CompanyName + Website</strong>. Rows with the
                      same combination become multiple contacts for one company.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
