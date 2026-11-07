/* eslint-env jest */

// Safe Area Context
jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Expo Secure Store
const mockStore = new Map();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key) => mockStore.get(key) || null),
  setItemAsync: jest.fn(async (key, value) => {
    mockStore.set(key, String(value));
  }),
  deleteItemAsync: jest.fn(async (key) => {
    mockStore.delete(key);
  }),
  isAvailableAsync: jest.fn(async () => true),
}));

// Expo Router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};
let mockParams = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Redirect: () => null,
  Stack: () => null,
}));

// Expo Notifications
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getExpoPushTokenAsync: jest.fn(async () => ({
    data: "ExponentPushToken[unit-test-token]",
  })),
}));

// Expo Vector Icons
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const MockIcon = (props) =>
    React.createElement(
      Text,
      { testID: props.testID || `icon-${props.name}`, ...props },
      props.name
    );
  return {
    FontAwesome5: MockIcon,
  };
});

// Expo SQLite (in-memory simulator for unit tests)
const mockDbRows = new Map();
const mockCreateDatabase = () => ({
  execAsync: jest.fn(async (_sql) => {
    return;
  }),
  runAsync: jest.fn(async (sql, ...params) => {
    const flatParams = params.flat();
    const upper = sql.trim().toUpperCase();
    if (upper.startsWith("INSERT")) {
      const id = flatParams[0];
      mockDbRows.set(id, flatParams);
      return { lastInsertRowId: 1, changes: 1 };
    }
    if (upper.startsWith("DELETE")) {
      if (flatParams.length > 0) {
        flatParams.forEach((id) => mockDbRows.delete(id));
      } else {
        mockDbRows.clear();
      }
      return { changes: flatParams.length || 1 };
    }
    return { changes: 0 };
  }),
  getAllAsync: jest.fn(async (_sql, ..._params) => {
    const rows = [];
    for (const [id, cols] of mockDbRows.entries()) {
      rows.push({
        id,
        person_id: cols[1] || "",
        person_name: cols[2] || "Amina",
        item_type: cols[3] || "product",
        item_id: cols[4] || "prod-1",
        product_name: cols[5] || "Plumpy'Nut",
        quantity: cols[6] || "1",
        unit: cols[7] || "sachet",
        taken_at: cols[8] || new Date().toISOString(),
        consumption: cols[9] || "all",
        origin: cols[10] || "app",
        schedule_time_id: cols[11] || null,
        notes: cols[12] || null,
        created_at: cols[13] || new Date().toISOString(),
        status: cols[14] || "pending",
      });
    }
    return rows;
  }),
  getFirstAsync: jest.fn(async (_sql, ..._params) => {
    return { count: mockDbRows.size };
  }),
  closeAsync: jest.fn(async () => {}),
});

const mockDefaultDb = mockCreateDatabase();
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(async () => mockDefaultDb),
  openDatabaseSync: jest.fn(() => mockDefaultDb),
  __resetMockDb: () => mockDbRows.clear(),
  __getMockRows: () => mockDbRows,
}));


