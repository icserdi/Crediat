import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      'out/**',
      'build/**',
      'dist/**',
      '.git/**',
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default config;