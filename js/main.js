// Keyi Website - Main JavaScript

/* ── Hamburger nav ───────────────────────────────────────────────── */
const hamburger = document.querySelector('.nav-hamburger');
if (hamburger) {
    hamburger.addEventListener('click', () => {
        const open = document.body.classList.toggle('nav-open');
        hamburger.setAttribute('aria-expanded', String(open));
    });

    // Close on link click (before navigation)
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            document.body.classList.remove('nav-open');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
}
