/**
 * E2E test for form submission
 * 
 * Tests the complete user flow:
 * 1. User visits the evaluation form page
 * 2. User fills out the form (email, URL, optional audience)
 * 3. User submits the form
 * 4. User sees confirmation message
 * 5. User receives email confirmation (mocked)
 * 
 * TDD: This test is written FIRST and should FAIL until implementation is complete.
 */

import { test, expect } from '@playwright/test';

test.describe('Evaluation Form Submission E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the evaluation form page
    await page.goto('/');
  });

  test('should successfully submit form with URL', async ({ page }) => {
    // Fill out the form
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="url"]', 'https://example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for confirmation message
    await expect(page.locator('.confirmation-message')).toBeVisible();
    await expect(page.locator('.confirmation-message')).toContainText(
      'received'
    );

    // Verify form is disabled or hidden
    await expect(page.locator('form')).not.toBeVisible();
  });

  test('should successfully submit form with file upload', async ({ page }) => {
    // Fill out the form
    await page.fill('input[type="email"]', 'user@example.com');

    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content'),
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for confirmation message
    await expect(page.locator('.confirmation-message')).toBeVisible();
  });

  test('should successfully submit form with optional target audience', async ({
    page,
  }) => {
    // Fill out the form
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="url"]', 'https://example.com');
    await page.fill(
      'input[name="user_provided_audience"]',
      'CFOs at Fortune 500 companies'
    );

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for confirmation message
    await expect(page.locator('.confirmation-message')).toBeVisible();
  });

  test('should show validation error for missing email', async ({ page }) => {
    // Fill out form without email
    await page.fill('input[type="url"]', 'https://example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(page.locator('.error-email')).toBeVisible();
    await expect(page.locator('.error-email')).toContainText('email');

    // Verify form is still visible (not submitted)
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('.confirmation-message')).not.toBeVisible();
  });

  test('should show validation error for invalid email format', async ({
    page,
  }) => {
    // Fill out form with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="url"]', 'https://example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(page.locator('.error-email')).toBeVisible();
    await expect(page.locator('.error-email')).toContainText('email');
  });

  test('should show validation error for invalid URL format', async ({
    page,
  }) => {
    // Fill out form with invalid URL
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="url"]', 'not-a-valid-url');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(page.locator('.error-url')).toBeVisible();
    await expect(page.locator('.error-url')).toContainText('URL');
  });

  test('should show validation error when neither URL nor files are provided', async ({
    page,
  }) => {
    // Fill out form with only email
    await page.fill('input[type="email"]', 'user@example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(page.locator('.error-content')).toBeVisible();
    await expect(page.locator('.error-content')).toMatch(/URL|file/i);
  });

  test('should show validation error for unsupported file type', async ({
    page,
  }) => {
    // Fill out form
    await page.fill('input[type="email"]', 'user@example.com');

    // Upload unsupported file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('test content'),
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(page.locator('.error-file')).toBeVisible();
    await expect(page.locator('.error-file')).toMatch(/PDF|PPTX|DOCX/i);
  });

  test('should show validation error for file exceeding 50MB', async ({
    page,
  }) => {
    // Fill out form
    await page.fill('input[type="email"]', 'user@example.com');

    // Create a large file (simulated)
    const largeContent = 'x'.repeat(50 * 1024 * 1024 + 1);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(largeContent),
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(page.locator('.error-file')).toBeVisible();
    await expect(page.locator('.error-file')).toContainText('50MB');
  });

  test('should show server error message when API returns error', async ({
    page,
  }) => {
    // Mock API to return error
    await page.route('**/v1/evaluations', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Email address is required',
        }),
      });
    });

    // Fill out and submit form
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="url"]', 'https://example.com');
    await page.click('button[type="submit"]');

    // Verify server error is shown
    await expect(page.locator('.server-error')).toBeVisible();
    await expect(page.locator('.server-error')).toContainText(
      'Email address is required'
    );
  });

  test('should show rate limit error when rate limit is exceeded', async ({
    page,
  }) => {
    // Mock API to return rate limit error
    await page.route('**/v1/evaluations', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please try again later.',
        }),
      });
    });

    // Fill out and submit form
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="url"]', 'https://example.com');
    await page.click('button[type="submit"]');

    // Verify rate limit error is shown
    await expect(page.locator('.server-error')).toBeVisible();
    await expect(page.locator('.server-error')).toContainText('rate limit');
  });

  test('should disable submit button while submitting', async ({ page }) => {
    // Mock API to delay response
    await page.route('**/v1/evaluations', (route) => {
      setTimeout(() => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '123',
            status: 'pending',
            submitted_at: new Date().toISOString(),
            estimated_completion_time: new Date().toISOString(),
            message: 'Request received',
          }),
        });
      }, 1000);
    });

    // Fill out form
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="url"]', 'https://example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify submit button is disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should show loading indicator during submission', async ({ page }) => {
    // Mock API to delay response
    await page.route('**/v1/evaluations', (route) => {
      setTimeout(() => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '123',
            status: 'pending',
            submitted_at: new Date().toISOString(),
            estimated_completion_time: new Date().toISOString(),
            message: 'Request received',
          }),
        });
      }, 1000);
    });

    // Fill out form
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="url"]', 'https://example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify loading indicator is shown
    await expect(page.locator('.loading')).toBeVisible();
  });
});

