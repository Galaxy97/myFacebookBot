const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const webHook = require('./routes/webhook/routes')

app.use(bodyParser.json())
app.use(bodyParser.text())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/webhook', webHook)

console.log(`
***********************************************
*********  Server is ready for usage  *********
***********************************************
***********************************************
`)

module.exports = app