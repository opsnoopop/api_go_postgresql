# Go API with PostgreSQL

A simple Go API application and PostgreSQL, containerized with Docker.


## Technology Stack

**Go Container: FROM golang:tip-alpine3.22**
- OS: Alpine Linux 3.22
- Go: 1.26-devel_f2db0dc
- pgx: v5.6.0 # go get github.com/jackc/pgx/v5

**PostgreSQL Container: FROM postgres:17.5**
- OS Debian GNU/Linux 12 (bookworm)
- PostgreSQL: 17.5

**Adminer Container: FROM adminer:5-standalone**
- OS Alpine Linux: 3.22.1
- Adminer: 5.3.0

**Grafana/k6 Container: FROM grafana/k6:1.1.0**
- OS Alpine Linux: 3.22.0
- Grafana/k6: 1.1.0


## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/opsnoopop/api_go_postgresql.git
```

### 2. Navigate to Project Directory
```bash
cd api_go_postgresql
```

### 3. Start the Application
```bash
docker compose up -d --build
```

### 4. Create table users
```bash
docker exec -i container_postgresql sh -c "PGPASSWORD='testpass' psql -U testuser -d testdb -c '
CREATE TABLE IF NOT EXISTS public.users (
  user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);'"
```


## API Endpoints

### Health Check
```bash
curl -X GET http://localhost/
```

### Create user
```bash
curl -X POST http://localhost/users -H 'Content-Type: application/json' -d '{"username":"optest","email":"opsnoopop@hotmail.com"}'
```

### Get user
```bash
curl -X GET http://localhost/users/1
```


## Test Performance by sysbench

### sysbench e.g.
```text
step 1 prepare
step 2 run test someting
step 3 cleanup

sysbench \
...
oltp_read_write prepare; # step 1 prepare สร้าง table

sysbench \
...
oltp_read_write run;     # step 2 run test อ่าน เขียน พร้อมกัน

sysbench \
...
oltp_read_only run;      # step 2 run test อ่าน อย่างเดียว

sysbench \
...
oltp_write_only run;     # step 2 run test เขียน อย่างเดียว

sysbench \
...
oltp_update_index run;   # step 2 run test update index

sysbench \
...
oltp_point_select run;   # step 2 run test query แบบเลือก row เดียว

sysbench \
...
oltp_delete run;         # step 2 run test delete rows

sysbench \
...
oltp_read_write cleanup; # step 3 cleanup ลบ table
```

### sysbench step 1 prepare
```bash
docker run \
--name container_sysbench \
--rm \
-it \
--network global_optest \
opsnoopop/ubuntu:24.04 \
sysbench \
--threads=2 \
--time=10 \
--db-driver="pgsql" \
--pgsql-host="container_postgresql" \
--pgsql-port=5432 \
--pgsql-user="testuser" \
--pgsql-password="testpass" \
--pgsql-db="testdb" \
--tables=10 \
--table-size=100000 \
oltp_read_write prepare;
```

### sysbench step 2 run test
```bash
docker run \
--name container_sysbench \
--rm \
-it \
--network global_optest \
-v ./sysbench/:/sysbench/ \
opsnoopop/ubuntu:24.04 \
sysbench \
--threads=2 \
--time=10 \
--db-driver="pgsql" \
--pgsql-host="container_postgresql" \
--pgsql-port=5432 \
--pgsql-user="testuser" \
--pgsql-password="testpass" \
--pgsql-db="testdb" \
--tables=10 \
--table-size=100000 \
oltp_read_write run > ./sysbench/sysbench_raw_$(date +"%Y%m%d_%H%M%S").txt
```

### sysbench step 3 cleanup
```bash
docker run \
--name container_sysbench \
--rm \
-it \
--network global_optest \
opsnoopop/ubuntu:24.04 \
sysbench \
--threads=2 \
--time=10 \
--db-driver="pgsql" \
--pgsql-host="container_postgresql" \
--pgsql-port=5432 \
--pgsql-user="testuser" \
--pgsql-password="testpass" \
--pgsql-db="testdb" \
--tables=10 \
--table-size=100000 \
oltp_read_write cleanup;
```


## Test Performance by grafana/k6

### grafana/k6 test Health Check
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_1_ramping_health_check.js
```

### grafana/k6 test Insert Create user
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_2_ramping_create_user.js
```

### grafana/k6 test Select Get user by id
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_3_ramping_get_user_by_id.js
```


## Test Performance by wrk

### wrk test Health Check
```bash
docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s http://172.16.0.11:3000
```

### wrk test Insert Create user
```bash
docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s -s /wrk/create_user.lua http://172.16.0.11:3000/users
```

### wrk test Select Get user by id
```bash
docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s http://172.16.0.11:3000/users/1
```


## Stop the Application

### Truncate table users
```bash
docker exec -i container_postgresql sh -c "PGPASSWORD='testpass' psql -U testuser -d testdb -c '
Truncate public.users RESTART IDENTITY;'"
```

### Delete table users
```bash
docker exec -i container_postgresql sh -c "PGPASSWORD='testpass' psql -U testuser -d testdb -c '
DELETE FROM public.users;'"
```

### Stop the Application
```bash
docker compose down
```