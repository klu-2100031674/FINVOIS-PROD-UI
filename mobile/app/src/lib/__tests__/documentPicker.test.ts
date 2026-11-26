import { uploadProblem } from '../documentPicker';

jest.mock('expo-document-picker', () => ({}));
jest.mock('expo-file-system', () => ({}));

const MB = 1024 * 1024;

describe('uploadProblem', () => {
  it('allows files within both limits', () => {
    expect(uploadProblem([{ uri: 'a', name: 'a.pdf', size: MB }], 2, 10, 5 * MB)).toBeNull();
  });

  it('refuses more files than the request can hold', () => {
    expect(uploadProblem([{ uri: 'a', name: 'a.pdf' }, { uri: 'b', name: 'b.pdf' }], 9, 10, 5 * MB)).toBe(
      'A request can hold 10 files. 9 are already uploaded.'
    );
  });

  it('names the file that is too large', () => {
    expect(uploadProblem([{ uri: 'a', name: 'big.pdf', size: 6 * MB }], 0, 10, 5 * MB)).toBe(
      'big.pdf is too large. Each file must be 5 MB or smaller.'
    );
  });
});
