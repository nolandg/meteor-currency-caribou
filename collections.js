import { Mongo } from 'meteor/mongo';

const ExchangeRates = new Mongo.Collection('currency-caribou.exchangerates');

export { ExchangeRates };
