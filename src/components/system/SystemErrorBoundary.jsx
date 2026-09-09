import React from 'react'
import { ServerErrorState } from './SystemState.jsx'

export default class SystemErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('SystemErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ServerErrorState
          mode="page"
          onRetry={this.handleRetry}
          copy="A component unexpectedly ran into a snag while rendering. You can try refreshing the view or returning to the storefront."
        />
      )
    }

    return this.props.children
  }
}
