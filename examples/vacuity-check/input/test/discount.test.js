import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPromo, volumeDiscount, shippingCost } from '../src/discount.js';

test('applyPromo applies a known promo code', () => {
  assert.equal(applyPromo(200, 'SAVE10'), 180);
});

test('applyPromo applies a larger discount', () => {
  assert.equal(applyPromo(200, 'SAVE25'), 150);
});

test('applyPromo ignores an unknown code', () => {
  assert.equal(applyPromo(200, 'NOPE'), 200);
});

test('volumeDiscount gives 5% at 10 units', () => {
  assert.equal(volumeDiscount(10, 10), 95);
});

test('volumeDiscount gives 10% at 25 units', () => {
  assert.equal(volumeDiscount(25, 10), 225);
});

test('volumeDiscount gives 15% at 60 units', () => {
  assert.equal(volumeDiscount(60, 10), 510);
});

test('shippingCost is free for large orders', () => {
  assert.equal(shippingCost(150, false), 0);
});

test('shippingCost charges standard rate for small orders', () => {
  assert.equal(shippingCost(50, false), 5.99);
});

test('shippingCost charges more for expedited', () => {
  assert.equal(shippingCost(50, true), 14.99);
});
