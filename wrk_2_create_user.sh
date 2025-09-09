docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s -s /wrk/create_user.lua http://172.16.0.11:3000/users >> ./wrk/wrk_2_create_user.txt

sleep 10

docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s -s /wrk/create_user.lua http://172.16.0.11:3000/users >> ./wrk/wrk_2_create_user.txt

sleep 10

docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s -s /wrk/create_user.lua http://172.16.0.11:3000/users >> ./wrk/wrk_2_create_user.txt