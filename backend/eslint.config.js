export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      semi: "error",
      "no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
];
