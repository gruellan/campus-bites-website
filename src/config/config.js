const getEnvironment = (NODE_ENV) => {
  switch (NODE_ENV) {
    case 'production':
      return 'production';
    case 'development':
    default:
      return 'development';
  }
};

const config = {
  commitSHA1: process.env.VUE_APP_COMMIT_SHA1,
  branch: process.env.VUE_APP_BRANCH,
  devtools: true,
  environment: getEnvironment(process.env.NODE_ENV),
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  },
  messagingPublicKey: '',
  productionTip: false
};

// Determine if the build environment is a 'local' machine (no commitSHA1 set)
//  and set the environment property to 'local' accordingly
if (config.environment !== 'local' && !config.commitSHA1) {
  console.warn('No SHA1 was set, defaulting to local environment');
  config.environment = 'local';
}

// Override configuration in different environments
if (config.environment === 'production') {
  const productionConfig = require('./config.production.js').default;
  console.debug('using production config:', productionConfig);
  Object.assign(config, productionConfig);
}

console.debug('Environment:', config.environment);
console.debug('Config:', config);

export default config;
