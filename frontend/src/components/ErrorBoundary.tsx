import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  // Reset boundary when this value changes (e.g. when the user switches views).
  resetKey?: string | number
  // Optional friendly name for the failing region — used in the fallback UI.
  label?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface to the console so devs see the stack + component path.
    console.error('[ErrorBoundary]', this.props.label || '', error, info.componentStack)
  }

  componentDidUpdate(prev: ErrorBoundaryProps): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children

    const message = this.state.error?.message || 'Unknown error'
    const label = this.props.label ? ` in ${this.props.label}` : ''

    return (
      <div className="h-full min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-red/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" fill="none" stroke="#f25f5c" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-text mb-1">Something broke{label}</h2>
          <p className="text-[13px] text-muted leading-relaxed mb-4 break-words">
            {message}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg text-[12px] font-medium bg-accent text-white hover:bg-accent/90 cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-[12px] font-medium bg-card border border-border text-muted hover:text-text cursor-pointer"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
