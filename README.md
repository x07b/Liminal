# LIMINAL — Creative Production House

Projet de référence : `C:\Users\Zuss\Repo\Liminal`. React, JavaScript, Vite et Motion. Polices et visuels locaux.

## Lancer le site

Node.js 22.13 ou plus récent.

```sh
npm ci
npm run dev -- --port 5180
```

Vite sert le site et son API sur la même adresse. Vérifier et compiler :

```sh
npm test
npm run build
npm start
```

`npm start` sert la version compilée et l’API sur le port 5180. Arrêter le serveur de développement avant, ou choisir un autre `PORT`. `npm run preview` comprend également l’API.

## Pages et langues

- Home : récit éditorial en plusieurs chapitres, aperçu des projets, services, méthode et accès à l’histoire.
- Les sections et leurs contenus se révèlent au scroll. Le mouvement respecte `prefers-reduced-motion`.
- Les témoignages publiés depuis l’administration apparaissent automatiquement sur la Home. En l’absence de témoignage réel, la section reste masquée.
- Projects : galerie alternée, filtres et détails alimentés par la base de données.
- Our Story : histoire, convictions, fondateur et mur participatif modéré.
- Join Us : trois parcours distincts — recrutement, freelance et sponsoring.
- Contact : brief client enregistré dans l’administration, puis suivi par email.
- `/admin` : projets, médias, témoignages, empreintes, demandes, audience, campagnes et corbeille récupérable.

Le sélecteur **FR / EN / عربي** traduit l’interface, les contenus éditoriaux et les projets de démonstration. L’arabe utilise une mise en page RTL. L’éditeur de projet permet d’ajouter des versions anglaises et arabes ; un champ non traduit reprend le français.

Les anciennes routes `/projets` et `/studio` redirigent vers les nouvelles pages.

## Leave your mark

Le visiteur choisit son nom public, renseigne un email privé, puis positionne le pictorial original. La trace reste invisible jusqu’à son approbation dans **Admin → Empreintes**. L’email n’est jamais exposé par l’API publique.

L’abonnement aux nouvelles est un choix séparé et facultatif. Le contact doit encore confirmer son email ; approuver une empreinte ne l’abonne pas. Chaque campagne contient un lien personnel de désabonnement.

Les traces, demandes, projets, abonnés et journaux sont enregistrés dans `data/marks.sqlite`. Le mur affiche 24 traces approuvées par page. Les formulaires utilisent des identifiants de requête pour éviter les doublons.

Chaque nouveau brief, candidature, proposition de collaboration, sponsoring ou empreinte envoie aussi une notification privée à `ADMIN_NOTIFICATION_EMAIL`. Une panne temporaire du service email ne supprime jamais la demande : elle reste enregistrée dans l’administration.

## Première ouverture de l’administration

Si le compte est déjà activé, aller sur `http://127.0.0.1:5180/admin`, saisir l’email et le mot de passe administrateur, puis utiliser le code reçu par email.

**Mot de passe oublié ?** demande d’abord l’email administrateur, puis son code de vérification. Le nouveau mot de passe est choisi seulement après validation du code. L’application ne confirme pas publiquement si une autre adresse existe ou non.

Pour une nouvelle installation :

1. Aller sur `http://127.0.0.1:5180/admin`.
2. Utiliser l’email `itsazizsaidi@gmail.com`.
3. Créer un mot de passe d’au moins 14 caractères avec majuscule, minuscule, chiffre et symbole. Ne pas le placer dans `.env` ou dans le code.
4. Copier la clé depuis `data/ADMIN-SETUP.txt`. Cette clé locale est supprimée après la création réussie du compte.
5. En mode local, ouvrir le fichier le plus récent de `data/mail-preview` et saisir le code à six chiffres.

À chaque connexion, un nouveau code valable 10 minutes est demandé. La session est stockée dans un cookie `HttpOnly`, `SameSite=Strict`, protégé par un jeton CSRF, avec 30 minutes d’inactivité et huit heures maximum. Les mots de passe sont hachés avec scrypt. Les tentatives, imports et envois sont limités. Les actions sensibles sont consignées dans le journal de l’administration.

Le mot de passe n’est volontairement pas créé dans le dépôt : le propriétaire le choisit lui-même dans cet écran privé.

## Projets et médias

Les deux concepts existants sont migrés automatiquement dans la base comme projets publiés et restent modifiables. Depuis **Admin → Projets**, on peut :

- créer un brouillon ou publier un projet ;
- modifier textes, catégorie, crédits, livrables et traductions ;
- importer JPG, PNG ou WebP jusqu’à 15 Mo ;
- importer MP4 ou WebM jusqu’à 100 Mo et ajouter une affiche ;
- utiliser une URL HTTPS externe pour un média.
- placer un projet dans la corbeille puis le restaurer pendant 30 jours ;
- vider toute la corbeille immédiatement avec une confirmation explicite.

