/**
 * EvaluationRequest model
 * 
 * Represents a user's submission of content for evaluation.
 * Validates input and manages state transitions.
 */

export interface FileReference {
  filename: string;
  file_path: string;
  file_type: 'pdf' | 'pptx' | 'docx';
  file_size: number;
  uploaded_at: Date;
}

export interface EvaluationRequestData {
  email: string;
  url?: string;
  uploaded_files?: FileReference[];
  user_provided_audience?: string;
  id?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  submitted_at?: Date;
  processing_started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  report_id?: string;
}

export class EvaluationRequest {
  public readonly id: string;
  public readonly email: string;
  public readonly url?: string;
  public readonly uploaded_files?: FileReference[];
  public readonly user_provided_audience?: string;
  private _status: 'pending' | 'processing' | 'completed' | 'failed';
  public readonly submitted_at: Date;
  public processing_started_at?: Date;
  public completed_at?: Date;
  public error_message?: string;
  public report_id?: string;

  constructor(data: EvaluationRequestData) {
    // Generate ID if not provided
    this.id = data.id || this.generateUUID();

    // Validate and set email
    if (!data.email) {
      throw new Error('Email is required');
    }
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    this.email = data.email;

    // Validate URL if provided
    if (data.url) {
      if (!this.isValidURL(data.url)) {
        throw new Error('Invalid URL format');
      }
      if (!this.isHTTPOrHTTPS(data.url)) {
        throw new Error('URL must be HTTP or HTTPS');
      }
      this.url = data.url;
    }

    // Validate files if provided
    if (data.uploaded_files) {
      this.validateFiles(data.uploaded_files);
      this.uploaded_files = data.uploaded_files;
    }

    // Ensure at least one of URL or files is provided
    if (!this.url && !this.uploaded_files) {
      throw new Error('Either URL or uploaded_files must be provided');
    }

    // Set optional fields
    this.user_provided_audience = data.user_provided_audience;

    // Set status (default to pending)
    this._status = data.status || 'pending';

    // Set timestamps
    this.submitted_at = data.submitted_at || new Date();
    this.processing_started_at = data.processing_started_at;
    this.completed_at = data.completed_at;
    this.error_message = data.error_message;
    this.report_id = data.report_id;
  }

  private validateFiles(files: FileReference[]): void {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['pdf', 'pptx', 'docx'];

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.file_type)) {
        throw new Error('Invalid file type');
      }

      // Validate file size
      if (file.file_size > maxSize) {
        throw new Error('File size exceeds 50MB limit');
      }

      // Validate filename (prevent path traversal)
      if (this.containsPathTraversal(file.filename)) {
        throw new Error('Invalid filename');
      }
    }
  }

  private containsPathTraversal(filename: string): boolean {
    return filename.includes('..') || filename.includes('/') || filename.includes('\\');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isHTTPOrHTTPS(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Status getter
  get status(): 'pending' | 'processing' | 'completed' | 'failed' {
    return this._status;
  }

  // Status transition validation
  set status(newStatus: 'pending' | 'processing' | 'completed' | 'failed') {
    const validTransitions: Record<string, string[]> = {
      pending: ['processing'],
      processing: ['completed', 'failed'],
      completed: [],
      failed: [],
    };

    const allowed = validTransitions[this._status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error('Invalid status transition');
    }

    // Update status and set timestamps
    this._status = newStatus;
    if (newStatus === 'processing' && !this.processing_started_at) {
      this.processing_started_at = new Date();
    }
    if (newStatus === 'completed' || newStatus === 'failed') {
      this.completed_at = new Date();
    }
  }

  // Serialization methods
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      email: this.email,
      url: this.url,
      uploaded_files: this.uploaded_files?.map((f) => ({
        ...f,
        uploaded_at: f.uploaded_at.toISOString(),
      })),
      user_provided_audience: this.user_provided_audience,
      status: this.status,
      submitted_at: this.submitted_at.toISOString(),
      processing_started_at: this.processing_started_at?.toISOString(),
      completed_at: this.completed_at?.toISOString(),
      error_message: this.error_message,
      report_id: this.report_id,
    };
  }

  static fromJSON(json: Record<string, any>): EvaluationRequest {
    return new EvaluationRequest({
      id: json.id,
      email: json.email,
      url: json.url,
      uploaded_files: json.uploaded_files?.map((f: any) => ({
        ...f,
        uploaded_at: new Date(f.uploaded_at),
      })),
      user_provided_audience: json.user_provided_audience,
      status: json.status,
      submitted_at: new Date(json.submitted_at),
      processing_started_at: json.processing_started_at
        ? new Date(json.processing_started_at)
        : undefined,
      completed_at: json.completed_at ? new Date(json.completed_at) : undefined,
      error_message: json.error_message,
      report_id: json.report_id,
    });
  }
}

