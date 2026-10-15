const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const React = require('react');

const root = path.resolve(__dirname, '../..');
const compiled = new Map();

// Load the actual source, replacing imports at its module boundary. Never fall
// through to real Firebase, Expo modules, network access, or device features.
function loadSource(relativePath, imports = {}) {
  if (!compiled.has(relativePath)) {
    compiled.set(relativePath, babel.transformSync(fs.readFileSync(path.join(root, relativePath), 'utf8'), {
      filename: relativePath, babelrc: false, configFile: false,
      plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
    }).code);
  }
  const module = { exports: {} };
  vm.runInNewContext(compiled.get(relativePath), {
    module, exports: module.exports,
    require(id) {
      if (Object.hasOwn(imports, id)) return imports[id];
      if (/\.(png|jpe?g)$/.test(id)) return id;
      throw new Error(`Unmocked import in ${relativePath}: ${id}`);
    },
    console: { log() {}, warn() {}, error() {} },
  }, { filename: relativePath });
  return module.exports;
}

function serviceHarness(seed = {}, options = {}) {
  const records = new Map(Object.entries(seed).map(([key, value]) => [key, structuredClone(value)]));
  const writes = [];
  const uploads = [];
  const auth = { currentUser: { uid: 'driver-1' } };
  const snapshot = (id) => ({ id: id.split('/').at(-1), exists: () => records.has(id), data: () => structuredClone(records.get(id)) });
  const commit = async (pending) => {
    if (options.writeError) throw new Error(options.writeError);
    for (const item of pending) {
      if (item.kind === 'delete') records.delete(item.ref);
      else records.set(item.ref, { ...records.get(item.ref), ...structuredClone(item.data) });
      writes.push(item);
    }
  };
  const firestore = {
    doc: (_db, collection, id) => `${collection}/${id}`,
    collection: (_db, name) => name,
    where: (field, operator, value) => ({ field, value }),
    query: (collection, condition) => ({ collection, condition }),
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    getDoc: async (ref) => snapshot(ref),
    getDocs: async ({ collection, condition }) => ({ docs: [...records.keys()]
      .filter((key) => key.startsWith(`${collection}/`) && records.get(key)[condition.field] === condition.value)
      .map(snapshot) }),
    addDoc: async (collection, data) => {
      const id = 'new-vehicle';
      await commit([{ kind: 'update', ref: `${collection}/${id}`, data }]);
      return { id };
    },
    updateDoc: async (ref, data) => commit([{ kind: 'update', ref, data }]),
    writeBatch: () => {
      const pending = [];
      return {
        update: (ref, data) => pending.push({ kind: 'update', ref, data }),
        delete: (ref) => pending.push({ kind: 'delete', ref }),
        commit: () => commit(pending),
      };
    },
    runTransaction: async (_db, callback) => {
      const pending = [];
      await callback({ get: async (ref) => snapshot(ref), update: (ref, data) => pending.push({ kind: 'update', ref, data }) });
      await commit(pending);
    },
  };
  const api = loadSource('services/firebaseDatabase.js', {
    'firebase/firestore': firestore, 'firebase/auth': {}, 'react-native': { Platform: { OS: 'ios' } },
    '../firebaseConfig': { db: {}, auth, storage: {} },
    './nativeImageUpload': { uploadNativeImage: async (...args) => {
      uploads.push(args);
      if (options.uploadError) throw new Error(options.uploadError);
      return 'https://example.test/vehicle.jpg';
    } },
  });
  return { api, auth, records, writes, uploads };
}

const colors = { ink: '#16352D', green: '#167458', greenDark: '#0D503D', mint: '#E8F3EC', canvas: '#F5F7F2', white: '#FFFFFF', muted: '#718078', border: '#E0E7DF', red: '#B44343', redBg: '#FCEEEE', amber: '#956016', amberBg: '#FFF4DC' };
function screenHarness(file, props = {}, overrides = {}) {
  const state = [];
  let cursor = 0;
  const alerts = [];
  const effects = [];
  const pendingEffects = [];
  const react = { ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      const previous = effects[index];
      if (!previous || dependencies?.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        pendingEffects.push(() => {
          previous?.cleanup?.();
          effects[index] = { dependencies, cleanup: callback() };
        });
      }
    },
  };
  const component = (name) => ({ __esModule: true, default: name });
  const api = {
    subscribeToDriverVehicles: () => () => {}, subscribeToOrderById: () => () => {},
    DEFAULT_COOP_DRIVERS: [], DELIVERY_STATUSES: {}, VALID_DELIVERY_TRANSITIONS: {},
  };
  const native = {
    ...Object.fromEntries(['View', 'Text', 'TouchableOpacity', 'TextInput', 'ScrollView', 'Image', 'StatusBar', 'ActivityIndicator', 'Modal', 'KeyboardAvoidingView', 'Switch'].map((key) => [key, key])),
    StyleSheet: { create: (styles) => styles }, Platform: { OS: 'ios' },
    Alert: { alert: (...args) => alerts.push(args) }, Linking: { openURL() {} },
  };
  const imports = {
    react, 'react-native': native, 'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@expo/vector-icons': { Ionicons: 'Ionicons', MaterialCommunityIcons: 'MaterialCommunityIcons' },
    '../services/firebaseDatabase': { ...api, ...overrides.services },
    './FarmerDesign': { FARMER_COLORS: colors, FarmerHeading: 'Heading', FarmerButton: 'Button', IconTile: 'IconTile', cleanLabel: (value) => value.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/^\+\s*/, '').trim() },
    './DriverDesign': loadSource('components/DriverDesign.js'),
    './AddVehicleScreen': component('AddVehicle'), './DriverVehiclesListScreen': component('Fleet'),
    './UserProfileScreen': component('Profile'), './DeliveryTrackingScreen': component('Tracking'),
    'expo-image-picker': overrides.imagePicker || {},
  };
  const Screen = loadSource(`components/${file}`, imports).default;
  return {
    alerts,
    render() { cursor = 0; const tree = Screen(props); while (pendingEffects.length) pendingEffects.shift()(); return tree; },
    cleanup() { effects.forEach((effect) => effect?.cleanup?.()); },
  };
}

// Only inspect visible branches; React Native Modal leaves its children in the
// element tree even when the native modal is not displayed.
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  if (node.type === 'Modal' && !node.props.visible) return [];
  return [node, ...elements(node.props?.children)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (node == null || typeof node === 'boolean') return '';
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function find(tree, predicate) {
  const found = elements(tree).find(predicate);
  if (!found) throw new Error('Expected element was not rendered');
  return found;
}
function button(tree, label) {
  return find(tree, (node) => ['TouchableOpacity', 'Button'].includes(node.type) &&
    (node.props.accessibilityLabel === label || node.props.label === label || text(node) === label));
}
module.exports = { loadSource, serviceHarness, screenHarness, elements, text, find, button };
