/**
 * DOM extraction for Timeless meeting memo pages
 *
 * Extracts structured data from a TipTap/ProseMirror editor
 * containing a VC screening memo. The memo follows a consistent template:
 *
 *   H1: Company Name
 *   H2: Team
 *     P: <strong>Name - Title</strong><br>Bio...
 *     P: <strong>Team size:</strong> ... <strong>Founded:</strong> ... <strong>Location:</strong> ...
 *   H2: Market
 *     P: description
 *   H2: Problem
 *     P: description
 *   H2: Summary
 *     P: <strong>Solution</strong> (sub-heading)
 *     P: solution text
 *     P: <strong>Traction</strong> (sub-heading)
 *     UL: traction items
 *     P: <strong>Funding</strong> (sub-heading)
 *     P: <strong>Funding History:</strong> ...
 *     P: <strong>Use of proceeds:</strong> ...
 *     P: <strong>Revenue model:</strong> ...
 */

import type { TimelessMemoData, TimelessFounder } from '../../lib/timeless/types';
import { SELECTORS } from './selectors';

/**
 * Find the content-rich memo container.
 * Timeless renders two .tiptap.ProseMirror editors; the one with
 * actual content has more than 1 child element.
 */
function findMemoContainer(): Element | null {
  const editors = document.querySelectorAll(SELECTORS.memoEditors);
  for (const editor of editors) {
    if (editor.children.length > 1) return editor;
  }
  return null;
}

/**
 * Get trimmed text content from an element
 */
function getText(el: Element | null): string {
  return el?.textContent?.trim().replace(/\s+/g, ' ') || '';
}

/**
 * Parse founders from Team section paragraphs.
 * Each founder is a P element with: <strong>Name - Title</strong><br>Bio text
 */
function parseFounders(paragraphs: Element[]): TimelessFounder[] {
  const founders: TimelessFounder[] = [];

  for (const p of paragraphs) {
    const strong = p.querySelector('strong');
    if (!strong) continue;

    const strongText = strong.textContent?.trim() || '';

    // Founder pattern: "Name - Title" (e.g. "Shiri Sharvit - CEO/Founder")
    const dashMatch = strongText.match(/^(.+?)\s*[-–]\s*(.+)$/);
    if (dashMatch) {
      founders.push({
        name: dashMatch[1].trim(),
        title: dashMatch[2].trim(),
      });
    }
  }

  return founders;
}

/**
 * Extract a bold-label value from a paragraph.
 * Pattern: <strong>Label:</strong> value text
 * Returns the text after the colon, or undefined if the label doesn't match.
 */
function extractBoldLabel(p: Element, label: string): string | undefined {
  const strongs = p.querySelectorAll('strong');
  for (const strong of strongs) {
    const text = strong.textContent?.trim() || '';
    if (text.toLowerCase().startsWith(label.toLowerCase())) {
      // Get the text after this strong element (the value)
      // The full paragraph text contains "Label: value", so extract after the label
      const fullText = p.textContent?.trim() || '';
      const labelWithColon = text.endsWith(':') ? text : text + ':';
      const idx = fullText.indexOf(labelWithColon);
      if (idx !== -1) {
        return fullText.slice(idx + labelWithColon.length).trim();
      }
    }
  }
  return undefined;
}

/**
 * Check if a paragraph is a bold sub-heading (contains only a single <strong> with no other text)
 */
function isBoldSubHeading(p: Element, heading: string): boolean {
  const strong = p.querySelector('strong');
  if (!strong) return false;
  const strongText = strong.textContent?.trim().toLowerCase() || '';
  const fullText = p.textContent?.trim().toLowerCase() || '';
  return strongText === fullText && strongText === heading.toLowerCase();
}

/**
 * Check if a paragraph is a founder entry (has <strong>Name - Title</strong> pattern)
 */
function isFounderParagraph(p: Element): boolean {
  const strong = p.querySelector('strong');
  if (!strong) return false;
  const strongText = strong.textContent?.trim() || '';
  return /^.+\s*[-–]\s*.+$/.test(strongText) && !strongText.includes(':');
}

/**
 * Check if a paragraph is a metadata label paragraph (Team size, Founded, Location)
 */
function isMetadataLabels(p: Element): boolean {
  const strongs = p.querySelectorAll('strong');
  if (strongs.length === 0) return false;
  const labels = Array.from(strongs).map((s) => s.textContent?.trim().toLowerCase() || '');
  return labels.some(
    (l) =>
      l.startsWith('team size') ||
      l.startsWith('founded') ||
      l.startsWith('location')
  );
}

/**
 * Build a formatted full memo text from the container elements
 */
