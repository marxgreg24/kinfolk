// Package migrations exposes the embedded SQL migration files so they can be
// used with goose.SetBaseFS from any package (including cmd/server).
package migrations

import "embed"

// FS holds all *.sql migration files embedded at compile time.
//
//go:embed *.sql
var FS embed.FS
