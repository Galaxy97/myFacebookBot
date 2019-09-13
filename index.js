const express = require('express')
const bodyParser = require('body-parser')
var schedule = require('node-schedule')
const axios = require('axios')
const app = express()

const ACCESS_TOKEN = "EAAHLOIwrujEBAJeNUBq3SN1CldjVaewwhZCYZAIjF8g4Vv49PlBAcSTdRZAvR629uCYCDwmmXkmKBHGPLuBL7sZAb0ugysL8QiOQS3zSdqYpFh0ZCaw59ksexYBjuqcsZBDNMPOOqZCKEUU8sg3kBUbFGag82Q11TTZAbFjlk1zmmwBUdouCoGau"

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const nameDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const reminders = new Array()

app.post('/reminder', (req, res) => {
  const intent = req.body.queryResult.intent.displayName
  let fulfillmentText = req.body.queryResult.fulfillmentText

  if (intent === 'reminder-save') {
    const day = {
      date: req.body.queryResult.parameters.date,
      time: req.body.queryResult.parameters.time
    }
    console.log(day)
    const dayWeeks = new Date(day.date)
    const dayTimes = new Date(day.time)
    const dateUnix = new Date(dayWeeks.getFullYear(), dayWeeks.getMonth(), dayWeeks.getDate(), dayTimes.getHours(), dayTimes.getMinutes(), 0).getTime()
    const dataNow = new Date().getTime()
    if (dateUnix > dataNow) {
      fulfillmentText = `Create new reminders on ${nameDays[dayWeeks.getDay()]} at ${dayTimes.getHours()}:${dayTimes.getMinutes() < 10 ? '0' + dayTimes.getMinutes() : dayTimes.getMinutes()}`
      sendReminderToFacebook(dateUnix, req.body.originalDetectIntentRequest.payload.data.sender.id)
    } else {
      fulfillmentText = 'The date is incorrect, please try again'
    }
  }

  if (intent === 'reminder-show') {
    if (reminders.length) {
      fulfillmentText = 'You have reminders: \n'
      reminders.forEach((element) => {
        fulfillmentText += new Date(element.unixTime).toLocaleString() + '\n'
      })
    } else {
      fulfillmentText = 'You have not reminders'
    }
  }
  if (intent === 'reminder-snooze') {
    delReminders()
    const dateUnix = new Date().getTime() + 300000
    sendReminderToFacebook(dateUnix, req.body.originalDetectIntentRequest.payload.data.sender.id)
    fulfillmentText = `Snooze reminder for 5 minutes`
  }

  if (intent === 'reminder-delete') {
    if (req.body.queryResult.parameters.date || req.body.queryResult.parameters.time) {
      if (req.body.queryResult.parameters.date) {
        const day = new Date(req.body.queryResult.parameters.date).getDay()
        reminders.forEach((element, index) => {
          if (new Date(element.unixTime).getDay() === day) {
            reminders.splice(index, 1)
          }
        })
        fulfillmentText = `delete all reminders on ${nameDays[day]}`
      }
    } else {
      delReminders()
      fulfillmentText = 'successful delete'
    }
  }

  res.json({ fulfillmentText })
})

function delReminders() {
  const date = new Date().getTime()
  reminders.forEach((element, index) => {
    if (element.unixTime <= date) {
      reminders.splice(index, 1)
    }
  })
}

function sendReminderToFacebook(dateUnix, id) {
  schedule.scheduleJob(dateUnix, function () {
    axios.post(`https://graph.facebook.com/v2.6/me/messages?access_token=${ACCESS_TOKEN}`, {
      "recipient": {
        "id": id
      },
      "message": {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [
              {
                "title": "You have reminder!",
                "image_url": "https://nifa.aero/wp-content/uploads/reminder-1024x638.gif",
                "subtitle": "We have the right hat for everyone.",
                "default_action": {
                  "type": "web_url",
                  "url": "https://www.google.com.ua/?hl=ru",
                  "webview_height_ratio": "tall",
                },
                "buttons": [
                  {
                    "type": "postback",
                    "payload": "reminder-delete",
                    "title": "accept"
                  }, {
                    "type": "postback",
                    "title": "snooze for 5 minutes",
                    "payload": "reminder-snooze"
                  }
                ]
              }
            ]
          }
        }
      }
    })
      .then((res) => {
        console.log(`statusCode: ${res.statusCode}`)
        console.log(res)
      })
      .catch((error) => {
        console.error(error)
      })
  })

  reminders.push({
    id,
    unixTime: dateUnix
  })
}

app.listen(3000, function () {
  console.log("Server is up and running...")
})
