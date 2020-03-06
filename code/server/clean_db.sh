#!/bin/bash
mongodb='mongo'
$mongodb <<EOF
use favormovies
db.hot.drop()
db.movieinfo.drop()
exit;
EOF
redis-cli <<EOF
flushall
exit
EOF

