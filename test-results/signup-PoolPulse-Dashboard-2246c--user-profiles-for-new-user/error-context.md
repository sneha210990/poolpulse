# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: signup.spec.js >> PoolPulse Dashboard Signup Flow >> Test 2 — Check Supabase user_profiles for new user
- Location: tests/signup.spec.js:69:3

# Error details

```
Error: Expected to find email "testuser+1775476821013@poolpulse-test.com" in user_profiles. Found 0 profiles. Emails: (none — RLS may block anon reads)

expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  36  | 
  37  |     if (isErrorVisible) {
  38  |       const errorText = await authError.textContent();
  39  |       const bgColor = await authError.evaluate(el => getComputedStyle(el).backgroundColor);
  40  | 
  41  |       console.log(`Auth message displayed: "${errorText}"`);
  42  |       console.log(`Background color: ${bgColor}`);
  43  | 
  44  |       // Success message has green background and says "Check your email"
  45  |       const isSuccess = errorText?.includes('Check your email') ||
  46  |                         bgColor.includes('239, 255, 239');
  47  | 
  48  |       expect(isSuccess, `Expected success message but got error: "${errorText}"`).toBeTruthy();
  49  |     } else {
  50  |       // Auth screen might have been hidden (user redirected to dashboard)
  51  |       const authScreenHidden = await authScreen.evaluate(el => el.style.display === 'none');
  52  |       expect(authScreenHidden, 'Expected auth screen to be hidden after signup').toBeTruthy();
  53  |     }
  54  | 
  55  |     // 5. Assert user is redirected to dashboard or shown success message
  56  |     const successShown = isErrorVisible && (await authError.textContent())?.includes('Check your email');
  57  |     const dashboardShown = await authScreen.evaluate(el => el.style.display === 'none');
  58  | 
  59  |     expect(
  60  |       successShown || dashboardShown,
  61  |       'Expected either a success message or redirect to dashboard'
  62  |     ).toBeTruthy();
  63  | 
  64  |     console.log(`Signup completed for: ${TEST_EMAIL}`);
  65  |     console.log(`Success message shown: ${successShown}`);
  66  |     console.log(`Dashboard shown: ${dashboardShown}`);
  67  |   });
  68  | 
  69  |   test('Test 2 — Check Supabase user_profiles for new user', async ({ request }) => {
  70  |     // Wait for the profile to be created (trigger may be async)
  71  |     await new Promise(resolve => setTimeout(resolve, 5000));
  72  | 
  73  |     // Fetch all profiles
  74  |     const response = await request.get(
  75  |       `${SUPABASE_URL}/rest/v1/user_profiles?select=*`,
  76  |       {
  77  |         headers: {
  78  |           'apikey': SUPABASE_KEY,
  79  |           'Authorization': `Bearer ${SUPABASE_KEY}`,
  80  |           'Content-Type': 'application/json',
  81  |         },
  82  |         ignoreHTTPSErrors: true,
  83  |       }
  84  |     );
  85  | 
  86  |     console.log(`Supabase API status: ${response.status()}`);
  87  |     const body = await response.text();
  88  |     console.log(`Supabase API response: ${body.substring(0, 1000)}`);
  89  | 
  90  |     expect(response.ok(), `Supabase API returned status ${response.status()}: ${body}`).toBeTruthy();
  91  | 
  92  |     const profiles = JSON.parse(body);
  93  |     console.log(`Total profiles found: ${profiles.length}`);
  94  | 
  95  |     // Also try filtering by email directly
  96  |     const filteredResponse = await request.get(
  97  |       `${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${encodeURIComponent(TEST_EMAIL)}&select=*`,
  98  |       {
  99  |         headers: {
  100 |           'apikey': SUPABASE_KEY,
  101 |           'Authorization': `Bearer ${SUPABASE_KEY}`,
  102 |           'Content-Type': 'application/json',
  103 |         },
  104 |         ignoreHTTPSErrors: true,
  105 |       }
  106 |     );
  107 | 
  108 |     const filteredBody = await filteredResponse.text();
  109 |     console.log(`Filtered response status: ${filteredResponse.status()}`);
  110 |     console.log(`Filtered response: ${filteredBody}`);
  111 | 
  112 |     // Check if the test email appears in either response
  113 |     const allEmails = profiles.map(p => p.email);
  114 |     const userProfile = profiles.find(
  115 |       (p) => p.email?.toLowerCase() === TEST_EMAIL.toLowerCase()
  116 |     );
  117 | 
  118 |     let filteredProfiles = [];
  119 |     try {
  120 |       filteredProfiles = JSON.parse(filteredBody);
  121 |     } catch (e) {
  122 |       console.log(`Could not parse filtered response: ${e.message}`);
  123 |     }
  124 | 
  125 |     const found = userProfile || (Array.isArray(filteredProfiles) && filteredProfiles.length > 0);
  126 | 
  127 |     if (found) {
  128 |       console.log(`Found user profile for: ${TEST_EMAIL}`);
  129 |     } else {
  130 |       console.log(`User NOT found. All emails: ${allEmails.join(', ') || '(none — table may be empty or RLS blocks anon reads)'}`);
  131 |     }
  132 | 
  133 |     expect(
  134 |       found,
  135 |       `Expected to find email "${TEST_EMAIL}" in user_profiles. Found ${profiles.length} profiles. Emails: ${allEmails.join(', ') || '(none — RLS may block anon reads)'}`
> 136 |     ).toBeTruthy();
      |       ^ Error: Expected to find email "testuser+1775476821013@poolpulse-test.com" in user_profiles. Found 0 profiles. Emails: (none — RLS may block anon reads)
  137 |   });
  138 | 
  139 |   test('Test 3 — No "Database error saving new user" message', async ({ page }) => {
  140 |     // 1. Navigate to dashboard signup page
  141 |     await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });
  142 | 
  143 |     // Wait for auth screen
  144 |     const authScreen = page.locator('#authScreen');
  145 |     await expect(authScreen).toBeVisible({ timeout: 15000 });
  146 | 
  147 |     // 2. Attempt signup with a new unique email
  148 |     const signupEmail = `testuser+err${Date.now()}@poolpulse-test.com`;
  149 |     await page.locator('#authEmail').fill(signupEmail);
  150 |     await page.locator('#authPassword').fill(TEST_PASSWORD);
  151 |     await page.locator('#signUpBtn').click();
  152 | 
  153 |     // Wait for the signup to complete
  154 |     await expect(page.locator('#signUpBtn')).toHaveText('Create account', { timeout: 15000 });
  155 | 
  156 |     // Give a moment for any error to render
  157 |     await page.waitForTimeout(2000);
  158 | 
  159 |     // 3. Assert "Database error saving new user" does NOT appear on the page
  160 |     const pageContent = await page.textContent('body');
  161 | 
  162 |     if (await page.locator('#authError').isVisible()) {
  163 |       const errorText = await page.locator('#authError').textContent();
  164 |       console.log(`Auth message text: "${errorText}"`);
  165 |     }
  166 | 
  167 |     expect(
  168 |       pageContent,
  169 |       'Page should not contain "Database error saving new user"'
  170 |     ).not.toContain('Database error saving new user');
  171 | 
  172 |     console.log('Confirmed: No "Database error saving new user" message found on the page.');
  173 |   });
  174 | });
  175 | 
```