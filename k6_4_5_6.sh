#!/bin/bash

intStartSeconds=$(date +%s)

bash k6_4_constant_health_check.sh
sleep 10
bash k6_5_constant_create_user.sh
sleep 10
bash k6_6_constant_get_user_by_id.sh

intEndSeconds=$(date +%s)

intDurationSeconds=$((intEndSeconds - intStartSeconds))
echo "Duration: $intDurationSeconds seconds"