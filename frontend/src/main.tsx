import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './AuthContext' // 1. IMPORTANTE: Importamos el provider
// @ts-ignore
import './index.css'

const queryClient = new QueryClient()

console.log("El main cargó correctamente");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* 2. ENVOLVEMOS TODO CON EL PROVIDER */}
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)