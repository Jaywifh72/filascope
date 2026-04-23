/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.app.json',
      diagnostics: { ignoreDiagnostics: [151001] },
    }],
  },
  moduleNameMapper: {
    '^@/integrations/supabase/client$': '<rootDir>/src/components/__tests__/__mocks__/supabaseClient.ts',
    '^@/lib/brandLogos$': '<rootDir>/src/components/__tests__/__mocks__/brandLogos.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['./jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/*.test.ts?(x)'],
};
