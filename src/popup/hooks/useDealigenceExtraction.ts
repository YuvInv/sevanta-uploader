/**
 * Hook for managing Dealigence company data extraction
 * Handles extraction, retry, and SPA navigation updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DealigenceCompanyData, ExtractionState, TabInfo } from '../../lib/dealigence/types';
import { isDealigenceCompanyPage } from '../../lib/dealigence/urlUtils';

// Message types from background script
interface UrlChangedMessage {
  type: 'DEALIGENCE_URL_CHANGED';
  url: string;
  tabId: number;
}

interface TabActivatedMessage {
  type: 'TAB_ACTIVATED';
  url: string;
  tabId: number;
  isDealigenceCompanyPage: boolean;
  isIvcCompanyPage: boolean;
}

export function useDealigenceExtraction() {
  // Tab info state
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [tabInfoLoading, setTabInfoLoading] = useState(true);

  // Extraction state
  const [state, setState] = useState<ExtractionState>({ step: 'idle' });

  // Ref to track if we're currently extracting (prevent double extraction)
  const extractingRef = useRef(false);

  // Get active tab info
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

  // Extract data from current tab
  const extractData = useCallback(async () => {
    if (!tabInfo?.tabId || !tabInfo.isDealigenceCompanyPage) {
      return;
    }

    if (extractingRef.current) {
      return; // Already extracting
    }

    extractingRef.current = true;
    setState({ step: 'extracting' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXTRACT_DEALIGENCE_DATA',
        tabId: tabInfo.tabId,
      });

      if (response?.success && response.data) {
        // Extract retry count from response data (added by background script)
        const { _retryCount, ...data } = response.data as DealigenceCompanyData & {
          _retryCount?: number;
        };
        if (_retryCount && _retryCount > 0) {
          console.log(`[Sevanta] Extraction succeeded after ${_retryCount} retries`);
        }
        setState({
          step: 'success',
          data: data as DealigenceCompanyData,
          retryCount: _retryCount,
        });
      } else {
        setState({
          step: 'error',
          error: response?.error || 'Extraction failed',
        });
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

  // Retry extraction
  const retry = useCallback(() => {
    setState({ step: 'idle' });
    extractData();
  }, [extractData]);

  // Reset state
  const reset = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  // Listen for URL changes (SPA navigation) and tab activation (full page load)
  useEffect(() => {
    const handleMessage = (message: UrlChangedMessage | TabActivatedMessage) => {
      if (message.type === 'DEALIGENCE_URL_CHANGED') {
        // Check if new URL is a company page
        const isCompanyPage = isDealigenceCompanyPage(message.url);

        // Update tab info with new URL and company page status
        setTabInfo((prev) => {
          if (prev && prev.tabId === message.tabId) {
            return {
              ...prev,
              url: message.url,
              isDealigenceCompanyPage: isCompanyPage,
            };
          }
          return prev;
        });

        // Reset state - auto-extract effect will handle re-extraction if on company page
        if (isCompanyPage) {
          setState({ step: 'idle' });
        }
      }

      // Handle tab activation / full page load navigation
      if (message.type === 'TAB_ACTIVATED' && message.isDealigenceCompanyPage) {
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

  // Auto-extract when tab info is available and we're idle
  useEffect(() => {
    if (tabInfo?.isDealigenceCompanyPage && state.step === 'idle' && !extractingRef.current) {
      extractData();
    }
  }, [tabInfo, state.step, extractData]);

  // Computed values
  const isDealigencePage = tabInfo?.isDealigenceCompanyPage ?? false;
  const isExtracting =
    state.step === 'extracting' || state.step === 'validating' || state.step === 'retrying';
  const hasError = state.step === 'error';
  const hasData = state.step === 'success' && !!state.data;

  return {
    // State
    tabInfo,
    tabInfoLoading,
    state,

    // Computed
    isDealigencePage,
    isExtracting,
    hasError,
    hasData,
    data: state.data,
    error: state.error,

    // Actions
    extractData,
    retry,
    reset,
    refreshTabInfo,
  };
}
