// eslint-disable-next-line @typescript-eslint/no-var-requires
const withTM = require('next-transpile-modules')(['three']);

module.exports = withTM({
  future: {
    webpack5: true,
  },
});
