import pymongo
import numpy as np
import pandas as pd
import redis 


POOL = redis.ConnectionPool(host='127.0.0.1', port=6379, max_connections=100)
client_redis = redis.Redis(connection_pool=POOL)


HOT_MOVIES = [
    {
        'name': 'Toy Story',
        'score': 90,
        'picUrl': 'http://image.tmdb.org/t/p/w780/dji4Fm0gCDVb9DQQMRvAI8YNnTz.jpg',
        'movieId': 1
    },
    {
        'name': 'Jumanji',
        'score': 93,
        'picUrl': 'http://image.tmdb.org/t/p/w780/7k4zEgUZbzMHawDaMc9yIkmY1qR.jpg',
        'movieId': 2
    },
    {
        'name': 'Grumpier Old Men',
        'score': 60,
        'picUrl': 'http://image.tmdb.org/t/p/w780/1ENbkuIYK2taNGGKNMs2hw6SaJb.jpg',
        'movieId': 3
    },
    {
        'name': 'Waiting to Exhale',
        'score': 80,
        'picUrl': 'http://image.tmdb.org/t/p/w780/u0hQzp4xfag3ZhsKKBBdgyIVvCl.jpg',
        'movieId': 4
    },
    {
        'name': 'Father of the Bride Part II',
        'score': 95,
        'picUrl': 'http://image.tmdb.org/t/p/w780/cZs50rEk4T13qWedon0uCnbYQzW.jpg',
        'movieId': 5
    }
]

def get_json(row):
    json = {}
    json['name'] = row['moviename']
    json['score'] = int(row['averating'] / 5.0 * 100)
    json['picUrl'] = row['picture']
    json['movieId'] = row['movieId']
    json['director'] = row['director']
    json['leadactors'] = row['leadactors']
    json['backpost'] = row['backpost']
    json['genres'] = row['genres']
    return json

def prepare_data():
    client_mongo = pymongo.MongoClient("mongodb://localhost:27017")
    db_fishmovie = client_mongo['favormovies']
    col_hot = db_fishmovie['hot']
    col_all_movies = db_fishmovie['movieinfo']
    df_hot_movies = pd.read_csv('../../data/hot_movies.csv', index_col=0)
    df_all_movies = pd.read_csv('../../data/movies_v2.csv', index_col=0)
    df_hot_movies['json'] = df_hot_movies.apply(get_json, axis=1)
    json_hot_movies = df_hot_movies['json'].values.tolist()
    col_hot.insert_many(json_hot_movies)
    df_all_movies['json'] = df_all_movies.apply(get_json, axis=1)
    json_all_movies = df_all_movies['json'].values.tolist()
    col_all_movies.insert_many(json_all_movies)
    hot_ids = [movie['movieId'] for movie in json_hot_movies]
    client_redis.rpush('hot', *hot_ids)
    df_sim_movies = pd.read_csv('../../data/similar_movies.csv', index_col=0)
    for i in range(0, df_sim_movies.shape[0]):
        client_redis.rpush('similar_{}'.format(df_sim_movies['movieId'].iloc[0]),
                                               *df_sim_movies.filter(regex='sim_').iloc[0].values.tolist())

def main():
    prepare_data()

if __name__ == '__main__':
    prepare_data()
