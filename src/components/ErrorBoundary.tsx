import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              minHeight: '100vh',
              background: '#0a0b0f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#13141a',
                border: '1px solid #dc2626',
                borderRadius: '0.75rem',
                padding: '2rem',
                maxWidth: '32rem',
                width: '100%',
              }}
            >
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#f87171',
                  marginBottom: '1rem',
                }}
              >
                Something went wrong
              </h1>
              <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                An error occurred while rendering this page. This is likely a
                temporary issue.
              </p>
              {this.state.error && (
                <pre
                  style={{
                    background: '#0d0e14',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    overflow: 'auto',
                    maxHeight: '12rem',
                    marginBottom: '1.5rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent stack:\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={this.handleRetry}
                  style={{
                    flex: 1,
                    background: '#8b5cf6',
                    color: 'white',
                    fontWeight: 500,
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#94a3b8',
                    fontWeight: 500,
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #374151',
                    cursor: 'pointer',
                  }}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
