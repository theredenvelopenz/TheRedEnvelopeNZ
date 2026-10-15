# Deploying The Red Envelope NZ

`site/` is the finished website. Upload everything inside it, keeping the folder structure.

## Important: this replaces whatever is live at theredenvelope.co.nz
If the domain currently runs your shop (checkout and Stripe), pointing it at this site takes the shop offline. To keep the shop, use a different domain or a subdomain for this site first.

## Easiest: Cloudflare Pages (free, no GitHub needed)
1. Cloudflare dashboard > Workers & Pages > Create > Pages > **Upload assets**.
2. Name the project, then drag the whole `site` folder in (folders keep their structure here) and deploy.
3. Your domain is theredenvelope.co.nz. If it is registered somewhere else you do not need to buy it: in Cloudflare choose Add a site (Free plan), then change the nameservers at your current registrar to the two Cloudflare gives you.
4. In your Pages project > Custom domains > add theredenvelope.co.nz. HTTPS is set up automatically.
5. Add a redirect so www goes to the main domain (Rules > Redirect Rules).

Cloudflare Pages applies `_headers` (security headers, HSTS, CSP) automatically.

## If you use GitHub Pages instead
Push the contents of `site/` to the repo root. Keep `assets/` and `assets/fonts/` as real folders (use GitHub Desktop or git; the browser uploader flattens folders). Add the empty `.nojekyll` file. GitHub Pages ignores `_headers`, so the CSP meta tag in `index.html` is the only header-style protection there. Cloudflare Pages is the better fit.

## Contact form
Out of the box the form opens the visitor's email app addressed to your contact email (so it never claims to have sent something it didn't).
To receive enquiries directly: create a free form at formspree.io, then edit `site/site-config.js` and paste the URL into `formEndpoint`. If you use a different service, add its domain to `connect-src` in both `_headers` and the `<meta http-equiv="Content-Security-Policy">` tag in `index.html`, and name the service in the Privacy Policy.

## If you use a different domain
Find and replace `theredenvelope.co.nz` in: `index.html`, `privacy.html`, `terms.html`, `sitemap.xml`, `robots.txt`, `.well-known/security.txt`.

## Before you go live (only you can confirm these)
- Privacy Policy says enquiries that don't lead to work are deleted within 12 months, and client records are kept for 7 years. Make sure that is what you will actually do.
- Prices are shown without saying if they include GST. If customers can be consumers, show GST-inclusive prices. Tell your quotes clearly either way.
- Claims on the site (13+ years, CompTIA Security+ / ITIL credentials, "no hidden costs", "never miss a call", "captures every lead") must be true and provable.
- If you are a company, add the registered company name and NZBN to the footer.
- Adding Google Analytics, a form service, or an AI chat backend later means updating the Privacy Policy first.
- Have a NZ lawyer read the Privacy Policy and Terms once. They are drafted for the NZ Privacy Act 2020 but are not legal advice.
