import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Error component that throws different types of errors
const ErrorComponent: React.FC<{ type: 'render' | 'async' }> = ({ type }) => {
  const { t } = useTranslation(['common']);

  if (type === 'render') {
    throw new Error('This is a render error for testing ErrorBoundary');
  }

  if (type === 'async') {
    // This won't be caught by ErrorBoundary
    setTimeout(() => {
      throw new Error('This is an async error that won\'t be caught');
    }, 100);
  }

  return <div>{t('noErrorThrown')}</div>;
};

const TestErrorPage: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [renderError, setRenderError] = useState(false);
  const [asyncError, setAsyncError] = useState(false);

  const triggerRenderError = () => {
    setRenderError(true);
  };

  const triggerAsyncError = () => {
    setAsyncError(true);
    // Reset after a short delay
    setTimeout(() => setAsyncError(false), 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Error Boundary Testing</h1>
        <p className="text-muted-foreground">
          Test the ErrorBoundary component with different types of errors
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Render Error Test */}
        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-destructive">⚠️</span>
              {t('renderError')}
            </CardTitle>
            <CardDescription className="text-xs">
              This will trigger a render error that will be caught by ErrorBoundary
            </CardDescription>
            <Button
              onClick={triggerRenderError}
              variant="destructive"
              size="sm"
              className="mt-3"
            >
              Trigger Render Error
            </Button>
          </CardContent>
        </Card>

        {/* Async Error Test */}
        <Card className="border-orange-500/20">
          <CardContent className="p-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-orange-500">⚡</span>
              {t('asyncError')}
            </CardTitle>
            <CardDescription className="text-xs">
              This will trigger an async error that won't be caught by ErrorBoundary
            </CardDescription>
            <Button
              onClick={triggerAsyncError}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Trigger Async Error
            </Button>
          </CardContent>
        </Card>

        {/* Component Error Test */}
        <Card className="border-yellow-500/20">
          <CardContent className="p-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-yellow-500">🔧</span>
              {t('componentError')}
            </CardTitle>
            <CardDescription className="text-xs">
              This will trigger a component error that will be caught by ErrorBoundary
            </CardDescription>
            <Button
              onClick={() => setRenderError(true)}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Trigger Component Error
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Error Component Demo */}
      <Card>
        <CardContent className="p-6">
          <CardTitle className="text-lg">{t('errorComponentDemo')}</CardTitle>
          <div className="mt-4 space-y-4">
            {renderError ? (
              <ErrorBoundary componentName="TestErrorPage">
                <ErrorComponent type="render" />
              </ErrorBoundary>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t('noErrorComponentRendered')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
            How ErrorBoundary Works
          </CardTitle>
          <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>{t('renderError')}:</strong> Will be caught by ErrorBoundary and show the professional error page</li>
              <li><strong>{t('componentError')}:</strong> Will also be caught and show component name "TestErrorPage"</li>
              <li><strong>{t('asyncError')}:</strong> Won't be caught by ErrorBoundary (check browser console)</li>
              <li>{t('errorBoundaryFeatures')}</li>
              <li>{t('copyErrorDetails')}</li>
            </ul>
          </CardContent>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestErrorPage; 