import 'mocha';

describe("server", function () {
  require('./server/health-check.spec.ts');
  require('./server/about.spec.ts');
});
