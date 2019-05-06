const express = require('express')
const router = new express.Router()
const {
  ctrlAddChannel,
  ctrlChannelsList,
  ctrlGetChannelNameByUrl,
  ctrlChannelDel,
  ctrlGetChannelById,
  ctrlGetChannelStatById,
  ctrlGetPostsByChannelId,
  ctrlGetPostsStat
} = require('./controllers')


router.post('/addchannel', ctrlGetChannelNameByUrl, ctrlAddChannel)

router.post('/getchname', ctrlGetChannelNameByUrl)

router.get('/channelslist', ctrlChannelsList)

router.put('/channeldel', ctrlChannelDel)

router.get('/channel/:id', ctrlGetChannelById)

router.get('/channel/:id/stat', ctrlGetChannelStatById)

router.get('/channel/:id/posts', ctrlGetPostsByChannelId)

router.get('/channel/:channelId/posts/:postId', ctrlGetPostsStat)

module.exports = router