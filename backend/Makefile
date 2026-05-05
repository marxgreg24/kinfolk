.PHONY: dev migrate-up migrate-down migrate-status migrate-profile-photos build tidy

dev:
	docker-compose up

migrate-up:
	@bash -c 'set -a && . ./.env && set +a && goose postgres "$$DATABASE_DIRECT_URL" up -dir ./migrations'

migrate-down:
	@bash -c 'set -a && . ./.env && set +a && goose postgres "$$DATABASE_DIRECT_URL" down -dir ./migrations'

migrate-status:
	@bash -c 'set -a && . ./.env && set +a && goose postgres "$$DATABASE_DIRECT_URL" status -dir ./migrations'

migrate-profile-photos:
	go run ./cmd/migrate-profile-photos

build:
	docker build --target production -t kinfolk-backend .

tidy:
	go mod tidy
