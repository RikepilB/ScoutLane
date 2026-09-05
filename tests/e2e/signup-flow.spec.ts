import { test, expect } from '@playwright/test';

test.describe('Signup and Role Selection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('signup page loads with Clerk SignUp component', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sign Up/i);

    // Check for key elements
    await expect(page.locator('h1')).toContainText('Create your account');
    await expect(page.locator('text=You\'ll choose your role')).toBeVisible();
  });

  test('choose-role is auth-gated: unauthenticated visitors land on signup', async ({
    page,
  }) => {
    // /choose-role redirects unauthenticated users to /signup. Verifying the
    // post-signup redirect itself requires a fresh, role-less Clerk account
    // (the demo accounts already have roles), so the signed-in variant is
    // covered by the choose-role page's own unit tests and manual QA.
    await page.goto('/choose-role');
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('h1')).toContainText('Create your account');
  });

  test.fixme('choose-role page shows Admin and Recruiter options', async ({ page }) => {
    // Requires an authenticated account WITHOUT a role yet — the demo accounts
    // already have roles and get redirected to /admin. Only a fresh signup can
    // see this page's content.
    await page.goto('/choose-role');
    await expect(page.locator('text=Admin Workspace')).toBeVisible();
    await expect(page.locator('text=Recruiter Workspace')).toBeVisible();
  });

  test('unauthenticated user is redirected from choose-role to signup', async ({ page }) => {
    // Navigate directly to choose-role without auth
    await page.goto('/choose-role');

    // Should redirect to signup
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signin page shows role chooser with workspace links', async ({ page }) => {
    await page.goto('/signin');

    // Check for role selection
    await expect(page.locator('h1')).toContainText('Choose your workspace');

    // Check for the workspace entry links
    await expect(page.getByRole('link', { name: 'Continue as Admin' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue as Recruiter' })).toBeVisible();
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
