docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s http://172.16.0.11:3000/users/1 >> ./wrk/wrk_3_get_user_by_id.txt

sleep 10

docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s http://172.16.0.11:3000/users/1 >> ./wrk/wrk_3_get_user_by_id.txt

sleep 10

docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s http://172.16.0.11:3000/users/1 >> ./wrk/wrk_3_get_user_by_id.txt
