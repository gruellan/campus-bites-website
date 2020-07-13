// This is a simple Vue.js "filter" (https://vuejs.org/v2/guide/filters.html)

// The input "value" is what is piped into the filter in your component
// and all this filter does is format a number (price in pence) to look like
// a price. e.g. 27 becomes "£0.27" and 103 becomes "£1.03".

// If sign is true show the + symbol when the number is positive
const formatPrice = (value, sign, showFree) => {
  let price = value || 0;
  if (price === 0 && showFree)
    return 'Free';
  const prefix = (price < 0) ? '-' : (sign ? '+' : '');
  price = Math.abs(price);
  const pounds = Math.floor(price / 100);
  const pence = price % 100;
  return prefix + '£' + pounds + '.' + ('0' + pence).slice(-2);
};

export default formatPrice;
