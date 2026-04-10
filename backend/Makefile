.PHONY: dev migrate-up migrate-down migrate-status migrate-profile-photos build tidy

dev:
	docker-compose up

migrate-up:
	@export $(shell grep DATABASE_DIRECT_URL .env | xargs) && \
	goose postgres "$$DATABASE_DIRECT_URL" up -dir ./migrations

migrate-down:
	@export $(shell grep DATABASE_DIRECT_URL .env | xargs) && \
	goose postgres "$$DATABASE_DIRECT_URL" down -dir ./migrations

migrate-status:
	@export $(shell grep DATABASE_DIRECT_URL .env | xargs) && \
	goose postgres "$$DATABASE_DIRECT_URL" status -dir ./migrations

migrate-profile-photos:
	go run ./cmd/migrate-profile-photos

build:
	docker build --target production -t kinfolk-backend .

tidy:
	go mod tidy
