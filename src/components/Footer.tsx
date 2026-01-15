import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-links">
                        <Link href="/">Home</Link>
                        <Link href="/about">About</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/terms">Terms</Link>
                    </div>

                    <div className="footer-disclaimer">
                        <strong>Disclaimer:</strong> This platform provides automated situational awareness
                        based on publicly available data from the GDELT Project. It does not constitute
                        news reporting, analysis, or official information. All data is sourced from
                        publicly available media and may contain inaccuracies.
                    </div>

                    <div className="footer-copy">
                        © {new Date().getFullYear()} GlobalWatch. Data sourced from GDELT Project.
                    </div>
                </div>
            </div>
        </footer>
    );
}
