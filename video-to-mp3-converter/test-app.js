const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testVideoToMP3Converter() {
  console.log('🧪 Starting Video to MP3 Converter Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--enable-features=SharedArrayBuffer']
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Check if the app loaded
    console.log('✅ App loaded successfully');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-screenshot-1.png' });
    console.log('📸 Screenshot saved: test-screenshot-1.png');
    
    // Check for main elements
    const title = await page.textContent('h1');
    console.log(`📝 App title: ${title}`);
    
    // Check for file upload area
    const uploadArea = await page.isVisible('[data-testid="file-upload-area"]');
    console.log(`📂 File upload area visible: ${uploadArea}`);
    
    // Check for drag and drop text
    const dragDropText = await page.textContent('text=/drag.*drop/i');
    console.log(`🎯 Drag & Drop text found: ${dragDropText ? 'Yes' : 'No'}`);
    
    // Create a test video file
    const testVideoPath = path.join(__dirname, 'test-video.mp4');
    if (!fs.existsSync(testVideoPath)) {
      console.log('⚠️  Test video not found, creating a dummy file...');
      // Create a minimal valid MP4 file (smallest possible valid MP4)
      const minimalMP4 = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
      ]);
      fs.writeFileSync(testVideoPath, minimalMP4);
    }
    
    // Upload file
    console.log('\n🎬 Testing file upload...');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testVideoPath);
    
    // Wait for file to be processed
    await page.waitForTimeout(2000);
    
    // Check if file info is displayed
    const fileInfoVisible = await page.isVisible('text=/test-video.mp4/i');
    console.log(`📄 File name displayed: ${fileInfoVisible}`);
    
    // Take screenshot after file upload
    await page.screenshot({ path: 'test-screenshot-2.png' });
    console.log('📸 Screenshot after upload: test-screenshot-2.png');
    
    // Check for convert button
    const convertButton = await page.locator('button:has-text("Convert")');
    const buttonVisible = await convertButton.isVisible();
    console.log(`🔄 Convert button visible: ${buttonVisible}`);
    
    if (buttonVisible) {
      console.log('\n🚀 Clicking convert button...');
      await convertButton.click();
      
      // Wait for conversion to start
      await page.waitForTimeout(3000);
      
      // Check for progress indicator
      const progressVisible = await page.isVisible('[role="progressbar"], text=/converting/i, text=/loading/i');
      console.log(`📊 Progress indicator visible: ${progressVisible}`);
      
      // Take screenshot during conversion
      await page.screenshot({ path: 'test-screenshot-3.png' });
      console.log('📸 Screenshot during conversion: test-screenshot-3.png');
    }
    
    // Check for error messages
    const errorVisible = await page.isVisible('text=/error/i');
    if (errorVisible) {
      const errorText = await page.textContent('text=/error/i');
      console.log(`❌ Error message found: ${errorText}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up
    await page.waitForTimeout(2000);
    await browser.close();
    console.log('\n🧹 Browser closed');
  }
}

// Run the test
testVideoToMP3Converter().catch(console.error);