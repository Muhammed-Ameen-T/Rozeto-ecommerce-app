#!/bin/bash
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
export OPENSSL_CONF=/dev/null
pm2 start /home/ubuntu/Rozeto-ecommerce-app/server.js --name Rozeto-ecommerce-app
