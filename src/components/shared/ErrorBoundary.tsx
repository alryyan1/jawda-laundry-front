import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  showTechnicalDetails: boolean;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: this.generateErrorId(),
      showTechnicalDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: ErrorBoundary.prototype.generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Here you can log to your error reporting service
    // logErrorToService(error, errorInfo, this.props.componentName);
  }

  generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: this.generateErrorId(),
      showTechnicalDetails: false,
      copied: false,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  copyErrorDetails = async () => {
    const errorDetails = this.getErrorDetails();
    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      toast.success('Error details copied to clipboard');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        this.setState({ copied: false });
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy error details');
    }
  };

  getErrorDetails(): string {
    const { error, errorInfo, errorId } = this.state;
    const { componentName } = this.props;
    
    // Try to extract more specific component info from stack trace
    const specificComponent = this.extractSpecificComponent(error?.stack, errorInfo?.componentStack);
    
    return `
Error Report
============
Error ID: ${errorId}
Component: ${componentName || 'Unknown Component'}${specificComponent ? ` -> ${specificComponent}` : ''}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Details:
${error?.name}: ${error?.message}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}
    `.trim();
  }

  extractSpecificComponent(stack?: string, componentStack?: string): string | null {
    if (!stack && !componentStack) return null;
    
    // Try to extract component name from stack trace
    const stackLines = (stack || '').split('\n');
    const componentStackLines = (componentStack || '').split('\n');
    
    // Look for component files in the stack trace
    for (const line of stackLines) {
      // Look for src/ files that contain component names
      const match = line.match(/src\/.*?([A-Z][a-zA-Z]+(?:Page|Component|Modal|Form|Cart|Wizard|Column))[^/]*\.(tsx?|jsx?):/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Look in component stack for specific component names
    for (const line of componentStackLines) {
      const match = line.match(/at\s+([A-Z][a-zA-Z]+(?:Page|Component|Modal|Form|Cart|Wizard|Column))/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  toggleTechnicalDetails = () => {
    this.setState(prev => ({
      showTechnicalDetails: !prev.showTechnicalDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, showTechnicalDetails, copied } = this.state;
      const { componentName, showDetails = true } = this.props;
      const specificComponent = this.extractSpecificComponent(error?.stack, this.state.errorInfo?.componentStack);

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-destructive/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-base">
                We encountered an unexpected error while loading this component.
                Don't worry, our team has been notified.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Error ID:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {errorId}
                  </Badge>
                </div>

                {(componentName || specificComponent) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Component:</span>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {componentName || 'Unknown'}
                      </Badge>
                      {specificComponent && specificComponent !== componentName && (
                        <Badge variant="outline" className="font-mono text-xs">
                          → {specificComponent}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Timestamp:</span>
                  <span className="text-sm font-mono">
                    {new Date().toLocaleString()}
                  </span>
                </div>

                {error && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Error:</span>
                    <div className="flex-1 text-right">
                      <Badge variant="destructive" className="text-xs">
                        {error.name}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1 break-words">
                        {error.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Technical Details */}
              {showDetails && (
                <>
                  <Separator />
                  <Collapsible 
                    open={showTechnicalDetails} 
                    onOpenChange={this.toggleTechnicalDetails}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Bug className="mr-2 h-4 w-4" />
                        {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">Error Details</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={this.copyErrorDetails}
                            className="h-8"
                          >
                            {copied ? (
                              <>
                                <Check className="mr-2 h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-3 w-3" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {error?.stack && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                              Stack Trace
                            </h5>
                            <pre className="text-xs bg-background border rounded p-3 overflow-x-auto max-h-48 font-mono">
                              {error.stack}
                            </pre>
                          </div>
                        )}

                        {this.state.errorInfo?.componentStack && (
                          <div className="space-y-2 mt-4">
                            <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                              Component Stack
                            </h5>
                            <pre className="text-xs bg-background border rounded p-3 overflow-x-auto max-h-48 font-mono">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                        <p className="font-medium mb-1">Need help?</p>
                        <p>
                          Copy the error details above and contact our support team. 
                          Include your Error ID ({errorId}) for faster assistance.
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 