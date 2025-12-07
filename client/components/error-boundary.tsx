"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  fallbackButtonText?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 text-6xl">
            <span role="img" aria-label="warning">&#9888;</span>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-foreground">
            {this.props.fallbackTitle || "Something went wrong"}
          </h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            {this.props.fallbackMessage || "An unexpected error occurred. Please try again."}
          </p>
          <Button onClick={this.handleReset} variant="default">
            {this.props.fallbackButtonText || "Try again"}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
