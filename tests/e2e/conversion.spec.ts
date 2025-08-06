import { test, expect } from '@playwright/test';
import { join } from 'path';

test.describe('動画→MP3変換機能テスト', () => {
  const testVideoPath = join(process.cwd(), 'movies', 'test-sample.mp4');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('動画ファイルをアップロードし、変換処理が開始される', async ({ page }) => {
    // ファイル選択
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);

    // ファイルが選択されたことを確認
    // （ファイル名やサイズが表示される、変換ボタンが表示されるなど）
    await expect(page.getByText(/test-sample\.mp4/i)).toBeVisible({ timeout: 10000 });

    // 変換開始ボタンが表示されることを確認
    const convertButton = page.getByRole('button', { name: /convert/i });
    await expect(convertButton).toBeVisible();
    await expect(convertButton).toBeEnabled();
  });

  test('変換処理の進行状況が表示される', async ({ page }) => {
    // ファイル選択
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);

    // 変換開始
    await page.getByRole('button', { name: /convert/i }).click();

    // 進行状況の表示を確認
    await expect(page.getByText(/converting/i)).toBeVisible({ timeout: 5000 });
    
    // プログレスバーの表示を確認
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible({ timeout: 5000 });
  });

  test('変換完了後にダウンロードボタンが表示される', async ({ page }) => {
    // ファイル選択
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);

    // 変換開始
    await page.getByRole('button', { name: /convert/i }).click();

    // 変換完了を待機（タイムアウトを長めに設定）
    await expect(page.getByText(/conversion completed/i)).toBeVisible({ timeout: 30000 });
    
    // ダウンロードボタンの表示を確認
    const downloadButton = page.getByRole('button', { name: /download/i });
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();
  });

  test('ドラッグ&ドロップでファイルをアップロードできる', async ({ page }) => {
    // ドロップゾーンを取得
    const dropzone = page.getByText('Click or drag & drop video file').locator('..');

    // ファイルをドラッグ&ドロップ
    await dropzone.setInputFiles(testVideoPath);

    // ファイルが選択されたことを確認
    await expect(page.getByText(/test-sample\.mp4/i)).toBeVisible({ timeout: 10000 });
  });

  test('変換中は新しいファイル選択が無効になる', async ({ page }) => {
    // ファイル選択
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);

    // 変換開始
    await page.getByRole('button', { name: /convert/i }).click();

    // 変換中はファイル選択エリアが無効になることを確認
    await expect(page.getByText(/converting/i)).toBeVisible({ timeout: 5000 });
    
    // ファイル入力が無効になっていることを確認
    await expect(fileInput).toBeDisabled();
  });
});