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
import { SearchProvider } from './context/SearchContext.tsx';
import { NewOrderProvider } from './context/NewOrderContext.tsx';
import { DateProvider } from './context/DateContext.tsx';
import './lib/websocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - prevent unnecessary refetches
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: 1, // Only retry once on failure
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <Suspense fallback="Loading translations...">
      <SettingsProvider>
        <AppThemeProvider>
          <ThemeProvider defaultTheme="light" storageKey="restaurant-management-ui-theme">
            <QueryClientProvider client={queryClient}>
                             <SearchProvider>
                 <NewOrderProvider>
                   <DateProvider>
                     <App />
                     <ReactQueryDevtools initialIsOpen={false} />
                   </DateProvider>
                 </NewOrderProvider>
               </SearchProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </AppThemeProvider>
      </SettingsProvider>
      
    </Suspense>
  // </React.StrictMode>,
);