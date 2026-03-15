import { describe, it, expect } from 'vitest';
import {
  normalizeCompanyName,
  stripCommonSuffixes,
  stripDisplaySuffixes,
  doCompanyNamesFuzzyMatch,
} from './nameMatching';

describe('normalizeCompanyName', () => {
  it('converts to lowercase', () => {
    expect(normalizeCompanyName('ACME Corp')).toBe('acme-corp');
  });

  it('removes apostrophes', () => {
    expect(normalizeCompanyName("O'Reilly Media")).toBe('oreilly-media');
    expect(normalizeCompanyName("McDonald's")).toBe('mcdonalds');
  });

  it('removes dots and special characters', () => {
    expect(normalizeCompanyName('Marquee.ai')).toBe('marquee-ai');
    expect(normalizeCompanyName('A.B.C. Inc.')).toBe('a-b-c-inc');
  });

  it('replaces spaces and non-alphanumeric with dashes', () => {
    expect(normalizeCompanyName('Acme   Technologies')).toBe('acme-technologies');
    expect(normalizeCompanyName('Tech@Work!')).toBe('tech-work');
  });

  it('trims leading and trailing dashes', () => {
    expect(normalizeCompanyName('-Leading Dash')).toBe('leading-dash');
    expect(normalizeCompanyName('Trailing Dash-')).toBe('trailing-dash');
    expect(normalizeCompanyName('---Multiple--- Dashes---')).toBe('multiple-dashes');
  });

  it('handles empty strings', () => {
    expect(normalizeCompanyName('')).toBe('');
  });

  it('handles special characters', () => {
    // Special characters are replaced with dashes for ASCII normalization
    expect(normalizeCompanyName('Société Générale')).toBe('soci-t-g-n-rale');
  });
});

describe('stripCommonSuffixes', () => {
  it('strips common business suffixes at the end', () => {
    expect(stripCommonSuffixes('marquee-ai-ltd')).toBe('marquee-ai');
    expect(stripCommonSuffixes('acme-inc')).toBe('acme');
    expect(stripCommonSuffixes('techcorp-llc')).toBe('techcorp');
    expect(stripCommonSuffixes('medical-devices-corp')).toBe('medical-devices');
  });

  it('strips multiple suffix variants', () => {
    expect(stripCommonSuffixes('acme-technologies')).toBe('acme');
    expect(stripCommonSuffixes('acme-tech')).toBe('acme');
    expect(stripCommonSuffixes('healthtech-medical')).toBe('healthtech');
  });

  it('does NOT strip suffixes in the middle of names', () => {
    expect(stripCommonSuffixes('technology-corp')).toBe('technology');
    expect(stripCommonSuffixes('inc-technologies')).toBe('inc');
  });

  it('does not modify names without suffixes', () => {
    expect(stripCommonSuffixes('marquee-ai')).toBe('marquee-ai');
    expect(stripCommonSuffixes('acme')).toBe('acme');
  });

  it('handles empty strings', () => {
    expect(stripCommonSuffixes('')).toBe('');
  });

  it('handles names that are only a suffix', () => {
    // Does NOT strip standalone suffixes (no dash prefix)
    expect(stripCommonSuffixes('ltd')).toBe('ltd');
    expect(stripCommonSuffixes('inc')).toBe('inc');
    // But DOES strip when there's a dash (e.g., from normalization)
    expect(stripCommonSuffixes('company-ltd')).toBe('company');
  });
});

describe('stripDisplaySuffixes', () => {
  it('strips Ltd. suffix preserving original casing', () => {
    expect(stripDisplaySuffixes('Ionix.IO Ltd.')).toBe('Ionix.IO');
    expect(stripDisplaySuffixes('NovaLink Space Ltd.')).toBe('NovaLink Space');
  });

  it('strips Inc suffix', () => {
    expect(stripDisplaySuffixes('Acme Inc')).toBe('Acme');
    expect(stripDisplaySuffixes('Acme Inc.')).toBe('Acme');
  });

  it('strips LLC, Corp, Limited, etc.', () => {
    expect(stripDisplaySuffixes('TechCo LLC')).toBe('TechCo');
    expect(stripDisplaySuffixes('TechCo Corp')).toBe('TechCo');
    expect(stripDisplaySuffixes('TechCo Corp.')).toBe('TechCo');
    expect(stripDisplaySuffixes('TechCo Limited')).toBe('TechCo');
    expect(stripDisplaySuffixes('TechCo Incorporated')).toBe('TechCo');
    expect(stripDisplaySuffixes('TechCo Corporation')).toBe('TechCo');
    expect(stripDisplaySuffixes('TechCo Co.')).toBe('TechCo');
  });

  it('preserves names without suffixes', () => {
    expect(stripDisplaySuffixes('Ionix.IO')).toBe('Ionix.IO');
    expect(stripDisplaySuffixes('Acme')).toBe('Acme');
  });

  it('handles empty strings', () => {
    expect(stripDisplaySuffixes('')).toBe('');
  });

  it('is case-insensitive for suffix matching', () => {
    expect(stripDisplaySuffixes('Acme LTD')).toBe('Acme');
    expect(stripDisplaySuffixes('Acme ltd')).toBe('Acme');
  });
});

