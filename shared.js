import React, { Component } from 'react';
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

function getDefaultCountry() { return alpha2ToCountry(Meteor.settings.public.currencyCaribou.defaultCountry); }
let localCountry = alpha2ToCountry(getDefaultCountry());
function getLocalCurrency(){ return alpha2ToCurrency(localCountry.alpha2); }
function getDefaultCurrency() { return alpha2ToCurrency(Meteor.settings.public.currencyCaribou.defaultCountry); }

if (Meteor.isClient) {
  // send a request for the geoip data and save it when it arrives
  $.getJSON('https://freegeoip.net/json/')
    .done((data) => {
      if(!data.country_code){
        console.log('Error geolocating IP address, no country code: ', error);
        return;
      }
      localCountry = alpha2ToCountry(data.country_code);
      if(!localCountry) localCountry
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

class CurrencyAmount extends Component {
  render(){
    const toCurrency = codeToCurrency(this.props.toCurrencyCode);
    const fromCurrency = codeToCurrency(this.props.fromCurrencyCode);
    const amount = Math.abs(convertAmount(this.props.amount, toCurrency, fromCurrency));
    const negative = this.props.amount < 0;
    const country = currencyToCountry(toCurrency);
    const integerAmount = Math.floor(amount);
    const fractionAmount = amount.toFixed(toCurrency.decimals).substr(-toCurrency.decimals);


    const className = 'currency-caribou amount' +
      (this.props.raisedFraction ? ' raised-fraction' : '') +
      (negative ? ' negative' : '');

    return (
      <span className={className}>
        {this.props.symbol && !this.props.currencyOnly && negative ? <span className="minus">-</span> : null}
        {this.props.symbol && !this.props.currencyOnly ? <span className="symbol">{toCurrency.symbol}</span> : null}
        {!this.props.currencyOnly ? <span className="integer">{integerAmount}</span> : null}
        {toCurrency.decimals && !this.props.excludeFraction && !this.props.currencyOnly ? (
          <span className="fraction-portion">
            <span className="point">.</span>
            <span className="fraction">{fractionAmount}</span>
          </span>
        ) : null}
        {this.props.flag ? <i className={country.alpha2.toLowerCase() + ' flag'} /> : null }
        {this.props.code ? <span className="code">{toCurrency.code}</span> : null }
      </span>
    )
  }
}

CurrencyAmount.propTypes = {
  raisedFraction: React.PropTypes.bool,
  excludeFraction: React.PropTypes.bool,
  flag: React.PropTypes.bool,
  currencyOnly: React.PropTypes.bool,
  code: React.PropTypes.bool,
  symbol: React.PropTypes.bool,
  amount: React.PropTypes.number,
  toCurrencyCode: React.PropTypes.string,
  fromCurrencyCode: React.PropTypes.string,
}
CurrencyAmount.defaultProps = {
  excludeFraction: false,
  symbol: true,
  flag: false,
  code: false,
  raisedFraction: false,
  toCurrencyCode: getLocalCurrency().code,
  fromCurrencyCode: getDefaultCurrency().code,
}

export { CurrencyAmount, convertAmount, observeCurrency, localCountry, getLocalCurrency };
