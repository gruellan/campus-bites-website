import Vue from 'vue';
import formatPrice from './price';

Vue.filter('price', formatPrice);

export { formatPrice };
