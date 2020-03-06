systemctl start mongod.service
nohup redis-server > redis.out &
python3 util.py
nohup python3 server.py &
