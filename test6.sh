docker run \
--name container_k6 \
--rm \
-it \
--network global_go \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_6_constant_get_user_by_id.js

sleep 10

docker run \
--name container_k6 \
--rm \
-it \
--network global_go \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_6_constant_get_user_by_id.js

sleep 10

docker run \
--name container_k6 \
--rm \
-it \
--network global_go \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_6_constant_get_user_by_id.js
