export default {
  clearMocks: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ["server/**/*.js"],

  // An array of file extensions your modules use
  moduleFileExtensions: ["js"],

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: ["**/tests/**/*.test.js"],

  roots: ["<rootDir>/tests"],

  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
};
