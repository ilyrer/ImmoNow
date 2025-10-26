/**
 * Document Preview Service
 * Universelles Vorschau-System für verschiedene Dateitypen
 */

export interface PreviewConfig {
  type: 'pdf' | 'image' | 'video' | 'office' | 'text' | 'unsupported';
  canPreview: boolean;
  previewUrl?: string;
  fallbackUrl?: string;
  thumbnailUrl?: string;
}

export interface PreviewOptions {
  width?: number;
  height?: number;
  quality?: number;
  page?: number; // For PDFs
}

export class DocumentPreviewService {
  private static instance: DocumentPreviewService;
  private thumbnailCache = new Map<string, string>();

  static getInstance(): DocumentPreviewService {
    if (!DocumentPreviewService.instance) {
      DocumentPreviewService.instance = new DocumentPreviewService();
    }
    return DocumentPreviewService.instance;
  }

  /**
   * Determine preview configuration for a document
   */
  getPreviewConfig(document: any, options: PreviewOptions = {}): PreviewConfig {
    const mimeType = document.mime_type || this.getMimeTypeFromExtension(document.title);
    const fileExtension = this.getFileExtension(document.title);

    // PDF Preview
    if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
      return {
        type: 'pdf',
        canPreview: true,
        previewUrl: this.generatePdfPreviewUrl(document.url, options),
        fallbackUrl: document.url,
        thumbnailUrl: this.generatePdfThumbnailUrl(document.url, options)
      };
    }

    // Image Preview
    if (mimeType.startsWith('image/')) {
      return {
        type: 'image',
        canPreview: true,
        previewUrl: this.generateImagePreviewUrl(document.url, options),
        fallbackUrl: document.url,
        thumbnailUrl: this.generateImageThumbnailUrl(document.url, options)
      };
    }

    // Video Preview
    if (mimeType.startsWith('video/')) {
      return {
        type: 'video',
        canPreview: true,
        previewUrl: document.url,
        fallbackUrl: document.url,
        thumbnailUrl: this.generateVideoThumbnailUrl(document.url, options)
      };
    }

    // Office Documents
    if (this.isOfficeDocument(mimeType, fileExtension)) {
      return {
        type: 'office',
        canPreview: this.canPreviewOfficeDocument(mimeType),
        previewUrl: this.generateOfficePreviewUrl(document.url, mimeType),
        fallbackUrl: document.url,
        thumbnailUrl: this.generateOfficeThumbnailUrl(document.url, mimeType)
      };
    }

    // Text Files
    if (mimeType.startsWith('text/') || this.isTextFile(fileExtension)) {
      return {
        type: 'text',
        canPreview: true,
        previewUrl: document.url,
        fallbackUrl: document.url
      };
    }

    // Unsupported
    return {
      type: 'unsupported',
      canPreview: false,
      fallbackUrl: document.url
    };
  }

  /**
   * Generate PDF preview URL
   */
  private generatePdfPreviewUrl(url: string, options: PreviewOptions): string {
    const params = new URLSearchParams();
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.page) params.set('page', options.page.toString());
    
    return `${url}?${params.toString()}`;
  }

  /**
   * Generate PDF thumbnail URL
   */
  private generatePdfThumbnailUrl(url: string, options: PreviewOptions): string {
    const params = new URLSearchParams();
    params.set('thumbnail', 'true');
    params.set('width', (options.width || 200).toString());
    params.set('height', (options.height || 200).toString());
    params.set('page', (options.page || 1).toString());
    
    return `${url}?${params.toString()}`;
  }

  /**
   * Generate image preview URL with optimization
   */
  private generateImagePreviewUrl(url: string, options: PreviewOptions): string {
    const params = new URLSearchParams();
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.quality) params.set('quality', options.quality.toString());
    params.set('format', 'webp'); // Optimize for web
    
    return `${url}?${params.toString()}`;
  }

  /**
   * Generate image thumbnail URL
   */
  private generateImageThumbnailUrl(url: string, options: PreviewOptions): string {
    const params = new URLSearchParams();
    params.set('thumbnail', 'true');
    params.set('width', (options.width || 200).toString());
    params.set('height', (options.height || 200).toString());
    params.set('quality', '80');
    params.set('format', 'webp');
    
    return `${url}?${params.toString()}`;
  }

  /**
   * Generate video thumbnail URL
   */
  private generateVideoThumbnailUrl(url: string, options: PreviewOptions): string {
    const params = new URLSearchParams();
    params.set('thumbnail', 'true');
    params.set('width', (options.width || 200).toString());
    params.set('height', (options.height || 200).toString());
    params.set('time', '10'); // 10 seconds into video
    
    return `${url}?${params.toString()}`;
  }

  /**
   * Generate Office document preview URL
   */
  private generateOfficePreviewUrl(url: string, mimeType: string): string {
    // Use Microsoft Office Online Viewer
    const encodedUrl = encodeURIComponent(url);
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  }

  /**
   * Generate Office document thumbnail URL
   */
  private generateOfficeThumbnailUrl(url: string, mimeType: string): string {
    // Use Google Docs Viewer for thumbnails
    const encodedUrl = encodeURIComponent(url);
    return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true&size=200x200`;
  }

  /**
   * Check if file is an Office document
   */
  private isOfficeDocument(mimeType: string, extension: string): boolean {
    const officeMimeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

    return officeMimeTypes.includes(mimeType) || officeExtensions.includes(extension);
  }

  /**
   * Check if Office document can be previewed
   */
  private canPreviewOfficeDocument(mimeType: string): boolean {
    const supportedOfficeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    return supportedOfficeTypes.includes(mimeType);
  }

  /**
   * Check if file is a text file
   */
  private isTextFile(extension: string): boolean {
    const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'php', 'py', 'java', 'cpp', 'c', 'h'];
    return textExtensions.includes(extension);
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(filename: string): string {
    const extension = this.getFileExtension(filename);
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Cache thumbnail URL
   */
  cacheThumbnail(key: string, url: string): void {
    this.thumbnailCache.set(key, url);
  }

  /**
   * Get cached thumbnail URL
   */
  getCachedThumbnail(key: string): string | undefined {
    return this.thumbnailCache.get(key);
  }

  /**
   * Clear thumbnail cache
   */
  clearThumbnailCache(): void {
    this.thumbnailCache.clear();
  }

  /**
   * Get preview dimensions based on container size
   */
  getOptimalDimensions(containerWidth: number, containerHeight: number, aspectRatio?: number): { width: number; height: number } {
    const maxWidth = Math.min(containerWidth, 1200);
    const maxHeight = Math.min(containerHeight, 800);

    if (aspectRatio) {
      const width = Math.min(maxWidth, maxHeight * aspectRatio);
      const height = width / aspectRatio;
      return { width, height };
    }

    return { width: maxWidth, height: maxHeight };
  }
}

// Export singleton instance
export const documentPreviewService = DocumentPreviewService.getInstance();
