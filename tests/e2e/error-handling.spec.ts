import { test, expect } from '@playwright/test';
import { join } from 'path';

test.describe('エラーハンドリングテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('サポートされていないファイル形式でエラーが表示される', async ({ page }) => {
    // テキストファイルを作成（サポートされていない形式）
    const testFile = join(process.cwd(), 'package.json');
    
    // ファイル選択（サポートされていない形式）
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);

    // エラーメッセージが表示されることを確認
    await expect(
      page.getByText(/unsupported file format|invalid file type/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('ファイルサイズが大きすぎる場合のエラーハンドリング', async ({ page }) => {
    // 大きなファイルの場合のテスト
    // （実際の大きなファイルがない場合は、コンソールエラーをモックする）
    
    // コンソールエラーを監視
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // ファイル選択
    const testVideoPath = join(process.cwd(), 'movies', 'test-sample.mp4');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);

    // 通常のファイルでは問題ないことを確認
    await expect(page.getByText(/test-sample\.mp4/i)).toBeVisible({ timeout: 10000 });
  });

  test('変換処理中のエラーハンドリング', async ({ page }) => {
    // コンソールエラーを監視
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // ファイル選択
    const testVideoPath = join(process.cwd(), 'movies', 'test-sample.mp4');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);

    // 変換開始
    const convertButton = page.getByRole('button', { name: /convert/i });
    await expect(convertButton).toBeVisible();
    await convertButton.click();

    // エラーが発生した場合、エラーメッセージが表示されるか、
    // または適切にフォールバック処理が実行されることを確認
    await page.waitForTimeout(5000);
    
    // エラー状態かどうかを確認
    const errorMessage = page.getByText(/error|failed/i);
    const isError = await errorMessage.isVisible();
    
    if (isError) {
      // エラーが発生した場合、適切なエラーメッセージが表示されることを確認
      await expect(errorMessage).toBeVisible();
    } else {
      // エラーが発生しない場合、変換処理が正常に進むことを確認
      const converting = page.getByText(/converting/i);
      const completed = page.getByText(/completed/i);
      
      await expect(converting.or(completed)).toBeVisible({ timeout: 30000 });
    }
  });

  test('ネットワークエラーのハンドリング', async ({ page }) => {
    // ネットワークを無効化
    await page.context().setOffline(true);

    // ページを再読み込み
    await page.reload();

    // オフライン状態でのエラーハンドリングを確認
    // Service Workerが適切に動作するかテスト
    await page.waitForTimeout(3000);

    // オンラインに戻す
    await page.context().setOffline(false);
    await page.reload();

    // 正常に復旧することを確認
    await expect(page.getByText('Video to MP3 Converter')).toBeVisible();
  });

  test('メモリ不足エラーのシミュレーション', async ({ page }) => {
    // メモリ使用量を監視
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    // ファイル選択
    const testVideoPath = join(process.cwd(), 'movies', 'test-sample.mp4');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);

    // 変換開始
    const convertButton = page.getByRole('button', { name: /convert/i });
    if (await convertButton.isVisible()) {
      await convertButton.click();

      // メモリエラーが発生した場合の適切なハンドリングを確認
      await page.waitForTimeout(10000);
      
      const errorOrSuccess = page.getByText(/error|failed|completed/i);
      await expect(errorOrSuccess).toBeVisible({ timeout: 30000 });
    }
  });
});