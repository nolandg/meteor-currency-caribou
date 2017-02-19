import React from 'react';
import { Meteor } from 'meteor/meteor';
import { ExchangeRates } from './collections';

function subscribeToExchangeRates() {
  Meteor.subscribe('currency-caribou.exchangerates');
}

Meteor.startup(()=>{
  subscribeToExchangeRates();
});

function countryToCurrency(country) {
  // This migh be better in the future: https://www.npmjs.com/package/country-data
  country = country.toUpperCase();
  switch (country) {
    case 'US': return 'USD';
    case 'CA':
    default: return 'CAD';
  }
}

function countryToSymbol(country) {
  // This migh be better in the future: https://www.npmjs.com/package/country-data
  country = country.toUpperCase();
  switch (country) {
    case 'US': return '$';
    case 'CA':
    default: return '$';
  }
}

function countryToDecimals(country) {
  // This migh be better in the future: https://www.npmjs.com/package/country-data
  country = country.toUpperCase();
  switch (country) {
    case 'US': return 2;
    case 'CA':
    default: return 2;
  }
}

function currencyToCountry(currency) {
  // This migh be better in the future: https://www.npmjs.com/package/country-data
  currency = currency.toUpperCase();
  switch (currency) {
    case 'USD': return 'US';
    case 'CAD':
    default: return 'CA';
  }
}

function currencyToSymbol(currency) {
  // This migh be better in the future: https://www.npmjs.com/package/country-data
  currency = currency.toUpperCase();
  switch (currency) {
    case 'USD': return '$';
    case 'CAD':
    default: return '$';
  }
}

function currencyToDecimals(currency) {
  // This migh be better in the future: https://www.npmjs.com/package/country-data
  currency = currency.toUpperCase();
  switch (currency) {
    case 'USD': return 2;
    case 'CAD':
    default: return 2;
  }
}

let localCountry;
let localCurrency;
let localCurrencySymbol;
let localCurrencyDecimals;

function updateLocals(country) {
  localCountry = country;
  localCurrency = countryToCurrency(localCountry);
  localCurrencySymbol = countryToSymbol(localCountry);
  localCurrencyDecimals = countryToDecimals(localCountry);
}
updateLocals(Meteor.settings.public.currencyCaribou.defaultCountry);

if (Meteor.isClient) {
  // send a request for the geoip data and save it when it arrives
  $.getJSON('https://freegeoip.net/json/')
    .done((data) => {
      //updateLocals(data.country_code);
      updateLocals('US');
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
console.log(localCurrency);
  let rate = 1;
  if (latestRates) {
    rate = latestRates.rates[toCurrency]/latestRates.rates[fromCurrency];
  }

  const convertedAmount = amount * rate;
  return convertedAmount;
}

function formatAmount(amount, toCurrency, fromCurrency) {
  fromCurrency = fromCurrency || countryToCurrency(Meteor.settings.public.currencyCaribou.defaultCountry);
  toCurrency = toCurrency || localCurrency;
  amount = convertAmount(amount, toCurrency, fromCurrency);

  const decimals = currencyToDecimals(toCurrency);
  const symbol = currencyToSymbol(toCurrency);
  const country = currencyToCountry(toCurrency);
  const integerAmount = Math.floor(amount);
  const fractionAmount = amount.toFixed(decimals).substr(-decimals);

  return (
    <span className="currency-caribou amount">
      <span className="symbol">{symbol}</span>
      <span className="integer">{integerAmount}</span>
      {decimals ? (
        <span className="fraction-portion">
          <span className="point">.</span>
          <span className="fraction">{fractionAmount}</span>
        </span>
      ) : null}
      <i className={country.toLowerCase() + ' flag'} />
      <span className="code">{toCurrency}</span>
    </span>
  )
}

export { formatAmount, subscribeToExchangeRates, getLatestExchangeRates, localCurrency };
