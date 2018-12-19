const CustomGenerator = require('../../utils/custom-generator');
const {log, logNewLine} = require('../../utils/log');
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
	FRAGMENT_TYPE_DEFAULT,
	FRAGMENT_TYPE_VAR,
	PROJECT_NAME_DEFAULT,
	PROJECT_NAME_MESSAGE,
	PROJECT_NAME_VAR,
	PROJECT_SLUG_VAR,
} = require('../../utils/constants');

/**
 * Generates a new project
 */
class AppGenerator extends CustomGenerator {
	/**
	 * @inheritdoc
	 */
	async prompting() {
		this._logWelcome();

		await this.ask([
			{
				type: 'input',
				name: PROJECT_NAME_VAR,
				message: PROJECT_NAME_MESSAGE,
				default: PROJECT_NAME_DEFAULT,
			},
			{
				type: 'confirm',
				name: ADD_SAMPLE_CONTENT_VAR,
				message: ADD_SAMPLE_CONTENT_MESSAGE,
				default: ADD_SAMPLE_CONTENT_DEFAULT,
			},
		]);

		this.setValue(
			PROJECT_SLUG_VAR,
			voca.slugify(this.getValue(PROJECT_NAME_VAR))
		);

		this.isRequired(PROJECT_SLUG_VAR);

		this.destinationRoot(
			this.destinationPath(
				this.getValue(PROJECT_SLUG_VAR)
			)
		);
	}

	/**
   	 * @inheritdoc
   	 */
	writing() {
		logNewLine('Creating directory');

		this.copyTemplates(this.destinationRoot(), [
			'.editorconfig',
			'.gitignore',
			'.yo-rc.json',
			'package.json',
			'README.md',
		]);
	}

	/**
	 * @inheritdoc
	 */
	install() {
		logNewLine('Installing dependencies');

		this.npmInstall(['yo', 'generator-liferay-fragments'], {
			loglevel: 'silent',
			progress: false,
			saveDev: true,
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
				[FRAGMENT_TYPE_VAR]: FRAGMENT_TYPE_DEFAULT,
				[FRAGMENT_COLLECTION_SLUG_VAR]: COLLECTION_SLUG_SAMPLE,
			});
		}

		setTimeout(() => {
			logNewLine('Done!');
			log('You\'re ready to create fragments.');
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
