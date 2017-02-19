/* eslint-disable prefer-arrow-callback, func-names */
import { Meteor } from 'meteor/meteor';
import { ExchangeRates } from './collections';

Meteor.publish('currency-caribou.exchangerates', function () {
  return ExchangeRates.find(
    {},
    {}
  );
});
