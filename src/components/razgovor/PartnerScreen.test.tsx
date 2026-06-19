import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PartnerScreen from './PartnerScreen';

describe('PartnerScreen', () => {
  beforeEach(() => localStorage.clear());

  it('renders back bar, greeting, and Ana modes', () => {
    render(<PartnerScreen partnerId="ana" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('← Razgovor')).toBeInTheDocument();
    expect(screen.getByText(/O čemu ćemo danas pričati/)).toBeInTheDocument();
    expect(screen.getByText('Počni razgovor')).toBeInTheDocument();
    expect(screen.getByText('Odigraj scenu')).toBeInTheDocument();
  });

  it('renders Kovač correction cluster', () => {
    render(<PartnerScreen partnerId="kovac" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Vođeni sat')).toBeInTheDocument();
    expect(screen.getByText('Pošalji mi tekst')).toBeInTheDocument();
    expect(screen.getByText('Slijepe točke')).toBeInTheDocument();
  });

  it('primary CTA preselects the persona and opens maja', () => {
    const setScr = vi.fn();
    render(<PartnerScreen partnerId="ana" setScr={setScr} sCurEx={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Počni razgovor'));
    expect(localStorage.getItem('maja_persona')).toBe('secretary');
    expect(setScr).toHaveBeenCalledWith('maja');
  });

  it('back button calls onBack', () => {
    const onBack = vi.fn();
    render(<PartnerScreen partnerId="ivo" setScr={vi.fn()} sCurEx={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText('← Razgovor'));
    expect(onBack).toHaveBeenCalled();
  });
});
