const schedule = require('node-schedule');
const axios = require('axios');

const ACCESS_TOKEN =
  'EAAHLOIwrujEBAJeNUBq3SN1CldjVaewwhZCYZAIjF8g4Vv49PlBAcSTdRZAvR629uCYCDwmmXkmKBHGPLuBL7sZAb0ugysL8QiOQS3zSdqYpFh0ZCaw59ksexYBjuqcsZBDNMPOOqZCKEUU8sg3kBUbFGag82Q11TTZAbFjlk1zmmwBUdouCoGau';
const nameDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const reminders = [];

const delFuncReminders = () => {
  const date = new Date().getTime();
  reminders.forEach((element, index) => {
    if (element.unixTime <= date) {
      reminders.splice(index, 1);
    }
  });
};

const deleteReminders = req => {
  if (req.body.queryResult.parameters.date || req.body.queryResult.parameters.time) {
    if (req.body.queryResult.parameters.date && req.body.queryResult.parameters.time) {
      const dayWeeks = new Date(req.body.queryResult.parameters.date);
      const dayTimes = new Date(req.body.queryResult.parameters.time);
      const day = new Date(
        dayWeeks.getFullYear(),
        dayWeeks.getMonth(),
        dayWeeks.getDate(),
        dayTimes.getHours(),
        dayTimes.getMinutes(),
        0,
      ).getTime();
      reminders.forEach((element, index) => {
        if (new Date(element.unixTime) === day) {
          reminders.splice(index, 1);
        }
      });
      return `delete reminder on ${new Date(day).toLocaleString()}`;
    }
    if (req.body.queryResult.parameters.date) {
      const day = new Date(req.body.queryResult.parameters.date).getDay();
      reminders.forEach((element, index) => {
        if (new Date(element.unixTime).getDay() === day) {
          reminders.splice(index, 1);
        }
      });
      return `delete all reminders on ${nameDays[day]}`;
    }
  }
  delFuncReminders();
  return 'successful delete';
};
const acceptReminders = () => {
  delFuncReminders();
  return 'successful accept';
};

const showReminders = () => {
  if (reminders.length) {
    let text = 'You have reminders: \n';
    reminders.forEach(element => {
      text += `${new Date(element.unixTime).toLocaleString()}\n`;
    });
    return text;
  }
  return 'You have not reminders';
};

const sendReminderToFacebook = (dateUnix, id) => {
  schedule.scheduleJob(dateUnix, () => {
    axios
      .post(`https://graph.facebook.com/v2.6/me/messages?access_token=${ACCESS_TOKEN}`, {
        recipient: {
          id,
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [
                {
                  title: 'You have reminder!',
                  image_url: 'https://nifa.aero/wp-content/uploads/reminder-1024x638.gif',
                  subtitle: 'We have the right hat for everyone.',
                  default_action: {
                    type: 'web_url',
                    url: 'https://www.google.com.ua/?hl=ru',
                    webview_height_ratio: 'tall',
                  },
                  buttons: [
                    {
                      type: 'postback',
                      title: 'accept',
                      payload: 'reminder-accept-v2',
                    },
                    {
                      type: 'postback',
                      title: 'snooze for 5 minutes',
                      payload: 'reminder-snooze',
                    },
                  ],
                },
              ],
            },
          },
        },
      })
      .catch(error => {
        console.error(error);
      });
  });

  reminders.push({
    id,
    unixTime: dateUnix,
  });
};

const saveReminders = req => {
  const day = {
    date: req.body.queryResult.parameters.date,
    time: req.body.queryResult.parameters.time,
  };
  const dayWeeks = new Date(day.date);
  const dayTimes = new Date(day.time);
  const dateUnix = new Date(
    dayWeeks.getFullYear(),
    dayWeeks.getMonth(),
    dayWeeks.getDate(),
    dayTimes.getHours(),
    dayTimes.getMinutes(),
    0,
  ).getTime();
  const dataNow = new Date().getTime();
  if (dateUnix > dataNow) {
    sendReminderToFacebook(dateUnix, req.body.originalDetectIntentRequest.payload.data.sender.id);
    return `Create new reminders on ${nameDays[dayWeeks.getDay()]} at ${dayTimes.getHours()}:${
      dayTimes.getMinutes() < 10 ? `0${dayTimes.getMinutes()}` : dayTimes.getMinutes()
    }`;
  }
  return 'The date is incorrect, please try again';
};

const snoozeReminders = req => {
  delFuncReminders();
  const dateUnix = new Date().getTime() + 300000;
  sendReminderToFacebook(dateUnix, req.body.originalDetectIntentRequest.payload.data.sender.id);
  return `Snooze reminder for 5 minutes`;
};

module.exports = {
  sendReminderToFacebook,
  delFuncReminders,
  acceptReminders,
  deleteReminders,
  snoozeReminders,
  saveReminders,
  showReminders,
};
