import { describe, it, expect } from 'vitest';
import { validateRfcFormat } from './rfc';

describe('validateRfcFormat', () => {
  it('acepta un RFC de persona física válido', () => {
    // GARC840101HDFRRN01: 4 letras + 6 dígitos + 3 homoclave
    expect(validateRfcFormat('GARC840101HDF', 'fisica')).toBe(true);
    expect(validateRfcFormat('GARC840101HDFRRN01'.slice(0, 13), 'fisica')).toBe(true);
  });

  it('acepta un RFC de persona moral válido', () => {
    // 3 letras + 6 dígitos + 3 homoclave
    expect(validateRfcFormat('SER930101XXX', 'moral')).toBe(true);
  });

  it('crítico: NO acepta un RFC de física de 12 caracteres', () => {
    // El RFC de física tiene 13 caracteres
    expect(validateRfcFormat('GARC840101HD', 'fisica')).toBe(false);
  });

  it('crítico: NO acepta un RFC de moral de 13 caracteres', () => {
    expect(validateRfcFormat('SER930101XXXX', 'moral')).toBe(false);
  });

  it('rechaza RFC con caracteres inválidos', () => {
    expect(validateRfcFormat('ABC123', 'fisica')).toBe(false);
    expect(validateRfcFormat('1234567890123', 'fisica')).toBe(false);
    expect(validateRfcFormat('!!!!840101HDF', 'fisica')).toBe(false);
  });

  it('normaliza a mayúsculas y recorta espacios', () => {
    expect(validateRfcFormat('  garc840101hdf  ', 'fisica')).toBe(true);
  });
});
