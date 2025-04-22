/**
 * A utility class for displaying terminal-based loading animations
 */
export class LoadingIndicator {
  private loadingChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private interval: NodeJS.Timeout | null = null;
  private index = 0;

  /**
   * Starts the loading animation with the specified message
   * @param message The message to display alongside the animation
   * @param intervalMs The interval between animation frames in milliseconds
   */
  start(message: string, intervalMs = 100): void {
    this.index = 0;
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.loadingChars[this.index]} ${message}`);
      this.index = (this.index + 1) % this.loadingChars.length;
    }, intervalMs);
  }

  /**
   * Stops the loading animation and clears the line
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r\x1b[K'); // Clear the line
    }
  }
}