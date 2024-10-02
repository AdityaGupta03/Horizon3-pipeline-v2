export default {
  clearMocks: true,
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/jest.config.js",
    "!**/coverage/**",
    "!**/server.js",
    "!**/helpers/**",
  ],
  moduleFileExtensions: ["js"],
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  roots: ["<rootDir>"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
};
