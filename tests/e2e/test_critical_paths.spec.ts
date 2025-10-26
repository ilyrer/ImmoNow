import { test, expect } from '@playwright/test';

test.describe('Critical Path E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigiere zur Login-Seite
    await page.goto('/login');
  });

  test('Login → Property Create → Upload → Metrics Widget', async ({ page }) => {
    // 1. Login Flow
    await test.step('Login Flow', async () => {
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      
      // Warte auf Dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    });

    // 2. Property Creation
    await test.step('Property Creation', async () => {
      await page.click('[data-testid="create-property-button"]');
      
      // Fülle Property-Formular aus
      await page.fill('[data-testid="property-title"]', 'Test Property E2E');
      await page.fill('[data-testid="property-location"]', 'Hamburg');
      await page.fill('[data-testid="property-price"]', '500000');
      await page.selectOption('[data-testid="property-type"]', 'apartment');
      await page.fill('[data-testid="property-area"]', '120');
      
      // Speichere Property
      await page.click('[data-testid="save-property-button"]');
      
      // Verifiziere dass Property erstellt wurde
      await expect(page.locator('[data-testid="property-success-message"]')).toBeVisible();
      await expect(page.locator('text=Test Property E2E')).toBeVisible();
    });

    // 3. Document Upload (Storage Check)
    await test.step('Document Upload with Storage Check', async () => {
      // Navigiere zur Property-Detail-Seite
      await page.click('text=Test Property E2E');
      
      // Klicke auf Upload-Button
      await page.click('[data-testid="upload-document-button"]');
      
      // Erstelle Test-Datei
      const testFile = new File(['Test document content'], 'test-document.pdf', {
        type: 'application/pdf'
      });
      
      // Upload Datei
      await page.setInputFiles('[data-testid="file-input"]', testFile);
      
      // Verifiziere Upload-Status
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      
      // Warte auf Upload-Abschluss
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });
    });

    // 4. Metrics Widget zeigt echte Werte
    await test.step('Metrics Widget shows real data', async () => {
      // Navigiere zum Analytics-Dashboard
      await page.click('[data-testid="analytics-tab"]');
      
      // Warte auf Property Performance Widget
      await expect(page.locator('[data-testid="property-performance-widget"]')).toBeVisible();
      
      // Verifiziere dass echte Daten angezeigt werden (nicht Math.random())
      const viewsElement = page.locator('[data-testid="property-views"]');
      const inquiriesElement = page.locator('[data-testid="property-inquiries"]');
      
      await expect(viewsElement).toBeVisible();
      await expect(inquiriesElement).toBeVisible();
      
      // Verifiziere dass Werte numerisch sind und nicht zufällig
      const viewsText = await viewsElement.textContent();
      const inquiriesText = await inquiriesElement.textContent();
      
      expect(viewsText).toMatch(/^\d+$/); // Sollte nur Zahlen enthalten
      expect(inquiriesText).toMatch(/^\d+$/); // Sollte nur Zahlen enthalten
      
      // Verifiziere dass Werte konsistent sind (nicht bei jedem Reload anders)
      await page.reload();
      await expect(page.locator('[data-testid="property-performance-widget"]')).toBeVisible();
      
      const viewsTextAfterReload = await viewsElement.textContent();
      const inquiriesTextAfterReload = await inquiriesElement.textContent();
      
      expect(viewsTextAfterReload).toBe(viewsText);
      expect(inquiriesTextAfterReload).toBe(inquiriesText);
    });

    // 5. Usage Widget zeigt aktuelle Limits
    await test.step('Usage Widget shows current limits', async () => {
      // Navigiere zum Dashboard
      await page.click('[data-testid="dashboard-tab"]');
      
      // Verifiziere dass Usage Widget sichtbar ist
      await expect(page.locator('[data-testid="usage-widget"]')).toBeVisible();
      
      // Verifiziere Storage-Anzeige
      const storageElement = page.locator('[data-testid="storage-usage"]');
      await expect(storageElement).toBeVisible();
      
      // Verifiziere dass Storage-Wert größer als 0 ist (wegen Upload)
      const storageText = await storageElement.textContent();
      expect(storageText).toContain('GB');
      
      // Verifiziere dass Progress Bar angezeigt wird
      await expect(page.locator('[data-testid="storage-progress-bar"]')).toBeVisible();
    });
  });

  test('Storage Limit Enforcement', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');

    // Simuliere Storage-Limit erreicht
    await test.step('Simulate storage limit reached', async () => {
      // Mock API Response für Storage-Limit
      await page.route('**/api/v1/billing/usage/summary', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: { current: 5, limit: 10, percentage: 50 },
            storage: { current_gb: 9.8, limit_gb: 10, percentage: 98 },
            properties: { current: 15, limit: 20, percentage: 75 }
          })
        });
      });

      // Navigiere zu einer Property
      await page.click('[data-testid="properties-tab"]');
      await page.click('[data-testid="property-item"]:first-child');
      
      // Versuche große Datei zu uploaden
      const largeFile = new File(['x'.repeat(500 * 1024 * 1024)], 'large-file.pdf', {
        type: 'application/pdf'
      });
      
      await page.click('[data-testid="upload-document-button"]');
      await page.setInputFiles('[data-testid="file-input"]', largeFile);
      
      // Verifiziere dass Storage-Limit-Fehler angezeigt wird
      await expect(page.locator('[data-testid="storage-limit-error"]')).toBeVisible();
      await expect(page.locator('text=Storage limit reached')).toBeVisible();
    });
  });

  test('Property View Tracking', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');

    await test.step('Track property views', async () => {
      // Navigiere zu Properties
      await page.click('[data-testid="properties-tab"]');
      
      // Klicke auf erste Property
      await page.click('[data-testid="property-item"]:first-child');
      
      // Verifiziere dass View getrackt wurde
      await expect(page.locator('[data-testid="property-detail-page"]')).toBeVisible();
      
      // Warte kurz für API-Call
      await page.waitForTimeout(1000);
      
      // Navigiere zurück und wieder zur gleichen Property
      await page.click('[data-testid="back-button"]');
      await page.click('[data-testid="property-item"]:first-child');
      
      // Verifiziere dass View-Count erhöht wurde
      const viewCountElement = page.locator('[data-testid="property-view-count"]');
      await expect(viewCountElement).toBeVisible();
      
      // Verifiziere dass View-Count größer als 0 ist
      const viewCount = await viewCountElement.textContent();
      expect(parseInt(viewCount || '0')).toBeGreaterThan(0);
    });
  });

  test('Usage Banner Display', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');

    await test.step('Show usage banner at 80%', async () => {
      // Mock API Response für 80% Usage
      await page.route('**/api/v1/billing/usage/summary', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: { current: 8, limit: 10, percentage: 80 },
            storage: { current_gb: 8, limit_gb: 10, percentage: 80 },
            properties: { current: 16, limit: 20, percentage: 80 }
          })
        });
      });

      // Reload page
      await page.reload();
      
      // Verifiziere dass Usage Banner angezeigt wird
      await expect(page.locator('[data-testid="usage-banner"]')).toBeVisible();
      await expect(page.locator('text=Nutzungslimits erreichen')).toBeVisible();
      
      // Verifiziere dass Banner Warning-Style hat
      const banner = page.locator('[data-testid="usage-banner"]');
      await expect(banner).toHaveClass(/bg-yellow-50/);
    });

    await test.step('Show critical banner at 100%', async () => {
      // Mock API Response für 100% Usage
      await page.route('**/api/v1/billing/usage/summary', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: { current: 10, limit: 10, percentage: 100 },
            storage: { current_gb: 10, limit_gb: 10, percentage: 100 },
            properties: { current: 20, limit: 20, percentage: 100 }
          })
        });
      });

      // Reload page
      await page.reload();
      
      // Verifiziere dass kritischer Banner angezeigt wird
      await expect(page.locator('[data-testid="usage-banner"]')).toBeVisible();
      await expect(page.locator('text=Kritische Nutzungslimits erreicht')).toBeVisible();
      
      // Verifiziere dass Banner Critical-Style hat
      const banner = page.locator('[data-testid="usage-banner"]');
      await expect(banner).toHaveClass(/bg-red-50/);
    });
  });
});
