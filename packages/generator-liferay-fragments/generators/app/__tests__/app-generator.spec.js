const fs = require('fs');
const path = require('path');
const YeomanTest = require('yeoman-test');

function expectFile(base, _path) {
  const content = fs.readFileSync(path.join(base, _path), 'utf-8');
  return expect({
    _path: _path.split(path.sep).join('/'),
    content
  }).toMatchSnapshot();
}

function expectFiles(base, paths) {
  return paths.map(_path => expectFile(base, _path));
}

describe('fragment-generator', () => {
  it('generates a new project', () =>
    YeomanTest.run(path.join(__dirname, '..')).then(projectPath =>
      expectFiles(path.join(projectPath, 'sample-liferay-fragments'), [
        '.editorconfig',
        '.eslintrc',
        '.gitignore',
        '.yo-rc.json',
        'package.json',
        path.join('scripts', 'compress.js'),
        path.join('scripts', 'log.js')
      ])
    ));

  it('allows a custom repository name', () =>
    YeomanTest.run(path.join(__dirname, '..'))
      .withPrompts({ repositoryName: 'My Nice Custom Repository' })
      .then(projectPath =>
        expectFiles(path.join(projectPath, 'my-nice-custom-repository'), [
          'package.json'
        ])
      ));

  it('allows adding sample content', () =>
    YeomanTest.run(path.join(__dirname, '..'))
      .withPrompts({ addSampleContent: true })
      .then(projectPath => {
        expectFiles(path.join(projectPath, 'sample-liferay-fragments'), [
          'package.json'
        ]);

        expectFiles(
          path.join(
            projectPath,
            'sample-liferay-fragments',
            'src',
            'sample-collection',
            'sample-fragment'
          ),
          ['fragment.json', 'index.html', 'styles.css', 'main.js']
        );
      }));
});
