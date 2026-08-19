import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      // Cobertura sobre la lógica pura de negocio (auth + capa SAP).
      // Los módulos de I/O (client, session-manager, db, email) se cubren
      // con pruebas de integración (ver backlog).
      include: [
        'src/lib/auth/domain.ts',
        'src/lib/auth/otp.ts',
        'src/lib/sap/errors.ts',
        'src/lib/sap/retry.ts',
        'src/lib/sap/config.ts',
        'src/lib/sap/companies-store.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});