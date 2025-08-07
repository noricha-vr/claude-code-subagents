import type {
  ConversionResult,
  DownloadOptions,
  BatchDownloadOptions,
  DownloadResult,
  BatchDownloadResult,
  DownloadErrorType,
  DownloadProgress,
  BatchDownloadProgress,
  FileUploadItem
} from '../types';

// JSZip for creating ZIP archives
declare global {
  interface Window {
    JSZip: any;
  }
}

/**
 * Download Error class for standardized error handling
 */
export class DownloadErrorClass extends Error {
  public readonly type: DownloadErrorType;
  public readonly originalError?: Error;
  public readonly fileId?: string;

  constructor(
    type: DownloadErrorType,
    message: string,
    originalError?: Error,
    fileId?: string
  ) {
    super(message);
    this.name = 'DownloadErrorClass';
    this.type = type;
    this.originalError = originalError;
    this.fileId = fileId;
  }
}

/**
 * Generate a sanitized filename for downloads
 */
export function generateDownloadFilename(
  originalName: string,
  options: DownloadOptions = {}
): string {
  const { format = 'mp3', useOriginalName = true } = options;
  
  if (options.filename) {
    return sanitizeFilename(options.filename);
  }
  
  if (useOriginalName) {
    // Remove original extension and add .mp3
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return sanitizeFilename(`${nameWithoutExt}.${format}`);
  }
  
  // Generate timestamp-based filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `converted-${timestamp}.${format}`;
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid characters
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .replace(/^_|_$/g, '')         // Remove leading/trailing underscores
    .substring(0, 255);            // Limit length
}

/**
 * Create a Blob URL for download
 */
