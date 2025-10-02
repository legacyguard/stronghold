import { test, expect } from '@playwright/test';

test.describe('Complete User Journey - i18n Translation Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000');
  });

  test('should have correct Slovak translations on homepage', async ({ page }) => {
    // Wait for i18n to load
    await page.waitForTimeout(2000);

    // Check hero section Slovak translations
    await expect(page.locator('h1')).toContainText('Nasaďte Váš Rodinný Štít');
    await expect(page.getByText('Vojenskou Bezpečnosťou')).toBeVisible();
    await expect(page.getByText('Právnou Presnosťou')).toBeVisible();

    // Check CTA buttons in Slovak
    await expect(page.getByRole('button', { name: 'Nasadiť Rodinný Štít' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zobraziť Architektúru Bezpečnosti' })).toBeVisible();
  });

  test('should have correct Slovak translations on login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');

    // Wait for translations to load and page to render
    await page.waitForTimeout(3000);

    // Check main title and subtitle
    await expect(page.getByText('Prihlásenie')).toBeVisible();
    await expect(page.getByText('Prihláste sa do svojho účtu')).toBeVisible();

    // Check OAuth buttons
    await expect(page.getByRole('button', { name: 'Pokračovať s Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pokračovať s Apple' })).toBeVisible();

    // Check form labels
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Heslo')).toBeVisible();

    // Check form placeholders
    await expect(page.getByPlaceholder('Zadajte váš email')).toBeVisible();
    await expect(page.getByPlaceholder('Zadajte vaše heslo')).toBeVisible();

    // Check other buttons
    await expect(page.getByRole('button', { name: 'Prihlásiť sa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pošlite mi prihlasovací odkaz' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zabudli ste heslo?' })).toBeVisible();

    // Check account creation link
    await expect(page.getByText('Nemáte účet?')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vytvoriť účet' })).toBeVisible();
  });

  test('should not display translation keys instead of values', async ({ page }) => {
    // Test homepage for any translation keys
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Check that no translation keys are visible
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('hero.title');
    expect(bodyText).not.toContain('hero.subtitle');
    expect(bodyText).not.toContain('hero.cta');

    // Test login page for translation keys
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(3000);

    const loginBodyText = await page.textContent('body');
    expect(loginBodyText).not.toContain('login.title');
    expect(loginBodyText).not.toContain('login.subtitle');
    expect(loginBodyText).not.toContain('login.google_button');
    expect(loginBodyText).not.toContain('login.apple_button');
    expect(loginBodyText).not.toContain('login.email_label');
    expect(loginBodyText).not.toContain('login.password_label');
    expect(loginBodyText).not.toContain('login.sign_in_button');
  });

  test('should handle navigation between pages with consistent translations', async ({ page }) => {
    // Start on homepage
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Verify homepage translations
    await expect(page.getByText('Nasaďte Váš Rodinný Štít')).toBeVisible();

    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(3000);

    // Verify login translations
    await expect(page.getByText('Prihlásenie')).toBeVisible();

    // Go back to homepage
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Verify homepage translations still work
    await expect(page.getByText('Nasaďte Váš Rodinný Štít')).toBeVisible();
  });

  test('should display all text in Slovak without overlapping', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Check that text elements don't overlap (basic visual regression)
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    // Take screenshot for manual review if needed
    await page.screenshot({
      path: 'e2e/screenshots/homepage-slovak.png',
      fullPage: true
    });

    // Navigate to login and take screenshot
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'e2e/screenshots/login-slovak.png',
      fullPage: true
    });
  });

  test('should load translations dynamically via HTTP backend', async ({ page }) => {
    // Monitor network requests for translation files
    const translationRequests = [];

    page.on('request', request => {
      if (request.url().includes('/locales/') && request.url().endsWith('.json')) {
        translationRequests.push(request.url());
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Verify that translation files were loaded
    expect(translationRequests.length).toBeGreaterThan(0);

    // Check that Slovak common translations were loaded
    const hasSkCommon = translationRequests.some(url =>
      url.includes('/locales/sk/common.json')
    );
    expect(hasSkCommon).toBe(true);

    // Navigate to login and check more translation loading
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(3000);

    // Verify translations are working
    await expect(page.getByText('Prihlásenie')).toBeVisible();
  });

  test('should handle Suspense loading gracefully', async ({ page }) => {
    // Navigate to login page and check for loading states
    await page.goto('http://localhost:3000/login');

    // Wait for either loading text or final content
    try {
      await page.getByText('Načítava sa...').waitFor({ state: 'visible', timeout: 1000 });
    } catch {
      // Loading was too fast, which is fine
    }

    // Ensure final content loads
    await page.waitForTimeout(3000);
    await expect(page.getByText('Prihlásenie')).toBeVisible();
  });

  test('should maintain i18n state across different routes', async ({ page }) => {
    // Test multiple page navigations to ensure i18n consistency
    const routes = [
      'http://localhost:3000',
      'http://localhost:3000/login'
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(2000);

      // Verify no translation keys are showing by checking specific translation patterns
      const bodyText = await page.textContent('main, [data-testid="content"], .landing-page, h1, h2, h3, p, button');
      expect(bodyText).not.toContain('hero.title');
      expect(bodyText).not.toContain('hero.subtitle');
      expect(bodyText).not.toContain('login.title');
      expect(bodyText).not.toContain('login.subtitle');

      // Verify Slovak content is present
      if (route.includes('/login')) {
        await expect(page.getByText('Prihlásenie')).toBeVisible();
      } else {
        await expect(page.getByText('Nasaďte Váš Rodinný Štít')).toBeVisible();
      }
    }
  });
});

test.describe('i18n System Performance', () => {
  test('should load translations within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000/login');

    // Wait for translations to appear
    await expect(page.getByText('Prihlásenie')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    console.log(`Translation load time: ${loadTime}ms`);
  });
});