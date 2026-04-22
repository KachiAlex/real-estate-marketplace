import React from 'react';

class SupportTicketsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('SupportTicketsErrorBoundary caught:', error, info);
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-bold mb-2">Support Tickets crashed</h2>
          <pre className="text-xs text-red-700 whitespace-pre-wrap">{this.state.error?.stack}</pre>
          <button className="mt-3 px-3 py-1 bg-red-600 text-white rounded" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SupportTicketsErrorBoundary;
