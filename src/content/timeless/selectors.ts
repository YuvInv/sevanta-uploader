/**
 * DOM selectors for Timeless meeting memo pages.
 *
 * Timeless renders memos inside a TipTap/ProseMirror editor.
 * The memo content is in the second .tiptap.ProseMirror container
 * (the first is an empty input field).
 */

export const SELECTORS = {
  /** All TipTap editor instances on the page */
  memoEditors: '.tiptap.ProseMirror',

  /** Company name heading inside memo */
  companyName: 'h1',

  /** Section headings inside memo */
  sectionHeading: 'h2',

  /** Paragraphs inside memo */
  paragraph: 'p',

  /** Unordered lists (traction items) */
  list: 'ul',

  /** List items */
  listItem: 'li',
} as const;
