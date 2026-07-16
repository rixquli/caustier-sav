# Runbook opérationnel — Caustier SAV

Guide pour l'exploitation interne de l'application en production.

## Démarrage et arrêt

### Docker Compose

```bash
# Démarrer (build + run en arrière-plan)
docker compose up -d --build

# Voir les logs
docker compose logs -f app

# Arrêter
docker compose down
```

### Mise à jour

```bash
git pull
docker compose up -d --build
```

Les migrations Prisma sont appliquées automatiquement au démarrage du conteneur `app` (`prisma migrate deploy`).

## Vérification santé

Endpoint public (sans authentification) :

```bash
curl -s http://localhost:3000/api/health | jq .
```

| HTTP | `status` | Signification |
|------|----------|---------------|
| 200 | `ok` | Application et base de données opérationnelles |
| 503 | `degraded` | Base de données inaccessible |

Utiliser cet endpoint pour :
- Healthcheck Docker (déjà configuré dans `Dockerfile` et `docker-compose.yml`)
- Sonde du reverse proxy / load balancer interne
- Supervision uptime (Nagios, Uptime Kuma, etc.)

## Logs

L'application écrit des logs **JSON structurés** sur stdout/stderr (une ligne par événement).

Champs standard :

```json
{
  "timestamp": "2026-07-15T07:00:00.000Z",
  "level": "info",
  "service": "caustier-sav",
  "message": "..."
}
```

### Filtrage

```bash
# Logs du conteneur
docker compose logs -f app

# Erreurs uniquement (avec jq)
docker compose logs app 2>&1 | jq 'select(.level == "error")'
```

### Niveau de log

Variable `LOG_LEVEL` dans `.env` : `debug` | `info` | `warn` | `error`.

- Production recommandée : `info`
- Diagnostic : `debug`

### Agrégation recommandée

En interne, rediriger stdout Docker vers un agrégateur :
- Grafana Loki
- ELK (Elasticsearch + Logstash + Kibana)
- Fichiers rotatifs via la configuration Docker du daemon

Convention pour les routes API : utiliser `logApiError()` depuis [`src/lib/log-api-error.ts`](../src/lib/log-api-error.ts) dans les blocs `catch`.

## Sauvegardes PostgreSQL

### Prérequis

Outils client PostgreSQL (`pg_dump`, `psql`) installés sur la machine qui exécute le script, ou utilisation via le conteneur Docker (voir ci-dessous).

### Sauvegarde manuelle

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/caustier_sav"
pnpm db:backup
```

Fichier créé dans `backups/caustier_sav_YYYYMMDD_HHMMSS.sql.gz`.

Avec rétention 30 jours :

```bash
./scripts/backup-db.sh --keep-days 30
```

### Sauvegarde via Docker

```bash
docker compose exec -T postgres pg_dump -U caustier caustier_sav | gzip > backups/caustier_sav_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Automatisation (cron)

Exemple — sauvegarde quotidienne à 2h :

```cron
0 2 * * * cd /opt/caustier-sav && DATABASE_URL="postgresql://..." ./scripts/backup-db.sh --keep-days 30 >> /var/log/caustier-backup.log 2>&1
```

Adapter le chemin et `DATABASE_URL` à votre environnement.

### Restauration

**Procédure recommandée en cas d'incident :**

1. Arrêter l'application : `docker compose stop app`
2. Restaurer la base :

```bash
pnpm db:restore backups/caustier_sav_YYYYMMDD_HHMMSS.sql.gz --yes
```

Ou via Docker :

```bash
gunzip -c backups/caustier_sav_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T postgres psql -U caustier caustier_sav
```

3. Redémarrer : `docker compose up -d app`
4. Vérifier : `curl http://localhost:3000/api/health`

## Checklist go-live interne

- [ ] `NODE_ENV=production`
- [ ] `BETTER_AUTH_SECRET` unique et fort (≥ 32 caractères)
- [ ] `BETTER_AUTH_URL` en HTTPS avec le domaine final
- [ ] Comptes démo désactivés (automatique en production)
- [ ] `WHATSAPP_APP_SECRET` configuré si webhook WhatsApp actif
- [ ] URL webhook Meta pointant vers `https://<domaine>/api/whatsapp/webhook`
- [ ] Sauvegardes automatisées testées (backup + restore sur staging)
- [ ] Health check intégré à la supervision
- [ ] Logs collectés et consultables

## Dépannage rapide

| Symptôme | Action |
|----------|--------|
| `/api/health` → 503 | Vérifier PostgreSQL (`docker compose ps`, logs postgres) |
| App ne démarre pas | Vérifier migrations : `docker compose logs app` |
| Webhook WhatsApp 403 | Vérifier `WHATSAPP_APP_SECRET` et signature Meta |
| Pas de logs visibles | `docker compose logs -f app`, vérifier `LOG_LEVEL` |
