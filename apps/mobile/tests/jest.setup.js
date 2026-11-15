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

// Google Sign-In
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-client-id";
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({ data: { idToken: "test-google-id-token" }, idToken: "test-google-id-token" })),
  },
}));

// Expo Localization
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "fr", languageTag: "fr-FR" }],
  locale: "fr-FR",
}));

// i18n setup for unit tests
const i18n = require("i18next");
const { initReactI18next } = require("react-i18next");
const { I18N_RESOURCES } = require("@tsotsa/i18n");

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "fr",
    fallbackLng: "fr",
    resources: I18N_RESOURCES,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

