/**
 * Unit tests for EvaluationForm component
 * 
 * Tests form validation, submission, and user interactions.
 * 
 * TDD: These tests are written FIRST and should FAIL until the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EvaluationForm from '../../../src/components/EvaluationForm.vue';

describe('EvaluationForm', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    // Reset wrapper before each test
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Form rendering', () => {
    it('should render email input field', () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      expect(emailInput.exists()).toBe(true);
    });

    it('should render URL input field', () => {
      wrapper = mount(EvaluationForm);
      const urlInput = wrapper.find('input[type="url"]');
      expect(urlInput.exists()).toBe(true);
    });

    it('should render file upload input', () => {
      wrapper = mount(EvaluationForm);
      const fileInput = wrapper.find('input[type="file"]');
      expect(fileInput.exists()).toBe(true);
    });

    it('should render optional target audience input', () => {
      wrapper = mount(EvaluationForm);
      const audienceInput = wrapper.find('input[name="user_provided_audience"]');
      expect(audienceInput.exists()).toBe(true);
    });

    it('should render submit button', () => {
      wrapper = mount(EvaluationForm);
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.exists()).toBe(true);
    });
  });

  describe('Form validation', () => {
    it('should show error when email is empty on submit', async () => {
      wrapper = mount(EvaluationForm);
      const form = wrapper.find('form');
      
      await form.trigger('submit');

      const emailError = wrapper.find('.error-email');
      expect(emailError.exists()).toBe(true);
      expect(emailError.text()).toContain('email');
    });

    it('should show error when email format is invalid', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      
      await emailInput.setValue('invalid-email');
      await wrapper.find('form').trigger('submit');

      const emailError = wrapper.find('.error-email');
      expect(emailError.exists()).toBe(true);
    });

    it('should show error when URL format is invalid', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');
      
      await emailInput.setValue('user@example.com');
      await urlInput.setValue('not-a-valid-url');
      await wrapper.find('form').trigger('submit');

      const urlError = wrapper.find('.error-url');
      expect(urlError.exists()).toBe(true);
    });

    it('should show error when neither URL nor files are provided', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      
      await emailInput.setValue('user@example.com');
      await wrapper.find('form').trigger('submit');

      const contentError = wrapper.find('.error-content');
      expect(contentError.exists()).toBe(true);
      expect(contentError.text()).toMatch(/URL|file/i);
    });

    it('should accept valid email and URL', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');
      
      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');
      
      // Should not show errors
      const emailError = wrapper.find('.error-email');
      const urlError = wrapper.find('.error-url');
      expect(emailError.exists()).toBe(false);
      expect(urlError.exists()).toBe(false);
    });
  });

  describe('File upload', () => {
    it('should accept PDF file', async () => {
      wrapper = mount(EvaluationForm);
      const fileInput = wrapper.find('input[type="file"]');
      
      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
      const fileList = {
        item: (index: number) => (index === 0 ? file : null),
        length: 1,
        0: file,
      } as FileList;

      Object.defineProperty(fileInput.element, 'files', {
        value: fileList,
        writable: false,
      });

      await fileInput.trigger('change');

      // File should be accepted
      expect(wrapper.vm.selectedFiles).toContain(file);
    });

    it('should reject unsupported file type', async () => {
      wrapper = mount(EvaluationForm);
      const fileInput = wrapper.find('input[type="file"]');
      
      const file = new File(['test content'], 'document.txt', { type: 'text/plain' });
      const fileList = {
        item: (index: number) => (index === 0 ? file : null),
        length: 1,
        0: file,
      } as FileList;

      Object.defineProperty(fileInput.element, 'files', {
        value: fileList,
        writable: false,
      });

      await fileInput.trigger('change');

      // Should show error for unsupported file type
      const fileError = wrapper.find('.error-file');
      expect(fileError.exists()).toBe(true);
    });

    it('should reject file exceeding 50MB', async () => {
      wrapper = mount(EvaluationForm);
      const fileInput = wrapper.find('input[type="file"]');
      
      // Create a file larger than 50MB
      const largeFile = new File(['x'.repeat(50 * 1024 * 1024 + 1)], 'large.pdf', {
        type: 'application/pdf',
      });
      const fileList = {
        item: (index: number) => (index === 0 ? largeFile : null),
        length: 1,
        0: largeFile,
      } as FileList;

      Object.defineProperty(fileInput.element, 'files', {
        value: fileList,
        writable: false,
      });

      await fileInput.trigger('change');

      // Should show error for file size
      const fileError = wrapper.find('.error-file');
      expect(fileError.exists()).toBe(true);
      expect(fileError.text()).toContain('50MB');
    });
  });

  describe('Form submission', () => {
    it('should emit submit event with form data when valid', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');
      const audienceInput = wrapper.find('input[name="user_provided_audience"]');
      
      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');
      await audienceInput.setValue('CFOs at Fortune 500 companies');
      
      await wrapper.find('form').trigger('submit');

      // Should emit submit event
      expect(wrapper.emitted('submit')).toBeTruthy();
      const submitEvent = wrapper.emitted('submit')![0][0];
      expect(submitEvent).toMatchObject({
        email: 'user@example.com',
        url: 'https://example.com',
        user_provided_audience: 'CFOs at Fortune 500 companies',
      });
    });

    it('should disable submit button while submitting', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');
      const submitButton = wrapper.find('button[type="submit"]');
      
      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');
      
      // Set submitting state
      await wrapper.setData({ isSubmitting: true });

      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('should show loading state during submission', async () => {
      wrapper = mount(EvaluationForm);
      
      await wrapper.setData({ isSubmitting: true });

      const loadingIndicator = wrapper.find('.loading');
      expect(loadingIndicator.exists()).toBe(true);
    });
  });

  describe('Optional target audience', () => {
    it('should allow submission without target audience', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');
      
      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');
      
      await wrapper.find('form').trigger('submit');

      // Should emit submit event without audience
      expect(wrapper.emitted('submit')).toBeTruthy();
      const submitEvent = wrapper.emitted('submit')![0][0];
      expect(submitEvent.user_provided_audience).toBeUndefined();
    });

    it('should include target audience in submission when provided', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      const urlInput = wrapper.find('input[type="url"]');
      const audienceInput = wrapper.find('input[name="user_provided_audience"]');
      
      await emailInput.setValue('user@example.com');
      await urlInput.setValue('https://example.com');
      await audienceInput.setValue('CISOs at large banks');
      
      await wrapper.find('form').trigger('submit');

      const submitEvent = wrapper.emitted('submit')![0][0];
      expect(submitEvent.user_provided_audience).toBe('CISOs at large banks');
    });
  });

  describe('Error display', () => {
    it('should display server validation errors', async () => {
      wrapper = mount(EvaluationForm);
      
      await wrapper.setProps({
        serverError: 'Email address is required',
      });

      const errorMessage = wrapper.find('.server-error');
      expect(errorMessage.exists()).toBe(true);
      expect(errorMessage.text()).toContain('Email address is required');
    });

    it('should clear errors when form is edited', async () => {
      wrapper = mount(EvaluationForm);
      const emailInput = wrapper.find('input[type="email"]');
      
      // Trigger validation error
      await wrapper.find('form').trigger('submit');
      expect(wrapper.find('.error-email').exists()).toBe(true);

      // Fix the error
      await emailInput.setValue('user@example.com');
      
      // Error should be cleared
      expect(wrapper.find('.error-email').exists()).toBe(false);
    });
  });
});

