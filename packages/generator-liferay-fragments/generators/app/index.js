const CustomGenerator = require('../../utils/custom-generator');
const { log, logNewLine } = require('../../utils/log');
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
  /**
   * @inheritdoc
   */
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

    this.isRequired(REPOSITORY_SLUG_VAR);

    this.destinationRoot(
      this.destinationPath(this.getValue(REPOSITORY_SLUG_VAR))
    );
  }

  /**
   * @inheritdoc
   */
  writing() {
    logNewLine('Creating directory');

    this.copyFiles(this.destinationRoot(), [
      'scripts/compress.js',
      'scripts/log.js'
    ]);

    this.copyTemplates(this.destinationRoot(), [
      '.editorconfig',
      '.eslintrc',
      '.gitignore',
      '.yo-rc.json',
      'package.json',
      'README.md'
    ]);
  }

  /**
   * @inheritdoc
   */
  install() {
    logNewLine('Installing dependencies');

    this.npmInstall(['chalk', 'glob', 'jszip'], {
      loglevel: 'silent',
      progress: false,
      saveDev: true
    });
  }

  /**
   * @inheritdoc
   */
  end() {
    if (this.getValue(ADD_SAMPLE_CONTENT_VAR)) {
      logNewLine('Adding sample content');

      this.composeWith(require.resolve('../collection'), {
        [COLLECTION_NAME_VAR]: COLLECTION_NAME_SAMPLE,
        [COLLECTION_DESCRIPTION_VAR]: COLLECTION_DESCRIPTION_SAMPLE,

        [FRAGMENT_NAME_VAR]: FRAGMENT_NAME_SAMPLE,
        [FRAGMENT_DESCRIPTION_VAR]: FRAGMENT_DESCRIPTION_SAMPLE,
        [FRAGMENT_COLLECTION_SLUG_VAR]: COLLECTION_SLUG_SAMPLE
      });
    }

    setTimeout(() => {
      logNewLine('Done!');
      log("You're ready to create fragments.");
    }, 100);
  }

  /**
   * Logs a welcome message to the console.
   */
  _logWelcome() {
    log(`
    __    ____________________  _____  __
    / /   /  _/ ____/ ____/ __ \\/   \\ \\/ /
  / /    / // /_  / __/ / /_/ / /| |\\  /
  / /____/ // __/ / /___/ _, _/ ___ |/ /
/_____/___/_/   /_____/_/ |_/_/  |_/_/
    `);
  }
}

module.exports = AppGenerator;
