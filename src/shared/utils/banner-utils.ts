import { ENV } from '../../config/env';

/**
 * Generates an ASCII art banner for server startup
 * @param port The port number the server is running on
 * @returns A formatted string with ASCII art and server information
 */
export const generateStartupBanner = (port: number): string => {
  return `
██████╗ ███████╗██╗     ██╗ █████╗  ██████╗ █████╗ ██████╗ ███████╗
██╔══██╗██╔════╝██║     ██║██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝
██████╔╝█████╗  ██║     ██║███████║██║     ███████║██████╔╝█████╗  
██╔══██╗██╔══╝  ██║     ██║██╔══██║██║     ██╔══██║██╔══██╗██╔══╝  
██║  ██║███████╗███████╗██║██║  ██║╚██████╗██║  ██║██║  ██║███████╗
╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
===================================
🚀 Reliacare API Server Started 🚀
📡 Running on port: ${port}
🔧 Environment: ${ENV.nodeEnv}
===================================
`;
};

/**
 * Determines if the banner should be shown based on environment
 * @returns Boolean indicating if banner should be displayed
 */
export const shouldShowBanner = (): boolean => {
  // You can add conditions like only showing in development
  return !ENV.isTest; // Don't show in test environment
};
