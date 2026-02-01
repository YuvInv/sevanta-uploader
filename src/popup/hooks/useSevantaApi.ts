import { useState, useEffect, useCallback } from 'react';
import type { Schema, ContactSchema } from '../../lib/types';

export function useSevantaApi() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [contactSchema, setContactSchema] = useState<ContactSchema | null>(null);
  const [error, setError] = useState<string | undefined>();

  const checkConnection = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' });

      if (response.success && response.data) {
        setConnected(true);

        // Fetch deal schema if connected
        const schemaResponse = await chrome.runtime.sendMessage({ type: 'GET_SCHEMA' });
        if (schemaResponse.success && schemaResponse.data) {
          setSchema(schemaResponse.data);
        }

        // Fetch contact schema if connected
        const contactSchemaResponse = await chrome.runtime.sendMessage({
          type: 'GET_CONTACT_SCHEMA',
        });
        if (contactSchemaResponse.success && contactSchemaResponse.data) {
          setContactSchema(contactSchemaResponse.data);
        }
      } else {
        setConnected(false);
        if (response.error) {
          setError(response.error);
        }
      }
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    setLoading(true);
    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
      await checkConnection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
      setLoading(false);
    }
  }, [checkConnection]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    connected,
    loading,
    schema,
    contactSchema,
    error,
    refreshConnection: checkConnection,
    clearCache,
  };
}
