import getDouble from './getDouble.ts';

describe('getDouble', () => {
  test('Renders heading', () => {
    expect(getDouble(10)).toEqual(20);
  });
});