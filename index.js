const cfg = require('./config')
const express = require('express')
const bodyParser = require('body-parser')
const router = require('./router')

const app = express()

const whiteList = {
  "http://localhost:8080": true,
  "http://127.0.0.1:8080": true
}

const allowCrossDomain = function(req, res, next) {
  console.log(`req.headers.origin: ${req.headers.origin}`)
  if (whiteList[req.headers.origin]) {
    res.header('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Origin, Accept')
    next()
  } 
}

app.use(allowCrossDomain);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

function logErrors (err, req, res, next) {
  if (err) {
    console.log(err)
    res.status(500).end()
  } else {
    next()
  }
}

app.use(router)

app.listen(cfg.http.PORT, () => {
  console.log(`server startpted on: http://${cfg.http.HOST}:${cfg.http.PORT}`)
})

app.use(logErrors)
