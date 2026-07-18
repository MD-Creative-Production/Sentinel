'use client';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface ApiKeyListProps {
  keys: ApiKey[];
  loading: boolean;
  onRevoke: (keyId: string) => void;
}

export function ApiKeyList({ keys, loading, onRevoke }: ApiKeyListProps) {
  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading API keys...</p>
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No API keys created yet</p>
        <p className="text-gray-500 text-sm mt-2">Create your first API key to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Name</th>
            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Key</th>
            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Created</th>
            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Last Used</th>
            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(key => (
            <tr
              key={key.id}
              className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <td className="px-4 py-4 text-white">{key.name}</td>
              <td className="px-4 py-4 text-gray-400 font-mono text-sm">****{key.keyPreview}</td>
              <td className="px-4 py-4 text-gray-400 text-sm">
                {new Date(key.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-gray-400 text-sm">
                {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
              </td>
              <td className="px-4 py-4">
                <button
                  onClick={() => onRevoke(key.id)}
                  className="px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded text-sm font-medium transition-colors"
                >
                  Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
