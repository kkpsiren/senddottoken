export const Footer = () => (
  <footer className="footer">
    <div className="footer-links">
      <span>© {new Date().getFullYear()} Send.Token</span>
    </div>
    <div className="footer-links" style={{ marginTop: 8 }}>
      <a href="https://orb.club" target="_blank" rel="noopener noreferrer">
        orb.club
      </a>

      <a
        href="https://github.com/kkpsiren/senddottoken"
        target="_blank"
        rel="noopener noreferrer"
      >
        github
      </a>
      <a href="https://lens.xyz" target="_blank" rel="noopener noreferrer">
        lens.xyz
      </a>
    </div>
  </footer>
);
