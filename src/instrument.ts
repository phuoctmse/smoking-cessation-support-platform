import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],
  environment: process.env.NODE_ENV || 'development',
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set profilesSampleRate to 1.0 to profile 100%
  // of sampled transactions.
  // This is relative to tracesSampleRate
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        // Remove sensitive information from error messages
        const sensitivePatterns = [
          /password/i,
          /token/i,
          /secret/i,
          /key/i,
          /auth/i,
        ];
        
        const errorMessage = typeof error.message === 'string' ? error.message : 'Unknown error';
        let message = errorMessage;
        sensitivePatterns.forEach(pattern => {
          message = message.replace(pattern, '[REDACTED]');
        });
        
        if (event.exception.values?.[0]) {
          event.exception.values[0].value = message;
        }
      }
    }
    
    return event;
  },
});
