import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import App from './App.jsx';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("App crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fef3c7,#fff7ed)', padding: 24, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: '#164e63', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#78716c', marginBottom: 20, fontSize: 14 }}>The app hit an unexpected error. Your progress is saved.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#0e7490,#164e63)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
