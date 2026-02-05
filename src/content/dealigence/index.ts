/**
 * Dealigence content script
 * Handles messages from background script to extract company data
 */

import { extractCompanyData } from './extractor';

// Message types for content script communication
interface ExtractMessage {
  type: 'EXTRACT_COMPANY_DATA';
}

interface ExtractResponse {
  success: boolean;
  data?: Awaited<ReturnType<typeof extractCompanyData>>;
  error?: string;
}

/**
 * Handle incoming messages from background script
 * extractCompanyData is async (waits for DOM data to load),
 * so we return true and use sendResponse asynchronously.
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtractMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtractResponse) => void
  ) => {
    if (message.type === 'EXTRACT_COMPANY_DATA') {
      extractCompanyData()
        .then((data) => sendResponse({ success: true, data }))
        .catch((error) =>
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Extraction failed',
          })
        );
      // Return true to indicate async response
      return true;
    }
    return false;
  }
);

// Log when content script loads (useful for debugging)
console.log('[Sevanta] Dealigence content script loaded');
