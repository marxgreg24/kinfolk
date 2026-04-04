import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider } from 'react-redux'
import { store } from '@/store/index'
import ClerkTokenProvider from '@/components/layout/ClerkTokenProvider'
import App from './App.tsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn('Clerk publishable key not set — auth will not work')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY ?? ''}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ClerkTokenProvider>
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
          </ClerkTokenProvider>
        </QueryClientProvider>
      </Provider>
    </ClerkProvider>
  </StrictMode>,
)
