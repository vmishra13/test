/**
 * Production startup script with proper path resolution
 */

const { register } = require('tsconfig-paths');
const path = require('path');

// Register paths for production (baseUrl relative to dist folder)
register({
  baseUrl: path.resolve(__dirname, 'dist'),
  paths: {
    '@/*': ['*'],
    '@config/logger': ['config/logger'],
    '@config': ['config/index'],
    '@config/*': ['config/*'],
    '@db': ['db/index'],
    '@db/*': ['db/*'],
    '@features/*': ['features/*'],
    '@shared': ['shared/index'],
    '@shared/*': ['shared/*'],
    '@api/*': ['api/*'],
    '@middleware/*': ['middleware/*'],
    '@utils/*': ['shared/utils/*'],
    '@types/*': ['shared/types/*'],
    '@constants/*': ['shared/constants/*'],
    '@services/*': ['services/*']
  }
});

// Set production environment
process.env.NODE_ENV = 'production';

// Start the application
require('./dist/index.js');
