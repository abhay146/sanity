```jsx
import './App.css';

function App() {
  return (
    <div className="sanity-app">
      <header className="sanity-header">
        <div>
          <h1>Sanity</h1>
          <p>Sanity integration is working.</p>
        </div>

        <button
          type="button"
          className="close-button"
          aria-label="Close"
          onClick={() => window.parent.postMessage({ type: 'sanity-close' }, '*')}
        >
          ×
        </button>
      </header>

      <main className="sanity-content">
        <div className="sanity-card">
          <div className="sanity-card-icon">
            S
          </div>

          <div className="sanity-card-content">
            <h2>Sanity Content</h2>

            <p>
              This React application is running inside the AEM Sidekick panel.
            </p>

            <button
              type="button"
              className="sanity-button"
              onClick={() => {
                alert('Create Content clicked');
              }}
            >
              Create Content
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
```
