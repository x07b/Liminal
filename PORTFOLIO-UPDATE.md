# Portfolio import — 2026-10-03

Seven supplied project sets were imported into the existing SQLite CMS. Paravie remains unchanged apart from its homepage order. The old Le geste, Résonance and FORMA projects are recoverable in the admin trash. Fictional testimonials and partner logos are unpublished, not removed.

## Sources and editorial choices
- Sayarty: sayara.pdf, six boards; use the actual brand spelling visible in the artwork.
- MecanoHub: hub.pdf, eight selected boards.
- Luxence: Lux.pdf, thirteen selected boards; the source dates its guidelines to 2024.
- Festive Wonder: The Festive Wonder Tree Team.pdf, twelve concept boards, credited to the team / MAGENTA. Presented as a concept, not proof of a built installation.
- Meliora: meliora1.pdf, ten boards.
- Destination Tuscany: Pumpkin.pdf, seven proposal boards. Credit retained as Farah Pumpkin. Personal contact/closing pages omitted. Presented as a proposal, not a completed website.
- Equality starts at home: all twelve supplied Oxfam-folder images. No direct client relationship or result metric asserted from the folder name.

Project text, images, order, visibility, featured state, case-study descriptions and gallery layout remain editable through Admin > Projects. Public media use supported /images/ URLs, so normal CMS saves preserve them. The homepage hero follows the first featured project in display order.

The import script in work/import-portfolio.mjs is a one-time migration, not a startup task. Do not rerun it after editorial changes; it replaces these imported records. Sources remain untouched. Original PDF files and their personal contact pages are not published.

## Restore
Pre-change source, package files, project records and a consistent SQLite snapshot:
C:/Users/Zuss/Documents/Codex/Liminal-Restore-Points/before-portfolio-direction-20261003

The older original business-prompt restore point was not modified. New portfolio assets are listed in work/portfolio-review/assets.json. A restore must remove these new assets as well as restore source/package/database files and rebuild; do not replace the entire database if later real inquiries need preserving without reviewing that separately.

## Verification
- Production build passed (existing bundle-size advisory remains).
- 23 server tests passed.
- All eight published projects and 75 referenced media returned successfully from the local preview.
- Desktop gallery: open, next image, Escape, focus return verified.
- Mobile 390px: full poster, no horizontal overflow, no broken images; light and dark checked.
- Homepage anchors, persistent navbar and revised text reveal checked.
- Motion preferences bypass smooth scrolling; native touch and dialogs excluded from wheel smoothing.
