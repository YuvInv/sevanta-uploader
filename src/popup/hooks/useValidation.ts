import { useCallback } from 'react';
import { validateCompany } from '../../lib/validation';
import type { Schema, Company } from '../../lib/types';

export function useValidation(schema: Schema | null) {
  const validateCompanies = useCallback(
    (companies: Company[]): Company[] => {
      if (!schema) return companies;

      return companies.map((company) => ({
        ...company,
        validation: validateCompany(company.data, schema),
      }));
    },
    [schema]
  );

  return { validateCompanies };
}
