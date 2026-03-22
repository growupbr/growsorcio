import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import './index.css';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Erro inesperado' };
  }

  componentDidCatch(error) {
    console.error('RootErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#09090b', color: '#f4f4f5', padding: 24 }}>
          <div style={{ maxWidth: 560, width: '100%', textAlign: 'center', border: '1px solid #27272a', borderRadius: 16, padding: 24, background: '#111113' }}>
            <h1 style={{ margin: 0, color: '#f87171', fontSize: 22, fontWeight: 800 }}>Erro ao carregar o app</h1>
            <p style={{ marginTop: 10, color: '#a1a1aa' }}>
              {this.state.message}
            </p>
            <p style={{ marginTop: 14, color: '#71717a', fontSize: 13 }}>
              Atualize a pagina com Ctrl/Cmd + Shift + R.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);
