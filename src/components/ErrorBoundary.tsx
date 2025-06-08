import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { env } from '../utils/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to analytics in production
    if (env.APP_ENV === 'production') {
      // TODO: Send to analytics service
      console.error('Production Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReport = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Copy to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error details copied to clipboard! Please send this to support.');
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg mx-auto shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Oops! Something went wrong
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                We encountered an unexpected error. Don't worry, this has been logged and we'll fix it soon.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {env.DEBUG_MODE && this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                    Error Details (Debug Mode):
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleReport}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  Report Issue
                </Button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                If this problem persists, please contact our support team.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;