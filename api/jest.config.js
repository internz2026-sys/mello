/** Minimal jest for the safety test suite. 4B.7's leakage tests are a
 *  release gate (safety-boundary.md §12), so the runner must be reliable. */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
};