function buildFullMemoText(container: Element): string {
  const lines: string[] = [];
  const children = Array.from(container.children);

  for (const child of children) {
    const tag = child.tagName;
    const text = child.textContent?.trim() || '';

    if (!text) continue;

    if (tag === 'H1' || tag === 'H2') {
      if (lines.length > 0) lines.push('');
      lines.push(text);
    } else if (tag === 'UL') {
      const items = child.querySelectorAll('li');
      for (const item of items) {
        lines.push(`* ${item.textContent?.trim()}`);
      }
    } else if (tag === 'P') {
      lines.push(text);
    }
  }

  return lines.join('\n');
}

/**
 * Main extraction function.
 * Parses the Timeless memo DOM into structured data.
 */
export async function extractMemoData(): Promise<TimelessMemoData> {
  const container = findMemoContainer();

  if (!container) {
    return {
      companyName: '',
      traction: [],
      founders: [],
      sourceUrl: window.location.href,
      fullMemoText: '',
      isLoading: true,
    };
  }

  const children = Array.from(container.children);

  // Extract company name from H1
  const h1 = container.querySelector(SELECTORS.companyName);
  const companyName = getText(h1);

  // Parse sections by H2 headings
  let currentSection = '';
  const sectionContent: Record<string, Element[]> = {};

  for (const child of children) {
    if (child.tagName === 'H2') {
      currentSection = getText(child).toLowerCase();
      sectionContent[currentSection] = [];
    } else if (currentSection) {
      if (!sectionContent[currentSection]) sectionContent[currentSection] = [];
      sectionContent[currentSection].push(child);
    }
  }

  // Extract founders from Team section
  const teamElements = sectionContent['team'] || [];
  const founderParagraphs = teamElements.filter((el) => el.tagName === 'P' && isFounderParagraph(el));
  const founders = parseFounders(founderParagraphs);

  // Extract team metadata (Team size, Founded, Location)
  let teamSize: string | undefined;
  let founded: string | undefined;
  let location: string | undefined;

  for (const el of teamElements) {
    if (el.tagName === 'P' && isMetadataLabels(el)) {
      teamSize = teamSize || extractBoldLabel(el, 'Team size');
      founded = founded || extractBoldLabel(el, 'Founded');
      location = location || extractBoldLabel(el, 'Location');
    }
  }

  // Extract Market
  const marketElements = sectionContent['market'] || [];
  const market = marketElements.length > 0 ? getText(marketElements[0]) : undefined;

  // Extract Problem
  const problemElements = sectionContent['problem'] || [];
  const problem = problemElements.length > 0 ? getText(problemElements[0]) : undefined;

  // Extract Summary sub-sections (Solution, Traction, Funding)
  const summaryElements = sectionContent['summary'] || [];

  let solution: string | undefined;
  const traction: string[] = [];
  let fundingHistory: string | undefined;
  let useOfProceeds: string | undefined;
  let revenueModel: string | undefined;
  let totalRaised: string | undefined;

  let subSection = '';

  for (const el of summaryElements) {
    const tag = el.tagName;

    // Check for bold sub-headings
    if (tag === 'P' && isBoldSubHeading(el, 'Solution')) {
      subSection = 'solution';
      continue;
    }
    if (tag === 'P' && isBoldSubHeading(el, 'Traction')) {
      subSection = 'traction';
      continue;
    }
    if (tag === 'P' && isBoldSubHeading(el, 'Funding')) {
      subSection = 'funding';
      continue;
    }

    // Collect content based on current sub-section
    if (subSection === 'solution' && tag === 'P') {
      const text = getText(el);
      if (text) solution = solution ? `${solution} ${text}` : text;
    }

    if (subSection === 'traction' && tag === 'UL') {
      const items = el.querySelectorAll('li');
      for (const item of items) {
        const text = item.textContent?.trim();
        if (text) traction.push(text);
      }
    }

    if (subSection === 'funding' && tag === 'P') {
      const fh = extractBoldLabel(el, 'Funding History');
      if (fh) {
        fundingHistory = fh;
        // Extract "Raised $X.XM" from funding history
        const raisedMatch = fh.match(/[Rr]aised\s+(\$[\d.,]+\s*[MBKmbk]?)/);
        if (raisedMatch) totalRaised = raisedMatch[1];
      }

      const uop = extractBoldLabel(el, 'Use of proceeds');
      if (uop) useOfProceeds = uop;

      const rm = extractBoldLabel(el, 'Revenue model');
      if (rm) revenueModel = rm;
    }
  }

  // Build description from market + solution
  const descParts: string[] = [];
  if (market) descParts.push(market);
  if (solution) descParts.push(solution);
  const description = descParts.length > 0 ? descParts.join('. ') : undefined;

  // Build full memo text
  const fullMemoText = buildFullMemoText(container);

  return {
    companyName,
    description,
    market,
    problem,
    solution,
    traction,
    founders,
    fundingHistory,
    useOfProceeds,
    revenueModel,
    totalRaised,
    teamSize,
    founded,
    location,
    sourceUrl: window.location.href,
    fullMemoText,
    isLoading: !companyName,
  };
}
