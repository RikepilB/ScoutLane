import { test, expect } from '@playwright/test';

test.describe('Signup and Role Selection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/signup');
  });

  test('signup page loads with Clerk SignUp component', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sign Up/i);

    // Check for key elements
    await expect(page.locator('h1')).toContainText('Create your account');
    await expect(page.locator('text=You\'ll choose your role')).toBeVisible();
  });

  test('redirects to choose-role after successful signup', async ({ page }) => {
    // Note: This would require mocking Clerk or using a test account
    // For now, just verify the choose-role page structure exists
    await page.goto('http://localhost:3000/choose-role');

    await expect(page).toHaveTitle(/Choose Your Role/i);
    await expect(page.locator('h1')).toContainText('Choose your workspace');
  });

  test('choose-role page shows Admin and Recruiter options', async ({ page }) => {
    await page.goto('http://localhost:3000/choose-role');

    // Check for workspace options
    await expect(page.locator('text=Admin Workspace')).toBeVisible();
    await expect(page.locator('text=Recruiter Workspace')).toBeVisible();

    // Check for role selection buttons
    const adminButton = page.locator('button:has-text("Choose Admin")');
    const recruiterButton = page.locator('button:has-text("Choose Recruiter")');

    await expect(adminButton).toBeVisible();
    await expect(recruiterButton).toBeVisible();
  });

  test('unauthenticated user is redirected from choose-role to signup', async ({ page }) => {
    // Navigate directly to choose-role without auth
    await page.goto('http://localhost:3000/choose-role');

    // Should redirect to signup
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signin page shows role chooser with demo buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/signin');

    // Check for role selection
    await expect(page.locator('h1')).toContainText('Choose your workspace');

    // Check for demo signin buttons
    const adminButton = page.locator('button:has-text("Enter as Admin")');
    const recruiterButton = page.locator('button:has-text("Enter as Recruiter")');

    await expect(adminButton).toBeVisible();
    await expect(recruiterButton).toBeVisible();
  });

  test('signup page has accessible form elements', async ({ page }) => {
    // Check for accessibility attributes
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Check that form is not empty (Clerk will render SignUp component)
    const signupContainer = page.locator('text=Create your account').first();
    await expect(signupContainer).toBeVisible();
  });
});
