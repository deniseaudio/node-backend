module.exports = {
  root: true,

  parser: "@typescript-eslint/parser",

  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.eslint.json"],
  },

  plugins: ["@typescript-eslint", "prettier"],

  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended",
  ],

  rules: {
    "import/prefer-default-export": "off",
    "prettier/prettier": "warn",
    "no-await-in-loop": "off",
    "no-console": "off",
    "no-restricted-syntax": "off",
  },
};
