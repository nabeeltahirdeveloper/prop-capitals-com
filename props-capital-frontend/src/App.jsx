import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from "@/contexts/ThemeContext"
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
        <AuthProvider>
          <Pages />
          <Toaster />
          <ChatSupport />
          <SocialProofNotification />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App 