# Studios du Quatrième Mur

Site statique immersif pour le catalogue privé des Studios du Quatrième Mur.

## Structure

```text
.
├── index.html
├── public/
│   └── assets/
│       ├── favicon-64.png
│       ├── logo-quatrieme-mur.png
│       └── logo-quatrieme-mur-web.png
└── src/
    ├── scripts/
    │   └── app.js
    └── styles/
        └── styles.css
```

## Lancement local

Le site peut être ouvert directement avec `index.html`.

Pour le servir en local :

```bash
python -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Formulaire

Le formulaire est volontairement désactivé tant que `CONTACT_WEBHOOK_URL` n’est pas renseigné dans `src/scripts/app.js`.
