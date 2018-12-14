const fs = require('fs');
const path = require('path');
const YeomanTest = require('yeoman-test');

function expectFile(...paths) {
  return expect(
    fs.readFileSync(path.join(...paths), 'utf-8')
  ).toMatchSnapshot();
}

function expectFiles(base, paths) {
  return paths.map(_path => expectFile(path.join(base, _path)));
}

describe('fragment-generator', () => {
  it('generates a new fragment', () =>
    YeomanTest.run(path.join(__dirname, '..'))
      .withOptions({ fragmentName: 'Sample Fragment' })
      .withOptions({ fragmentDescription: 'Sample Description' })
      .withOptions({ fragmentType: 'section' })
      .withOptions({ fragmentCollectionSlug: 'sample-collection' })
      .then(projectPath => {
        expectFiles(
          path.join(projectPath, 'src', 'sample-collection', 'sample-fragment'),
          ['fragment.json', 'index.html', 'styles.css', 'main.js']
        );
      }));

  it('accepts no description', () =>
    YeomanTest.run(path.join(__dirname, '..'))
      .withOptions({ fragmentName: 'Sample Fragment' })
      .withOptions({ fragmentType: 'section' })
      .withOptions({ fragmentCollectionSlug: 'sample-collection' })
      .then(projectPath => {
        expectFiles(
          path.join(projectPath, 'src', 'sample-collection', 'sample-fragment'),
          ['fragment.json', 'index.html', 'styles.css', 'main.js']
        );
      }));

  it('needs a name', () =>
    new Promise((resolve, reject) =>
      YeomanTest.run(path.join(__dirname, '..'))
        .withOptions({ fragmentDescription: 'Sample Description' })
        .withOptions({ fragmentType: 'section' })
        .withOptions({ fragmentCollectionSlug: 'sample-collection' })
        .then(reject)
        .catch(resolve)
    ));

  it('needs a collection', () =>
    new Promise((resolve, reject) =>
      YeomanTest.run(path.join(__dirname, '..'))
        .withOptions({ fragmentName: 'Sample Fragment' })
        .withOptions({ fragmentType: 'section' })
        .withOptions({ fragmentDescription: 'Sample Description' })
        .then(reject)
        .catch(resolve)
    ));
});
