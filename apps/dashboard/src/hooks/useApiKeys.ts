import { useState, useCallback } from 'react';
import axios from 'axios';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function useApiKeys(userId: string) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api-keys/${userId}`);
      setKeys(response.data);
    } catch (err) {
      setError('Failed to load API keys');
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createKey = useCallback(
    async (name: string) => {
      if (!userId) return;
      try {
        const response = await axios.post(`${API_BASE_URL}/api-keys/${userId}`, {
          name,
        });
        // Show the key to user only on creation
        alert(`API Key created! Store it safely:\n\n${response.data.key}`);
        await refetch();
      } catch (err) {
        setError('Failed to create API key');
        console.error('Error creating API key:', err);
      }
    },
    [userId, refetch],
  );

  const revokeKey = useCallback(
    async (keyId: string) => {
      if (!userId) return;
      try {
        await axios.delete(`${API_BASE_URL}/api-keys/${userId}/${keyId}`);
        await refetch();
      } catch (err) {
        setError('Failed to revoke API key');
        console.error('Error revoking API key:', err);
      }
    },
    [userId, refetch],
  );

  return {
    keys,
    loading,
    error,
    createKey,
    revokeKey,
    refetch,
  };
}
