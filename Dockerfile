# syntax=docker/dockerfile:1

FROM golang:1.25 AS builder
WORKDIR /app

# 1) นำเข้า go.mod และ go.sum ก่อน เพื่อ cache dependency layer
COPY go.mod ./
RUN go mod download

# 2) นำเข้าซอร์สทั้งหมด แล้ว tidy อีกรอบ (สำคัญ!)
COPY . .
RUN go mod tidy

# 3) build
RUN go build -v -o /usr/local/bin/app ./...

# --- runtime stage (ถ้ามี) ---
FROM gcr.io/distroless/base-debian12
COPY --from=builder /usr/local/bin/app /usr/local/bin/app
EXPOSE 3000
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/app"]
