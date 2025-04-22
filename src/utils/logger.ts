/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * A utility class for logging messages with colors
 */
export const logger = {
  /**
   * Log an info message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  info: (message: string, ...args: unknown[]): void => {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`, ...args);
  },

  /**
   * Log a success message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  success: (message: string, ...args: unknown[]): void => {
    console.log(`\n\n${colors.green}[SUCCESS]${colors.reset} ${message}`, ...args);
  },

  /**
   * Log a warning message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
  },

  /**
   * Log an error message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  error: (message: string, ...args: unknown[]): void => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`, ...args);
  },

  /**
   * Log a debug message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  debug: (message: string, ...args: unknown[]): void => {
    console.debug(`${colors.magenta}[DEBUG]${colors.reset} ${message}`, ...args);
  },
};
