/**
 * Hook for managing Timeless meeting memo data extraction
 * Handles extraction and navigation updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimelessMemoData, TimelessExtractionState } from '../../lib/timeless/types';
import type { TabInfo } from '../../lib/dealigence/types';
import { isTimelessMemoPage } from '../../lib/timeless/urlUtils';

export function useTimelessExtraction() {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [tabInfoLoading, setTabInfoLoading] = useState(true);
  const [state, setState] = useState<TimelessExtractionState>({ step: 'idle' });
  const extractingRef = useRef(false);

  const refreshTabInfo = useCallback(async () => {
    setTabInfoLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB_INFO' });
      if (response?.success && response.data) {
        setTabInfo(response.data);
      } else {
        setTabInfo(null);
      }
    } catch {
      setTabInfo(null);
    } finally {
      setTabInfoLoading(false);
    }
  }, []);

  const extractData = useCallback(async () => {
    if (!tabInfo?.tabId || !tabInfo.isTimelessMemoPage) return;
    if (extractingRef.current) return;

    extractingRef.current = true;
    setState({ step: 'extracting' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXTRACT_TIMELESS_DATA',
        tabId: tabInfo.tabId,
      });

      if (response?.success && response.data) {
        setState({ step: 'success', data: response.data as TimelessMemoData });
      } else {
        setState({ step: 'error', error: response?.error || 'Extraction failed' });
      }
    } catch (error) {
      setState({
        step: 'error',
        error: error instanceof Error ? error.message : 'Extraction failed',
      });
    } finally {
      extractingRef.current = false;
    }
  }, [tabInfo]);

  const retry = useCallback(() => {
    setState({ step: 'idle' });
    extractData();
  }, [extractData]);

  // Listen for URL changes and tab activation
  useEffect(() => {
    const handleMessage = (message: {
      type: string;
      url?: string;
      tabId?: number;
      isTimelessMemoPage?: boolean;
    }) => {
      if (message.type === 'TIMELESS_URL_CHANGED' && message.url) {
        if (isTimelessMemoPage(message.url)) {
          setTabInfo((prev) =>
            prev && prev.tabId === message.tabId
              ? { ...prev, url: message.url!, isTimelessMemoPage: true }
              : prev
          );
          setState({ step: 'idle' });
        }
      }

      if (message.type === 'TAB_ACTIVATED' && message.isTimelessMemoPage) {
        refreshTabInfo().then(() => {
          setState({ step: 'idle' });
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [refreshTabInfo]);

  // Initial tab info fetch
  useEffect(() => {
    refreshTabInfo();
  }, [refreshTabInfo]);

  // Auto-extract when on a Timeless page and idle
  useEffect(() => {
    if (tabInfo?.isTimelessMemoPage && state.step === 'idle' && !extractingRef.current) {
      extractData();
    }
  }, [tabInfo, state.step, extractData]);

  const isTimelessPage = tabInfo?.isTimelessMemoPage ?? false;
  const isExtracting = state.step === 'extracting';
  const hasError = state.step === 'error';
  const hasData = state.step === 'success' && !!state.data;

  return {
    tabInfo,
    tabInfoLoading,
    state,
    isTimelessPage,
    isExtracting,
    hasError,
    hasData,
    data: state.data,
    error: state.error,
    extractData,
    retry,
    refreshTabInfo,
  };
}
