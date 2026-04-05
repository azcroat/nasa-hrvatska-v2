import { test, expect } from '@playwright/test';
import { blockFirebase } from './fixtures/seed-auth.js';

test.describe('Authentication — Login screen', () => {
  test.beforeEach(async ({ page }) => {
    await blockFirebase(page);
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Naša Hrvatska', { timeout: 20_000 });
  });

  test('renders the login form with all required fields', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('shows error when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('shows error for invalid email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill('notanemail');
    await page.locator('input[type="password"]').fill('somepassword');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('shows error when password is missing', async ({ page }) => {
    // Use #auth-email ID + pressSequentially to guarantee React onChange fires
    await page.locator('#auth-email').click();
    await page.locator('#auth-email').pressSequentially('user@example.com');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText('Please enter your password')).toBeVisible();
  });

  test('can switch to registration form', async ({ page }) => {
    await page.getByText('Create one').click();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    await expect(page.locator('input[placeholder="Your name"]')).toBeVisible();
  });

  test('registration form validates matching passwords', async ({ page }) => {
    await page.getByText('Create one').click();
    await page.locator('input[placeholder="Your name"]').fill('Test User');
    await page.locator('input[type="email"]').fill('new@example.com');
    await page.locator('input[placeholder*="Create password"]').fill('password123');
    await page.locator('input[placeholder="Confirm your password"]').fill('different456');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('registration form shows password strength indicator', async ({ page }) => {
    await page.getByText('Create one').click();
    const pwInput = page.locator('input[placeholder*="Create password"]');
    // "weakpass" is 8 chars → strength 1 → label "Weak"
    await pwInput.fill('weakpass');
    await expect(page.getByText('Weak')).toBeVisible();
    // Strong password with upper, lower, number, special
    await pwInput.fill('StrongP@ss123');
    await expect(page.getByText('Strong')).toBeVisible();
  });

  test('forgot password link is visible on login form', async ({ page }) => {
    await expect(page.getByText('Forgot password?')).toBeVisible();
  });

  test('can switch back from register to login', async ({ page }) => {
    await page.getByText('Create one').click();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    // The toggle at the bottom says "Sign in"
    await page.getByText('Sign in').click();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });
});
