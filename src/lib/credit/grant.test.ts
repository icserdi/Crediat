import { describe, it, expect } from 'vitest';
import { requiredApprovalLevels, DEFAULT_APPROVAL_RULES } from './grant';

describe('requiredApprovalLevels', () => {
  it('requiere 1 nivel para montos dentro del límite del cobrador', () => {
    expect(requiredApprovalLevels(50000, DEFAULT_APPROVAL_RULES)).toBe(1);
  });

  it('requiere 2 niveles para montos que superan al cobrador', () => {
    expect(requiredApprovalLevels(150000, DEFAULT_APPROVAL_RULES)).toBe(2);
  });

  it('requiere 3 niveles para montos que superan al supervisor', () => {
    expect(requiredApprovalLevels(600000, DEFAULT_APPROVAL_RULES)).toBe(3);
  });

  it('requiere 3 niveles para montos muy grandes', () => {
    expect(requiredApprovalLevels(5000000, DEFAULT_APPROVAL_RULES)).toBe(3);
  });

  it('requiere 1 nivel para el monto exacto del límite del cobrador', () => {
    expect(requiredApprovalLevels(100000, DEFAULT_APPROVAL_RULES)).toBe(1);
  });
});

describe('DEFAULT_APPROVAL_RULES', () => {
  it('define 3 niveles con roles y límites', () => {
    expect(DEFAULT_APPROVAL_RULES.levels).toHaveLength(3);
    expect(DEFAULT_APPROVAL_RULES.levels[0].role).toBe('cobrador');
    expect(DEFAULT_APPROVAL_RULES.levels[1].role).toBe('supervisor');
    expect(DEFAULT_APPROVAL_RULES.levels[2].role).toBe('admin');
  });
});
