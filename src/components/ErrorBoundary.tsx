import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Disc3 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <Disc3 className="mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mb-6 text-gray-600">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
