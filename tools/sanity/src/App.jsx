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

  function getCurrentPageDocument() {
    // The AEM page is the parent window when the plugin
    // is opened as a Sidekick popover.
    try {
      if (window.parent && window.parent !== window) {
        return {
          document: window.parent.document,
          url: window.parent.location.href,
        };
      }

      return {
        document: window.document,
        url: window.location.href,
      };
    } catch (error) {
      console.error('Unable to access parent AEM page:', error);

      throw new Error(
        'Sanity could not access the current AEM page. Please make sure the Sanity plugin is opened from the AEM Sidekick.'
      );
    }
  }

  function analyzeCurrentPage() {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const page = getCurrentPageDocument();

      if (!page.document) {
        throw new Error('Current AEM page could not be detected.');
      }

      setPageUrl(page.url);

      const pageResults = runChecks(page.document);

      setResults(pageResults);
    } catch (err) {
      console.error('Sanity check failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function runChecks(pageDocument) {
    // -------------------------
    // H1 CHECK
    // -------------------------

    const h1s = [...pageDocument.querySelectorAll('h1')];

    // -------------------------
    // IMAGE ALT CHECK
    // -------------------------

    const images = [...pageDocument.querySelectorAll('img')];

    const imagesWithoutAlt = images.filter((img) => {
      const alt = img.getAttribute('alt');

      return alt === null || alt.trim() === '';
    });

    // -------------------------
    // LINK CHECK
    // -------------------------

    const links = [...pageDocument.querySelectorAll('a[href]')];

    const linksWithoutText = links.filter((link) => {
      const text = link.textContent.trim();

      const hasImage = link.querySelector('img');

      return !text && !hasImage;
    });

    // -------------------------
    // HEADINGS CHECK
    // -------------------------

    const headings = [
      ...pageDocument.querySelectorAll(
        'h1, h2, h3, h4, h5, h6'
      ),
    ];

    // -------------------------
    // TITLE CHECK
    // -------------------------

    const title = pageDocument.querySelector('title');

    // -------------------------
    // META DESCRIPTION CHECK
    // -------------------------

    const metaDescription = pageDocument.querySelector(
      'meta[name="description"]'
    );

    // -------------------------
    // RETURN RESULTS
    // -------------------------

    return {
      h1Count: h1s.length,

      h1Text: h1s.map((h1) =>
        h1.textContent.trim()
      ),

      imageCount: images.length,

      imagesWithoutAlt:
        imagesWithoutAlt.length,

      linkCount: links.length,

      linksWithoutText:
        linksWithoutText.length,

      headingCount: headings.length,

      hasTitle:
        !!title &&
        title.textContent.trim().length > 0,

      hasMetaDescription:
        !!metaDescription &&
        metaDescription
          .getAttribute('content')
          ?.trim().length > 0,
    };
  }

  function closeSanity() {
    window.parent.postMessage(
      {
        type: 'sanity-close',
      },
      '*'
    );
  }

  return (
    <div className="sanity-app">

      {/* HEADER */}

      <header className="sanity-header">

        <div>
          <h1>Sanity</h1>

          <p>
            AEM Page Quality Checker
          </p>
        </div>

        <button
          type="button"
          className="close-button"
          aria-label="Close"
          onClick={closeSanity}
        >
          ×
        </button>

      </header>


      {/* CONTENT */}

      <main className="sanity-content">

        {/* LOADING */}

        {loading && (
          <div className="state-card">

            <div className="loader"></div>

            <h2>
              Checking page...
            </h2>

            <p>
              Sanity is analyzing the current AEM page.
            </p>

          </div>
        )}


        {/* ERROR */}

        {!loading && error && (
          <div className="state-card error-card">

            <div className="status-icon">
              !
            </div>

            <h2>
              Unable to check page
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="sanity-button"
              onClick={analyzeCurrentPage}
            >
              Try Again
            </button>

          </div>
        )}


        {/* RESULTS */}

        {!loading &&
          !error &&
          results && (
            <>

              {/* CURRENT PAGE */}

              <div className="page-info">

                <span className="page-info-label">
                  Checking page
                </span>

                <div className="page-url">
                  {pageUrl}
                </div>

              </div>


              {/* CHECKS */}

              <section className="results-section">

                <h2>
                  Page Checks
                </h2>


                {/* H1 */}

                <div
                  className={`check-card ${
                    results.h1Count === 1
                      ? 'success'
                      : 'warning'
                  }`}
                >

                  <div className="check-icon">
                    {results.h1Count === 1
                      ? '✓'
                      : '!'}
                  </div>

                  <div className="check-content">

                    <h3>
                      H1 Heading
                    </h3>

                    <p>
                      {results.h1Count === 1
                        ? 'Page has exactly one H1 heading.'
                        : `Page has ${results.h1Count} H1 headings.`}
                    </p>

                    {results.h1Text.length > 0 && (
                      <div className="details">

                        {results.h1Text.map(
                          (text, index) => (
                            <div
                              key={index}
                              className="detail-item"
                            >
                              H1 {index + 1}:{' '}
                              {text}
                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </div>


                {/* IMAGE ALT */}

                <div
                  className={`check-card ${
                    results.imagesWithoutAlt === 0
                      ? 'success'
                      : 'warning'
                  }`}
                >

                  <div className="check-icon">
                    {results.imagesWithoutAlt === 0
                      ? '✓'
                      : '!'}
                  </div>

                  <div className="check-content">

                    <h3>
                      Image ALT Text
                    </h3>

                    <p>
                      {results.imagesWithoutAlt === 0
                        ? `All ${results.imageCount} images have ALT text.`
                        : `${results.imagesWithoutAlt} of ${results.imageCount} images are missing ALT text.`}
                    </p>

                  </div>

                </div>


                {/* LINKS */}

                <div
                  className={`check-card ${
                    results.linksWithoutText === 0
                      ? 'success'
                      : 'warning'
                  }`}
                >

                  <div className="check-icon">
                    {results.linksWithoutText === 0
                      ? '✓'
                      : '!'}
                  </div>

                  <div className="check-content">

                    <h3>
                      Link Text
                    </h3>

                    <p>
                      {results.linksWithoutText === 0
                        ? `All ${results.linkCount} links have accessible text.`
                        : `${results.linksWithoutText} links may be missing accessible text.`}
                    </p>

                  </div>

                </div>


                {/* TITLE */}

                <div
                  className={`check-card ${
                    results.hasTitle
                      ? 'success'
                      : 'warning'
                  }`}
                >

                  <div className="check-icon">
                    {results.hasTitle
                      ? '✓'
                      : '!'}
                  </div>

                  <div className="check-content">

                    <h3>
                      Page Title
                    </h3>

                    <p>
                      {results.hasTitle
                        ? 'Page has a title.'
                        : 'Page title is missing.'}
                    </p>

                  </div>

                </div>


                {/* META DESCRIPTION */}

                <div
                  className={`check-card ${
                    results.hasMetaDescription
                      ? 'success'
                      : 'warning'
                  }`}
                >

                  <div className="check-icon">
                    {results.hasMetaDescription
                      ? '✓'
                      : '!'}
                  </div>

                  <div className="check-content">

                    <h3>
                      Meta Description
                    </h3>

                    <p>
                      {results.hasMetaDescription
                        ? 'Meta description is present.'
                        : 'Meta description is missing.'}
                    </p>

                  </div>

                </div>


                {/* HEADINGS */}

                <div className="check-card success">

                  <div className="check-icon">
                    ✓
                  </div>

                  <div className="check-content">

                    <h3>
                      Headings
                    </h3>

                    <p>
                      {results.headingCount}{' '}
                      headings found on this page.
                    </p>

                  </div>

                </div>

              </section>


              {/* REFRESH */}

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