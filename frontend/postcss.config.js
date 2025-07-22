// postcss.config.js
module.exports = {
  plugins: {
    // Utilisez @tailwindcss/postcss au lieu de tailwindcss
    '@tailwindcss/postcss': {}, // CHANGEMENT ICI
    autoprefixer: {},
  },
};
