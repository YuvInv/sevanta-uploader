/**
 * Types for Timeless Meeting Memo Quick Upload feature
 */

export interface TimelessFounder {
  name: string;
  title?: string;
}

export interface TimelessMemoData {
  companyName: string;
  description?: string;
  market?: string;
  problem?: string;
  solution?: string;
  traction: string[];
  founders: TimelessFounder[];
  fundingHistory?: string;
  useOfProceeds?: string;
  revenueModel?: string;
  totalRaised?: string;
  teamSize?: string;
  founded?: string;
  location?: string;
  sourceUrl: string;
  fullMemoText: string;
  isLoading?: boolean;
}

export type TimelessExtractionStep = 'idle' | 'extracting' | 'success' | 'error';

export interface TimelessExtractionState {
  step: TimelessExtractionStep;
  data?: TimelessMemoData;
  error?: string;
}
