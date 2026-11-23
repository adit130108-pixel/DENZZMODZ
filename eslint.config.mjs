import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'src/**/*', 'node_modules/**/*', 'server.ts', '*.config.*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
