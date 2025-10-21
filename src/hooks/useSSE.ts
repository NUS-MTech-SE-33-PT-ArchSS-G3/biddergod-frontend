import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * SSE Event Structure
 * Matches the format sent by the SSE Stream Service
 */
export interface SSEEvent {
  type: string;
  data?: any;
  timestamp: string;
  userId?: string;
  message?: string;
}

/**
 * SSE Hook Options
 */
export interface UseSSEOptions {
  /** SSE endpoint URL */
  url: string;
  /** Event handler callback */
  onEvent?: (event: SSEEvent) => void;
  /** Connection opened callback */
  onOpen?: () => void;
  /** Error callback */
  onError?: (error: Event) => void;
  /** Max retries reached callback */
  onMaxRetriesReached?: () => void;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Auto-reconnect on error (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds (default: 5000) */
  reconnectDelay?: number;
  /** Maximum reconnection attempts (default: 5, set to 0 for unlimited) */
  maxReconnectAttempts?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Custom hook for SSE connections with JWT authentication
 *
 * Features:
 * - Automatic JWT token retrieval from AWS Amplify
 * - Auto-reconnect on connection failure
 * - Clean disconnect on unmount
 * - TypeScript support
 *
 * @example
 * ```tsx
 * const { isConnected, disconnect, reconnect } = useSSE({
 *   url: 'http://localhost:8000/events',
 *   onEvent: (event) => {
 *     console.log('Received event:', event);
 *   },
 *   onError: (error) => {
 *     console.error('SSE error:', error);
 *   }
 * });
 * ```
 */
export function useSSE(options: UseSSEOptions) {
  const {
    url,
    onEvent,
    onOpen,
    onError,
    onMaxRetriesReached,
    autoConnect = true,
    autoReconnect = true,
    reconnectDelay = 5000,
    maxReconnectAttempts = 5,
    debug = false
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isManualDisconnectRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[useSSE]', ...args);
    }
  }, [debug]);

  /**
   * Connect to SSE endpoint with JWT authentication
   */
  const connect = useCallback(async () => {
    try {
      log('Attempting to connect to SSE...');

      // Get JWT token from Amplify
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        const errorMsg = 'No authentication token available';
        log('Error:', errorMsg);
        setConnectionError(errorMsg);
        return;
      }

      log('JWT token obtained, creating EventSource connection...');

      // Create SSE connection with token as query parameter
      // EventSource doesn't support custom headers, so we use query param
      const eventSourceUrl = `${url}?token=${encodeURIComponent(idToken)}`;
      const eventSource = new EventSource(eventSourceUrl);

      eventSource.onopen = () => {
        log('SSE connection opened');
        setIsConnected(true);
        setConnectionError(null);

        // Reset reconnect attempts on successful connection
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);

        if (onOpen) {
          onOpen();
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          log('SSE event received:', data);

          // Call parent component's event handler
          if (onEvent) {
            onEvent(data);
          }
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        log('SSE connection error:', error);
        setIsConnected(false);

        // Close the connection
        eventSource.close();
        eventSourceRef.current = null;

        // Call error handler (only once per error, not on retries)
        if (onError && reconnectAttemptsRef.current === 0) {
          onError(error);
        }

        // Auto-reconnect if enabled and not manually disconnected
        if (autoReconnect && !isManualDisconnectRef.current) {
          // Check if we've exceeded max reconnection attempts
          if (maxReconnectAttempts > 0 && reconnectAttemptsRef.current >= maxReconnectAttempts) {
            const errorMsg = `Max reconnection attempts (${maxReconnectAttempts}) reached. Please check if the backend service is running.`;
            log(errorMsg);
            setConnectionError(errorMsg);

            // Call max retries callback
            if (onMaxRetriesReached) {
              onMaxRetriesReached();
            }

            return;
          }

          reconnectAttemptsRef.current += 1;
          setReconnectAttempts(reconnectAttemptsRef.current);

          const errorMsg = `Connection lost. Retry attempt ${reconnectAttemptsRef.current}${maxReconnectAttempts > 0 ? `/${maxReconnectAttempts}` : ''} in ${reconnectDelay / 1000}s...`;
          log(errorMsg);
          setConnectionError(errorMsg);

          reconnectTimeoutRef.current = setTimeout(() => {
            log(`Reconnecting (attempt ${reconnectAttemptsRef.current})...`);
            connect();
          }, reconnectDelay);
        } else {
          setConnectionError('SSE connection closed');
        }
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      const errorMsg = `Error setting up SSE: ${error}`;
      console.error(errorMsg);
      log('Error:', error);
      setConnectionError(errorMsg);

      // Retry connection after delay if auto-reconnect is enabled
      if (autoReconnect && !isManualDisconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          log(`Retrying connection in ${reconnectDelay}ms...`);
          connect();
        }, reconnectDelay);
      }
    }
  }, [url, onEvent, onOpen, onError, onMaxRetriesReached, autoReconnect, reconnectDelay, maxReconnectAttempts, log]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    log('Disconnecting from SSE...');
    isManualDisconnectRef.current = true;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);

    // Reset reconnect attempts
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
  }, [log]);

  /**
   * Manually reconnect (resets retry counter)
   */
  const reconnect = useCallback(() => {
    log('Manual reconnect requested');
    disconnect();

    // Reset reconnect attempts for fresh start
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);

    isManualDisconnectRef.current = false;
    connect();
  }, [connect, disconnect, log]);

  // Connect on mount (if autoConnect is true)
  useEffect(() => {
    if (autoConnect) {
      isManualDisconnectRef.current = false;
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (debug) {
        console.log('[useSSE] Component unmounting, cleaning up SSE connection');
      }
      isManualDisconnectRef.current = true;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    disconnect,
    reconnect
  };
}