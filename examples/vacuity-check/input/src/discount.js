// Order pricing: applies a promo code, then a volume discount.

const CODES = {
  SAVE10: 0.10,
  SAVE25: 0.25,
  HALF: 0.50,
};

const FREE_SHIPPING_THRESHOLD = 100;

export function applyPromo(subtotal, code) {
  if (subtotal <= 0) return 0;
  const rate = CODES[code];
  if (rate === undefined) return subtotal;
  return round2(subtotal * (1 - rate));
}

export function volumeDiscount(quantity, unitPrice) {
  if (quantity <= 0) return 0;
  let rate = 0;
  if (quantity >= 50) rate = 0.15;
  else if (quantity >= 20) rate = 0.10;
  else if (quantity >= 10) rate = 0.05;
  return round2(quantity * unitPrice * (1 - rate));
}

export function shippingCost(subtotal, expedited) {
  if (subtotal > FREE_SHIPPING_THRESHOLD && !expedited) return 0;
  return expedited ? 14.99 : 5.99;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
