import 'mocha';

describe("server", function () {
  require('./server/health-check.spec.ts');
  require('./server/about.spec.ts');
});

describe("organizations", function () {
  require('./organizations/create.spec.ts');
  require('./organizations/delete.spec.ts');
  require('./organizations/get.spec.ts');
  require('./organizations/update.spec.ts');
  require('./organizations/list.spec.ts');
});
