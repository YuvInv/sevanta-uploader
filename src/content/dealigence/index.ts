/**
 * Content script entry point for Dealigence company pages
 * Runs on dealigence.vc/company/* pages and provides extraction functionality
 */

import { extractCompanyData } from './extractor';
import type { DealigenceCompanyData } from './types';

// Expose extraction function for chrome.scripting.executeScript
declare global {
  interface Window {
    __dealigenceExtractor?: {
      extract: () => DealigenceCompanyData;
    };
  }
}

// Make extractor available on window for executeScript calls
window.__dealigenceExtractor = {
  extract: extractCompanyData,
};

// Message listener for direct communication from the extension
chrome.runtime.onMessage.addListener(
  (
    message: { type: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: {
      success: boolean;
      data?: DealigenceCompanyData;
      error?: string;
    }) => void
  ) => {
    if (message.type === 'EXTRACT_DEALIGENCE_DATA') {
      try {
        const data = extractCompanyData();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Extraction failed',
        });
      }
    }
    return true; // Keep the message channel open for async response
  }
);

// Log that the content script is loaded (helpful for debugging)
console.log('[Sevanta Uploader] Dealigence content script loaded');
