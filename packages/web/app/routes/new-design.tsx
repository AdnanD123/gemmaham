const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Barlow:wght@300;400;500;600&display=swap');

  .nd * { margin: 0; padding: 0; box-sizing: border-box; }

  .nd {
    background-color: #07090f;
    color: #e6e1d5;
    font-family: 'Barlow', sans-serif;
    font-weight: 300;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── Nav ── */
  .nd-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 22px 48px;
    background: linear-gradient(to bottom, rgba(7,9,15,0.95) 0%, transparent 100%);
    backdrop-filter: blur(10px);
  }
  .nd-nav-inner {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .nd-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: #e6e1d5;
    text-decoration: none;
  }
  .nd-logo span { color: #c8a84b; }
  .nd-nav-links {
    display: flex;
    align-items: center;
    gap: 36px;
  }
  .nd-nav-links a {
    color: rgba(230,225,213,0.55);
    text-decoration: none;
    font-size: 13px;
    letter-spacing: 0.08em;
    transition: color 0.2s;
  }
  .nd-nav-links a:hover { color: #e6e1d5; }
  .nd-nav-btn {
    padding: 9px 26px;
    border: 1px solid rgba(200,168,75,0.45);
    color: #c8a84b !important;
    transition: all 0.2s !important;
  }
  .nd-nav-btn:hover {
    background: rgba(200,168,75,0.08) !important;
    border-color: #c8a84b !important;
    color: #c8a84b !important;
  }

  /* ── Hero ── */
  .nd-hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 140px 48px 80px;
    position: relative;
    overflow: hidden;
  }
  .nd-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(200,168,75,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(200,168,75,0.04) 1px, transparent 1px);
    background-size: 80px 80px;
    pointer-events: none;
  }
  .nd-hero::after {
    content: '';
    position: absolute;
    top: 15%;
    right: -8%;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(200,168,75,0.07) 0%, transparent 65%);
    pointer-events: none;
  }
  .nd-hero-inner {
    max-width: 1280px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    z-index: 1;
  }
  .nd-eyebrow {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #c8a84b;
    margin-bottom: 32px;
    animation: nd-fadein 0.9s ease 0.1s both;
  }
  .nd-eyebrow::before {
    content: '';
    display: inline-block;
    width: 40px;
    height: 1px;
    background: #c8a84b;
    flex-shrink: 0;
  }
  .nd-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(72px, 11vw, 148px);
    font-weight: 300;
    line-height: 0.92;
    letter-spacing: -0.02em;
    color: #e6e1d5;
    margin-bottom: 40px;
    animation: nd-fadein 0.9s ease 0.25s both;
  }
  .nd-hero-title em {
    font-style: italic;
    color: #c8a84b;
  }
  .nd-hero-sub {
    max-width: 460px;
    font-size: 16px;
    font-weight: 300;
    line-height: 1.85;
    color: rgba(230,225,213,0.55);
    margin-bottom: 52px;
    animation: nd-fadein 0.9s ease 0.4s both;
  }
  .nd-hero-ctas {
    display: flex;
    gap: 20px;
    align-items: center;
    animation: nd-fadein 0.9s ease 0.55s both;
  }
  .nd-cta-primary {
    display: inline-flex;
    align-items: center;
    padding: 15px 40px;
    background: #c8a84b;
    color: #07090f;
    text-decoration: none;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    transition: background 0.2s, transform 0.2s;
  }
  .nd-cta-primary:hover { background: #d4b55e; transform: translateY(-1px); }
  .nd-cta-ghost {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 15px 20px;
    color: rgba(230,225,213,0.6);
    text-decoration: none;
    font-size: 13px;
    letter-spacing: 0.05em;
    border-bottom: 1px solid rgba(230,225,213,0.15);
    transition: all 0.2s;
  }
  .nd-cta-ghost:hover { color: #e6e1d5; border-color: rgba(230,225,213,0.4); }

  /* Stats */
  .nd-stats {
    display: flex;
    gap: 0;
    margin-top: 96px;
    border-top: 1px solid rgba(200,168,75,0.12);
    padding-top: 48px;
    animation: nd-fadein 0.9s ease 0.7s both;
  }
  .nd-stat { flex: 1; }
  .nd-stat + .nd-stat {
    padding-left: 48px;
    border-left: 1px solid rgba(230,225,213,0.07);
    margin-left: 0;
  }
  .nd-stat-num {
    display: block;
    font-family: 'Cormorant Garamond', serif;
    font-size: 60px;
    font-weight: 300;
    color: #c8a84b;
    line-height: 1;
    margin-bottom: 10px;
  }
  .nd-stat-label {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(230,225,213,0.35);
  }

  /* ── Features ── */
  .nd-features {
    padding: 130px 48px;
    background: #0b0e18;
  }
  .nd-section-inner { max-width: 1280px; margin: 0 auto; }
  .nd-section-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #c8a84b;
    margin-bottom: 20px;
  }
  .nd-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(40px, 5vw, 68px);
    font-weight: 300;
    line-height: 1.1;
    color: #e6e1d5;
    max-width: 580px;
    margin-bottom: 80px;
  }
  .nd-section-title em { font-style: italic; color: #c8a84b; }
  .nd-features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: rgba(200,168,75,0.08);
    border: 1px solid rgba(200,168,75,0.08);
  }
  .nd-feature-card {
    background: #0b0e18;
    padding: 52px;
    transition: background 0.3s;
    cursor: default;
  }
  .nd-feature-card:hover { background: rgba(200,168,75,0.03); }
  .nd-feature-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 60px;
    font-weight: 300;
    color: rgba(200,168,75,0.18);
    line-height: 1;
    margin-bottom: 28px;
  }
  .nd-feature-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 400;
    color: #e6e1d5;
    margin-bottom: 18px;
  }
  .nd-feature-desc {
    font-size: 14px;
    font-weight: 300;
    line-height: 1.9;
    color: rgba(230,225,213,0.45);
  }

  /* ── Roles ── */
  .nd-roles {
    padding: 130px 48px;
    position: relative;
    overflow: hidden;
  }
  .nd-roles::before {
    content: '';
    position: absolute;
    right: -5%;
    top: 40%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(68,112,212,0.05) 0%, transparent 70%);
    pointer-events: none;
  }
  .nd-roles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
  .nd-role-card {
    padding: 48px;
    border: 1px solid rgba(230,225,213,0.06);
    position: relative;
    transition: border-color 0.35s, transform 0.35s;
  }
  .nd-role-card:hover {
    border-color: rgba(200,168,75,0.22);
    transform: translateY(-5px);
  }
  .nd-role-card::before {
    content: '';
    position: absolute;
    top: -1px; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(to right, #c8a84b 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.35s;
  }
  .nd-role-card:hover::before { opacity: 1; }
  .nd-role-icon {
    width: 52px;
    height: 52px;
    border: 1px solid rgba(200,168,75,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32px;
    font-size: 22px;
  }
  .nd-role-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px;
    font-weight: 400;
    color: #e6e1d5;
    margin-bottom: 16px;
  }
  .nd-role-desc {
    font-size: 14px;
    font-weight: 300;
    line-height: 1.9;
    color: rgba(230,225,213,0.45);
    margin-bottom: 28px;
  }
  .nd-role-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .nd-role-list li {
    font-size: 13px;
    color: rgba(230,225,213,0.35);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    line-height: 1.5;
  }
  .nd-role-list li::before {
    content: '—';
    color: #c8a84b;
    font-size: 11px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  /* ── CTA Section ── */
  .nd-final-cta {
    padding: 140px 48px;
    background: linear-gradient(135deg, #0d1220 0%, #090c16 100%);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .nd-final-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(200,168,75,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(200,168,75,0.025) 1px, transparent 1px);
    background-size: 64px 64px;
  }
  .nd-cta-inner {
    position: relative;
    z-index: 1;
    max-width: 720px;
    margin: 0 auto;
  }
  .nd-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 8vw, 100px);
    font-weight: 300;
    line-height: 0.95;
    color: #e6e1d5;
    margin-bottom: 28px;
  }
  .nd-cta-title em { font-style: italic; color: #c8a84b; }
  .nd-cta-sub {
    font-size: 16px;
    color: rgba(230,225,213,0.45);
    margin-bottom: 56px;
    font-weight: 300;
    line-height: 1.7;
  }
  .nd-cta-btns { display: flex; gap: 16px; justify-content: center; align-items: center; }

  /* ── Footer ── */
  .nd-footer {
    padding: 36px 48px;
    border-top: 1px solid rgba(230,225,213,0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .nd-footer-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: rgba(230,225,213,0.35);
  }
  .nd-footer-links {
    display: flex;
    gap: 28px;
  }
  .nd-footer-links a {
    font-size: 12px;
    letter-spacing: 0.08em;
    color: rgba(230,225,213,0.25);
    text-decoration: none;
    transition: color 0.2s;
  }
  .nd-footer-links a:hover { color: rgba(230,225,213,0.6); }
  .nd-footer-copy {
    font-size: 11px;
    letter-spacing: 0.06em;
    color: rgba(230,225,213,0.2);
  }

  /* ── Animations ── */
  @keyframes nd-fadein {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Comparison banner ── */
  .nd-banner {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999;
    background: rgba(7,9,15,0.92);
    border: 1px solid rgba(200,168,75,0.35);
    backdrop-filter: blur(12px);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .nd-banner span {
    font-size: 12px;
    letter-spacing: 0.08em;
    color: rgba(230,225,213,0.6);
  }
  .nd-banner a {
    font-size: 12px;
    letter-spacing: 0.08em;
    color: #c8a84b;
    text-decoration: none;
    border-bottom: 1px solid rgba(200,168,75,0.3);
    transition: border-color 0.2s;
  }
  .nd-banner a:hover { border-color: #c8a84b; }
`;

export default function NewDesignPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="nd">

        {/* ── Nav ── */}
        <nav className="nd-nav">
          <div className="nd-nav-inner">
            <a href="/" className="nd-logo">GEMMA<span>HAM</span></a>
            <div className="nd-nav-links">
              <a href="/properties">Properties</a>
              <a href="/buildings">Buildings</a>
              <a href="/auth/login">Sign In</a>
              <a href="/auth/register" className="nd-nav-btn">Get Started</a>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="nd-hero">
          <div className="nd-hero-inner">
            <div className="nd-eyebrow">AI-Powered Real Estate Platform</div>

            <h1 className="nd-hero-title">
              The Future<br />
              of <em>Real Estate</em><br />
              Is Here
            </h1>

            <p className="nd-hero-sub">
              Transform 2D floor plans into stunning 3D visualizations.
              Connect buyers, agencies, and contractors on one intelligent platform.
            </p>

            <div className="nd-hero-ctas">
              <a href="/properties" className="nd-cta-primary">Browse Properties</a>
              <a href="/auth/register" className="nd-cta-ghost">Create Account →</a>
            </div>

            <div className="nd-stats">
              <div className="nd-stat">
                <span className="nd-stat-num">3D</span>
                <span className="nd-stat-label">AI Visualization</span>
              </div>
              <div className="nd-stat">
                <span className="nd-stat-num">3</span>
                <span className="nd-stat-label">Integrated Roles</span>
              </div>
              <div className="nd-stat">
                <span className="nd-stat-num">∞</span>
                <span className="nd-stat-label">Possibilities</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="nd-features">
          <div className="nd-section-inner">
            <div className="nd-section-label">Platform Capabilities</div>
            <h2 className="nd-section-title">
              Everything you need,<br />
              <em>nothing you don't</em>
            </h2>

            <div className="nd-features-grid">
              <div className="nd-feature-card">
                <div className="nd-feature-num">01</div>
                <div className="nd-feature-title">AI Floor Plan Visualization</div>
                <p className="nd-feature-desc">
                  Upload any 2D floor plan and let our AI engine generate immersive
                  3D renders in seconds. Give buyers the spatial understanding they
                  need before ever stepping foot inside.
                </p>
              </div>
              <div className="nd-feature-card">
                <div className="nd-feature-num">02</div>
                <div className="nd-feature-title">Real-Time Communication</div>
                <p className="nd-feature-desc">
                  Built-in messaging between users, agencies, and contractors.
                  No third-party tools. No lost threads. Every conversation
                  tied to the right property or project.
                </p>
              </div>
              <div className="nd-feature-card">
                <div className="nd-feature-num">03</div>
                <div className="nd-feature-title">End-to-End Reservations</div>
                <p className="nd-feature-desc">
                  From browsing to signed reservation — manage the entire
                  lifecycle in one place. Status tracking, meeting scheduling,
                  and deposit confirmation built in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Roles ── */}
        <section className="nd-roles">
          <div className="nd-section-inner">
            <div className="nd-section-label">Who It's For</div>
            <h2 className="nd-section-title">
              Three roles.<br />
              <em>One platform.</em>
            </h2>

            <div className="nd-roles-grid">
              <div className="nd-role-card">
                <div className="nd-role-icon">🏠</div>
                <div className="nd-role-title">Buyers & Renters</div>
                <p className="nd-role-desc">
                  Discover properties with 3D previews, reserve your space,
                  and communicate directly with agencies — all without leaving
                  the platform.
                </p>
                <ul className="nd-role-list">
                  <li>Browse flats, houses & buildings</li>
                  <li>3D floor plan visualization</li>
                  <li>Send reservation requests</li>
                  <li>Track reservation status</li>
                  <li>Direct messaging with agencies</li>
                </ul>
              </div>

              <div className="nd-role-card">
                <div className="nd-role-icon">🏢</div>
                <div className="nd-role-title">Agencies & Companies</div>
                <p className="nd-role-desc">
                  List properties, manage reservations, assign contractors
                  to buildings, and track everything through a powerful
                  agency dashboard.
                </p>
                <ul className="nd-role-list">
                  <li>Upload & manage listings</li>
                  <li>AI-generate 3D renders</li>
                  <li>Approve reservations</li>
                  <li>Assign contractors to projects</li>
                  <li>Analytics & insights</li>
                </ul>
              </div>

              <div className="nd-role-card">
                <div className="nd-role-icon">🔧</div>
                <div className="nd-role-title">Contractors</div>
                <p className="nd-role-desc">
                  Build your public profile, apply for building projects,
                  and communicate with agencies — all in one professional
                  contractor workspace.
                </p>
                <ul className="nd-role-list">
                  <li>Public contractor profile</li>
                  <li>Browse open building projects</li>
                  <li>Apply to assignments</li>
                  <li>Track project progress</li>
                  <li>Agency messaging</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="nd-final-cta">
          <div className="nd-cta-inner">
            <div className="nd-section-label" style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', marginBottom: '24px' }}>
              Start Today
            </div>
            <h2 className="nd-cta-title">
              Your next property<br />
              <em>awaits</em>
            </h2>
            <p className="nd-cta-sub">
              Join Gemmaham and experience real estate the way it was meant to be —
              transparent, visual, and connected.
            </p>
            <div className="nd-cta-btns">
              <a href="/auth/register" className="nd-cta-primary">Get Started Free</a>
              <a href="/properties" className="nd-cta-ghost">Browse Properties →</a>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="nd-footer">
          <div className="nd-footer-logo">GEMMAHAM</div>
          <div className="nd-footer-links">
            <a href="/properties">Properties</a>
            <a href="/buildings">Buildings</a>
            <a href="/auth/login">Sign In</a>
            <a href="/auth/register">Register</a>
          </div>
          <div className="nd-footer-copy">© 2026 Gemmaham</div>
        </footer>

      </div>

      {/* Comparison banner */}
      <div className="nd-banner">
        <span>New Design Preview</span>
        <a href="/">← Back to current design</a>
      </div>
    </>
  );
}
