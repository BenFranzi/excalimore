import { act, render, screen } from '@testing-library/react';
import Title from '.';

describe('Title', () => {
  test('Renders heading',  () => {
    render(<Title value={ 'Hello, world!' } />);
    expect(screen.getByRole('heading', { name: 'Hello, world!' })).toBeInTheDocument();
  });

  test('Button count updates',  async () => {
    render(<Title value={ 'Hello, world!' } />);
    const element = screen.getByTestId('counter');
    expect(element.textContent = 'I have been clicked 0 times!');
    await act(() => element.click());
    expect(element.textContent = 'I have been clicked 1 times!');
    await act(() => element.click());
    expect(element.textContent = 'I have been clicked 2 times!');
  });
});