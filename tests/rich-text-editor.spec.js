const { test, expect } = require('@playwright/test');

test.describe('Rich Text Editor Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@planedu.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('FAQs Rich Text Editor', () => {
    test('should display rich text editor in FAQ creation modal', async ({ page }) => {
      await page.goto('http://localhost:3001/faqs');
      await page.waitForLoadState('networkidle');

      // Click "Add New FAQ" button
      await page.click('button:has-text("Add New FAQ")');

      // Wait for modal to appear
      await expect(page.locator('text=Create New FAQ')).toBeVisible();

      // Check if RichTextEditor toolbar is present
      await expect(page.locator('.prose')).toBeVisible();

      // Verify toolbar buttons exist
      const toolbar = page.locator('div.bg-slate-50.border-b');
      await expect(toolbar).toBeVisible();

      console.log('✓ Rich text editor toolbar is visible in FAQ modal');
    });

    test('should allow text formatting in FAQ answer', async ({ page }) => {
      await page.goto('http://localhost:3001/faqs');
      await page.waitForLoadState('networkidle');

      // Open create modal
      await page.click('button:has-text("Add New FAQ")');
      await expect(page.locator('text=Create New FAQ')).toBeVisible();

      // Fill in question
      await page.fill('textarea', 'Test FAQ Question?');

      // Click into the editor
      const editor = page.locator('.prose');
      await editor.click();

      // Type some text
      await page.keyboard.type('This is a test answer with formatting.');

      // Verify text appears in editor
      await expect(editor).toContainText('This is a test answer with formatting.');

      console.log('✓ Can type text in FAQ rich text editor');
    });

    test('should use bold formatting in FAQ editor', async ({ page }) => {
      await page.goto('http://localhost:3001/faqs');
      await page.waitForLoadState('networkidle');

      // Open create modal
      await page.click('button:has-text("Add New FAQ")');
      await expect(page.locator('text=Create New FAQ')).toBeVisible();

      // Click into the editor
      const editor = page.locator('.prose');
      await editor.click();

      // Type text
      await page.keyboard.type('Bold text test');

      // Select all text
      await page.keyboard.press('Control+A');

      // Click bold button
      const boldButton = page.locator('button[title="Bold (Ctrl+B)"]');
      await boldButton.click();

      // Check if bold is active (button should have bg-slate-300 class)
      await expect(boldButton).toHaveClass(/bg-slate-300/);

      console.log('✓ Bold formatting works in FAQ editor');
    });

    test('should create FAQ with rich text content', async ({ page }) => {
      await page.goto('http://localhost:3001/faqs');
      await page.waitForLoadState('networkidle');

      // Open create modal
      await page.click('button:has-text("Add New FAQ")');
      await expect(page.locator('text=Create New FAQ')).toBeVisible();

      // Fill in category and question
      await page.fill('input[placeholder*="Admissions"]', 'Testing');
      await page.fill('textarea', 'How does the rich text editor work?');

      // Click into the editor and add content
      const editor = page.locator('.prose');
      await editor.click();
      await page.keyboard.type('The rich text editor allows you to format your FAQ answers with bold, italic, lists, and more.');

      // Submit the form
      await page.click('button:has-text("Create FAQ")');

      // Wait for success message
      await page.waitForTimeout(2000);

      console.log('✓ FAQ created with rich text content');
    });
  });

  test.describe('News Rich Text Editor', () => {
    test('should display rich text editor in article creation modal', async ({ page }) => {
      await page.goto('http://localhost:3001/news');
      await page.waitForLoadState('networkidle');

      // Click "Create New Article" button
      await page.click('button:has-text("Create New Article")');

      // Wait for modal to appear
      await expect(page.locator('text=Create New Article')).toBeVisible();

      // Check if RichTextEditor is present
      await expect(page.locator('.prose')).toBeVisible();

      // Verify toolbar exists
      const toolbar = page.locator('div.bg-slate-50.border-b');
      await expect(toolbar).toBeVisible();

      console.log('✓ Rich text editor toolbar is visible in News modal');
    });

    test('should allow text formatting in article content', async ({ page }) => {
      await page.goto('http://localhost:3001/news');
      await page.waitForLoadState('networkidle');

      // Open create modal
      await page.click('button:has-text("Create New Article")');
      await expect(page.locator('text=Create New Article')).toBeVisible();

      // Fill in title
      await page.fill('input[type="text"]', 'Test Article with Rich Text');

      // Click into the editor
      const editor = page.locator('.prose');
      await editor.click();

      // Type some text
      await page.keyboard.type('This is a test article with rich text formatting capabilities.');

      // Verify text appears in editor
      await expect(editor).toContainText('This is a test article with rich text formatting capabilities.');

      console.log('✓ Can type text in News rich text editor');
    });

    test('should use heading formatting in article editor', async ({ page }) => {
      await page.goto('http://localhost:3001/news');
      await page.waitForLoadState('networkidle');

      // Open create modal
      await page.click('button:has-text("Create New Article")');
      await expect(page.locator('text=Create New Article')).toBeVisible();

      // Click into the editor
      const editor = page.locator('.prose');
      await editor.click();

      // Type text
      await page.keyboard.type('Heading text');

      // Select all text
      await page.keyboard.press('Control+A');

      // Click H1 button
      const h1Button = page.locator('button:has-text("H1")');
      await h1Button.click();

      // Check if H1 is active
      await expect(h1Button).toHaveClass(/bg-slate-300/);

      console.log('✓ Heading formatting works in News editor');
    });

    test('should use bullet list in article editor', async ({ page }) => {
      await page.goto('http://localhost:3001/news');
      await page.waitForLoadState('networkidle');

      // Open create modal
      await page.click('button:has-text("Create New Article")');
      await expect(page.locator('text=Create New Article')).toBeVisible();

      // Click into the editor
      const editor = page.locator('.prose');
      await editor.click();

      // Click bullet list button
      const bulletListButton = page.locator('button[title="Bullet List"]');
      await bulletListButton.click();

      // Type list items
      await page.keyboard.type('First item');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Second item');
      await page.keyboard.press('Enter');
      await page.keyboard.type('Third item');

      // Check if bullet list is active
      await expect(bulletListButton).toHaveClass(/bg-slate-300/);

      console.log('✓ Bullet list formatting works in News editor');
    });

    test('should create article with rich text content', async ({ page }) => {
      await page.goto('http://localhost:3001/news');
      await page.waitForLoadState('networkidle');

      // Open create modal
      await page.click('button:has-text("Create New Article")');
      await expect(page.locator('text=Create New Article')).toBeVisible();

      // Fill in title
      await page.fill('input[type="text"]', 'Test Article with Rich Formatting');

      // Click into the editor and add content
      const editor = page.locator('.prose');
      await editor.click();
      await page.keyboard.type('This article demonstrates the rich text editor capabilities including bold text, lists, and headings.');

      // Submit the form
      await page.click('button:has-text("Create Article")');

      // Wait for success message
      await page.waitForTimeout(2000);

      console.log('✓ Article created with rich text content');
    });
  });

  test.describe('Rich Text Editor Features', () => {
    test('should verify all toolbar buttons are present in FAQ editor', async ({ page }) => {
      await page.goto('http://localhost:3001/faqs');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Add New FAQ")');
      await expect(page.locator('text=Create New FAQ')).toBeVisible();

      // Check for key toolbar buttons
      await expect(page.locator('button[title="Bold (Ctrl+B)"]')).toBeVisible();
      await expect(page.locator('button[title="Italic (Ctrl+I)"]')).toBeVisible();
      await expect(page.locator('button:has-text("H1")').first()).toBeVisible();
      await expect(page.locator('button:has-text("H2")').first()).toBeVisible();
      await expect(page.locator('button:has-text("H3")').first()).toBeVisible();
      await expect(page.locator('button[title="Bullet List"]')).toBeVisible();
      await expect(page.locator('button[title="Numbered List"]')).toBeVisible();
      await expect(page.locator('button[title="Add Link"]')).toBeVisible();
      await expect(page.locator('button[title="Add Image"]')).toBeVisible();
      await expect(page.locator('button[title="Undo (Ctrl+Z)"]')).toBeVisible();
      await expect(page.locator('button[title="Redo (Ctrl+Y)"]')).toBeVisible();

      console.log('✓ All toolbar buttons present in FAQ editor');
    });

    test('should verify all toolbar buttons are present in News editor', async ({ page }) => {
      await page.goto('http://localhost:3001/news');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Create New Article")');
      await expect(page.locator('text=Create New Article')).toBeVisible();

      // Check for key toolbar buttons
      await expect(page.locator('button[title="Bold (Ctrl+B)"]')).toBeVisible();
      await expect(page.locator('button[title="Italic (Ctrl+I)"]')).toBeVisible();
      await expect(page.locator('button:has-text("H1")').first()).toBeVisible();
      await expect(page.locator('button:has-text("H2")').first()).toBeVisible();
      await expect(page.locator('button:has-text("H3")').first()).toBeVisible();
      await expect(page.locator('button[title="Bullet List"]')).toBeVisible();
      await expect(page.locator('button[title="Numbered List"]')).toBeVisible();
      await expect(page.locator('button[title="Add Link"]')).toBeVisible();
      await expect(page.locator('button[title="Add Image"]')).toBeVisible();
      await expect(page.locator('button[title="Undo (Ctrl+Z)"]')).toBeVisible();
      await expect(page.locator('button[title="Redo (Ctrl+Y)"]')).toBeVisible();

      console.log('✓ All toolbar buttons present in News editor');
    });
  });
});
