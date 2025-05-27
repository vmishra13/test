import net from 'net';

/**
 * Check if a port is available
 * @param port Port number to check
 * @returns Promise resolving to boolean indicating if port is available
 */
export const isPortAvailable = (port: number): Promise<boolean> => {
  return new Promise(resolve => {
    const tester = net
      .createServer()
      .once('error', () => {
        // Port is in use
        resolve(false);
      })
      .once('listening', () => {
        // Port is available
        tester.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
};

/**
 * Find an available port starting from the specified port
 * @param startPort Starting port number
 * @returns Promise resolving to available port number
 */
export const findAvailablePort = async (startPort: number): Promise<number> => {
  let port = startPort;
  const maxPort = startPort + 10; // Try up to 10 ports

  while (port <= maxPort) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }

  throw new Error(`No available ports found in range ${startPort}-${maxPort}`);
};