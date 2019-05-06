// node_modules/kue/bin/kue-dashboard -p 3050 -r redis://127.0.0.1:6379

// FIXME: (node:5836) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 job ttl exceeded listeners added. Use emitter.setMaxListeners() to increase limit
// FIXME: (node:18585) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 job ttl exceeded listeners added. Use emitter.setMaxListeners() to increase limit

const CronJob = require('cron').CronJob;
const kue = require('kue')

const { getChannels } = require('../db/model')
// const { getPostData, saveChannelSubscribers } = require('../parser/pp.js')
const { parseChannel } = require('../parser/common.js')

const queueJob = kue.createQueue()
const queueProc = kue.createQueue()

const cronjob = new CronJob('*/20 * * * *', async function() {
  const arrChannels = await getChannels()

  if (arrChannels.length === 0) {
    console.log(`Нет каналов для обработки`)
    return
  }

  for (const channel of arrChannels) {
    const job = queueJob
      .create('posts_stat', { channelUrl: channel.url, channelId: channel.channel_id })
      .save(function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log(`${new Date()} Добавлена задача: ${channel.url}`)
        }
      })
  }

  queueProc.process('posts_stat', async function(job, done){
    try {
/*------------------------------------------------------------------------------
      FOR PP.JS ONLY!!!
      -----------------
      console.log('Обновление информации по самим каналам (подписчики и дата)')
      await saveChannelSubscribers(job.data.channelId, job.data.channelUrl)
      console.log('Обновление информации по постам каналов')
      await getPostData(job.data.channelUrl, job.data.channelId)
-------------------------------------------------------------------------------*/
      await parseChannel(job.data.channelId, job.data.channelUrl)
      done()
    } catch (error) {
      console.log(error)
      done(error)
    }
  })

});

cronjob.start();
