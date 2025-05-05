/**
 * Creates a promise that resolves after the specified delay
 * @param ms Time to wait in milliseconds
 * @returns Promise that resolves after the delay
 */
export default function delay(ms: number = 30000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
