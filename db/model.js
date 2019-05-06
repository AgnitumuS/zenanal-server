const cfg = require('../config')
const {Pool} = require('pg')
const pool = new Pool(cfg.DB)


/**
 * 
 */
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})


/**
 * 
 * @param {*} url 
 * @param {*} name 
 */
const addChannel = async (url, name, subscribers) => {
  const client = await pool.connect()

  try {
    const res = await client.query('INSERT INTO channels (url, name, subscribers) VALUES($1, $2, $3) RETURNING channel_id', [url, name, subscribers])
    return res
  } catch(error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const updateChannel = async (channel_id, subscribers) => {
  const client = await pool.connect()

  try {
    await client.query('UPDATE channels SET subscribers=$1, updated_at=NOW() WHERE channel_id=$2)', [subscribers, channel_id])
  } catch(error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const getChannels = async () => {
  const client = await pool.connect()

  const q = `SELECT channel_id, url, name, subscribers FROM channels`

  try {
    const res = await client.query(q)
    return res.rows
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const getChannelById = async (channelId) => {
  const client = await pool.connect()

  const q = `SELECT url, name, subscribers 
  FROM channels
  WHERE channel_id=$1`

  try {
    const res = await client.query(q, [channelId])
    return res.rows[0]
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const addChannelStat = async (channel_id, subscribers) => {
  const client = await pool.connect()

  try {
    await client.query('INSERT INTO channel_stat(channel_id, subscribers) VALUES($1, $2)', [channel_id, subscribers])
    await client.query('UPDATE channels SET updated_at=NOW(), subscribers=$2 WHERE channel_id=$1', [channel_id, subscribers])
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const getChannelStatById = async (channelId) => {
  const client = await pool.connect()

  try {
    const res = await client.query('SELECT * FROM channel_stat WHERE channel_id=$1', [channelId])
    return res.rows
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const channelDel = async (channel_id) => {
  const client = await pool.connect()

  const q = `DELETE FROM channels WHERE channel_id=$1`

  try {
    await client.query(q, [channel_id])
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const addPost = async (post) => {
  const client = await pool.connect()

  const q = `INSERT INTO posts(
    url, 
    name, 
    channel_id
  ) VALUES($1, $2, $3) 
  ON CONFLICT (url)
  DO UPDATE
  SET name=EXCLUDED.name
  RETURNING post_id
  `

  try {
    const res = await client.query(q, [
      post.postUrl,
      post.postName,
      post.channelId
    ])
    return res.rows[0].post_id
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const addPostStat = async (post) => {
  const client = await pool.connect()

  const q = `INSERT INTO post_stat(
    post_id,
    views,
    views_till_end,
    sum_view_time_sec,
    likes,
    comments
  ) VALUES($1, $2, $3, $4, $5, $6)`

  try {
    await client.query(q, [
      post.postId,
      post.views,
      post.viewsTillEnd,
      post.sumViewTimeSec,
      post.likes,
      post.comments
    ])
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const getPostsByChannelId = async (channel_id) => {
  const client = await pool.connect()

  try {
    const res = await client.query('SELECT * FROM posts WHERE channel_id=$1', [channel_id])
    return res.rows
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


const getPostStat = async (post_id) => {
  const client = await pool.connect()

  try {
    const res = await client.query('SELECT * FROM post_stat WHERE post_id=$1', [post_id])
    return res.rows
  } catch (error) {
    throw new Error(error)
  } finally {
    client.release()
  }
}


module.exports = {
  addChannel,
  getChannels,
  updateChannel,
  getChannelById,
  channelDel,
  addChannelStat,
  getChannelStatById,
  addPost,
  addPostStat,
  getPostsByChannelId,
  getPostStat
}
