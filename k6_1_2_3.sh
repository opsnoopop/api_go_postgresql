#!/bin/bash

intStartSeconds=$(date +%s)

bash k6_1_ramping_health_check.sh
sleep 10
bash k6_2_ramping_create_user.sh
sleep 10
bash k6_3_ramping_get_user_by_id.sh

intEndSeconds=$(date +%s)

intDurationSeconds=$((intEndSeconds - intStartSeconds))
echo "Duration: $intDurationSeconds seconds"