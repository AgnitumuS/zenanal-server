const model = require('./db/model')
const parser = require('./parser/pp.js')

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const ctrlMain = (req, res, next) => {
  res.json({
    v: '0.0.1'
  })
  res.end()

  next()
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const ctrlGetChannelNameByUrl = async (req, res, next) => {
  // let name = null

  try {
    const { name, subscribers } = await parser.getChannelName(req.body.url)
    req.body.name = name
    req.body.subscribers = subscribers
  } catch (error) {
    return next(error)
  }

  return next()
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const ctrlAddChannel = async (req, res, next) => {
  const { url, name, subscribers } = req.body

  try {
    const result = await model.addChannel(url, name, subscribers)
    const channel_id = result.rows[0].channel_id
    const result2 = await model.addChannelStat(channel_id, subscribers)
  } catch (error) {
    return next(error)
  }

  res.status(200).json({ name, subscribers })
  return next()
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const ctrlChannelsList = async (req, res, next) => {
  let channels = null

  try {
    channels = await model.getChannels()
  } catch (error) {
    return next(error)
  }

  res.status(200).json(channels)

  return next()
}


const ctrlGetChannelById = async (req, res, next) => {
  let channelData = null 

  try {
    channelData = await model.getChannelById(req.params.id)
  } catch (error) {
    return next(error)
  }

  res.status(200).json(channelData)
  next()
}


const ctrlChannelDel = async (req, res, next) => {
  const { channel_id } = req.body
  
  try {
    await model.channelDel(channel_id)
  } catch (error) {
    return next(error)
  }

  res.status(200).end()

  return next()
}


const ctrlGetChannelStatById = async (req, res, next) => {
  let stats = null

  try {
    stats = await model.getChannelStatById(req.params.id)
  } catch (error) {
    return next(error)
  }

  res.status(200).json(stats)
  next()
}


const ctrlGetPostsByChannelId = async (req, res, next) => {
  let posts = null

  try {
    posts = await model.getPostsByChannelId(req.params.id)
  } catch (error) {
    return next(error)
  }

  res.status(200).json(posts)
  next()
}


const ctrlGetPostsStat = async (req, res, next) => {
  let postStat = null

  try {
    postStat = await model.getPostStat(req.params.postId)
  } catch (error) {
    return next(error)
  }

  res.status(200).json(postStat)
  next()
}

module.exports = {
  ctrlMain,
  ctrlGetChannelNameByUrl,
  ctrlAddChannel,
  ctrlChannelsList,
  ctrlChannelDel,
  ctrlGetChannelById,
  ctrlGetChannelStatById,
  ctrlGetPostsByChannelId,
  ctrlGetPostsStat
}