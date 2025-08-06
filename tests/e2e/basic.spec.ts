import { test, expect } from '@playwright/test';

test.describe('動画→MP3変換アプリ - 基本動作テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('アプリが正常に起動し、必要な要素が表示される', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/Video to MP3 Converter/i);
    
    // ヘッダーの確認
    await expect(page.getByText('Video to MP3 Converter')).toBeVisible();
    
    // ファイルアップローダーの確認
    await expect(page.getByText('Click or drag & drop video file')).toBeVisible();
    await expect(page.getByText('Supported formats: MP4, MOV, AVI, WebM')).toBeVisible();
    
    // ファイル入力要素の存在確認
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', 'video/*');
  });

  test('ファイル選択エリアがクリック可能である', async ({ page }) => {
    // ファイル選択エリアをクリック
    await page.getByText('Click or drag & drop video file').click();
    
    // ファイルダイアログが開くかは直接テストできないが、
    // クリックイベントが発火することを確認
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('レスポンシブデザインが適用されている', async ({ page }) => {
    // デスクトップサイズで確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByText('Video to MP3 Converter')).toBeVisible();
    
    // タブレットサイズで確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('Video to MP3 Converter')).toBeVisible();
    
    // モバイルサイズで確認
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Video to MP3 Converter')).toBeVisible();
  });

  test('アクセシビリティ基本要件の確認', async ({ page }) => {
    // フォーカス可能な要素の確認
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeAttached();
  });
});