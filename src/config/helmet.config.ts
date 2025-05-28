import { HelmetOptions } from 'helmet';
import { ENV } from './env';

/**
 * Helmet configuration for HTTP security headers
 *
 * These settings are particularly important for healthcare applications
 * to safeguard sensitive patient data and comply with regulations.
 */
export const helmetConfig: HelmetOptions = {
  // Content Security Policy - restricts sources of content
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Default to allowing only same-origin resources
      baseUri: ["'self'"], // Restrict base URI to same origin
      fontSrc: ["'self'", 'https:', 'data:'], // Allow fonts from same origin, HTTPS and data URIs
      frameAncestors: ["'self'"], // Prevent embedding the app in iframes from other origins
      imgSrc: ["'self'", 'data:'], // Allow images from same origin and data URIs
      objectSrc: ["'none'"], // Block <object>, <embed>, and <applet> elements
      scriptSrc: ["'self'"], // Allow scripts from same origin only
      scriptSrcAttr: ["'none'"], // Block inline script attributes
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"], // Allow styles from same origin, HTTPS, and inline
      upgradeInsecureRequests: ENV.isProduction ? [] : null, // Force HTTPS in production
    },
  },

  // HTTP Strict Transport Security - enforces HTTPS
  hsts: {
    maxAge: 15552000, // 180 days in seconds
    includeSubDomains: true, // Apply to all subdomains
    preload: true, // Ready for browser preload lists
  },

  // X-Frame-Options - prevents clickjacking
  frameguard: {
    action: 'deny', // Never allow framing
  },

  // X-Content-Type-Options - prevents MIME type sniffing
  noSniff: true,

  // X-XSS-Protection - stops pages from loading when XSS detected
  xssFilter: true,

  // Referrer-Policy - controls what information is sent in Referer header
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // DNS Prefetch Control - controls browser DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // Permissions Policy (formerly Feature-Policy)
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
};
