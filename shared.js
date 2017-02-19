import React from 'react';
import { Meteor } from 'meteor/meteor';
import { ExchangeRates } from './collections';
import { Tracker } from 'meteor/tracker';
import currencies from './currency-data';
const countries = require('./country-data.json');

const dependency = new Tracker.Dependency()

function observeCurrency(){
  dependency.depend();
  Meteor.subscribe('currency-caribou.exchangerates');
}

Meteor.startup(()=>{
  Meteor.subscribe('currency-caribou.exchangerates');

  ExchangeRates.find({}, { sort: { timestamp: -1 } }).observe({
    added: ()=>{ dependency.changed(); },
  });
});

function alpha2ToCountry(alpha2){
  return countries.find((c) => { return c.alpha2 === alpha2 });
}
function codeToCurrency(code){
  return currencies.find((c) => { return c.code === code });
}
function alpha2ToCurrency(alpha2) {
  const country = alpha2ToCountry(alpha2)
  if(country) return codeToCurrency(country.currencies[0]);
  return null;
}
function currencyToCountry(code) {
  if(typeof code === 'object') code = code.code;
  return countries.find((c) => { return c.currencies[0] === code });
}

function getDefaultCountry() { return Meteor.settings.public.currencyCaribou.defaultCountry; }
let localCountry = alpha2ToCountry(getDefaultCountry());
function getLocalCurrency(){ return alpha2ToCurrency(localCountry.alpha2); }
function getDefaultCurrency() { return alpha2ToCurrency(Meteor.settings.public.currencyCaribou.defaultCountry); }

if (Meteor.isClient) {
  // send a request for the geoip data and save it when it arrives
  $.getJSON('https://freegeoip.net/json/')
    .done((data) => {
      localCountry = alpha2ToCountry(data.country_code);
      dependency.changed();
    })
    .fail((jqxhr, textStatus, error) => {
      console.log('Error geolocating IP address: ', error);
    });
}

function getLatestExchangeRates(){
  return ExchangeRates.findOne({}, { sort: { timestamp: -1 } });
}

function convertAmount(amount, toCurrency, fromCurrency) {
  const latestRates = getLatestExchangeRates();
  let rate = 1;
  if (latestRates) {
    rate = latestRates.rates[toCurrency.code]/latestRates.rates[fromCurrency.code];
  }

  const convertedAmount = amount * rate;
  return convertedAmount;
}

function formatAmount(amount, toCurrencyCode, fromCurrencyCode) {
  const toCurrency = toCurrencyCode ? codeToCurrency(toCurrencyCode) : getLocalCurrency();
  const fromCurrency = fromCurrencyCode ? codeToCurrency(toCurrencyCode) : getDefaultCurrency();
  amount = convertAmount(amount, toCurrency, fromCurrency);

  const country = currencyToCountry(toCurrency);
  const integerAmount = Math.floor(amount);
  const fractionAmount = amount.toFixed(toCurrency.decimals).substr(-toCurrency.decimals);

  return (
    <span className="currency-caribou amount">
      <span className="symbol">{toCurrency.symbol}</span>
      <span className="integer">{integerAmount}</span>
      {toCurrency.decimals ? (
        <span className="fraction-portion">
          <span className="point">.</span>
          <span className="fraction">{fractionAmount}</span>
        </span>
      ) : null}
      <i className={country.alpha2.toLowerCase() + ' flag'} />
      <span className="code">{toCurrency.code}</span>
    </span>
  )
}

export { formatAmount, observeCurrency, localCountry, getLocalCurrency };
