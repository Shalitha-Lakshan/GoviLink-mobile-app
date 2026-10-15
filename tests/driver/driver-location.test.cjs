const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers.cjs');
const { driverLocationLabel } = loadSource('components/DriverDesign.js');

test('driver district labels support English, Sinhala and Tamil records', () => {
  const district = { nameEn: 'Kandy', nameSi: 'මහනුවර', nameTa: 'கண்டி' };
  assert.equal(driverLocationLabel(district, 'en'), district.nameEn);
  assert.equal(driverLocationLabel(district, 'si'), district.nameSi);
  assert.equal(driverLocationLabel(district, 'ta'), district.nameTa);
});
test('legacy district strings remain usable', () => {
  assert.equal(driverLocationLabel('Galle', 'si'), 'Galle');
});
test('missing translations use a supported fallback without rendering an object', () => {
  assert.equal(driverLocationLabel({ nameEn: 'Kandy' }, 'ta'), 'Kandy');
  for (const invalid of [null, undefined, {}, { nameEn: {} }, { nameEn: ' ' }]) {
    assert.equal(driverLocationLabel(invalid, 'en', 'Sri Lanka'), 'Sri Lanka');
  }
});
