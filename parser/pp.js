// TODO: Переписать весь парсинг через API zen.yandex
const needle = require('needle')
const cheerio = require('cheerio')
const { Cluster } = require('puppeteer-cluster')
const model = require('../db/model')


// const testChannelUrl = 'https://zen.yandex.ru/id/5c33aeca5c17e000a985f57b'
// const testPostUrl = 'https://zen.yandex.ru/media/id/5c33aeca5c17e000a985f57b/jiraf-leningradov-pereehavshii-dom-stela-shashlyk-5cbc5f1a0a13b900b4b7b70f'

const ignoreList = [
  'an.yandex.ru',
  'mc.yandex.ru',
  'mc.admetrica.ru',
  'api-maps.yandex.ru',
  'vec01.maps.yandex.net',
  'static-mon.yandex.net',
  'avatars.mds.yandex.ru'
]


const getChannelName = (channelUrl) => {
  return new Promise((resolve, reject) => {
    
    needle.get(channelUrl, { compressed: true }, function(err, resp) {

      if (err) {
        return reject(err)
      }

      const $ = cheerio.load(resp.body)
      const nameObj = $('h1')
      const name = nameObj.text()

      const subcribersObj = $('div.channel-subscribers')
      let subscribers = (subcribersObj.text()).split('').map((item) => {
        if (/[1234567890]/.test(item)) {
          return item
        }
      })
      subscribers = subscribers.join('')

      return resolve({ name, subscribers })
    })
  })  
}


const saveChannelSubscribers = async (channelId, channelUrl) => {
  let subscribersObj = null

  try {
    subscribersObj = await getChannelName(channelUrl)
    // обновить в channels поле subscribers, last_updated
    // вставить новую запись в channel_stat
    await model.addChannelStat(channelId, subscribersObj.subscribers)
  } catch (error) {
    console.log(`saveChannelSubscribers:`, error)
  }
}


const getPosts = (channelUrl) => {
  return new Promise((resolve, reject) => {
    
    needle.get(channelUrl, { compressed: true }, function(err, resp) {

      if (err) {
        return reject(err)
      }
  
      const $ = cheerio.load(resp.body)
  
      // Все доступные ссылки на посты
      const a = $('a.doc__content')

      const arrPosts = []
    
      a.each(function(i, ahref){
        const post = {
          url: '',
          name: ''
        }
  
        let href = $(ahref).attr('href')
        post.url = href.split('?feed_exp')[0]
        console.log(`post.url: ${post.url}`)

        let h2 = $('h2.specified-title', this)
        post.name = h2.text()
  
        arrPosts.push(post)
      })
  
      return resolve(arrPosts)
    })
  })  
}


const getPostData = async (channelUrl, channelId) => {

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 5,
    monitor: false,
    puppeteerOptions: {
      // TODO: Почему не работает в безголовом режиме
      headless: false,
      ignoreHTTPSErrors: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1000"
      ]
    }
  })

  await cluster.task(async ({ page, data }) => {

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36')
    await page.setExtraHTTPHeaders({
      // TODO: other headers ???
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
    })

    await page.setRequestInterception(true)
    page.on('request', ireq => {
      if (ignoreList.includes((ireq._url.split('/'))[2])) {
        ireq.abort()
      } else {
        ireq.continue()
      }
    })

    await page.goto(data, {
      timeout: 60000,
      waitUntil: 'networkidle2'
    })

    const pageData = await page.evaluate(function () {

      // Поминки по мадам Петуховой | Как попасть в книгу | Яндекс Дзен
      let title = document.querySelector('title').textContent || 'NoData'
      title = (title.split('|')[0]).trim()

      // TODO: перевод в дату - Sugar.Date.create('3 дня назад', 'ru')
      // Вчера
      // 3 дня назад
      // 13 марта
      // 3 ноября 2018
      let publishedDate = document.querySelector('span.article-stat__date').textContent || 'NoData'
      // FIXME: сейчас по умолчанию создается текущая дата
      publishedDate = (new Date()).toISOString()

      // 1,8 тыс. просмотров
      // 457 просмотров
      let showAmount = document.querySelectorAll('span.article-stat__count')[0].textContent || 'NoData'
      showAmount = showAmount.split(' ')
      if (showAmount[1].includes('тыс.')) {
        showAmount = (parseFloat(showAmount[0].replace(/\,/, '.'))) * 1000
      } else {
        showAmount = parseInt((showAmount[0]).trim())
      }

      // 1,2 тыс. дочитываний
      // 127 дочитываний
      let readBackAmount = document.querySelectorAll('span.article-stat__count')[1].textContent || 'NoData'
      readBackAmount = readBackAmount.split(' ')
      if (readBackAmount[1].includes('тыс.')) {
        readBackAmount = (parseFloat(readBackAmount[0].replace(/\,/, '.'))) * 1000
      } else {
        readBackAmount = parseInt((readBackAmount[0]).trim())
      }

      // 10 мин.
      // 25,5 мин.
      let readTime = document.querySelectorAll('span.article-stat__count')[2].textContent || 'NoData'
      readTime = (readTime.split(' ')[0]).replace(/\,/, '.')

      // 47 нравится
      // Понравилась статья?
      let likesAmount = document.querySelector('span.likes-count__count').textContent || 'NoData'
      if (likesAmount.includes('нравится')) {
        likesAmount = parseInt(likesAmount)
      } else if (likesAmount.includes('Понравилась статья?')) {
        likesAmount = 0
      }
      
      // Нет комментариев
      // 2 комментария
      // 5 комментариев
      let commentsAmount = document.querySelector('span.comments-count__count').textContent || 'NoData'
      if (commentsAmount.includes('Нет комментариев')) {
        commentsAmount = 0
      } else {
        commentsAmount = parseInt(commentsAmount)
      }
      

      return {
        title,
        publishedDate,
        showAmount,
        readBackAmount,
        readTime,
        // readInfo,
        likesAmount,
        commentsAmount
      }
    })

    const postObj = {
      postUrl: data,
      postName: pageData.title,
      createdAt: pageData.publishedDate,
      channel_id: channelId
    }

    let postId

    try {
      postId = await model.addPost(postObj)
      console.log('postId ===>>>', postId)
    } catch (error) {
      console.log(error)
    }

    const postStatObj = {
      post_id: postId,
      showAmount: pageData.showAmount,
      readBack: pageData.readBackAmount,
      readTime: pageData.readTime,
      likes: pageData.likesAmount,
      comments: pageData.commentsAmount
    }

    try {
      await model.addPostStat(postStatObj)
    } catch (error) {
      console.log(error)
    }
  })

  const arrPosts = await getPosts(channelUrl)

  if (arrPosts.length > 0) {
    for (const post of arrPosts) {
      cluster.queue(post.url)
    }
  } else {
    console.log(`Пустые данные`)
  }

  await cluster.idle()
  await cluster.close()
}


// (async () => {
//   const arrPosts = await getPostData(testChannelUrl)
//   console.log(arrPosts)
// })()


module.exports = {
  getChannelName,
  getPosts,
  getPostData,
  saveChannelSubscribers
}
