import type { LookupContact } from './types';
import { EMAIL_REGEX } from './constants';

/**
 * Parse contact input text into structured contacts.
 * Supports multiple formats:
 * - "Name <email@domain.com>" format
 * - Tab-separated: "Name\temail@domain.com"
 * - Comma-separated: "Name, email@domain.com"
 * - Just email: "email@domain.com"
 * - Just name: "John Smith"
 */
export function parseContactInput(text: string): LookupContact[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const contacts: LookupContact[] = [];

  for (const line of lines) {
    const contact = parseSingleContact(line);
    if (contact) {
      contacts.push({
        ...contact,
        id: crypto.randomUUID(),
      });
    }
  }

  return contacts;
}

function parseSingleContact(line: string): Omit<LookupContact, 'id'> | null {
  // Try "Name <email>" format
  const angleMatch = line.match(/^(.+?)\s*<([^>]+)>$/);
  if (angleMatch) {
    const name = angleMatch[1].trim();
    const email = angleMatch[2].trim();
    if (EMAIL_REGEX.test(email)) {
      return { name: name || extractNameFromEmail(email), email, rawInput: line };
    }
  }

  // Try tab-separated format
  if (line.includes('\t')) {
    const parts = line.split('\t').map((p) => p.trim());
    return parsePartsForContact(parts, line);
  }

  // Try comma-separated format (but be careful - names can have commas)
  // Only split on comma if one part looks like an email
  if (line.includes(',')) {
    const parts = line.split(',').map((p) => p.trim());
    // Check if any part is an email
    const emailPartIndex = parts.findIndex((p) => EMAIL_REGEX.test(p));
    if (emailPartIndex !== -1) {
      const email = parts[emailPartIndex];
      const nameParts = parts.filter((_, i) => i !== emailPartIndex);
      const name = nameParts.join(' ').trim();
      return { name: name || extractNameFromEmail(email), email, rawInput: line };
    }
    // No email found - treat as a name with comma
    return { name: line, rawInput: line };
  }

  // Try space-separated (last token might be email)
  const spaceParts = line.split(/\s+/);
  const lastPart = spaceParts[spaceParts.length - 1];
  if (spaceParts.length > 1 && EMAIL_REGEX.test(lastPart)) {
    const email = lastPart;
    const name = spaceParts.slice(0, -1).join(' ');
    return { name, email, rawInput: line };
  }

  // Check if entire line is just an email
  if (EMAIL_REGEX.test(line)) {
    return { name: extractNameFromEmail(line), email: line, rawInput: line };
  }

  // Treat as name only
  if (line.length > 0) {
    return { name: line, rawInput: line };
  }

  return null;
}

function parsePartsForContact(parts: string[], rawInput: string): Omit<LookupContact, 'id'> | null {
  // Find which part is the email (if any)
  const emailIndex = parts.findIndex((p) => EMAIL_REGEX.test(p));

  if (emailIndex !== -1) {
    const email = parts[emailIndex];
    const nameParts = parts.filter((_, i) => i !== emailIndex && parts[i].length > 0);
    const name = nameParts.join(' ').trim();
    return { name: name || extractNameFromEmail(email), email, rawInput };
  }

  // No email found - combine all parts as name
  const name = parts.join(' ').trim();
  if (name.length > 0) {
    return { name, rawInput };
  }

  return null;
}

/**
 * Extract a display name from an email address.
 * "john.smith@company.com" -> "John Smith"
 */
function extractNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  // Split on dots, underscores, hyphens
  const parts = localPart.split(/[._-]+/);
  // Capitalize each part
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

/**
 * Normalize a name for comparison (lowercase, remove extra spaces)
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Normalize an email for comparison (lowercase)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Check if two names are similar enough to be a possible match.
 * Uses simple substring matching for now.
 */
export function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  // Exact match
  if (n1 === n2) return true;

  // One contains the other (helps with "John Smith" vs "John")
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Check if first/last names match
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');

  // If either has multiple parts, check if any significant parts match
  if (parts1.length > 1 || parts2.length > 1) {
    // Check first and last name matches
    const first1 = parts1[0];
    const last1 = parts1[parts1.length - 1];
    const first2 = parts2[0];
    const last2 = parts2[parts2.length - 1];

    // First and last name both match (order might be different)
    if ((first1 === first2 && last1 === last2) || (first1 === last2 && last1 === first2)) {
      return true;
    }
  }

  return false;
}
