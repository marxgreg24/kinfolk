import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import AuthBootstrap from '@/components/layout/AuthBootstrap'
import ErrorBoundaryPage from '@/features/ErrorBoundaryPage'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryPage
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: undefined })}
        />
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthBootstrap>
        <Toaster position="top-right" />
        <RouterProvider router={router} />
      </AuthBootstrap>
    </ErrorBoundary>
  )
}

export default App
