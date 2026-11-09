import { test, expect } from '@playwright/test';

test.describe('Catalogue des composants (Dev)', () => {
  test('charge la page du catalogue et vérifie les composants principaux', async ({ page }) => {
    await page.goto('/dev/catalog');

    // Vérifie le titre
    await expect(page.locator('h1')).toContainText('Catalogue des composants partagés (Dev)');

    // Vérifie la présence de l'en-tête et du logo
    await expect(page.getByTestId('app-header')).toBeVisible();

    // Vérifie les boutons
    await expect(page.getByText('Utilisateur (Solid)')).toBeVisible();
    await expect(page.getByText('Soignant (Solid)')).toBeVisible();

    // Vérifie le graphique Z-score
    await expect(page.getByTestId('zscore-chart')).toBeVisible();
  });
});

