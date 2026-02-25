/**
 * Content script for Timeless meeting memo pages.
 * Listens for extraction requests from the background script.
 */

import { extractMemoData } from './extractor';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_TIMELESS_DATA') {
    extractMemoData()
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Extraction failed',
        });
      });

    return true; // async response
  }
});
