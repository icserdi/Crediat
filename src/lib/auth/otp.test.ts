import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { generateOtp, verifyOtp } from './otp';

describe('generateOtp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('genera un OTP de 6 dígitos', () => {
    const otp = generateOtp('user@serdi.com.mx');
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('genera OTPs distintos para llamadas consecutivas', () => {
    const a = generateOtp('a@serdi.com.mx');
    const b = generateOtp('b@serdi.com.mx');
    expect(a).not.toBe(b);
  });
});

describe('verifyOtp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('verifica un OTP correcto', () => {
    const email = 'user@serdi.com.mx';
    const otp = generateOtp(email);
    expect(verifyOtp(email, otp)).toBe(true);
  });

  it('rechaza un OTP incorrecto', () => {
    const email = 'user@serdi.com.mx';
    generateOtp(email);
    expect(verifyOtp(email, '000000')).toBe(false);
  });

  it('rechaza un OTP para un email sin registro', () => {
    expect(verifyOtp('nobody@serdi.com.mx', '123456')).toBe(false);
  });

  it('rechaza un OTP expirado', () => {
    const email = 'user@serdi.com.mx';
    const otp = generateOtp(email);
    // Avanzar más allá de los 10 minutos de expiración
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(verifyOtp(email, otp)).toBe(false);
  });

  it('un OTP solo puede usarse una vez', () => {
    const email = 'user@serdi.com.mx';
    const otp = generateOtp(email);
    expect(verifyOtp(email, otp)).toBe(true);
    expect(verifyOtp(email, otp)).toBe(false);
  });
});
