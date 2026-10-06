const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Schedule, presenters, ad packages and banners live in the web app (`../src/config`)
// so the website and the mobile app always ship the same line-up.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../src/config')]

module.exports = config
