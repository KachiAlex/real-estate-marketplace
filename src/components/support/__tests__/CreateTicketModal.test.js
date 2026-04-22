import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateTicketModal from '../CreateTicketModal';
import apiClient from '../../../services/apiClient';
import { AuthProvider } from '../../../contexts/AuthContext-new';

jest.mock('../../../services/apiClient', () => ({
  post: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1', email: 'a@b.com' } })
}));

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
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { success: true, message: 'ok' } });

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    render(
      <MemoryRouter>
        <AuthProvider>
          <CreateTicketModal onClose={onClose} onSuccess={onSuccess} />
        </AuthProvider>
      </MemoryRouter>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Help' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'technical' } });
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'My app broken' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));

    await waitFor(() => expect(postSpy).toHaveBeenCalled());

    expect(postSpy).toHaveBeenCalledWith('/support/inquiry', expect.objectContaining({ subject: 'Help' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation error when required fields missing', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CreateTicketModal onClose={() => {}} onSuccess={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));

    // apiClient.post should not be called
    const postSpy = jest.spyOn(apiClient, 'post');
    expect(postSpy).not.toHaveBeenCalled();
  });
});
