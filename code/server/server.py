from flask import Flask
import flask_restful as restful
from flask_restful import reqparse
import requests
import pymongo
import redis
import os
import numpy as np
import pandas as pd


PRIVATE_PATH='../../../favor-movie-private/'
POOL = redis.ConnectionPool(host='127.0.0.1', port=6379, max_connections=100)
client_redis = redis.Redis(connection_pool=POOL)

class HelloWorld(restful.Resource):
    def post(self):
        return {'hello':'world'}

class Login(restful.Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('code', type=str, help='code to get openid')
        args = parser.parse_args()
        code = args['code']
        config = json.load(open(os.path.join(PRIVATE_PATH, 'config.json')))
        rsp = requests.get(url='https://api.weixin.qq.com/sns/jscode2session',
                        params={'appid':config['appid'], 'secret':config['secret'],
                                'js_code':code, 'grant_type':'authorization_code'})
        openid = rsp.json()['openid']
        return {'result':0, 'openid':openid}

class Recommend(restful.Resource):
    def get(self, openid):
        """
        每次推荐20个电影，当前是从热门电影中选取
        :param openid:
        :return:
        """
        # 热门召回
        hot_ids = client_redis.lrange('hot', 0, -1)
        hot_ids = set(list(map(int, hot_ids)))
        # ItemCF召回
        favor_ids = client_redis.lrange('like_{}'.format(openid), -20, -1)
        itemcf_ids = []
        for id in favor_ids:
            tmp = client_redis.lrange('sim_{}'.format(id), -50, -1)
            itemcf_ids += tmp
        itemcf_ids = set(list(map(int, itemcf_ids)))

        # 去重
        dislike_ids = client_redis.lrange('dislike_{}'.format(openid), 0, -1)
        dislike_ids = set(list(map(int, dislike_ids)))
        like_ids = client_redis.lrange('like_{}'.format(openid), 0, -1)
        like_ids = set(list(map(int, like_ids)))
        recommend_ids = (hot_ids.union(itemcf_ids)) - (like_ids.union(dislike_ids))

        # 排序
        recommend_ids = list(recommend_ids)[:20]

        recommend_movies = query_movies_by_ids(recommend_ids)
        return {'movieData':recommend_movies}


class Like(restful.Resource):
    def get(self, openid):
        parser = reqparse.RequestParser()
        parser.add_argument('movieid', type=str, location='args', help='movieid to change for this resource')
        args = parser.parse_args()
        movieid = args['movieid']
        if client_redis.llen("like_{}".format(openid)) >= 100:
            client_redis.lpop("like_{}".format(openid))
        client_redis.rpush("like_{}".format(openid), movieid)
        return {'result':0}


class Dislike(restful.Resource):
    def get(self, openid):
        parser = reqparse.RequestParser()
        parser.add_argument('movieid', type=str, location='args', help='movieid to change for this resource')
        args = parser.parse_args()
        movieid = args['movieid']
        if client_redis.llen("dislike_{}".format(openid)) >= 100:
            client_redis.lpop("dislike_{}".format(openid))
        client_redis.rpush("dislike_{}".format(openid), movieid)
        return {'result': 0}


class Favorite(restful.Resource):
    def get(self, openid):
        print('hello')
        favor_ids = client_redis.lrange('like_{}'.format(openid), 0, -1)
        favor_ids = list(map(int, favor_ids))
        favor_movies = query_movies_by_ids(favor_ids)
        return {'movieData':favor_movies[-20:]}

class ClearFavor(restful.Resource):
    def get(self, openid):
        client_redis.delete('like_{}'.format(openid))
        return {'result': 0}

def query_movies_by_ids(ids):
    client_mongo = pymongo.MongoClient("mongodb://localhost:27017")
    db_fishmovie = client_mongo['favormovies']
    col_all_movies = db_fishmovie['movieinfo']
    movies = []
    for id in ids:
        movie_list = [movie for movie in col_all_movies.find({'movieId':id}, {'_id':0})]
        if len(movie_list) != 1:
            print('error, movieid {}'.format(id))
            continue
        movies.append(movie_list[0])
    return movies

def main():
    app = Flask(__name__)
    api = restful.Api(app)
    api.add_resource(HelloWorld, '/')
    api.add_resource(Login, '/login')
    api.add_resource(Recommend, '/recommend/<openid>')
    api.add_resource(Like, '/like/<openid>')
    api.add_resource(Dislike, '/dislike/<openid>')
    api.add_resource(Favorite, '/favorite/<openid>')
    api.add_resource(ClearFavor, '/clear/<openid>')
    #app.run(host='0.0.0.0', port=443, debug=True, ssl_context=(os.path.join(PRIVATE_PATH, '3098862_fishmovie.top.pem'),
    app.run(host='0.0.0.0', port=8080, debug=True)
if __name__ == '__main__':
    main()
