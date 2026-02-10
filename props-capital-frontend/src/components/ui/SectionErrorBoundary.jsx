import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[${this.props.label || 'Section'}] Error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 gap-2 text-center" style={{ minHeight: 120 }}>
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <p className="text-sm text-gray-400">{this.props.label || 'Section'} failed to load</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SectionErrorBoundary;
