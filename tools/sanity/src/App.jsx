import { useEffect, useState } from 'react';
import './App.css';

function analyzeHTML(html, pageUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // -----------------------------
  // HEADINGS
  // -----------------------------

  const h1 = [...doc.querySelectorAll('h1')];
  const h2 = [...doc.querySelectorAll('h2')];
  const h3 = [...doc.querySelectorAll('h3')];

  const allHeadings = [
    ...doc.querySelectorAll('h1, h2, h3, h4, h5, h6'),
  ];

  const headingHierarchyIssues = [];

  allHeadings.forEach((heading, index) => {
    if (index === 0) return;

    const previous = allHeadings[index - 1];

    const previousLevel = Number(
      previous.tagName.replace('H', '')
    );

    const currentLevel = Number(
      heading.tagName.replace('H', '')
    );

    if (currentLevel - previousLevel > 1) {
      headingHierarchyIssues.push(
        `${previous.tagName} → ${heading.tagName}`
      );
    }
  });

  // -----------------------------
  // SEO
  // -----------------------------

  const title =
    doc.querySelector('title')?.textContent.trim() || '';

  const description =
    doc
      .querySelector('meta[name="description"]')
      ?.getAttribute('content')
      ?.trim() || '';

  const canonical =
    doc
      .querySelector('link[rel="canonical"]')
      ?.getAttribute('href')
      ?.trim() || '';

  const robots =
    doc
      .querySelector('meta[name="robots"]')
      ?.getAttribute('content')
      ?.trim() || '';

  const ogTitle =
    doc
      .querySelector('meta[property="og:title"]')
      ?.getAttribute('content')
      ?.trim() || '';

  const ogDescription =
    doc
      .querySelector('meta[property="og:description"]')
      ?.getAttribute('content')
      ?.trim() || '';

  // -----------------------------
  // IMAGES
  // -----------------------------

  const images = [
    ...doc.querySelectorAll('img'),
  ];

  const missingAlt = images.filter(
    (img) => !img.hasAttribute('alt')
  );

  const emptyAlt = images.filter(
    (img) =>
      img.hasAttribute('alt') &&
      !img.getAttribute('alt')?.trim()
  );

  // -----------------------------
  // LINKS
  // -----------------------------

  const links = [
    ...doc.querySelectorAll('a[href]'),
  ];

  const internalLinks = links.filter((link) => {
    try {
      return (
        new URL(link.href, pageUrl).origin ===
        new URL(pageUrl).origin
      );
    } catch {
      return false;
    }
  });

  const externalLinks = links.filter((link) => {
    try {
      return (
        new URL(link.href, pageUrl).origin !==
        new URL(pageUrl).origin
      );
    } catch {
      return false;
    }
  });

  const emptyLinks = links.filter(
    (link) =>
      !link.textContent?.trim() &&
      !link.getAttribute('aria-label')
  );

  // -----------------------------
  // BUTTON ACCESSIBILITY
  // -----------------------------

  const buttons = [
    ...doc.querySelectorAll('button'),
  ];

  const inaccessibleButtons = buttons.filter(
    (button) =>
      !button.textContent?.trim() &&
      !button.getAttribute('aria-label') &&
      !button.getAttribute('title')
  );

  // -----------------------------
  // CONTENT
  // -----------------------------

  const bodyText =
    doc.body?.innerText || '';

  const words = bodyText.trim()
    ? bodyText.trim().split(/\s+/).length
    : 0;

  // -----------------------------
  // ISSUES
  // -----------------------------

  const issues = [];

  if (h1.length === 0) {
    issues.push({
      type: 'error',
      message: 'H1 tag is missing',
    });
  }

  if (h1.length > 1) {
    issues.push({
      type: 'warning',
      message: `Multiple H1 tags found (${h1.length})`,
    });
  }

  if (!title) {
    issues.push({
      type: 'error',
      message: 'Page title is missing',
    });
  }

  if (!description) {
    issues.push({
      type: 'warning',
      message: 'Meta description is missing',
    });
  }

  if (!canonical) {
    issues.push({
      type: 'warning',
      message: 'Canonical URL is missing',
    });
  }

  if (missingAlt.length > 0) {
    issues.push({
      type: 'error',
      message: `${missingAlt.length} image(s) missing alt text`,
    });
  }

  if (emptyAlt.length > 0) {
    issues.push({
      type: 'warning',
      message: `${emptyAlt.length} image(s) have empty alt`,
    });
  }

  if (emptyLinks.length > 0) {
    issues.push({
      type: 'warning',
      message: `${emptyLinks.length} link(s) have no accessible text`,
    });
  }

  if (inaccessibleButtons.length > 0) {
    issues.push({
      type: 'warning',
      message: `${inaccessibleButtons.length} button(s) have no accessible name`,
    });
  }

  if (headingHierarchyIssues.length > 0) {
    issues.push({
      type: 'warning',
      message: `${headingHierarchyIssues.length} heading hierarchy issue(s)`,
    });
  }

  // -----------------------------
  // SCORE
  // -----------------------------

  let score = 100;

  if (h1.length === 0) score -= 15;
  if (h1.length > 1) score -= 5;
  if (!title) score -= 10;
  if (!description) score -= 5;
  if (!canonical) score -= 5;

  score -= missingAlt.length * 3;
  score -= emptyAlt.length * 2;
  score -= emptyLinks.length * 2;
  score -= inaccessibleButtons.length * 2;
  score -= headingHierarchyIssues.length * 2;

  score = Math.max(
    0,
    Math.min(100, score)
  );

  return {
    url: pageUrl,

    score,

    headings: {
      h1: h1.length,
      h2: h2.length,
      h3: h3.length,

      h1Texts: h1.map(
        (item) =>
          item.textContent.trim()
      ),

      hierarchyIssues:
        headingHierarchyIssues,
    },

    seo: {
      title,
      description,
      canonical,
      robots,
      ogTitle,
      ogDescription,
    },

    images: {
      total: images.length,
      missingAlt: missingAlt.length,
      emptyAlt: emptyAlt.length,
    },

    links: {
      total: links.length,
      internal: internalLinks.length,
      external: externalLinks.length,
      empty: emptyLinks.length,
    },

    accessibility: {
      inaccessibleButtons:
        inaccessibleButtons.length,
    },

    content: {
      words,
      characters: bodyText.length,
    },

    issues,
  };
}

