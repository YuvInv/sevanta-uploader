import { useContactLookup } from '../../hooks/useContactLookup';
import { ContactInput } from './ContactInput';
import { ContactLookupProgress } from './ContactLookupProgress';
import { ContactLookupTable } from './ContactLookupTable';

interface ContactLookupProps {
  connected: boolean;
}

export function ContactLookup({ connected }: ContactLookupProps) {
  const {
    step,
    parsedContacts,
    results,
    progress,
    error,
    strongCount,
    possibleCount,
    noneCount,
    parseInput,
    startLookup,
    reset,
  } = useContactLookup();

  if (!connected) {
    return (
      <div className="bg-gradient-to-r from-caution-50 to-warm-100 border border-caution-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-caution-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-caution-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-caution-800 mb-1">Not Connected</h3>
            <p className="text-caution-700 text-sm">
              Please log into{' '}
              <a
                href="https://run.mydealflow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-caution-900"
              >
                Sevanta Dealflow
              </a>{' '}
              first to use contact lookup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Modal */}
      {step === 'searching' && progress && <ContactLookupProgress progress={progress} />}

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-danger-50 border border-danger-200 rounded-xl p-4 text-danger-700">
          {error}
        </div>
      )}

      {/* Input step */}
      {step === 'input' && (
        <ContactInput
          onParse={parseInput}
          onLookup={startLookup}
          parsedCount={parsedContacts.length}
        />
      )}

      {/* Results step */}
      {step === 'results' && (
        <ContactLookupTable
          results={results}
          strongCount={strongCount}
          possibleCount={possibleCount}
          noneCount={noneCount}
          onReset={reset}
        />
      )}
    </div>
  );
}
