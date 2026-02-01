import type { UploadProgress as UploadProgressType } from '../../lib/types';

interface UploadProgressProps {
  progress: UploadProgressType;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  const percentage = Math.round((progress.completed / progress.total) * 100);
  const isComplete = progress.completed === progress.total;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-medium mb-2">
          {isComplete ? 'Upload Complete' : 'Uploading...'}
        </h2>
        {progress.current && <p className="text-gray-600 text-sm">Uploading: {progress.current}</p>}
      </div>

      <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-center gap-8 text-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">{progress.completed}</p>
          <p className="text-gray-500">of {progress.total}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{progress.successful}</p>
          <p className="text-gray-500">Successful</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
          <p className="text-gray-500">Failed</p>
        </div>
      </div>

      {isComplete && (
        <div className="text-center">
          {progress.failed === 0 ? (
            <p className="text-green-600">All companies uploaded successfully!</p>
          ) : (
            <p className="text-yellow-600">
              Upload complete with {progress.failed} failures. Check the table for details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
