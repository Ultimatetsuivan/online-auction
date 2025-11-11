import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container my-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card shadow">
                <div className="card-body text-center py-5">
                  <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
                  <h2 className="mt-4 mb-3">Уучлаарай, алдаа гарлаа</h2>
                  <p className="text-muted mb-4">
                    Ямар нэгэн асуудал гарсан байна. Хуудсыг дахин ачааллана уу.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      this.setState({ hasError: false, error: null });
                      window.location.reload();
                    }}
                  >
                    Хуудсыг дахин ачааллах
                  </button>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-4 text-start">
                      <summary className="text-muted">Техникийн мэдээлэл</summary>
                      <pre className="mt-2 p-3 bg-light rounded" style={{ fontSize: '0.85rem' }}>
                        {this.state.error.toString()}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
