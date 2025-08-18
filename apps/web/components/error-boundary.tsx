'use client';

import React from 'react';
import { Button } from '@fluentui/react-components';
import { ErrorCircle24Regular, ArrowClockwise24Regular } from '@fluentui/react-icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <ErrorCircle24Regular style={{ color: '#dc2626', marginBottom: '16px' }} />
          <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>Terjadi Kesalahan</h2>
          <p style={{ color: '#7f1d1d', marginBottom: '16px', maxWidth: '500px' }}>
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              textAlign: 'left',
              maxWidth: '600px',
              width: '100%'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                Detail Error (Development Mode)
              </summary>
              <pre style={{ 
                fontSize: '12px', 
                color: '#374151',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          
          <Button 
            appearance="primary"
            icon={<ArrowClockwise24Regular />}
            onClick={this.resetError}
          >
            Coba Lagi
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
export { ErrorBoundary };

// Hook untuk menangani error secara manual
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Manual error capture:', error);
    setError(error);
  }, []);

  // Throw error untuk memicu ErrorBoundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
};

// Component untuk menampilkan error fallback yang lebih sederhana
export const SimpleErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <div style={{
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px'
  }}>
    <ErrorCircle24Regular style={{ color: '#dc2626', marginBottom: '8px' }} />
    <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Terjadi Kesalahan</h3>
    <p style={{ color: '#7f1d1d', marginBottom: '12px' }}>
      Komponen ini mengalami masalah. Silakan coba lagi.
    </p>
    <Button size="small" onClick={resetError}>
      Coba Lagi
    </Button>
  </div>
);