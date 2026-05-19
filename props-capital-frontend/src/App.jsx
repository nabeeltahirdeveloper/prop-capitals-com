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
    // <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center px-6">
    //   <div className="max-w-xl w-full text-center">
    //     <img
    //       src="/assets/images/logo-dark.png"
    //       alt="Prop Capitals"
    //       className="h-12 mx-auto mb-10 opacity-90"
    //     />

    //     <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-300 mb-6">
    //       <span className="relative flex h-2 w-2">
    //         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
    //         <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
    //       </span>
    //       Scheduled Maintenance
    //     </div>

    //     <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
    //       We&apos;ll be back shortly.
    //     </h1>

    //     <p className="text-slate-400 leading-relaxed mb-8">
    //       Prop Capitals is currently undergoing maintenance to bring you a better
    //       trading experience. Thank you for your patience — we&apos;ll be back online
    //       very soon.
    //     </p>

    //     <p className="text-sm text-slate-500">
    //       Need urgent help? Reach us at{' '}
    //       <a
    //         href="mailto:support@prop-capitals.com"
    //         className="text-slate-300 hover:text-white underline underline-offset-4"
    //       >
    //         support@prop-capitals.com
    //       </a>
    //     </p>

    //     <div className="mt-12 text-xs text-slate-600">
    //       &copy; {new Date().getFullYear()} Prop Capitals. All rights reserved.
    //     </div>
    //   </div>
    // </div>
  )
}

export default App 