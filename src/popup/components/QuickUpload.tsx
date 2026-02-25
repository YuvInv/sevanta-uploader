/**
 * Site-aware Quick Upload router
 * Renders IvcQuickUpload, DealigenceQuickUpload, or a "navigate to a company page" placeholder
 * based on the current active tab URL.
 */

import { useState, useEffect } from 'react';
import { DealigenceQuickUpload } from './DealigenceQuickUpload';
import { IvcQuickUpload } from './IvcQuickUpload';
import { TimelessQuickUpload } from './TimelessQuickUpload';
import { isDealigenceCompanyPage } from '../../lib/dealigence/urlUtils';
import { isIvcCompanyPage } from '../../lib/ivc/urlUtils';
import { isTimelessMemoPage } from '../../lib/timeless/urlUtils';

interface QuickUploadProps {
  connected: boolean;
}

type ActiveSite = 'dealigence' | 'ivc' | 'timeless' | 'none';

export function QuickUpload({ connected }: QuickUploadProps) {
  const [activeSite, setActiveSite] = useState<ActiveSite>('none');
  const [loading, setLoading] = useState(true);

  // Check which site is active on mount
  useEffect(() => {
    let mounted = true;

    const checkTab = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB_INFO' });
        if (!mounted) return;

        if (response?.success && response.data) {
          if (response.data.isDealigenceCompanyPage) {
            setActiveSite('dealigence');
          } else if (response.data.isIvcCompanyPage) {
            setActiveSite('ivc');
          } else if (response.data.isTimelessMemoPage) {
            setActiveSite('timeless');
          } else {
            setActiveSite('none');
          }
        }
      } catch {
        // Ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkTab();
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for tab changes and SPA navigation
  useEffect(() => {
    const handleMessage = (message: {
      type: string;
      url?: string;
      isDealigenceCompanyPage?: boolean;
      isIvcCompanyPage?: boolean;
      isTimelessMemoPage?: boolean;
    }) => {
      if (message.type === 'DEALIGENCE_URL_CHANGED' && message.url) {
        if (isDealigenceCompanyPage(message.url)) {
          setActiveSite('dealigence');
        } else {
          setActiveSite('none');
        }
      }
      if (message.type === 'IVC_URL_CHANGED' && message.url) {
        if (isIvcCompanyPage(message.url)) {
          setActiveSite('ivc');
        } else {
          setActiveSite('none');
        }
      }
      if (message.type === 'TIMELESS_URL_CHANGED' && message.url) {
        if (isTimelessMemoPage(message.url)) {
          setActiveSite('timeless');
        } else {
          setActiveSite('none');
        }
      }
      if (message.type === 'TAB_ACTIVATED') {
        if (message.isDealigenceCompanyPage) {
          setActiveSite('dealigence');
        } else if (message.isIvcCompanyPage) {
          setActiveSite('ivc');
        } else if (message.isTimelessMemoPage) {
          setActiveSite('timeless');
        } else {
          setActiveSite('none');
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  if (loading) return null;

  if (activeSite === 'dealigence') {
    return <DealigenceQuickUpload connected={connected} />;
  }

  if (activeSite === 'ivc') {
    return <IvcQuickUpload connected={connected} />;
  }

  if (activeSite === 'timeless') {
    return <TimelessQuickUpload connected={connected} />;
  }

  // Not on any supported site
  return (
    <div className="bg-warm-100 rounded-xl p-6 text-center">
      <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-warm-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="font-semibold text-warm-700 mb-3">Navigate to a Company Page</h3>
      <p className="text-warm-500 text-sm">
        Visit a company profile on one of the supported sites:
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <a
          href="https://dealigence.vc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-600 hover:underline text-sm"
        >
          dealigence.vc
        </a>
        <a
          href="https://www.ivc-online.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-600 hover:underline text-sm"
        >
          ivc-online.com
        </a>
        <a
          href="https://my.timeless.day"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-600 hover:underline text-sm"
        >
          my.timeless.day
        </a>
      </div>
    </div>
  );
}
