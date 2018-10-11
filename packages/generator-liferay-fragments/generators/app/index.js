const chalk = require('chalk');
const CustomGenerator = require('../../utils/custom-generator');
const voca = require('voca');

const {
  ADD_SAMPLE_CONTENT_DEFAULT,
  ADD_SAMPLE_CONTENT_MESSAGE,
  ADD_SAMPLE_CONTENT_VAR,
  COLLECTION_DESCRIPTION_SAMPLE,
  COLLECTION_DESCRIPTION_VAR,
  COLLECTION_NAME_SAMPLE,
  COLLECTION_NAME_VAR,
  COLLECTION_SLUG_SAMPLE,
  FRAGMENT_COLLECTION_SLUG_VAR,
  FRAGMENT_DESCRIPTION_SAMPLE,
  FRAGMENT_DESCRIPTION_VAR,
  FRAGMENT_NAME_SAMPLE,
  FRAGMENT_NAME_VAR,
  REPOSITORY_NAME_DEFAULT,
  REPOSITORY_NAME_MESSAGE,
  REPOSITORY_NAME_VAR,
  REPOSITORY_SLUG_VAR
} = require('../../utils/constants');

class AppGenerator extends CustomGenerator {
  async prompting() {
    this._logWelcome();

    await this.ask([
      {
        type: 'input',
        name: REPOSITORY_NAME_VAR,
        message: REPOSITORY_NAME_MESSAGE,
        default: REPOSITORY_NAME_DEFAULT
      },
      {
        type: 'confirm',
        name: ADD_SAMPLE_CONTENT_VAR,
        message: ADD_SAMPLE_CONTENT_MESSAGE,
        default: ADD_SAMPLE_CONTENT_DEFAULT
      }
    ]);

    this.setValue(
      REPOSITORY_SLUG_VAR,
      voca.slugify(this.getValue(REPOSITORY_NAME_VAR))
    );

    this.destinationRoot(
      this.destinationPath(this.getValue(REPOSITORY_SLUG_VAR))
    );
  }

  writing() {
    this.log('');
    this.log(chalk.blue('Creating directory'));

    this.copyTemplates(this.destinationRoot(), [
      '.editorconfig',
      '.eslintrc',
      '.gitignore',
      '.yo-rc.json',
      'package.json',
      'README.md',
      'scripts/compress.js'
    ]);
  }

  install() {
    this.log('');
    this.log(chalk.blue('Installing dependencies'));

    this.npmInstall(['chalk', 'glob', 'jszip'], {
      loglevel: 'silent',
      progress: false,
      saveDev: true
    });
  }

  end() {
    if (this.getValue(ADD_SAMPLE_CONTENT_VAR)) {
      this.log(chalk.blue('Adding sample content'));

      this.composeWith(require.resolve('../collection'), {
        [COLLECTION_NAME_VAR]: COLLECTION_NAME_SAMPLE,
        [COLLECTION_DESCRIPTION_VAR]: COLLECTION_DESCRIPTION_SAMPLE,

        [FRAGMENT_NAME_VAR]: FRAGMENT_NAME_SAMPLE,
        [FRAGMENT_DESCRIPTION_VAR]: FRAGMENT_DESCRIPTION_SAMPLE,
        [FRAGMENT_COLLECTION_SLUG_VAR]: COLLECTION_SLUG_SAMPLE
      });
    }

    setTimeout(() => {
      this.log('');
      this.log(chalk.blue('Done!'));
      this.log(chalk.blue("You're ready to create fragments."));
    }, 100);
  }

  _logWelcome() {
    this.log(
      chalk.blue(`
    __    ____________________  _____  __
    / /   /  _/ ____/ ____/ __ \\/   \\ \\/ /
  / /    / // /_  / __/ / /_/ / /| |\\  /
  / /____/ // __/ / /___/ _, _/ ___ |/ /
/_____/___/_/   /_____/_/ |_/_/  |_/_/
    `)
    );
  }
}

module.exports = AppGenerator;
