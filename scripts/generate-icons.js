import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// アイコンサイズの定義
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// publicディレクトリのパス
const publicDir = join(process.cwd(), 'public');

// アイコンを描画する関数
function drawIcon(canvas, ctx, size) {
  // 背景色（青のグラデーション）
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6'); // blue-500
  gradient.addColorStop(1, '#1d4ed8'); // blue-700
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // 角を丸くする
  const radius = size * 0.15;
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  
  // アイコンのシンボル（音符と変換矢印）
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.05;
  ctx.lineCap = 'round';
  
  // 音符の描画
  const centerX = size * 0.5;
  const centerY = size * 0.5;
  const noteSize = size * 0.3;
  
  // 音符の円
  ctx.beginPath();
  ctx.arc(centerX - noteSize * 0.3, centerY + noteSize * 0.2, noteSize * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  // 音符の棒
  ctx.beginPath();
  ctx.moveTo(centerX - noteSize * 0.15, centerY + noteSize * 0.2);
  ctx.lineTo(centerX - noteSize * 0.15, centerY - noteSize * 0.4);
  ctx.stroke();
  
  // 変換矢印（→）
  ctx.beginPath();
  ctx.moveTo(centerX - noteSize * 0.1, centerY - noteSize * 0.1);
  ctx.lineTo(centerX + noteSize * 0.3, centerY - noteSize * 0.1);
  ctx.stroke();
  
  // 矢印の先端
  ctx.beginPath();
  ctx.moveTo(centerX + noteSize * 0.2, centerY - noteSize * 0.2);
  ctx.lineTo(centerX + noteSize * 0.3, centerY - noteSize * 0.1);
  ctx.lineTo(centerX + noteSize * 0.2, centerY);
  ctx.stroke();
  
  // MP3テキスト
  ctx.font = `${size * 0.12}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('MP3', centerX + noteSize * 0.1, centerY + noteSize * 0.5);
}

// 各サイズのアイコンを生成
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  drawIcon(canvas, ctx, size);
  
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}x${size}.png`;
  const filepath = join(publicDir, filename);
  
  writeFileSync(filepath, buffer);
  console.log(`Generated: ${filename}`);
});

// favicon.icoとapple-touch-icon.pngも作成
const faviconCanvas = createCanvas(32, 32);
const faviconCtx = faviconCanvas.getContext('2d');
drawIcon(faviconCanvas, faviconCtx, 32);
writeFileSync(join(publicDir, 'favicon.ico'), faviconCanvas.toBuffer('image/png'));

const appleCanvas = createCanvas(180, 180);
const appleCtx = appleCanvas.getContext('2d');
drawIcon(appleCanvas, appleCtx, 180);
writeFileSync(join(publicDir, 'apple-touch-icon.png'), appleCanvas.toBuffer('image/png'));

console.log('All icons generated successfully!');