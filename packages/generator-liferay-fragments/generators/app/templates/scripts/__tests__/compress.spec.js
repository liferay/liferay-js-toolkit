const compress = require('../compress');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const JSZip = require('jszip');

describe('app-generator > compress', () => {
  let tmpDir;
  let tmpDirName;

  async function checkZip() {
    const data = fs.readFileSync(path.join(tmpDirName, 'fragments.zip'));
    const zip = await JSZip.loadAsync(data);
    const promises = [];

    zip.forEach((relativePath, file) => {
      const readable = file.nodeStream();
      let fileContent = '';

      promises.push(new Promise((resolve) => {
        readable.on('data', (chunk) => { fileContent += chunk; });

        readable.on('end', () => {
          expect({
            relativePath,
            fileContent,
            dir: file.dir
          }).toMatchSnapshot();

          resolve();
        });
      }));
    });

    await Promise.all(promises);
  }

  beforeEach(() => {
    tmpDir = tmp.dirSync({ unsafeCleanup: true });
    tmpDirName = tmpDir.name;
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  it('generates a zip file', async () => {
    await compress(tmpDirName);
    await checkZip();
  });

  it('appends existing collections', async () => {
    fs.mkdirSync(path.join(tmpDirName, 'src'));
    fs.mkdirSync(path.join(tmpDirName, 'src', 'sample-collection'));

    fs.copyFileSync(
      path.join(__dirname, 'assets', 'collection.json'),
      path.join(tmpDirName, 'src', 'sample-collection', 'collection.json')
    );

    await compress(tmpDirName);
    await checkZip();
  });

  it('appends existing fragments', async () => {
    fs.mkdirSync(path.join(tmpDirName, 'src'));
    fs.mkdirSync(path.join(tmpDirName, 'src', 'sample-collection'));
    fs.mkdirSync(path.join(tmpDirName, 'src', 'sample-collection', 'sample-fragment'));

    fs.copyFileSync(
      path.join(__dirname, 'assets', 'collection.json'),
      path.join(tmpDirName, 'src', 'sample-collection', 'collection.json')
    );

    fs.copyFileSync(
      path.join(__dirname, 'assets', 'fragment.json'),
      path.join(tmpDirName, 'src', 'sample-collection', 'sample-fragment', 'fragment.json')
    );

    fs.copyFileSync(
      path.join(__dirname, 'assets', 'index.html'),
      path.join(tmpDirName, 'src', 'sample-collection', 'sample-fragment', 'index.html')
    );

    fs.copyFileSync(
      path.join(__dirname, 'assets', 'main.js'),
      path.join(tmpDirName, 'src', 'sample-collection', 'sample-fragment', 'main.js')
    );

    fs.copyFileSync(
      path.join(__dirname, 'assets', 'styles.css'),
      path.join(tmpDirName, 'src', 'sample-collection', 'sample-fragment', 'styles.css')
    );

    await compress(tmpDirName);
    await checkZip();
  });
});
