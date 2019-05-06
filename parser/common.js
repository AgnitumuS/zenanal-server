const needle = require('needle')

const {
  addChannelStat,
  addPost,
  addPostStat
} = require('../db/model')


const getData = (url) => {
  return new Promise((resolve, reject) => {
    needle.get(url, {compressed: true}, function(err, resp) {
      if (err) {
        return reject(err)
      }

      return resolve(resp.body)
    })
  })
}


const parseChannel = async (channelId, channelUrl) => {
  
  console.log(`Начало сбора информации по каналу id=${channelId}`)

  const channel = {}

  // Загрузка страницы канала
  const channelPage = await getData(channelUrl)

  // Получение ссылки на export постов
  const beginUrl = channelPage.indexOf(`https://zen.yandex.ru/api/v3/launcher/more?channel_name=`)
  const endUrl = channelPage.indexOf('"', beginUrl)
  const channelFeedUrl = channelPage.slice(beginUrl, endUrl)

  const channelFeed = await getData(channelFeedUrl)

  // Получение названия канала
  channel.name = channelFeed.channel.source.title
  // Получение числа подписчиков
  channel.subscribers = channelFeed.channel.source.subscribers
  // Сохранение числа подписчиков канала
  await addChannelStat(channelId, channel.subscribers)

  //  Сбор данных о постах
  channel.posts = []

  for (const postItem of channelFeed.items) {
    const post = {}
    post.name = postItem.title
    post.url = postItem.link.split('?feed_exp')[0]

    // Сохранение данных по посту 
    // и получение post_id
    const postId = await addPost({
      postUrl: post.url,
      postName: post.name,
      channelId
    })

    const postStatUrl = 'https://zen.yandex.ru/media-api/publication-view-stat?publicationId=' + postItem.publication_id.split(':')[1]
    const postStatData = await getData(postStatUrl)
    post.views = postStatData.views
    post.viewsTillEnd = postStatData.viewsTillEnd
    post.sumViewTimeSec = postStatData.sumViewTimeSec
    post.comments = postStatData.comments

    const publisherId = postItem.source.logo.split('pub_')[1].split('_')[0]
    const documentId = postItem.publication_id.replace(/:/, '%3A')
    const pageWithLikes = `https://zen.yandex.ru/api/comments/top-comments?withUser=true&commentCount=3&publisherId=${publisherId}&documentId=${documentId}&commentId=0&sessionTs=1556313204068&channelOwnerUid=97543268&clientTs=1556313204071&rid=2607022391.3717523395.150453942727716.2379980465`
    const commentsData = await getData(pageWithLikes)

    post.likes = commentsData.publicationLikeCount

    // Сохранение статистики по посту
    await addPostStat({
      postId,
      views: post.views,
      viewsTillEnd: post.viewsTillEnd,
      sumViewTimeSec: post.sumViewTimeSec,
      likes: post.likes,
      comments: post.comments
    })

    channel.posts.push(post)
  }

  console.log('ok')
}


/*-----------------------------------------------------
                TEST BLOCK
                ----------
testChannelUrl = 'https://zen.yandex.ru/evodolazkin'
testChannelId = 4
parseChannel(testChannelId, testChannelUrl)
-----------------------------------------------------*/

module.exports = {
  parseChannel
}