module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
    },
    extends: [
        "@typescript-eslint/recommended",
        "prettier",
        "plugin:prettier/recommended",
    ],
    settings: {
        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
                project: "./tsconfig.json",
            },
        },
    },
    rules: {
        // Custom rules
        "@typescript-eslint/explicit-function-return-type": [
            "error",
            { allowExpressions: true },
        ],
        "@typescript-eslint/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_" },
        ],
        "no-console": ["warn", { allow: ["warn", "error"] }],
        "prettier/prettier": "error",
    },
    env: {
        node: true,
    },
};
