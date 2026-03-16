import { test, expect } from '@playwright/test';

test.describe('Integration: login，add transaction， Dashboard', () => {
  test('after adding a transaction, dashboard shows the new transaction or updated summary', async ({
    page,
  }) => {
    const uniqueNote = `E2E integration ${Date.now()}`;
    const amount = '99.99';

    await page.goto('/login');
    await page.getByLabel(/username or email/i).fill('integrationtest@test.com');
    await page.getByLabel(/password/i).fill('demo12!@');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/transactions');
    await page.getByRole('button', { name: /\+ add/i }).click();

    await expect(page.getByRole('dialog', { name: /add transaction/i })).toBeVisible();
    await page.getByLabel(/amount/i).fill(amount);
    await page.getByRole('button', { name: /select a category/i }).click();
    await page.locator('[role="listbox"] li, ul[class*="options"] li').first().click();
    await page.getByRole('button', { name: /select an account/i }).click();
    await page.locator('[role="listbox"] li, ul[class*="options"] li').first().click();
    await page.getByRole('textbox', { name: /notes/i }).fill(uniqueNote);
    await page.getByRole('dialog').getByRole('textbox', { name: /notes/i }).fill(uniqueNote);
    await page.getByRole('button', { name: /add expense/i }).click();

    await expect(page.getByRole('dialog', { name: 'Add Transaction' })).not.toBeVisible({ timeout: 5000 });

    await page.goto('/dashboard');
    await expect(
      page.getByText(uniqueNote).or(page.getByText(amount)).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
