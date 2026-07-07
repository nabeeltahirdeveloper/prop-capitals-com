import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from "@/contexts/ThemeContext"
import { TradingProvider } from './contexts/TradingContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import SocialProofNotification from "@/components/SocialProofNotification.jsx"
import ChatSupport from './components/ChatSupport.jsx'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <TradingProvider>
              <AuthProvider>
                <Pages />
                <Toaster />
                <ChatSupport />
                {/* <SocialProofNotification /> */}
              </AuthProvider>
            </TradingProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App 