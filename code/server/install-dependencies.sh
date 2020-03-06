cp *.repo /etc/yum.repos.d/
yum makecache
yum -y install mongodb-org

yum -y install redis
