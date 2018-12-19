const Generator = require('yeoman-generator');
const path = require('path');

/**
 * Custom Generator that extends Yeoman's Generator class
 * adding extra shortcuts.
 *
 * It maintains a three objects with the information collected from users:
 * - this.options: Given by yeoman, console parameters
 * - this.defaultValues: Initially empty, may be overriden with setValue method,
 *   values used if there is no answer and no option has been given.
 * - this.answers: Initially empty, it is filled with the answers given
 *   by asking questions.
 *
 * @see Generator
 */
class CustomGenerator extends Generator {
	/**
	 * Initializes defaultValues and answers and calls
	 * yeoman generator
	 * @param  {...any} args
	 */
	constructor(...args) {
		super(...args);
		this.defaultValues = {};
		this.answers = {};
	}

	/**
	 * Prompts the given question(s) to the user and merges
	 * the response with this.answers object.
	 * @param {object|object[]} question Any valid yeoman question(s)
	 * @return {Promise<object>} Merged answers
	 */
	async ask(question) {
		const answers = await this.prompt(question);
		this.answers = Object.assign({}, this.answers, answers);
		return this.answers;
	}

	/**
	 * Copies the given file to the given destination, using
	 * this.templatePath and this.destinationPath internally.
	 * @param {*} filePath File path
	 * @param {*} destinationPath Destination path
	 */
	copyFile(filePath, destinationPath) {
		this.fs.copy(
			this.templatePath(filePath),
			this.destinationPath(destinationPath)
		);
	}

	/**
	 * Copy a set of files to a basePath.
	 * `[filePath]` -> `[basePath]/[filePath]`
	 * @param {string} basePath Basepath where templates will be copied
	 * @param {string[]} filePaths List of templates to be copied
	 */
	copyFiles(basePath, filePaths) {
		filePaths.forEach(filePath =>
			this.copyFile(filePath, path.join(basePath, filePath))
		);
	}

	/**
	 * Copies the given template to the given destination, using
	 * this.templatePath and this.destinationPath internally.
	 * All templates receive the data collected from this generator.
	 * @param {*} templatePath Template path
	 * @param {*} destinationPath Destination path
	 */
	copyTemplate(templatePath, destinationPath) {
		this.fs.copyTpl(
			this.templatePath(templatePath),
			this.destinationPath(destinationPath),
			Object.assign({}, this.defaultValues, this.options, this.answers)
		);
	}

	/**
	 * Copy a set of templates to a basePath.
	 * For each template path produces the following transformation
	 * `[templatePath].ejs` -> `[basePath]/[templatePath]`
	 * @param {string} basePath Basepath where templates will be copied
	 * @param {string[]} templatePaths List of templates to be copied
	 */
	copyTemplates(basePath, templatePaths) {
		templatePaths.forEach(templatePath =>
			this.copyTemplate(
				`${templatePath}.ejs`,
				path.join(basePath, templatePath)
			)
		);
	}

	/**
	 * Returns a value for the given key, looking in answers, then options and
	 * finally defaultValues.
	 * @param {string} key Value key
	 * @return {*} Found value, undefined if none
	 */
	getValue(key) {
		return this.answers[key] ||
      this.options[key] ||
      this.defaultValues[key];
	}

	/**
	 * Returns if value for the given key is setted either in answers, or options
	 * or defaultValues.
	 * @param {string} key Value key
	 * @return {boolean} Wether the value is defined or not
	 */
	hasValue(key) {
		return key in this.answers ||
      key in this.options ||
      key in this.defaultValues;
	}

	/**
	 * Checks if the given variable is available and stops generator
	 * execution if not.
	 * @param {string} variable Variable name
	 */
	isRequired(variable) {
		if (!this.getValue(variable) || !this.getValue(variable).trim()) {
			this.env.error(`${variable} is required`);
		}
	}

	/**
	 * Stores the given value inside the given key inside defaultOptions
	 * @param {string} key Value key
	 * @param {*} value Value
	 */
	setValue(key, value) {
		this.defaultValues[key] = value;
	}
}

module.exports = CustomGenerator;
