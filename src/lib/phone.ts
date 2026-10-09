// Shows only the first two and last two digits of a 10-digit number: 98••••••10.
// For pages anyone holding a booking link can open; staff and the account owner still see full numbers elsewhere.
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return '••••••••••';
  return `${digits.slice(0, 2)}••••••${digits.slice(-2)}`;
}
