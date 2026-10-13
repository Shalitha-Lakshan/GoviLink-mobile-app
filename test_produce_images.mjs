import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual service functions with Firebase and device I/O isolated.
const source = fs.readFileSync(new URL('./services/firebaseDatabase.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('const compressWebDataUrl'), source.indexOf('export const deleteProduceListing'))
  .replaceAll('export const ', 'const ');
const image = 'data:image/jpeg;base64,aGVsbG8=';
function setup(os, overrides = {}) {
  const writes = [];
  const uploads = [];
  const context = vm.createContext({
    Platform: { OS: os }, db: {}, storage: {},
    console: { warn() {}, error() {} },
    ref: (_, path) => path,
    uploadString: async (...args) => { uploads.push(args); },
    uploadBytes: async (...args) => { uploads.push(args); },
    getDownloadURL: async () => 'https://firebasestorage.googleapis.com/shared-photo',
    collection: (_, name) => name,
    doc: (_, name, id) => `${name}/${id}`,
    serverTimestamp: () => 'timestamp',
    addDoc: async (_, data) => { writes.push(data); return { id: 'listing' }; },
    updateDoc: async (_, data) => { writes.push(data); },
    fetch: async () => ({ ok: true, blob: async () => ({ type: 'image/jpeg' }) }),
    FileReader: class {
      readAsDataURL() { this.result = image; this.onload(); }
    },
    ...overrides,
  });
  vm.runInContext(`${code}\nglobalThis.api = { uploadProduceImage, addProduceListing, updateProduceListing };`, context);
  return { ...context.api, writes, uploads };
}

let service = setup('android');
assert.equal(await service.uploadProduceImage(image), 'https://firebasestorage.googleapis.com/shared-photo');
assert.equal(service.uploads[0][2], 'data_url');
assert.equal((await service.addProduceListing({ image })).success, true);
assert.match(service.writes[0].image, /^https:/);

service = setup('android', { uploadString: async () => { throw Error('storage/unauthorized'); } });
assert.equal((await service.addProduceListing({ image })).success, true);
assert.equal(service.writes[0].image, image);
const oversized = `data:image/jpeg;base64,${'A'.repeat(700000)}`;
assert.equal((await service.addProduceListing({ image: oversized })).success, false);
assert.equal(service.writes.length, 1, 'Oversized fallback must not write a listing');

service = setup('android', { fetch: async () => { throw Error('Photo no longer exists. Please select it again.'); } });
assert.equal((await service.addProduceListing({ image: 'file:///device-only/photo.jpg' })).success, false);
assert.equal((await service.updateProduceListing('listing', { image: 'content://device-only/photo' })).success, false);
assert.equal(service.writes.length, 0, 'Failed upload must never persist a local address');

service = setup('web');
assert.equal((await service.addProduceListing({ image: 'blob:https://origin/temporary' })).success, true);
assert.equal(service.writes[0].image, image, 'Temporary browser URL must become shared image data');
assert.equal((await service.addProduceListing({ image: 'data:text/plain;base64,aGVsbG8=' })).success, false);
assert.equal((await service.addProduceListing({ image: oversized })).success, false);
assert.equal(service.writes.length, 1);

service = setup('web', { fetch: async () => { throw Error('Expired browser photo'); } });
assert.equal((await service.addProduceListing({ image: 'blob:https://origin/expired' })).success, false);
assert.equal(service.writes.length, 0);

service = setup('ios');
await service.updateProduceListing('listing', { image });
await service.updateProduceListing('listing', { image });
assert.notEqual(service.uploads[0][0], service.uploads[1][0], 'Replacements must use new paths to avoid stale caches');
assert.equal(await service.uploadProduceImage('https://example.com/photo.jpg'), 'https://example.com/photo.jpg');

console.log('Produce image checks passed: hosted uploads, shared fallback, blob conversion, failed reads, size limits, edits, and remote URLs.');
