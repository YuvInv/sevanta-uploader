/**
 * IVC content script
 * Handles messages from background script to extract company data
 */

import { extractIvcCompanyData } from './extractor';

// Message types for content script communication
interface ExtractMessage {
  type: 'EXTRACT_IVC_COMPANY_DATA';
}

interface ExtractResponse {
  success: boolean;
  data?: ReturnType<typeof extractIvcCompanyData>;
  error?: string;
}

/**
 * Handle incoming messages from background script
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtractMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtractResponse) => void
  ) => {
    if (message.type === 'EXTRACT_IVC_COMPANY_DATA') {
      try {
        const data = extractIvcCompanyData();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Extraction failed',
        });
      }
      return true;
    }
    return false;
  }
);

// Log when content script loads (useful for debugging)
console.log('[Sevanta] IVC content script loaded');
