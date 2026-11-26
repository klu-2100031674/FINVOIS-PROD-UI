import { passwordProblem } from '../profile';

jest.mock('../client', () => ({ api: {} }));

describe('passwordProblem matches the rules of POST /users/change-password', () => {
  it.each([
    ['Short1A', 'Use at least 8 characters.'],
    ['alllower1', 'Add at least one uppercase letter.'],
    ['ALLUPPER1', 'Add at least one lowercase letter.'],
    ['NoNumbersHere', 'Add at least one number.'],
    ['Good1Password', null],
  ])('%s', (password, expected) => {
    expect(passwordProblem(password)).toBe(expected);
  });
});
