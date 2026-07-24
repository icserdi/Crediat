const otpStore = new Map<string, { otp: string; expiresAt: number; email: string }>();

export function generateOtp(email: string): string {
  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
    email,
  });
  return otp;
}

export function verifyOtp(email: string, otp: string): boolean {
  const record = otpStore.get(email);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return false;
  }
  if (record.otp !== otp) return false;
  otpStore.delete(email);
  return true;
}