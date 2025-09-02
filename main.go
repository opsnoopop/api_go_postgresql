// main.go
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type App struct {
	DB *sql.DB
}

type createUserReq struct {
	Username string `json:"username"`
	Email    string `json:"email"`
}

func jsonWrite(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func (a *App) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet || r.URL.Path != "/" {
		jsonWrite(w, http.StatusNotFound, map[string]string{"error": "Not Found"})
		return
	}
	jsonWrite(w, http.StatusOK, map[string]string{"message": "Hello World from Go"})
}

func (a *App) handleUsers(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == http.MethodPost && r.URL.Path == "/users":
		a.createUser(w, r)
	case r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/users/"):
		a.getUser(w, r)
	default:
		jsonWrite(w, http.StatusNotFound, map[string]string{"error": "Not Found"})
	}
}

func (a *App) createUser(w http.ResponseWriter, r *http.Request) {
	var req createUserReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonWrite(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if strings.TrimSpace(req.Username) == "" || strings.TrimSpace(req.Email) == "" {
		jsonWrite(w, http.StatusBadRequest, map[string]string{"error": "username and email are required"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()

	var id int32
	err := a.DB.QueryRowContext(
		ctx,
		"INSERT INTO users (username, email) VALUES ($1, $2) RETURNING user_id",
		req.Username, req.Email,
	).Scan(&id)
	if err != nil {
		jsonWrite(w, http.StatusInternalServerError, map[string]string{"error": "Database error", "detail": err.Error()})
		return
	}

	jsonWrite(w, http.StatusCreated, map[string]any{
		"message": "User created successfully",
		"user_id": id,
	})
}

func (a *App) getUser(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/users/"), "/")
	if len(parts) < 1 || parts[0] == "" {
		jsonWrite(w, http.StatusBadRequest, map[string]string{"error": "Invalid user_id"})
		return
	}
	id, err := strconv.Atoi(parts[0])
	if err != nil {
		jsonWrite(w, http.StatusBadRequest, map[string]string{"error": "Invalid user_id"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()

	var (
		userID   int32
		username string
		email    string
	)
	err = a.DB.QueryRowContext(ctx,
		"SELECT user_id, username, email FROM users WHERE user_id = $1",
		id,
	).Scan(&userID, &username, &email)

	if err == sql.ErrNoRows {
		jsonWrite(w, http.StatusNotFound, map[string]string{"error": "User not found"})
		return
	}
	if err != nil {
		jsonWrite(w, http.StatusInternalServerError, map[string]string{"error": "Database error", "detail": err.Error()})
		return
	}

	jsonWrite(w, http.StatusOK, map[string]any{
		"user_id":  userID,
		"username": username,
		"email":    email,
	})
}

func mustEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	host := mustEnv("DB_HOST", "container_postgresql")
	user := mustEnv("DB_USER", "testuser")
	pass := mustEnv("DB_PASSWORD", "testpass")
	name := mustEnv("DB_NAME", "testdb")
	port := mustEnv("DB_PORT", "5432")
	httpPort := mustEnv("PORT", "3000")

	// Postgres DSN (pgx stdlib)
	// NOTE: ใน Docker/local มักใช้ sslmode=disable
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, pass, host, port, name)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}

	// Connection pool
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(10 * time.Minute)

	if err := pingWithTimeout(db, 10*time.Second); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	app := &App{DB: db}

	mux := http.NewServeMux()
	mux.HandleFunc("/", app.handleRoot)
	mux.HandleFunc("/users", app.handleUsers)
	mux.HandleFunc("/users/", app.handleUsers)

	srv := &http.Server{
		Addr:              ":" + httpPort,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Server listening on :%s", httpPort)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server: %v", err)
	}
}

func pingWithTimeout(db *sql.DB, d time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), d)
	defer cancel()
	return db.PingContext(ctx)
}
