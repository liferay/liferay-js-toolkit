const fs = require('fs');
const path = require('path');
const YeomanTest = require('yeoman-test');

function expectFile(...paths) {
  return expect(
    fs.readFileSync(path.join(...paths), 'utf-8')
  ).toMatchSnapshot();
}

describe('collection-generator', () => {
  it('generates a new collection', () =>
    YeomanTest.run(path.join(__dirname, '..'))
      .withOptions({ collectionName: 'Sample Collection' })
      .withOptions({ collectionDescription: 'Sample Description' })
      .then(projectPath => {
        expectFile(projectPath, 'src', 'sample-collection', 'collection.json');
      }));

  it('accepts no description', () =>
    YeomanTest.run(path.join(__dirname, '..'))
      .withOptions({ collectionName: 'Sample Collection' })
      .then(projectPath => {
        expectFile(projectPath, 'src', 'sample-collection', 'collection.json');
      }));

  it('requires a name', () =>
    new Promise((resolve, reject) =>
      YeomanTest.run(path.join(__dirname, '..'))
        .then(reject)
        .catch(resolve)
    ));
});
