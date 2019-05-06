-- https://www.8host.com/blog/ustanovka-i-ispolzovanie-postgresql-v-ubuntu-18-04/

-- sudo -u postgres psql

CREATE DATABASE zenanal;

-- \c zenanal

DROP TABLE channels;
CREATE TABLE channels (
  channel_id serial PRIMARY KEY,
  url VARCHAR(1024) UNIQUE NOT NULL,
  name VARCHAR(512),
  subscribers INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);


DROP TABLE channel_stat;
CREATE TABLE channel_stat(
  channel_stat_id serial PRIMARY KEY,
  channel_id INTEGER NOT NULL,
  subscribers INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);


DROP TABLE posts;
CREATE TABLE posts(
  post_id serial PRIMARY KEY,
  channel_id INTEGER NOT NULL,
  url VARCHAR(1024) UNIQUE NOT NULL,
  name VARCHAR(512),
  created_at TIMESTAMP DEFAULT NOW()
);


DROP TABLE post_stat;
CREATE TABLE post_stat(
  post_stat_id serial PRIMARY KEY,
  updated_at TIMESTAMP DEFAULT NOW(),
  post_id INTEGER NOT NULL,
  views INTEGER,
  views_till_end INTEGER,
  sum_view_time_sec NUMERIC,
  likes INTEGER,
  comments INTEGER
);

-- \q