function StatusIcon({ good }) {
  return (
    <span
      className={
        good
          ? 'status-icon good'
          : 'status-icon bad'
      }
    >
      {good ? '✓' : '!' }
    </span>
  );
}

function App() {
  const [pageUrl, setPageUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --------------------------------
  // GET URL FROM SIDEKICK
  // --------------------------------

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const url = params.get('url');

    if (url) {
      setPageUrl(url);

      checkPage(url);
    }
  }, []);

  // --------------------------------
  // CHECK PAGE
  // --------------------------------

  async function checkPage(url) {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const html =
        await response.text();

      const analysis =
        analyzeHTML(
          html,
          url
        );

      setResult(analysis);

    } catch (error) {
      setError(
        'Unable to analyze this page. The page may block cross-origin requests (CORS).'
      );
    }

    setLoading(false);
  }

  // --------------------------------
  // CLOSE PANEL
  // --------------------------------

  function closePanel() {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'SANITY_CLOSE',
        },
        '*'
      );
    } else {
      window.history.back();
    }
  }

  return (
    <div className="sanity-overlay">

      <div className="sanity-panel">

        {/* HEADER */}

        <header className="sanity-header">

          <div>

            <span className="sanity-label">
              PAGE SANITY
            </span>

            <h1>
              Sanity Checker
            </h1>

          </div>

          <button
            className="close-button"
            onClick={closePanel}
          >
            ×
          </button>

        </header>

        {/* PAGE URL */}

        <div className="page-bar">

          <span>
            Current Page
          </span>

          <div className="current-url">
            {pageUrl ||
              'No page URL detected'}
          </div>

        </div>

        {/* CONTENT */}

        <main className="sanity-content">

          {loading && (

            <div className="loading">

              <div className="loader" />

              <h3>
                Analyzing page...
              </h3>

              <p>
                Please wait while we check
                the page.
              </p>

            </div>

          )}

          {error && (

            <div className="error-box">

              <strong>
                Unable to analyze page
              </strong>

              <p>
                {error}
              </p>

              <button
                onClick={() =>
                  checkPage(pageUrl)
                }
              >
                Try Again
              </button>

            </div>

          )}

          {result && !loading && (

            <>

              {/* SCORE */}

              <section className="score-section">

                <div>

                  <span>
                    Overall Score
                  </span>

                  <strong>
                    {result.score}
                    <small>/100</small>
                  </strong>

                </div>

                <div className="score-circle">
                  {result.score}%
                </div>

              </section>

              {/* HEADINGS */}

              <section className="check-section">

                <div className="section-title">

                  <h2>
                    Headings
                  </h2>

                  <span>
                    Structure
                  </span>

                </div>

                <div className="metric-grid">

                  <div className="metric">

                    <span>
                      H1 Tags
                    </span>

                    <strong>
                      {result.headings.h1}
                    </strong>

                    <StatusIcon
                      good={
                        result.headings.h1 === 1
                      }
                    />

                  </div>

                  <div className="metric">

                    <span>
                      H2 Tags
                    </span>

                    <strong>
                      {result.headings.h2}
                    </strong>

                  </div>

                  <div className="metric">

                    <span>
                      H3 Tags
                    </span>

                    <strong>
                      {result.headings.h3}
                    </strong>

                  </div>

                </div>

              </section>

              {/* SEO */}

              <section className="check-section">

                <div className="section-title">

                  <h2>
                    SEO
                  </h2>

                  <span>
                    Search Optimization
                  </span>

                </div>

                <div className="check-list">

                  <div className="check-row">

                    <span>
                      Page Title
                    </span>

                    <StatusIcon
                      good={
                        Boolean(
                          result.seo.title
                        )
                      }
                    />

                  </div>

                  <div className="check-row">

                    <span>
                      Meta Description
                    </span>

                    <StatusIcon
                      good={
                        Boolean(
                          result.seo.description
                        )
                      }
                    />

                  </div>

                  <div className="check-row">

                    <span>
                      Canonical URL
                    </span>

                    <StatusIcon
                      good={
                        Boolean(
                          result.seo.canonical
                        )
                      }
                    />

                  </div>

                  <div className="check-row">

                    <span>
                      Open Graph Title
                    </span>

                    <StatusIcon
                      good={
                        Boolean(
                          result.seo.ogTitle
                        )
                      }
                    />

                  </div>

                </div>

              </section>

              {/* IMAGES */}

              <section className="check-section">

                <div className="section-title">

                  <h2>
                    Images
                  </h2>

                </div>

                <div className="metric-grid">

                  <div className="metric">

                    <span>
                      Total
                    </span>

                    <strong>
                      {result.images.total}
                    </strong>

                  </div>

                  <div className="metric">

                    <span>
                      Missing Alt
                    </span>

                    <strong>
                      {result.images.missingAlt}
                    </strong>

                    <StatusIcon
                      good={
                        result.images.missingAlt === 0
                      }
                    />

                  </div>

                  <div className="metric">

                    <span>
                      Empty Alt
                    </span>

                    <strong>
                      {result.images.emptyAlt}
                    </strong>

                  </div>

                </div>

              </section>

              {/* LINKS */}

              <section className="check-section">

                <div className="section-title">

                  <h2>
                    Links
                  </h2>

                </div>

                <div className="metric-grid">

                  <div className="metric">

                    <span>
                      Total
                    </span>

                    <strong>
                      {result.links.total}
                    </strong>

                  </div>

                  <div className="metric">

                    <span>
                      Internal
                    </span>

                    <strong>
                      {result.links.internal}
                    </strong>

                  </div>

                  <div className="metric">

                    <span>
                      External
                    </span>

                    <strong>
                      {result.links.external}
                    </strong>

                  </div>

                </div>

              </section>

              {/* CONTENT */}

              <section className="check-section">

                <div className="section-title">

                  <h2>
                    Content
                  </h2>

                </div>

                <div className="metric-grid">

                  <div className="metric">

                    <span>
                      Words
                    </span>

                    <strong>
                      {result.content.words}
                    </strong>

                  </div>

                  <div className="metric">

                    <span>
                      Characters
                    </span>

                    <strong>
                      {result.content.characters}
                    </strong>

                  </div>

                </div>

              </section>

              {/* H1 */}

              <section className="check-section">

                <div className="section-title">

                  <h2>
                    H1 Content
                  </h2>

                </div>

                {result.headings.h1Texts.length > 0 ? (

                  result.headings.h1Texts.map(
                    (text, index) => (

                      <div
                        className="text-result"
                        key={index}
                      >
                        {text ||
                          '(Empty H1)'}
                      </div>

                    )
                  )

                ) : (

                  <div className="empty-result">
                    No H1 tag found.
                  </div>

                )}

              </section>

              {/* ISSUES */}

              <section className="check-section">

                <div className="section-title">

                  <h2>
                    Issues
                  </h2>

                  <span>
                    {result.issues.length}
                  </span>

                </div>

                {result.issues.length > 0 ? (

                  <div className="issues">

                    {result.issues.map(
                      (issue, index) => (

                        <div
                          className={
                            `issue ${issue.type}`
                          }
                          key={index}
                        >

                          <span>
                            {issue.type === 'error'
                              ? '!'
                              : '⚠'}
                          </span>

                          <p>
                            {issue.message}
                          </p>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <div className="success">

                    ✓ No major issues found.

                  </div>

                )}

              </section>

            </>

          )}

        </main>

      </div>

    </div>
  );
}

export default App;