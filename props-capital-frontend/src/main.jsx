import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { migrateLocalePrefs } from '@/lib/migrateLocalePrefs'

migrateLocalePrefs()

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 