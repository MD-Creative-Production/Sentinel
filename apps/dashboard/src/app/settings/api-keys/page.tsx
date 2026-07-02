'use client';

import { useState, useEffect } from 'react';
import { ApiKeyList } from '@/components/api-keys/ApiKeyList';
import { CreateKeyModal } from '@/components/api-keys/CreateKeyModal';
import { useApiKeys } from '@/hooks/useApiKeys';

export default function ApiKeysPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState('');
  const { keys, loading, error, createKey, revokeKey, refetch } = useApiKeys(userId);

  // Get userId from session/context in production
  useEffect(() => {
    // Placeholder: In production, get from auth context/session
    const tempUserId = localStorage.getItem('userId') || 'user-123';
    setUserId(tempUserId);
  }, []);

  const handleCreateKey = async (name: string) => {
    await createKey(name);
    setShowCreateModal(false);
    refetch();
  };

  const handleRevokeKey = async (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      await revokeKey(keyId);
      refetch();
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
        <p className="text-gray-400">Manage your API keys for programmatic access to Sentinel</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Create New Key
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/60 text-red-400 rounded-lg mb-6">
          {error}
        </div>
      )}

      <ApiKeyList keys={keys} loading={loading} onRevoke={handleRevokeKey} />

      {showCreateModal && (
        <CreateKeyModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateKey} />
      )}
    </div>
  );
}
