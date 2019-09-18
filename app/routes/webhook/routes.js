const express = require('express');
const services = require('./services');

const router = express.Router();

router.post('/', (req, res) => {
  // .com/webhook
  const intent = req.body.queryResult.intent.displayName;
  let { fulfillmentText } = req.body.queryResult.fulfillmentText;

  switch (intent) {
    case 'reminder-save':
      fulfillmentText = services.saveReminders(req);
      break;
    case 'reminder-show':
      fulfillmentText = services.showReminders();
      break;
    case 'reminder-snooze':
      fulfillmentText = services.snoozeReminders(req);
      break;
    case 'reminder-delete':
      fulfillmentText = services.deleteReminders(req);
      break;
    case 'reminder-accept-v2':
      fulfillmentText = services.acceptReminders();
      break;
    default:
      break;
  }
  res.json({ fulfillmentText });
});

module.exports = router;