describe('doCompanyNamesFuzzyMatch', () => {
  describe('Level 1: Exact match', () => {
    it('matches identical normalized names', () => {
      expect(doCompanyNamesFuzzyMatch('Acme Corp', 'ACME CORP')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('Marquee.ai', 'marquee-ai')).toBe(true);
    });

    it('matches despite different formatting', () => {
      expect(doCompanyNamesFuzzyMatch('A.B.C.', 'A B C')).toBe(true);
      expect(doCompanyNamesFuzzyMatch("O'Reilly", 'OReilly')).toBe(true);
    });
  });

  describe('Level 2: Partial match', () => {
    it('matches when one name contains the other', () => {
      expect(doCompanyNamesFuzzyMatch('Acme', 'Acme Technologies')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('Acme Technologies', 'Acme')).toBe(true);
    });

    it('matches with partial overlaps', () => {
      expect(doCompanyNamesFuzzyMatch('Google', 'Google LLC')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('Meta', 'Meta Platforms')).toBe(true);
    });
  });

  describe('Level 3: Suffix-stripped match', () => {
    it('matches when suffixes differ', () => {
      expect(doCompanyNamesFuzzyMatch('Marquee AI Ltd.', 'Marquee.ai')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('Acme Technologies', 'Acme Tech')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('HealthCo Medical', 'HealthCo')).toBe(true);
    });

    it('matches common suffix variations', () => {
      expect(doCompanyNamesFuzzyMatch('Acme Inc', 'Acme LLC')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('TechCorp Ltd', 'TechCorp Corporation')).toBe(true);
    });
  });

  describe('False positive prevention', () => {
    it('does NOT match different companies with same suffix', () => {
      expect(doCompanyNamesFuzzyMatch('ABC Inc', 'ABC International')).toBe(false);
      expect(doCompanyNamesFuzzyMatch('Tech Corp', 'TechData Corp')).toBe(false);
    });

    it('does NOT match completely different companies', () => {
      expect(doCompanyNamesFuzzyMatch('Acme', 'Widget Co')).toBe(false);
      expect(doCompanyNamesFuzzyMatch('Google', 'Apple')).toBe(false);
    });

    it('does NOT match when only a small part overlaps', () => {
      expect(doCompanyNamesFuzzyMatch('The Tech Company', 'Tech Innovations')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('handles empty strings', () => {
      expect(doCompanyNamesFuzzyMatch('', '')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('Acme', '')).toBe(false);
      expect(doCompanyNamesFuzzyMatch('', 'Acme')).toBe(false);
    });

    it('handles very short names', () => {
      expect(doCompanyNamesFuzzyMatch('AB Ltd', 'AB Inc')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('X Corp', 'X')).toBe(true);
    });

    it('handles names with only suffixes after stripping', () => {
      expect(doCompanyNamesFuzzyMatch('Ltd', 'Inc')).toBe(false);
    });

    it('handles special characters consistently', () => {
      expect(doCompanyNamesFuzzyMatch('café tech', 'Café Tech')).toBe(true);
    });
  });

  describe('Real-world cases', () => {
    it('matches the reported bug case', () => {
      expect(doCompanyNamesFuzzyMatch('Marquee AI Ltd.', 'Marquee.ai')).toBe(true);
    });

    it('matches common company name variations', () => {
      expect(doCompanyNamesFuzzyMatch('Microsoft Corporation', 'Microsoft Corp')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('Apple Inc.', 'Apple')).toBe(true);
      expect(doCompanyNamesFuzzyMatch('Alphabet Inc', 'Alphabet')).toBe(true);
    });

    it('does NOT match similar but different companies', () => {
      expect(doCompanyNamesFuzzyMatch('Acme Corp', 'Acme Industries')).toBe(false);
      expect(doCompanyNamesFuzzyMatch('Tech Solutions', 'Tech Services')).toBe(false);
    });

    it('matches IVC names with display suffixes against CRM names', () => {
      expect(doCompanyNamesFuzzyMatch('Ionix.IO Ltd.', 'Ionix.IO')).toBe(true);
    });
  });
});
