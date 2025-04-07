#!/bin/sh
set -x
echo "Starting nginx-entrypoint.sh..."
ls -l /etc/nginx/nginx.conf
nginx -g 'daemon off;'