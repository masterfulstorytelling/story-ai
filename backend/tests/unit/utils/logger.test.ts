import { logger } from '../../../src/utils/logger';

describe('Logger', () => {
  const originalConsole = { ...console };
  const consoleSpy = {
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    console.log = consoleSpy.log;
    console.debug = consoleSpy.debug;
    console.warn = consoleSpy.warn;
    console.error = consoleSpy.error;
    jest.clearAllMocks();
  });

  afterAll(() => {
    console.log = originalConsole.log;
    console.debug = originalConsole.debug;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('should log info messages in JSON format', () => {
    logger.info('Test message');

    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    const logCall = consoleSpy.log.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData.level).toBe('info');
    expect(logData.message).toBe('Test message');
    expect(logData.timestamp).toBeDefined();
  });

  it('should log info messages with metadata', () => {
    logger.info('Test message', { key: 'value' });

    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    const logCall = consoleSpy.log.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData.metadata).toEqual({ key: 'value' });
  });

  it('should log warn messages', () => {
    logger.warn('Warning message');

    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    const logCall = consoleSpy.warn.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData.level).toBe('warn');
    expect(logData.message).toBe('Warning message');
  });

  it('should log error messages', () => {
    logger.error('Error message');

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    const logCall = consoleSpy.error.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData.level).toBe('error');
    expect(logData.message).toBe('Error message');
  });

  it('should log error messages with Error object', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error);

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    const logCall = consoleSpy.error.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData.metadata?.error?.name).toBe('Error');
    expect(logData.metadata?.error?.message).toBe('Test error');
    expect(logData.metadata?.error?.stack).toBeDefined();
  });

  it('should log error messages with metadata', () => {
    logger.error('Error message', undefined, { context: 'test' });

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    const logCall = consoleSpy.error.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData.metadata?.context).toBe('test');
  });

  it('should only log debug messages in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    logger.debug('Debug message');

    expect(consoleSpy.debug).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = 'production';
    logger.debug('Debug message');

    expect(consoleSpy.debug).toHaveBeenCalledTimes(1); // Still 1, not called again

    process.env.NODE_ENV = originalEnv;
  });
});

