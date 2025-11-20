import { render, screen, fireEvent } from '@testing-library/react';
import { RightPanel } from '../RightPanel';
import { describe, it, expect } from 'vitest';

describe('RightPanel', () => {
  it('renders guide tab when guideView is provided', () => {
    render(<RightPanel demoView={<div>Demo</div>} guideView={<div>Guide Content</div>} />);
    expect(screen.getByText('GUIDE')).toBeInTheDocument();
  });

  it('shows guide content when guide tab is clicked', () => {
    render(<RightPanel demoView={<div>Demo</div>} guideView={<div>Guide Content</div>} />);

    fireEvent.click(screen.getByText('GUIDE'));
    expect(screen.getByText('Guide Content')).toBeInTheDocument();
  });

  it('does not render guide tab when guideView is not provided', () => {
    render(<RightPanel demoView={<div>Demo</div>} />);
    expect(screen.queryByText('GUIDE')).not.toBeInTheDocument();
  });
});
