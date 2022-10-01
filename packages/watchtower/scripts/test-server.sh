pnpm database:test stop
pnpm database:test start

export DATABASE_URL="postgres://test-user@localhost:5432/test-db"

pnpm database:apply
pnpm database:sync

pnpm ava ./test/server.test.ts
