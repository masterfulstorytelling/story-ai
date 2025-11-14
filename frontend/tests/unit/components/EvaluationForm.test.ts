/**
 * Unit test for EvaluationForm component
 *
 * Tests the EvaluationForm component for User Story 1:
 * - Form accepts website URL (required)
 * - Form accepts file uploads (PDF, PPTX, DOCX) (optional)
 * - Form accepts optional target audience field
 * - Form validates inputs and shows error messages
 * - Form submits data to API
 * - Form displays confirmation message on success
 *
 * TDD: This test is written FIRST and should FAIL until implementation is complete.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import EvaluationForm from '../../../src/components/EvaluationForm.vue';
import * as apiService from '../../../src/services/api';

// Mock the API service
vi.mock('../../../src/services/api', () => ({
  submitEvaluation: vi.fn(),
}));

describe('EvaluationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Fields', () => {
    it('should render email input field', () => {
      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      expect(emailInput.exists()).toBe(true);
    });

    it('should render URL input field', () => {
      const wrapper = mount(EvaluationForm);
      const urlInput = wrapper.find('input[type="url"]');
      expect(urlInput.exists()).toBe(true);
    });

    it('should render file upload input', () => {
      const wrapper = mount(EvaluationForm);
      const fileInput = wrapper.find('input[type="file"]');
      expect(fileInput.exists()).toBe(true);
    });

    it('should render optional target audience input field', () => {
      const wrapper = mount(EvaluationForm);
      const audienceInput = wrapper.find(
        'input[placeholder*="audience" i], textarea[placeholder*="audience" i]'
      );
      expect(audienceInput.exists()).toBe(true);
    });

    it('should render submit button', () => {
      const wrapper = mount(EvaluationForm);
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.exists()).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should show error when email is missing on submit', async () => {
      const wrapper = mount(EvaluationForm);
      const form = wrapper.find('form');

      await form.trigger('submit');

      const errorMessage = wrapper.text();
      expect(errorMessage.toLowerCase()).toContain('email');
    });

    it('should show error when email format is invalid', async () => {
      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');

      await emailInput.setValue('invalid-email');
      const form = wrapper.find('form');
      await form.trigger('submit');

      const errorMessage = wrapper.text();
      expect(errorMessage.toLowerCase()).toContain('email');
    });

    it('should show error when URL format is invalid', async () => {
      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');

      await emailInput.setValue('user@example.com');
      await urlInput.setValue('not-a-valid-url');
      const form = wrapper.find('form');
      await form.trigger('submit');

      const errorMessage = wrapper.text();
      expect(errorMessage.toLowerCase()).toContain('url');
    });

    it('should show error when neither URL nor file is provided', async () => {
      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');

      await emailInput.setValue('user@example.com');
      const form = wrapper.find('form');
      await form.trigger('submit');

      const errorMessage = wrapper.text();
      expect(errorMessage.toLowerCase()).toMatch(/url|file/);
    });

    it('should accept valid email and URL without errors', async () => {
      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');

      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');

      // Should not show validation errors for valid inputs
      const errorMessages = wrapper.findAll('.error, [role="alert"]');
      expect(errorMessages.length).toBe(0);
    });
  });

  describe('File Upload', () => {
    it('should accept PDF files', async () => {
      const wrapper = mount(EvaluationForm);
      const fileInput = wrapper.find('input[type="file"]');

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
        [Symbol.iterator]: function* () {
          yield file;
        },
      } as FileList;

      Object.defineProperty(fileInput.element, 'files', {
        value: fileList,
        writable: false,
      });

      await fileInput.trigger('change');

      // File should be accepted without error
      const errorMessage = wrapper.text();
      expect(errorMessage.toLowerCase()).not.toContain('unsupported');
    });

    it('should show error for unsupported file types', async () => {
      const wrapper = mount(EvaluationForm);
      const fileInput = wrapper.find('input[type="file"]');

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
        [Symbol.iterator]: function* () {
          yield file;
        },
      } as FileList;

      Object.defineProperty(fileInput.element, 'files', {
        value: fileList,
        writable: false,
      });

      await fileInput.trigger('change');

      const errorMessage = wrapper.text();
      expect(errorMessage.toLowerCase()).toMatch(/unsupported|format|pdf|pptx|docx/);
    });
  });

  describe('Form Submission', () => {
    it('should call API service with correct data when form is submitted', async () => {
      const mockSubmitEvaluation = vi.mocked(apiService.submitEvaluation);
      mockSubmitEvaluation.mockResolvedValue({
        id: 'test-id',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        estimated_completion_time: new Date().toISOString(),
        message: 'Your evaluation request has been received',
      });

      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');

      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');

      const form = wrapper.find('form');
      await form.trigger('submit');

      expect(mockSubmitEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          url: 'https://example.com',
        })
      );
    });

    it('should include optional target audience in API call', async () => {
      const mockSubmitEvaluation = vi.mocked(apiService.submitEvaluation);
      mockSubmitEvaluation.mockResolvedValue({
        id: 'test-id',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        estimated_completion_time: new Date().toISOString(),
        message: 'Your evaluation request has been received',
      });

      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');
      const audienceInput = wrapper.find(
        'input[placeholder*="audience" i], textarea[placeholder*="audience" i]'
      );

      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');
      await audienceInput.setValue('CFOs at Fortune 500 companies');

      const form = wrapper.find('form');
      await form.trigger('submit');

      expect(mockSubmitEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          url: 'https://example.com',
          targetAudience: 'CFOs at Fortune 500 companies',
        })
      );
    });

    it('should handle API errors and display error message', async () => {
      const mockSubmitEvaluation = vi.mocked(apiService.submitEvaluation);
      mockSubmitEvaluation.mockRejectedValue(new Error('Network error'));

      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');

      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');

      const form = wrapper.find('form');
      await form.trigger('submit');

      await wrapper.vm.$nextTick();

      const errorMessage = wrapper.text();
      expect(errorMessage.toLowerCase()).toMatch(/error|failed/);
    });
  });

  describe('Confirmation Display', () => {
    it('should display confirmation message after successful submission', async () => {
      const mockSubmitEvaluation = vi.mocked(apiService.submitEvaluation);
      mockSubmitEvaluation.mockResolvedValue({
        id: 'test-id',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        estimated_completion_time: new Date().toISOString(),
        message: 'Your evaluation request has been received',
      });

      const wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');

      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');

      const form = wrapper.find('form');
      await form.trigger('submit');

      await wrapper.vm.$nextTick();

      const confirmationMessage = wrapper.text();
      expect(confirmationMessage.toLowerCase()).toMatch(/success|received|confirmation/);
    });
  });
});
