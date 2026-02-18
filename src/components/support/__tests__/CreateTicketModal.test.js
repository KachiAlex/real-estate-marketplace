import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTicketModal from '../CreateTicketModal';
import * as authToken from '../../../utils/authToken';
import { AuthProvider } from '../../../contexts/AuthContext-new';

// Mock toast so we can assert calls if needed
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

describe('CreateTicketModal', () => {
  beforeEach(() => {
    // ensure localStorage has a token and currentUser
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('currentUser', JSON.stringify({ id: 'user-1', email: 'a@b.com' }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('submits ticket and calls onSuccess/onClose on success', async () => {
    const fakeResp = new Response(JSON.stringify({ message: 'ok' }), { status: 201 });
    const fetchSpy = jest.spyOn(authToken, 'authenticatedFetch').mockResolvedValue(fakeResp);

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    render(
      <AuthProvider>
        <CreateTicketModal onClose={onClose} onSuccess={onSuccess} />
      </AuthProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Help' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'technical' } });
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'My app broken' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    // Assert the authenticatedFetch was called with the support endpoint
    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toMatch(/\/support\/inquiry$/);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation error when required fields missing', async () => {
    render(
      <AuthProvider>
        <CreateTicketModal onClose={() => {}} onSuccess={() => {}} />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));

    // authenticatedFetch should not be called
    const fetchSpy = jest.spyOn(authToken, 'authenticatedFetch');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
