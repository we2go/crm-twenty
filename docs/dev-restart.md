# Перезапуск локальной разработки

## Когда перезапускать

- После изменения `.env` или любых конфигов окружения.
- После миграций базы данных (`database:reset`, `database:migrate`).
- Когда фронтенд, API или воркер не отвечают / ведут себя нестабильно.

## Первичная настройка окружения

Единый скрипт поднимает Postgres + Redis (локально или в Docker), создаёт
базы, копирует `.env` и инициализирует схему БД (прогоняет миграции). Идемпотентен —
можно запускать повторно.

```sh
cd /Users/antony/Documents/dev/twenty-crm
bash packages/twenty-utils/setup-dev-env.sh
```

Полезные флаги:

| Флаг | Назначение |
| --- | --- |
| `--docker` | Принудительно использовать Docker (`packages/twenty-docker/docker-compose.dev.yml`) |
| `--down` | Остановить сервисы (Postgres/Redis) |
| `--reset` | Сбросить данные и поднять всё заново |

## Полный запуск dev-окружения

Из **корня репозитория**:

```sh
cd /Users/antony/Documents/dev/twenty-crm
yarn start
```

`yarn start` запускает через `concurrently`:
- `twenty-server` (NestJS API + GraphQL);
- `twenty-front` (Vite dev-сервер);
- `twenty-server:worker` (фоновый воркер) — стартует после поднятия порта `3000`.

## Запуск отдельных пакетов

```sh
npx nx start twenty-front     # только фронтенд
npx nx start twenty-server    # только API
npx nx run twenty-server:worker  # только воркер
```

## После редактирования `.env`

1. Останови запущенный dev (`Ctrl+C` в терминале).
2. Запусти его заново командой выше (`yarn start`).

Процесс читает переменные окружения при старте. Уже запущенный процесс держит
старые значения до перезапуска.

## Сброс базы данных

```sh
npx nx database:reset twenty-server
```

## Частые порты

| Сервис | URL / порт |
| --- | --- |
| Фронтенд | `http://localhost:3001` |
| API / GraphQL | `http://localhost:3000` |
| Воркер | часть `twenty-server` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

## Занятые порты

Если порт уже используется:

```sh
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Найди PID и останови процесс перед перезапуском.
