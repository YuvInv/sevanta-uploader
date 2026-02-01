import type { Company } from '../../lib/types';

interface ValidationPanelProps {
  company: Company;
}

export function ValidationPanel({ company }: ValidationPanelProps) {
  const { validation, duplicate, uploadError } = company;

  if (
    validation.errors.length === 0 &&
    validation.warnings.length === 0 &&
    !duplicate?.isDuplicate &&
    !uploadError
  ) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-green-700 text-sm">All fields are valid</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm font-medium">Upload Error</p>
          <p className="text-red-600 text-xs mt-1">{uploadError}</p>
        </div>
      )}

      {duplicate?.isDuplicate && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-orange-700 text-sm font-medium">Possible Duplicate</p>
          <p className="text-orange-600 text-xs mt-1">Matched on: {duplicate.matchedOn}</p>
          {duplicate.existingDeal && (
            <p className="text-orange-600 text-xs">
              Existing: {duplicate.existingDeal.CompanyName}
            </p>
          )}
        </div>
      )}

      {validation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm font-medium mb-1">Errors</p>
          <ul className="text-red-600 text-xs space-y-1">
            {validation.errors.map((error, i) => (
              <li key={i}>
                <span className="font-medium">{error.field}:</span> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-700 text-sm font-medium mb-1">Warnings</p>
          <ul className="text-yellow-600 text-xs space-y-1">
            {validation.warnings.map((warning, i) => (
              <li key={i}>
                <span className="font-medium">{warning.field}:</span> {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
