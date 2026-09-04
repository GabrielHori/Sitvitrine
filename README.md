# Horizon IT

Site vitrine statique d'Horizon IT, déployé sur Netlify. Il présente deux univers liés : le dépannage informatique et les solutions domotiques à Arles et alentours.

## Développement

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
npm run build
```

Pour régénérer le CSS pendant les modifications :

```bash
npm run watch:styles
```

Le déploiement Netlify lance également `npm run build`.

## Structure utile

```text
index.html              Accueil et services informatiques
domotique.html          Offre maison connectée
style.scss              Point d'entrée SCSS
scss/sections/           Un partiel SCSS par zone visuelle du site
style.css               CSS généré — ne pas modifier directement
script.js               Interactions, thème, formulaires, transitions
netlify/functions/      API de contact, avis et administration
netlify.toml            Build, redirections et en-têtes de sécurité
sitemap.xml             Pages à indexer
robots.txt              Directives pour les robots
```

## Référencement

Les pages indexables ont chacune un titre, une meta-description, une URL canonique, des balises Open Graph et des données structurées JSON-LD. La page domotique décrit aussi le service local proposé. Après l’ajout d’une page commerciale, il faut l’ajouter à `sitemap.xml` et vérifier qu’elle n’a pas de balise `noindex`.

## Diagnostic rapide

1. Si le style est absent ou ancien, lancez `npm run build` puis vérifiez que `style.css` a bien été généré.
2. Si le formulaire ne répond plus, consultez les logs Netlify de `netlify/functions/contact.js` et vérifiez les variables d’environnement Turnstile, Supabase et Resend.
3. Si une page n’est pas indexée, contrôlez l’URL canonique, `robots.txt`, `sitemap.xml` et les en-têtes Netlify.

`style.css` et `style.css.map` sont générés à partir des sources SCSS et doivent être versionnés pour que le site fonctionne aussi sans étape de build locale.
