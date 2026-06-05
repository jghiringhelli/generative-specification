/**
 * Conventional Commits configuration.
 *
 * Enforces `type(scope): subject` where type is one of the allowed set.
 * The `subject-case` rule is relaxed to permit the TDD phase markers used by
 * this project's commit protocol, e.g. `test(auth): [RED] reject expired token`.
 *
 * @see .claude/constitution.md § Commit Protocol
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'build', 'ci'],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 120],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [1, 'always'],
  },
};
