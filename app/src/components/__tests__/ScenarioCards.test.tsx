import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ScenarioCards } from '../ScenarioCards';

describe('ScenarioCards', () => {
  it('renders all quick-brief scenarios with titles and descriptions', () => {
    render(<ScenarioCards onScenarioSelect={vi.fn()} />);

    expect(
      screen.getByRole('heading', { level: 4, name: 'Forge divestment guardrails' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Align trustees on when divestment triggers before you layer in conflict-specific data/i
      )
    ).toBeInTheDocument();

    const scenarioButtons = screen.getAllByTestId('scenario-card');
    expect(scenarioButtons).toHaveLength(5);
  });

  it('invokes onScenarioSelect with the chosen scenario', () => {
    const handleSelect = vi.fn();
    render(<ScenarioCards onScenarioSelect={handleSelect} />);

    const scenarioButtons = screen.getAllByTestId('scenario-card');

    fireEvent.click(scenarioButtons[0]);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const scenario = handleSelect.mock.calls[0][0];
    expect(scenario.id).toBe('policy_scaffold');
    expect(scenario.context.identity).toBe('public_pension');
  });
});
