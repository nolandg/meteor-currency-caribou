/* eslint-disable prefer-arrow-callback, func-names */
import { Meteor } from 'meteor/meteor';
import request from 'request';
import { SyncedCron as syncedCron } from 'meteor/percolate:synced-cron';
import { ExchangeRates } from './collections';
import './publications';
import { formatAmount, subscribeToExchangeRates, getLatestExchangeRates } from './shared';

export { formatAmount, subscribeToExchangeRates, getLatestExchangeRates };

function addNewRates(rates, base, timestamp) {
  // remove all but latest rates
  const oldRates = ExchangeRates.find({}, { sort: { timestamp: 1 } }).fetch();
  oldRates.forEach((rate, i) => {
    if (i === oldRates.length - 1) return;
    ExchangeRates.remove(rates._id);
  });

  ExchangeRates.insert({ rates, base, timestamp });
}

function updateExchangeRates() {
  const url = 'https://openexchangerates.org/api/latest.json?' +
    'app_id=' + Meteor.settings.private.openExchangeRates.appId;

  request.get({ url, json: true }, Meteor.bindEnvironment((error, res, data) => {
    if (error) {
      console.log('Error updating exchange rates: ', error);
    } else if (res.statusCode !== 200) {
      console.log('Status error updating exchange rates: ', res.statusCode);
    } else {
      addNewRates(data.rates, data.base, data.timestamp);
    }
  }));
}

syncedCron.add({
  name: 'Update exchange rates',
  schedule(parser) {
    // parser is a later.parse object
    return parser.text('every 1 hour');
  },
  job() {
    updateExchangeRates();
  },
});
syncedCron.start();