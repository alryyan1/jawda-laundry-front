import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bug, Zap, RefreshCw } from 'lucide-react';

const TestErrorPage: React.FC = () => {
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const [errorType, setErrorType] = useState<'render' | 'async' | 'component'>('render');

  // Component that throws an error
  const ErrorComponent: React.FC<{ type: string }> = ({ type }) => {
    if (type === 'render') {
      throw new Error('This is a test render error thrown by TestErrorPage component');
    }
    return <div>No error thrown</div>;
  };

  const handleAsyncError = async () => {
    try {
      // Simulate an async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('This is a test async error from TestErrorPage'));
        }, 1000);
      });
    } catch (error) {
      // This won't be caught by ErrorBoundary since it's async
      console.error('Async error:', error);
      throw error;
    }
  };

  const handleComponentError = () => {
    setShouldThrowError(true);
    setErrorType('component');
  };

  if (shouldThrowError && errorType === 'component') {
    throw new Error('This is a test component error thrown by TestErrorPage');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Error Boundary Testing Page
          </CardTitle>
          <CardDescription>
            This page is for testing the ErrorBoundary component. Use the buttons below to trigger different types of errors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Render Error */}
            <Card className="border-destructive/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Render Error
                </CardTitle>
                <CardDescription className="text-xs">
                  Throws an error during component rendering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => {
                    setShouldThrowError(true);
                    setErrorType('render');
                  }}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Trigger Render Error
                </Button>
              </CardContent>
            </Card>

            {/* Component Error */}
            <Card className="border-orange-500/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Component Error
                </CardTitle>
                <CardDescription className="text-xs">
                  Throws an error in component state update
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleComponentError}
                  variant="outline"
                  size="sm"
                  className="w-full border-orange-500/20"
                >
                  Trigger Component Error
                </Button>
              </CardContent>
            </Card>

            {/* Async Error */}
            <Card className="border-yellow-500/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-yellow-600" />
                  Async Error
                </CardTitle>
                <CardDescription className="text-xs">
                  Async errors won't be caught by ErrorBoundary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleAsyncError}
                  variant="outline"
                  size="sm"
                  className="w-full border-yellow-500/20"
                >
                  Trigger Async Error
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Error Component Demo */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Error Component Demo</CardTitle>
              <CardDescription>
                This component will throw an error when the render error is triggered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shouldThrowError && errorType === 'render' ? (
                <ErrorComponent type="render" />
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No error component rendered yet. Click "Trigger Render Error" to see the ErrorBoundary in action.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                Testing Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Render Error:</strong> Will be caught by ErrorBoundary and show the professional error page</li>
                <li><strong>Component Error:</strong> Will also be caught and show component name "TestErrorPage"</li>
                <li><strong>Async Error:</strong> Won't be caught by ErrorBoundary (check browser console)</li>
                <li>The ErrorBoundary will show technical details, error ID, and recovery options</li>
                <li>You can copy error details and use the retry functionality</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestErrorPage; 