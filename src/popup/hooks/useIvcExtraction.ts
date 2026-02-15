/**
 * Hook for managing IVC company data extraction
 * Simpler than Dealigence: no SPA listener needed (server-rendered pages)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { IvcCompanyData } from '../../lib/ivc/types';
import type { TabInfo, ExtractionStep } from '../../lib/dealigence/types';
import { isIvcCompanyPage } from '../../lib/ivc/urlUtils';

// Re-use the same state shape as Dealigence extraction
interface IvcExtractionState {
  step: ExtractionStep;
  data?: IvcCompanyData;
  error?: string;
}

export function useIvcExtraction() {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [tabInfoLoading, setTabInfoLoading] = useState(true);
  const [state, setState] = useState<IvcExtractionState>({ step: 'idle' });
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
    if (!tabInfo?.tabId || !tabInfo.isIvcCompanyPage) {
      return;
    }

    if (extractingRef.current) return;

    extractingRef.current = true;
    setState({ step: 'extracting' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXTRACT_IVC_DATA',
        tabId: tabInfo.tabId,
      });

      if (response?.success && response.data) {
        setState({
          step: 'success',
          data: response.data as IvcCompanyData,
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

  const retry = useCallback(() => {
    setState({ step: 'idle' });
    extractData();
  }, [extractData]);

  const reset = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  // Listen for URL changes and tab activations (same-site navigation)
  useEffect(() => {
    const handleMessage = (message: {
      type: string;
      url?: string;
      tabId?: number;
      isIvcCompanyPage?: boolean;
    }) => {
      if (message.type === 'IVC_URL_CHANGED' && message.url) {
        const isCompany = isIvcCompanyPage(message.url);
        setTabInfo((prev) => {
          if (!prev) return prev;
          return { ...prev, url: message.url!, isIvcCompanyPage: isCompany };
        });
        if (isCompany) {
          setState({ step: 'idle' });
        }
      }
      if (message.type === 'TAB_ACTIVATED' && message.isIvcCompanyPage) {
        // Full page load on IVC — refresh tab info and re-extract
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
    if (tabInfo?.isIvcCompanyPage && state.step === 'idle' && !extractingRef.current) {
      extractData();
    }
  }, [tabInfo, state.step, extractData]);

  // Computed values
  const isIvcPage = tabInfo?.isIvcCompanyPage ?? false;
  const isExtracting = state.step === 'extracting';
  const hasError = state.step === 'error';
  const hasData = state.step === 'success' && !!state.data;

  return {
    tabInfo,
    tabInfoLoading,
    state,
    isIvcPage,
    isExtracting,
    hasError,
    hasData,
    data: state.data,
    error: state.error,
    extractData,
    retry,
    reset,
    refreshTabInfo,
  };
}
