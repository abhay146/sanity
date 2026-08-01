import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [pageUrl, setPageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    analyzeCurrentPage();
  }, []);

  async function analyzeCurrentPage() {
    setLoading(true);
    setError('');

    try {
      // Get current AEM page URL from query parameter
      const params = new URLSearchParams(window.location.search);

      let currentPageUrl = params.get('url');

      // Fallback: try Sidekick context if available
      // if (!currentPageUrl && window.parent !== window) {
      //   currentPageUrl = document.referrer;
      // }
      if (!currentPageUrl) {
  currentPageUrl = document.referrer;
}

      if (!currentPageUrl) {
        throw new Error('Current AEM page URL could not be detected.');
      }

      setPageUrl(currentPageUrl);

      // Fetch the current AEM page
      const response = await fetch(currentPageUrl);

      if (!response.ok) {
        throw new Error(
          `Unable to load page. Server returned ${response.status}.`
        );
      }

      const html = await response.text();

      // Convert HTML string into DOM
      const parser = new DOMParser();
      const pageDocument = parser.parseFromString(html, 'text/html');

      // Run all checks
      const pageResults = runChecks(pageDocument);

      setResults(pageResults);
    } catch (err) {
      console.error('Sanity check failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function runChecks(pageDocument) {
    // H1 check
    const h1s = [...pageDocument.querySelectorAll('h1')];

    // Image ALT check
    const images = [...pageDocument.querySelectorAll('img')];

    const imagesWithoutAlt = images.filter((img) => {
      const alt = img.getAttribute('alt');

      return alt === null || alt.trim() === '';
    });

    // Links check
    const links = [...pageDocument.querySelectorAll('a[href]')];

    const linksWithoutText = links.filter((link) => {
      const text = link.textContent.trim();

      const hasImage = link.querySelector('img');

      return !text && !hasImage;
    });

    // Heading structure
    const headings = [
      ...pageDocument.querySelectorAll('h1, h2, h3, h4, h5, h6'),
    ];

    // Meta description
    const metaDescription = pageDocument.querySelector(
      'meta[name="description"]'
    );

    // Title
    const title = pageDocument.querySelector('title');

    return {
      h1Count: h1s.length,
      h1Text: h1s.map((h1) => h1.textContent.trim()),

      imageCount: images.length,
      imagesWithoutAlt: imagesWithoutAlt.length,

      linkCount: links.length,
      linksWithoutText: linksWithoutText.length,

      headingCount: headings.length,

      hasMetaDescription:
        !!metaDescription &&
        metaDescription.getAttribute('content')?.trim().length > 0,

      hasTitle: !!title && title.textContent.trim().length > 0,
    };
  }

  function getStatus(count) {
    return count === 0 ? 'success' : 'warning';
  }

  return (
    <div className="sanity-app">
      <header className="sanity-header">
        <div>
          <h1>Sanity</h1>
          <p>Page Quality Checker</p>
        </div>

        <button
          type="button"
          className="close-button"
          aria-label="Close"
          onClick={() =>
            window.parent.postMessage(
              {
                type: 'sanity-close',
              },
              '*'
            )
          }
        >
          ×
        </button>
      </header>

      <main className="sanity-content">
        {loading && (
          <div className="state-card">
            <div className="loader" />
            <h2>Checking page...</h2>
            <p>Sanity is analyzing the current AEM page.</p>
          </div>
        )}

        {!loading && error && (
          <div className="state-card error-card">
            <div className="status-icon">!</div>

            <h2>Unable to check page</h2>

            <p>{error}</p>

            <button
              type="button"
              className="sanity-button"
              onClick={analyzeCurrentPage}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && results && (
          <>
            <div className="page-info">
              <span className="page-info-label">Checking page</span>

              <a
                href={pageUrl}
                target="_blank"
                rel="noreferrer"
                className="page-url"
              >
                {pageUrl}
              </a>
            </div>

            <section className="results-section">
              <h2>Page Checks</h2>

              {/* H1 */}
              <div className={`check-card ${getStatus(results.h1Count)}`}>
                <div className="check-icon">
                  {results.h1Count === 1 ? '✓' : '!'}
                </div>

                <div className="check-content">
                  <h3>H1 Heading</h3>

                  <p>
                    {results.h1Count === 1
                      ? 'Page has exactly one H1 heading.'
                      : `Page has ${results.h1Count} H1 headings.`}
                  </p>

                  {results.h1Text.length > 0 && (
                    <div className="details">
                      {results.h1Text.map((text, index) => (
                        <div key={index} className="detail-item">
                          H1 {index + 1}: {text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Image ALT */}
              <div
                className={`check-card ${
                  results.imagesWithoutAlt === 0 ? 'success' : 'warning'
                }`}
              >
                <div className="check-icon">
                  {results.imagesWithoutAlt === 0 ? '✓' : '!'}
                </div>

                <div className="check-content">
                  <h3>Image ALT Text</h3>

                  <p>
                    {results.imagesWithoutAlt === 0
                      ? `All ${results.imageCount} images have ALT text.`
                      : `${results.imagesWithoutAlt} of ${results.imageCount} images are missing ALT text.`}
                  </p>
                </div>
              </div>

              {/* Links */}
              <div
                className={`check-card ${
                  results.linksWithoutText === 0 ? 'success' : 'warning'
                }`}
              >
                <div className="check-icon">
                  {results.linksWithoutText === 0 ? '✓' : '!'}
                </div>

                <div className="check-content">
                  <h3>Link Text</h3>

                  <p>
                    {results.linksWithoutText === 0
                      ? `All ${results.linkCount} links have accessible text.`
                      : `${results.linksWithoutText} links may be missing accessible text.`}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div
                className={`check-card ${
                  results.hasTitle ? 'success' : 'warning'
                }`}
              >
                <div className="check-icon">
                  {results.hasTitle ? '✓' : '!'}
                </div>

                <div className="check-content">
                  <h3>Page Title</h3>

                  <p>
                    {results.hasTitle
                      ? 'Page has a title.'
                      : 'Page title is missing.'}
                  </p>
                </div>
              </div>

              {/* Meta Description */}
              <div
                className={`check-card ${
                  results.hasMetaDescription ? 'success' : 'warning'
                }`}
              >
                <div className="check-icon">
                  {results.hasMetaDescription ? '✓' : '!'}
                </div>

                <div className="check-content">
                  <h3>Meta Description</h3>

                  <p>
                    {results.hasMetaDescription
                      ? 'Meta description is present.'
                      : 'Meta description is missing.'}
                  </p>
                </div>
              </div>

              {/* Headings */}
              <div className="check-card success">
                <div className="check-icon">✓</div>

                <div className="check-content">
                  <h3>Headings</h3>

                  <p>
                    {results.headingCount} headings found on this page.
                  </p>
                </div>
              </div>
            </section>

            <button
              type="button"
              className="refresh-button"
              onClick={analyzeCurrentPage}
            >
              ↻ Run Check Again
            </button>
          </>
        )}
      </main>
    </div>
  );
}

export default App;