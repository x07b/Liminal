# Vérification de la première version

Vérifications réalisées le 30 septembre 2026, dans le navigateur intégré.

- Compilation de production réussie avec Vite 8.3.1.
- Serveur de développement lancé et page d’accueil chargée sans erreurs console.
- Page d’accueil : absence de débordement horizontal et de titres hors écran aux largeurs 375, 768, 1024 et 1440 px.
- Inspection visuelle du hero sur desktop et mobile, et du studio sur mobile.
- Images chargées, polices locales présentes.
- Navigation vers les explorations et leurs détails.
- Filtre Identité : une entrée affichée, entrée Image retirée.
- Accordéon services : ouverture et état ARIA vérifiés.
- FAQ : affichage de la réponse sur budget et délai.
- Menu mobile : ouverture, fermeture par Escape, navigation et fermeture après choix.
- Lien Approche depuis Studio : retour à l’accueil sur la bonne section.
- Formulaire vide : trois champs invalides, aucun brouillon créé.
- Formulaire rempli avec des données de test : brouillon et lien mailto correctement encodés. Aucun email envoyé.
- Page introuvable et lien de retour à l’accueil fonctionnels.

Les préférences de mouvement réduit sont implémentées dans Motion et CSS. Aucun score Lighthouse, test lecteur d’écran complet ou résultat commercial n’est revendiqué. Le site reste local ; aucun déploiement public n’a été effectué.

## Navigation et mur participatif — mise à jour

- Navigation Home / Projects / Our Story / Join Us ; anciennes routes conservées par redirection.
- Compilation de production réussie après restructuration.
- Our Story vérifié à 375, 768 et 1440 px sans débordement horizontal ; Projects vérifié à 375 px.
- Filtre Identité : une seule entrée correspondante.
- Join Us sur mobile : brouillon et lien mailto vérifiés avec données de test, sans envoi.
- Mur testé dans une base QA distincte : placement au clavier, confirmation et trace encore présente après rechargement.
- Quatre tests serveur réussis : partage/idempotence, persistance/pagination, validation/rejets et limitation des publications.
- Les traces réelles du dossier data sont conservées ; les données QA sont isolées dans work/wall-qa.

- Placement par clic sur écran mobile vérifié avec confirmation réussie dans la base QA. Serveur de production vérifié : route Our Story et API répondent, les deux traces QA sont présentes.

## Portail multilingue et administration — 1 octobre 2026

- Build de production réussi et huit tests serveur réussis.
- Création du propriétaire, vérification par code, session privée, expiration, déconnexion, protection CSRF et limites de tentatives vérifiées.
- Empreinte invisible avant approbation, email absent de l’API publique, publication après approbation et retrait après refus vérifiés.
- Abonnement explicite à double confirmation, désabonnement et campagne idempotente vérifiés dans un service email de test.
- Projets existants migrés sans écrasement ; brouillon, publication, modification et traduction de projet vérifiés.
- Import vidéo, refus de SVG actif et lecture vidéo par plages d’octets vérifiés.
- Formulaires projet, recrutement, freelance et sponsoring enregistrés dans la boîte de réception admin.
- Join Us redessiné et vérifié visuellement ; sponsor de test reçu dans le dashboard QA.
- FR / EN / arabe RTL vérifiés sur desktop et mobile. Aucun débordement horizontal à 375 px.
- Dashboard vérifié à 375 px et 1440 px. Les données QA utilisent `work/portal-qa`, séparé de `data`.
- Fichiers privés `data`, `work`, `server` et `.env` refusés par le serveur de développement.

## Resend et corbeille — 1 octobre 2026

- Configuration Resend conservée uniquement dans `.env`, exclu du dépôt ; aucun secret n’est envoyé au navigateur.
- Email de connexion accepté puis signalé `delivered` par Resend vers l’adresse administrateur.
- Les briefs, demandes Join Us et empreintes produisent une notification administrateur avec clé d’idempotence ; l’enregistrement en base reste prioritaire si l’email échoue.
- Suppression réversible et restauration vérifiées pour projets et empreintes dans une base QA isolée.
- Purge après 30 jours vérifiée, y compris la suppression d’un média importé devenu inutilisé.
- Vue Corbeille vérifiée visuellement en largeur mobile : compteur, date, délai restant et action Restaurer.
- Huit tests serveur réussis et build Vite de production réussi après les changements.

## UX, témoignages et récupération — 1 octobre 2026

- Home structurée comme un récit éditorial : promesse, preuve, savoir-faire, méthode, origine et conversation.
- Logos partenaires et témoignages fictifs retirés ; les témoignages réels publiés depuis l’administration apparaissent automatiquement.
- Défilement fluide natif et révélations progressives appliqués aux sections et aux contenus, avec respect de `prefers-reduced-motion`.
- Home vérifiée dans le navigateur en anglais sur desktop et en anglais/arabe RTL à 360 px : aucun débordement horizontal ni erreur console ; l’ancre Projects et sa révélation arrivent à leur état final correctement.
- Témoignages publics alimentés par l’API ; création, brouillon, publication, modification et suppression vérifiés dans l’administration.
- Mot de passe oublié vérifié dans l’ordre email, code, puis nouveau mot de passe fort ; l’ancien mot de passe est invalidé.
- Emails HTML LIMINAL avec logo CID, code visuel, version texte et idempotence vérifiés. L’email réel de test a été signalé `opened` par Resend.
- Empty Trash vérifié côté serveur et confirmation en deux étapes inspectée dans l’interface QA.
- Messages de mode local retirés des écrans d’authentification et du dashboard.
- Dix tests serveur réussis et build Vite de production réussi.
