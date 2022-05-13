import * as fs from 'fs';
import s from 'shelljs';
import packageJson from './package.json';

type About = {
  name: string;
  description: string;
  author: string;
  license: string;
  versions: {
    'apim-analytics-server': string;
  }
  repository: {
    type: string;
    url: string;
    revision: {
      sha1: string;
    }
  }
  issues_url: string;
  build_date: string;
}

const prepare = () => {
  if (s.mkdir('-p', './public').code !== 0) process.exit(1);
}

const createAbout = () => {

  const sha1 = s.exec('git rev-parse HEAD', { silent: true }).stdout.slice(0, -1);

  const about: About = {
    name: packageJson.name,
    description: packageJson.description,
    author: packageJson.author,
    license: packageJson.license,
    versions: {
      'apim-analytics-server': packageJson.version,
    },
    repository: {
      type: packageJson.repository.type,
      url: packageJson.repository.url,
      revision: {
        sha1: sha1,
      }
    },
    issues_url: packageJson.bugs.url,
    build_date: new Date().toISOString(),
  }

  const filename = './public/about.json';
  try {
    fs.writeFileSync(filename, JSON.stringify(about, null, 2));
  } catch (error) {
    console.log(`ERROR: failed to write about file '${filename}'`);
    process.exit(1);
  }
}

const copyAssets = () => {
  // public resources
  if (s.cp('-rf', 'public', './dist/public').code !== 0) process.exit(1);
}

const main = () => {
  prepare();
  createAbout();
  copyAssets();
}

main();