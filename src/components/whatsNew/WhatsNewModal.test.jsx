import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WhatsNewModal from './WhatsNewModal';
import { CURRENT_RELEASE, APP_VERSION } from '../../config/version';

describe('WhatsNewModal', () => {
  it('does not render when isOpen is false', () => {
    render(<WhatsNewModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/What's New in FolioX/i)).not.toBeInTheDocument();
  });

  it('renders release version, codename, and all feature cards when open', () => {
    render(<WhatsNewModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/What's New in FolioX/i)).toBeInTheDocument();
    expect(screen.getByText(`v${APP_VERSION}`)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(CURRENT_RELEASE.codename, 'i'))).toBeInTheDocument();

    // Verify all 5 features from CURRENT_RELEASE are displayed
    CURRENT_RELEASE.features.forEach((feature) => {
      expect(screen.getByText(feature.title)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button or explore button is clicked', () => {
    const handleClose = vi.fn();
    render(<WhatsNewModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const exploreBtn = screen.getByRole('button', { name: /Explore FolioX/i });
    fireEvent.click(exploreBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
