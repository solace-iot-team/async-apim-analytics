import 'mocha';
import { expect } from 'chai';
import * as path from 'path';
import fetch from 'node-fetch';

const scriptName: string = path.basename(__filename);

describe(scriptName, function () {

  const serverPort = process.env.AMAX_SERVER_PORT;
  const aboutURI = `http://localhost:${serverPort}/about.json`;

  it("should return 'about' information", async function () {

    const response = await fetch(aboutURI).catch((reason) => {
      expect.fail(`failed to get about information; error='${reason}`);
    });

    expect(response.status, 'failed to get about information').to.be.eql(200);

    const data = await response.json();
    expect(data, 'response is not correct').contains.keys([
      "name", "description", "author", "license", "versions", "repository", "build_date"
    ]);
  });
});