Les empreintes disposent de la même corbeille, séparée de l’action **Refuser**. Après 30 jours, les projets et empreintes supprimés sont effacés automatiquement ; un média importé est également retiré s’il n’est plus utilisé par aucun autre projet.

Depuis **Admin → Témoignages**, on peut créer, modifier, publier ou supprimer un témoignage, ajouter le nom, le poste, l’entreprise, une signature digitale, une photo et un logo. Les images utilisent le même import sécurisé que les projets.

Les types réels sont contrôlés à partir du contenu du fichier. SVG et contenus arbitraires sont refusés. Les vidéos locales acceptent les requêtes partielles nécessaires à la lecture.

Pour sauvegarder, arrêter le serveur puis copier le dossier `data`, ou utiliser une sauvegarde SQLite adaptée.

## Hébergement

L’administration, les formulaires et le mur nécessitent **un serveur Node et un disque persistant**. Publier seulement `dist` sur un hébergement statique ne suffit pas.

Copier `.env.example` vers `.env` pour la configuration locale. Le mode email par défaut écrit des aperçus privés dans `data/mail-preview` et refuse de fonctionner à distance. Pour publier :

- `SITE_ORIGIN=https://votre-domaine` ;
- `MAIL_MODE=resend`, `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL` et `MAIL_FROM` vérifiés ;
- `LIMINAL_DATA_DIR` sur un volume persistant ;
- HTTPS obligatoire et une seule instance Node pour cette version SQLite.

Le serveur ajoute une politique CSP, bloque l’affichage dans une iframe, limite les permissions navigateur et active HSTS quand `SITE_ORIGIN` utilise HTTPS. Derrière un proxy, adapter la détection d’adresse uniquement avec une configuration de proxy de confiance.

Sans domaine vérifié, Resend autorise l’adresse de test `onboarding@resend.dev` seulement vers l’email propriétaire du compte. Cela suffit pour les alertes administrateur et les codes de connexion. Les confirmations et campagnes destinées aux visiteurs demandent un domaine LIMINAL vérifié et un `MAIL_FROM` sur ce domaine.

Les emails transactionnels utilisent un gabarit HTML responsive avec le logo LIMINAL intégré au message, une version texte de secours et des clés d’idempotence.

Avant publication, compléter les vrais projets et leurs crédits, confirmer coordonnées et domaine, puis ajouter canonical et sitemap. Le site n’a pas été publié.

## Personnaliser

- `src/content.js` : coordonnées, projets, services, méthode et FAQ.
- `src/main.jsx` : pages et navigation.
- `src/HandprintWall.jsx`, `src/Join.jsx` et `src/InquiryForm.jsx` : interactions publiques.
- `src/Admin.jsx` : tableau de bord et éditeur de projets.
- `src/locale.jsx` et `src/translations.json` : langues et RTL.
- `src/styles.css`, `src/community.css`, `src/portal.css` et `src/admin.css` : présentation.
- `server/portal.js` et `server/index.js` : authentification, données, médias et serveur.
- `public/brand/` : les quatre SVG originaux fournis, conservés.

Les deux projets présents sont des études conceptuelles originales, pas des campagnes clients. « Le geste » utilise une image générée par IA ; « Résonance » est une composition vectorielle. Remplacer ou compléter avec les vrais travaux et leur attribution.

## Image et provenance

Fichiers utilisés : `public/images/liminal-editorial.webp` et `public/images/liminal-editorial-small.webp`.

Création avec le **outil intégré ImageGen**, puis optimisation WebP avec Sharp. Prompt original intégral :

> Use case: ads-marketing. Asset type: ultra-wide cinematic website hero image for LIMINAL, a premium Tunisian creative production house. Create an original art-direction study, no text or logos. Wide editorial 21:9 composition: a mysterious anonymous human figure almost entirely obscured by an enormous flowing sheet of burnt vermilion silk, sculptural windblown fabric spanning the central and right portions of the image, one graceful hand subtly visible reaching from the fabric. Understated warm sandstone architectural space, dark brown shadow on left, late afternoon directional light from upper right, tactile film grain, deep rich blacks and glowing terracotta highlights. Fashion-film still meets contemporary art. Beautiful physical fabric folds, realistic photographic texture, cinematic intentional composition, sophisticated and warm not sci-fi. Large horizontal composition, no collage, no frames, no letters, no watermark. The figure is fully clothed and obscured. Make it look like an expensive art-house production still with generous quiet space and an enigmatic human gesture.

Les polices DM Sans et Manrope sont distribuées via Fontsource ; leurs licences sont incluses dans leurs packages. L’archive du projet contient également une copie des licences.
