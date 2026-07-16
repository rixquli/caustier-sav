# Caustier SAV

Application web interne de gestion du service après-vente (SAV) pour Caustier : demandes d'intervention, clients, techniciens, FAQ et notifications WhatsApp.

## Prérequis

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- PostgreSQL 16 (local ou via Docker)

Alternative : Docker et Docker Compose uniquement (voir section Production Docker).

## Développement local

1. Copier les variables d'environnement :

```bash
cp .env.example .env
```

2. Renseigner au minimum `DATABASE_URL`, `BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` dans `.env`.

3. Installer les dépendances et appliquer les migrations :

```bash
pnpm install
pnpm db:migrate
```

4. Lancer l'application :

```bash
pnpm dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

### Comptes par défaut

| Environnement | Comportement |
|---------------|--------------|
| Développement | `admin@caustier.fr` / `admin123` et `client@caustier.fr` / `client123` |
| Production (1er démarrage) | Si aucun admin n'existe, création de `admin@caustier.fr` / `admin123` (changement de mot de passe demandé à la 1re connexion) |

Le seed s'exécute automatiquement au démarrage du serveur. En production avec admins déjà présents, aucun compte démo n'est recréé.

## Production Docker

1. Copier et configurer `.env` (secrets forts, URL HTTPS publique pour `BETTER_AUTH_URL`).

2. Démarrer PostgreSQL et l'application :

```bash
docker compose up -d --build
```

3. Vérifier la santé :

```bash
curl http://localhost:3000/api/health
```

Réponse attendue (HTTP 200) :

```json
{"status":"ok","db":"ok","timestamp":"...","version":"0.1.0"}
```

4. Arrêter :

```bash
docker compose down
```

Pour les opérations courantes (mises à jour, sauvegardes, logs), voir [`docs/operations.md`](docs/operations.md).

## Variables d'environnement

Référence complète : [`.env.example`](.env.example).

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connexion PostgreSQL |
| `BETTER_AUTH_SECRET` | Secret session (obligatoire en prod) |
| `BETTER_AUTH_URL` | URL publique de l'app |
| `WHATSAPP_*` | Intégration Meta WhatsApp (optionnel) |
| `LOG_LEVEL` | Niveau de log : `debug`, `info`, `warn`, `error` |

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build production |
| `pnpm test` | Tests unitaires |
| `pnpm db:migrate` | Migrations (dev) |
| `pnpm db:backup` | Sauvegarde PostgreSQL |
| `pnpm db:restore` | Restauration PostgreSQL |

## Documentation

- Runbook ops : [`docs/operations.md`](docs/operations.md)
- Cahier des charges : [`cahier-des-charges.md`](cahier-des-charges.md)
