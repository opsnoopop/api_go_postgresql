docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_5_constant_create_user.js

sleep 10

docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_5_constant_create_user.js

sleep 10

docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_5_constant_create_user.js
