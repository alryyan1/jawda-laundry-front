import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { ThemeProvider } from './components/theme-provider'; //  Adjust path if needed
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { ThemeProvider as AppThemeProvider } from './context/ThemeContext.tsx';
import './lib/websocket';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback="Loading translations...">
      <SettingsProvider>
        <AppThemeProvider>
          <ThemeProvider defaultTheme="dark" storageKey="laundry-management-ui-theme">
            <QueryClientProvider client={queryClient}>
              <App />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </ThemeProvider>
        </AppThemeProvider>
      </SettingsProvider>
      
    </Suspense>
  </React.StrictMode>,
);