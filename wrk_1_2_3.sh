#!/bin/bash

intStartSeconds=$(date +%s)

bash wrk_1_health_check.sh
sleep 10
bash wrk_2_create_user.sh
sleep 10
bash wrk_3_get_user_by_id.sh

intEndSeconds=$(date +%s)

intDurationSeconds=$((intEndSeconds - intStartSeconds))
echo "Duration: $intDurationSeconds seconds"