export function createDownloadBlob(
  data: Uint8Array,
  mimeType: string = 'audio/mpeg'
): Blob {
  try {
    return new Blob([data], { type: mimeType });
  } catch (error) {
    throw new DownloadErrorClass(
      'BLOB_CREATION_ERROR',
      `Failed to create download blob: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Trigger browser download of a file
 */
export function triggerDownload(
  blob: Blob,
  filename: string,
  onProgress?: (progress: DownloadProgress) => void
): DownloadResult {
  const startTime = Date.now();
  
  try {
    // Create object URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Schedule cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    // Simulate progress updates
    if (onProgress) {
      const fileId = `download-${Date.now()}`;
      const totalBytes = blob.size;
      
      // Simulate download progress
      let bytesDownloaded = 0;
      const progressInterval = setInterval(() => {
        bytesDownloaded = Math.min(bytesDownloaded + totalBytes * 0.2, totalBytes);
        const percentage = Math.round((bytesDownloaded / totalBytes) * 100);
        
        onProgress({
          fileId,
          fileName: filename,
          stage: bytesDownloaded >= totalBytes ? 'completed' : 'downloading',
          percentage,
          bytesDownloaded,
          totalBytes,
          speed: formatSpeed(bytesDownloaded / (Date.now() - startTime) * 1000),
          timeRemaining: null
        });
        
        if (bytesDownloaded >= totalBytes) {
          clearInterval(progressInterval);
        }
      }, 200);
    }
    
    return {
      fileId: `download-${startTime}`,
      fileName: filename,
      success: true,
      downloadUrl: url,
      timestamp: new Date().toISOString(),
      fileSize: blob.size
    };
    
  } catch (error) {
    throw new DownloadErrorClass(
      'DOWNLOAD_FAILED',
      `Failed to trigger download: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Download a single converted MP3 file
 */
export async function downloadSingleFile(
  conversionResult: ConversionResult,
  options: DownloadOptions = {},
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  try {
    // Validate conversion result
    if (!conversionResult.success || !conversionResult.convertedData) {
      throw new DownloadErrorClass(
        'FILE_NOT_FOUND',
        'No converted data available for download',
        undefined,
        conversionResult.fileId
      );
    }
    
    // Generate filename
    const filename = generateDownloadFilename(conversionResult.originalFile.name, options);
    
    // Create blob
    const blob = createDownloadBlob(conversionResult.convertedData);
    
    // Trigger download
    return triggerDownload(blob, filename, onProgress);
    
  } catch (error) {
    if (error instanceof DownloadErrorClass) {
      throw error;
    }
    
    throw new DownloadErrorClass(
      'DOWNLOAD_FAILED',
      `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined,
      conversionResult.fileId
    );
  }
}

/**
 * Download multiple files as a ZIP archive
 */
export async function downloadMultipleFiles(
  conversionResults: ConversionResult[],
  options: BatchDownloadOptions = {},
  onProgress?: (progress: BatchDownloadProgress) => void
): Promise<BatchDownloadResult> {
  
  try {
    // Load JSZip if not available
    if (typeof window.JSZip === 'undefined') {
      await loadJSZip();
    }
    
    const {
      archiveName = `converted-audio-${new Date().toISOString().slice(0, 10)}.zip`,
      includeFailedFiles = false,
      compression = 'fast'
    } = options;
    
    // Filter results
    const validResults = conversionResults.filter(result => 
      result.success && result.convertedData && (includeFailedFiles || result.success)
    );
    
    if (validResults.length === 0) {
      throw new DownloadErrorClass(
        'FILE_NOT_FOUND',
        'No valid files available for download'
      );
    }
    
    // Create ZIP archive
    const zip = new window.JSZip();
    const results: DownloadResult[] = [];
    let totalSize = 0;
    
    // Add files to archive
    for (let i = 0; i < validResults.length; i++) {
      const result = validResults[i];
      const filename = generateDownloadFilename(result.originalFile.name);
      
      // Update progress
      if (onProgress) {
        onProgress({
          totalFiles: validResults.length,
          completedFiles: i,
          failedFiles: 0,
          overallPercentage: Math.round((i / validResults.length) * 50), // 50% for adding files
          currentFile: filename,
          stage: 'preparing',
          fileProgresses: [],
          archiveSize: totalSize,
        });
      }
      
      try {
        if (result.convertedData) {
          zip.file(filename, result.convertedData);
          totalSize += result.convertedData.length;
          
          results.push({
            fileId: result.fileId,
            fileName: filename,
            success: true,
            timestamp: new Date().toISOString(),
            fileSize: result.convertedData.length
          });
        }
      } catch (error) {
        results.push({
          fileId: result.fileId,
          fileName: filename,
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add file to archive',
          timestamp: new Date().toISOString(),
          fileSize: 0
        });
      }
    }
    
    // Generate archive
    if (onProgress) {
      onProgress({
        totalFiles: validResults.length,
        completedFiles: validResults.length,
        failedFiles: results.filter(r => !r.success).length,
        overallPercentage: 75, // 75% for generating
        stage: 'creating_archive',
        fileProgresses: [],
        archiveSize: totalSize,
      });
    }
    
    const compressionLevel = compression === 'best' ? 9 : compression === 'fast' ? 1 : 0;
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: compressionLevel
      }
    });
    
    // Trigger download
    if (onProgress) {
      onProgress({
        totalFiles: validResults.length,
        completedFiles: validResults.length,
        failedFiles: results.filter(r => !r.success).length,
        overallPercentage: 100,
        stage: 'downloading',
        fileProgresses: [],
        archiveSize: zipBlob.size,
      });
    }
    
    const downloadResult = triggerDownload(zipBlob, archiveName);
    
    return {
      results,
      archiveUrl: downloadResult.downloadUrl,
      archiveName,
      totalFiles: validResults.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      totalSize: zipBlob.size,
      success: true,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    if (error instanceof DownloadErrorClass) {
      throw error;
    }
    
    throw new DownloadErrorClass(
      'ARCHIVE_CREATION_ERROR',
      `Failed to create archive: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Load JSZip library dynamically
 */
async function loadJSZip(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.JSZip !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load JSZip library'));
    document.head.appendChild(script);
  });
}

/**
 * Format download speed
 */
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${Math.round(bytesPerSecond)} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${Math.round(bytesPerSecond / 1024)} KB/s`;
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
}

/**
 * Get downloadable files from upload items
 */
export function getDownloadableFiles(uploadItems: FileUploadItem[]): ConversionResult[] {
  return uploadItems
    .filter(item => item.status === 'success' && item.convertedData)
    .map(item => ({
      fileId: item.id,
      originalFile: item.file,
      convertedData: item.convertedData!.data,
      success: true,
      processingTime: 0, // This would be tracked during conversion
      outputFormat: 'mp3',
      bitrate: 128,
      timestamp: new Date().toISOString()
    }));
}

/**
 * Utility functions for components
 */
export const downloadUtils = {
  generateDownloadFilename,
  sanitizeFilename,
  createDownloadBlob,
  triggerDownload,
  getDownloadableFiles,
  formatFileSize: (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};