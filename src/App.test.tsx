import { fireEvent, render, screen } from '@testing-library/react';

import { App } from './App';

describe('Milestone 1 shell', () => {
  it('renders the mobile shell with primary navigation', () => {
    render(<App />);

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Things')).toBeTruthy();
    expect(screen.getByText('People')).toBeTruthy();
    expect(screen.getByText('Memories')).toBeTruthy();
  });

  it('navigates to Things from the bottom navigation', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /things/i }));

    expect(screen.getAllByText('Things').length).toBeGreaterThan(0);
    expect(screen.getByText('Consumer-friendly ownership')).toBeTruthy();
  });

  it('opens the FAB menu and exposes the agent entries', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open add or ask menu/i }));

    expect(screen.getByText('Ask Agent — Chat')).toBeTruthy();
    expect(screen.getByText('Ask Agent — Voice')).toBeTruthy();
  });
});
