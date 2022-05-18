import { Suite } from 'mocha';
import * as serverapi from '../../../lib/server-api';
import * as utils from '../../../lib/utils';

/**
 * Registers a `before()` hook for an organization service test suite.
 * 
 * The `before()` hook logs a "Executing test cases ..." message and configures the OpenAPI
 * client for the analytics server.
 * 
 * **Important:**
 * 
 * If the title of the parent test suite matches the start of the title of the test suite,
 * the hooks will be registered for the parent test suite instead.
 * 
 * This improves the test execution time when tests from multiple test suites are executed.
 * 
 * @param suite The organization service test suite.
 */
 export function addBeforeHooks(suite: Suite) {

  const parent = suite.parent;

  if (parent && parent.title && suite.title.startsWith(parent.title)) {
    if (parent.ctx["BeforeHooks"]) { return; }
    suite = parent;
    parent.ctx["BeforeHooks"] = true;
  }

  suite.retries(2);

  suite.beforeAll(async () => {
    utils.logMessage(suite.title, 'Executing test cases ...');
  });

  suite.beforeEach(beforeEach);
}

/** beforeEach hook for a test suite */
function beforeEach() {

}

/**
 * Registers `afterEach()` and `after()` hooks for an organization service test suite.
 * 
 * The `afterEach()` hook resets the OpenAPI client for the analytics server.
 * 
 * The `after()` hook logs a ">>> Finished" message.
 * 
 * **Important:**
 * 
 * If the title of the parent test suite matches the start of the title of the test suite,
 * the hooks will be registered for the parent test suite instead.
 * 
 * This improves the test execution time when tests from multiple test suites are executed.
 * 
 * @param suite The organization service test suite.
 */
 export function addAfterHooks(suite: Suite) {

  const parent = suite.parent;

  if (parent && parent.title && suite.title.startsWith(parent.title)) {
    if (parent.ctx["AfterHooks"]) { return; }
    suite = parent;
    parent.ctx["AfterHooks"] = true;
  }

  suite.afterEach(afterEach);

  suite.afterAll(async () => {
    utils.logMessage(suite.title, "Finished");
  });
}

/** afterEach hook for a test suite */
function afterEach() {
  serverapi.reset(); // re-apply configuration
}
