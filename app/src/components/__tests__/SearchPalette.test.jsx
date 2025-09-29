import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPalette from '../SearchPalette.jsx';

vi.mock('../../data.js', () => ({
  DOCS: [{ id: 'doc-test', title: 'Test Document Title', summary: 'Summary copy', body: 'Body content for testing.' }],
  FACTS: [],
  KEY_POINTS: [],
  TRAILHEADS: [],
}));

test('renders search palette with results when open', () => {
  render(
    <MemoryRouter>
      <SearchPalette open onClose={() => {}} />
    </MemoryRouter>
  );

  expect(screen.getByPlaceholderText(/search dryvest/i)).toBeInTheDocument();
  expect(screen.getByText(/Test Document Title/i)).toBeInTheDocument();
});
