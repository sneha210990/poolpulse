// @ts-check
const { test, expect } = require('@playwright/test');

const DASHBOARD_URL = 'https://sneha210990.github.io/poolpulse/dashboard.html';
const SUPABASE_URL = 'https://hygjskvfkucuwtcihbiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Z2pza3Zma3VjdXd0Y2loYml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjQ4OTMsImV4cCI6MjA4Njg0MDg5M30.SSrSE9J9-hs0kZNIzUMBCPST5T_JXZG5I68UF4ZjgLs';

// Generate a unique test email for this run
const TEST_EMAIL = `testuser+${Date.now()}@poolpulse-test.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('PoolPulse Dashboard Signup Flow', () => {

  test('Test 1 — Email signup', async ({ page }) => {
    // 1. Navigate to dashboard
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });

    // Wait for the auth screen to appear
    const authScreen = page.locator('#authScreen');
    await expect(authScreen).toBeVisible({ timeout: 15000 });

    // 2. Enter test email and password
    await page.locator('#authEmail').fill(TEST_EMAIL);
    await page.locator('#authPassword').fill(TEST_PASSWORD);

    // 3. Click Create account
    const signUpBtn = page.locator('#signUpBtn');
    await signUpBtn.click();

    // Wait for the button text to change back from "Creating account..."
    await expect(signUpBtn).toHaveText('Create account', { timeout: 15000 });

    // 4. Assert no error message appears (red-styled error)
    const authError = page.locator('#authError');
    const isErrorVisible = await authError.isVisible();

    if (isErrorVisible) {
      const errorText = await authError.textContent();
      const bgColor = await authError.evaluate(el => getComputedStyle(el).backgroundColor);

      console.log(`Auth message displayed: "${errorText}"`);
      console.log(`Background color: ${bgColor}`);

      // Success message has green background and says "Check your email"
      const isSuccess = errorText?.includes('Check your email') ||
                        bgColor.includes('239, 255, 239');

      expect(isSuccess, `Expected success message but got error: "${errorText}"`).toBeTruthy();
    } else {
      // Auth screen might have been hidden (user redirected to dashboard)
      const authScreenHidden = await authScreen.evaluate(el => el.style.display === 'none');
      expect(authScreenHidden, 'Expected auth screen to be hidden after signup').toBeTruthy();
    }

    // 5. Assert user is redirected to dashboard or shown success message
    const successShown = isErrorVisible && (await authError.textContent())?.includes('Check your email');
    const dashboardShown = await authScreen.evaluate(el => el.style.display === 'none');

    expect(
      successShown || dashboardShown,
      'Expected either a success message or redirect to dashboard'
    ).toBeTruthy();

    console.log(`Signup completed for: ${TEST_EMAIL}`);
    console.log(`Success message shown: ${successShown}`);
    console.log(`Dashboard shown: ${dashboardShown}`);
  });

  test('Test 2 — Check Supabase user_profiles for new user', async ({ request }) => {
    // Wait for the profile to be created (trigger may be async)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Fetch all profiles
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/user_profiles?select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        ignoreHTTPSErrors: true,
      }
    );

    console.log(`Supabase API status: ${response.status()}`);
    const body = await response.text();
    console.log(`Supabase API response: ${body.substring(0, 1000)}`);

    expect(response.ok(), `Supabase API returned status ${response.status()}: ${body}`).toBeTruthy();

    const profiles = JSON.parse(body);
    console.log(`Total profiles found: ${profiles.length}`);

    // Also try filtering by email directly
    const filteredResponse = await request.get(
      `${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${encodeURIComponent(TEST_EMAIL)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        ignoreHTTPSErrors: true,
      }
    );

    const filteredBody = await filteredResponse.text();
    console.log(`Filtered response status: ${filteredResponse.status()}`);
    console.log(`Filtered response: ${filteredBody}`);

    // Check if the test email appears in either response
    const allEmails = profiles.map(p => p.email);
    const userProfile = profiles.find(
      (p) => p.email?.toLowerCase() === TEST_EMAIL.toLowerCase()
    );

    let filteredProfiles = [];
    try {
      filteredProfiles = JSON.parse(filteredBody);
    } catch (e) {
      console.log(`Could not parse filtered response: ${e.message}`);
    }

    const found = userProfile || (Array.isArray(filteredProfiles) && filteredProfiles.length > 0);

    if (found) {
      console.log(`Found user profile for: ${TEST_EMAIL}`);
    } else {
      console.log(`User NOT found. All emails: ${allEmails.join(', ') || '(none — table may be empty or RLS blocks anon reads)'}`);
    }

    expect(
      found,
      `Expected to find email "${TEST_EMAIL}" in user_profiles. Found ${profiles.length} profiles. Emails: ${allEmails.join(', ') || '(none — RLS may block anon reads)'}`
    ).toBeTruthy();
  });

  test('Test 3 — No "Database error saving new user" message', async ({ page }) => {
    // 1. Navigate to dashboard signup page
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });

    // Wait for auth screen
    const authScreen = page.locator('#authScreen');
    await expect(authScreen).toBeVisible({ timeout: 15000 });

    // 2. Attempt signup with a new unique email
    const signupEmail = `testuser+err${Date.now()}@poolpulse-test.com`;
    await page.locator('#authEmail').fill(signupEmail);
    await page.locator('#authPassword').fill(TEST_PASSWORD);
    await page.locator('#signUpBtn').click();

    // Wait for the signup to complete
    await expect(page.locator('#signUpBtn')).toHaveText('Create account', { timeout: 15000 });

    // Give a moment for any error to render
    await page.waitForTimeout(2000);

    // 3. Assert "Database error saving new user" does NOT appear on the page
    const pageContent = await page.textContent('body');

    if (await page.locator('#authError').isVisible()) {
      const errorText = await page.locator('#authError').textContent();
      console.log(`Auth message text: "${errorText}"`);
    }

    expect(
      pageContent,
      'Page should not contain "Database error saving new user"'
    ).not.toContain('Database error saving new user');

    console.log('Confirmed: No "Database error saving new user" message found on the page.');
  });
});
