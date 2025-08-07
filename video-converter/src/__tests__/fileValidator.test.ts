import { describe, it, expect } from 'vitest';
import { FileValidator } from '@/utils/fileValidator';

// Mock File constructor for testing
class MockFile implements File {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string;

  constructor(name: string, size: number, type: string) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.lastModified = Date.now();
    this.webkitRelativePath = '';
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented.');
  }

  slice(): Blob {
    throw new Error('Method not implemented.');
  }

  stream(): ReadableStream<Uint8Array> {
    throw new Error('Method not implemented.');
  }

  text(): Promise<string> {
    throw new Error('Method not implemented.');
  }
}

describe('FileValidator', () => {
  describe('validateFile', () => {
    it('should validate a valid MP4 file', () => {
      const file = new MockFile('test.mp4', 10 * 1024 * 1024, 'video/mp4'); // 10MB
      const result = FileValidator.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const file = new MockFile('large.mp4', 600 * 1024 * 1024, 'video/mp4'); // 600MB
      const result = FileValidator.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.type).toBe('file_too_large');
      expect(result.error?.message).toContain('File size too large');
    });

    it('should reject files that are too small', () => {
      const file = new MockFile('tiny.mp4', 500, 'video/mp4'); // 500 bytes
      const result = FileValidator.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.type).toBe('file_too_large');
      expect(result.error?.message).toContain('File size too small');
    });

    it('should validate files with supported extensions even without MIME type', () => {
      const file = new MockFile('test.avi', 10 * 1024 * 1024, ''); // No MIME type
      const result = FileValidator.validateFile(file);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject unsupported file formats', () => {
      const file = new MockFile('document.pdf', 1024 * 1024, 'application/pdf');
      const result = FileValidator.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.type).toBe('unsupported_format');
      expect(result.error?.message).toContain('Unsupported file format');
    });

    it('should validate all supported video formats', () => {
      const supportedFormats = [
        { ext: 'mp4', type: 'video/mp4' },
        { ext: 'avi', type: 'video/avi' },
        { ext: 'mov', type: 'video/mov' },
        { ext: 'mkv', type: 'video/mkv' },
        { ext: 'webm', type: 'video/webm' },
        { ext: 'wmv', type: 'video/wmv' },
        { ext: 'flv', type: 'video/flv' },
        { ext: '3gp', type: 'video/3gp' },
        { ext: 'ogv', type: 'video/ogv' }
      ];

      supportedFormats.forEach(format => {
        const file = new MockFile(`test.${format.ext}`, 10 * 1024 * 1024, format.type);
        const result = FileValidator.validateFile(file);
        
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateMultipleFiles', () => {
    it('should validate multiple valid files', () => {
      const files = [
        new MockFile('test1.mp4', 10 * 1024 * 1024, 'video/mp4'),
        new MockFile('test2.avi', 15 * 1024 * 1024, 'video/avi'),
        new MockFile('test3.mov', 20 * 1024 * 1024, 'video/mov')
      ];
      
      const result = FileValidator.validateMultipleFiles(files);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty file list', () => {
      const result = FileValidator.validateMultipleFiles([]);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('No files selected');
    });

    it('should reject too many files', () => {
      const files = Array(15).fill(null).map((_, i) => 
        new MockFile(`test${i}.mp4`, 10 * 1024 * 1024, 'video/mp4')
      );
      
      const result = FileValidator.validateMultipleFiles(files);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('Too many files');
    });

    it('should reject if total size is too large', () => {
      const files = [
        new MockFile('large1.mp4', 400 * 1024 * 1024, 'video/mp4'),
        new MockFile('large2.mp4', 400 * 1024 * 1024, 'video/mp4'),
        new MockFile('large3.mp4', 400 * 1024 * 1024, 'video/mp4')
      ];
      
      const result = FileValidator.validateMultipleFiles(files);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('Total file size too large');
    });

    it('should reject if any individual file is invalid', () => {
      const files = [
        new MockFile('valid.mp4', 10 * 1024 * 1024, 'video/mp4'),
        new MockFile('invalid.pdf', 1024 * 1024, 'application/pdf')
      ];
      
      const result = FileValidator.validateMultipleFiles(files);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.type).toBe('unsupported_format');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(FileValidator.formatFileSize(0)).toBe('0 Bytes');
      expect(FileValidator.formatFileSize(500)).toBe('500 Bytes');
      expect(FileValidator.formatFileSize(1024)).toBe('1 KB');
      expect(FileValidator.formatFileSize(1536)).toBe('1.5 KB');
      expect(FileValidator.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(FileValidator.formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(FileValidator.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('getSupportedFormats', () => {
    it('should return list of supported formats', () => {
      const formats = FileValidator.getSupportedFormats();
      
      expect(formats).toBeInstanceOf(Array);
      expect(formats.length).toBeGreaterThan(0);
      expect(formats).toContain('mp4');
      expect(formats).toContain('avi');
      expect(formats).toContain('mov');
    });
  });

  describe('getMaxFileSize', () => {
    it('should return maximum file size', () => {
      const maxSize = FileValidator.getMaxFileSize();
      
      expect(typeof maxSize).toBe('number');
      expect(maxSize).toBeGreaterThan(0);
    });
  });
});