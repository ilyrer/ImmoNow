/**
 * Centralized Logging Service
 * Replaces console.log/warn/error with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
  }

  private addToHistory(entry: LogEntry) {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  debug(message: string, context?: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    
    const entry: LogEntry = {
      level: 'debug',
      message,
      context,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.addToHistory(entry);
    console.debug(this.formatMessage('debug', message, context), data || '');
  }

  info(message: string, context?: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    
    const entry: LogEntry = {
      level: 'info',
      message,
      context,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.addToHistory(entry);
    console.info(this.formatMessage('info', message, context), data || '');
  }

  warn(message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      level: 'warn',
      message,
      context,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.addToHistory(entry);
    console.warn(this.formatMessage('warn', message, context), data || '');
  }

  error(message: string, context?: string, error?: Error | any): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      context,
      data: error,
      timestamp: new Date().toISOString()
    };
    
    this.addToHistory(entry);
    
    if (error instanceof Error) {
      console.error(this.formatMessage('error', message, context), error);
    } else {
      console.error(this.formatMessage('error', message, context), error || '');
    }

    // In production, you could send errors to an error tracking service here
    // Example: Sentry.captureException(error);
  }

  /**
   * Get recent log history (useful for debugging)
   */
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter(entry => entry.level === level);
    }
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger, type LogLevel, type LogEntry };
