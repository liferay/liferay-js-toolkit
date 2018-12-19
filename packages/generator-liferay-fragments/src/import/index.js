const chokidar = require('chokidar');
const path = require('path');
const api = require('../../utils/api');
const CustomGenerator = require('../../utils/custom-generator');
const getProjectContent = require('../../utils/get-project-content');
const importProject = require('./import');
const {log, logData, logNewLine, logError} = require('../../utils/log');

const {
	IMPORT_WATCH_VAR,
	LIFERAY_COMPANYID_MESSAGE,
	LIFERAY_COMPANYID_VAR,
	LIFERAY_GROUPID_MESSAGE,
	LIFERAY_GROUPID_VAR,
	LIFERAY_HOST_DEFAULT,
	LIFERAY_HOST_MESSAGE,
	LIFERAY_HOST_VAR,
	LIFERAY_PASSWORD_DEFAULT,
	LIFERAY_PASSWORD_MESSAGE,
	LIFERAY_PASSWORD_VAR,
	LIFERAY_USERNAME_DEFAULT,
	LIFERAY_USERNAME_MESSAGE,
	LIFERAY_USERNAME_VAR,
} = require('../../utils/constants');

module.exports = class extends CustomGenerator {
	/**
	 * Sets optional arguments
	 * @param  {...any} args
	 */
	constructor(...args) {
		super(...args);
		this.argument(IMPORT_WATCH_VAR, {type: Boolean, required: false});
	}

	/**
	 * @inheritdoc
	 */
	async asking() {
		this._api = api;

		await this._askHostData();
		await this._askSiteData();

		if (this.getValue(IMPORT_WATCH_VAR)) {
			await this._watchChanges();
		} else {
			await this._importProject();
		}
	}

	/**
	 * Requests host information and tries to connect
	 */
	async _askHostData() {
		this.setValue(LIFERAY_HOST_VAR, LIFERAY_HOST_DEFAULT);
		this.setValue(LIFERAY_USERNAME_VAR, LIFERAY_USERNAME_DEFAULT);
		this.setValue(LIFERAY_PASSWORD_VAR, LIFERAY_PASSWORD_DEFAULT);

		await this.ask([
			{
				type: 'input',
				name: LIFERAY_HOST_VAR,
				message: LIFERAY_HOST_MESSAGE,
				default: this.getValue(LIFERAY_HOST_VAR),
			},
			{
				type: 'input',
				name: LIFERAY_USERNAME_VAR,
				message: LIFERAY_USERNAME_MESSAGE,
				default: this.getValue(LIFERAY_USERNAME_VAR),
			},
			{
				type: 'password',
				name: LIFERAY_PASSWORD_VAR,
				message: LIFERAY_PASSWORD_MESSAGE,
			},
		]);

		logNewLine('Checking connection...');

		try {
			this._wrapApi();
			await this._checkConnection();
		} catch (error) {
			logError(
				'Connection unsuccessful,\n' +
          'please check your host information.\n\n' +
          `${error.toString()}\n`
			);

			return this._askHostData();
		}

		log('Connection successful\n');
	}

	/**
	 * Request site information
	 */
	async _askSiteData() {
		this._companyChoices = await this._getCompanyChoices();

		await this.ask([
			{
				type: 'list',
				name: LIFERAY_COMPANYID_VAR,
				message: LIFERAY_COMPANYID_MESSAGE,
				choices: this._companyChoices,
				default: this.getValue(LIFERAY_COMPANYID_VAR),
			},
		]);

		this._groupChoices = await this._getGroupChoices();

		await this.ask([
			{
				type: 'list',
				name: LIFERAY_GROUPID_VAR,
				message: LIFERAY_GROUPID_MESSAGE,
				choices: this._groupChoices,
				default: this.getValue(LIFERAY_GROUPID_VAR),
			},
		]);
	}

	/**
	 * Tests connection with liferay server
	 * @return {Promise<Object>} Response content or connection error
	 */
	async _checkConnection() {
		const response = await this._api('/user/get-current-user');

		if (response.status >= 400) {
			throw new Error(`${response.status}\n${await response.body}`);
		}

		return JSON.parse(response.body);
	}

	/**
	 * Return a list of companies
	 * @return {Array<Object>} List of choices
	 */
	async _getCompanyChoices() {
		const response = await this._api('/company/get-companies');
		const companies = JSON.parse(response.body);

		return companies.map(company => ({
			name: company.webId,
			value: company.companyId,
		}));
	}

	/**
	 * Return a list of companies
	 * @return {Array<Object>} List of choices
	 */
	async _getGroupChoices() {
		const companyId = this.getValue(LIFERAY_COMPANYID_VAR);
		const response = await this._api(
			`/group/get-groups/company-id/${companyId}/parent-group-id/0/site/true`
		);

		const groups = JSON.parse(response.body);

		return groups.map(group => ({
			name: group.descriptiveName,
			value: group.groupId,
		}));
	}

	/**
	 * Performs a project import
	 * @return {Promise} Promise resolved when import has finished
	 */
	_importProject() {
		return importProject(
			this._api,
			this.getValue(LIFERAY_GROUPID_VAR),
			getProjectContent(this.destinationPath())
		);
	}

	/**
	 * Watches changes inside project and runs an import
	 * process for any change.
	 * @return {Promise} Promise returned by this methos is never resolved,
	 *  so you can wait for an infinite process until user cancels
	 *  it.
	 */
	_watchChanges() {
		const watchPath = path.resolve(this.destinationPath(), 'src');
		const host = this.getValue(LIFERAY_HOST_VAR);
		const user = this.getValue(LIFERAY_USERNAME_VAR);
		const groupId = this.getValue(LIFERAY_GROUPID_VAR);
		const group = this._groupChoices.find(group => group.value === groupId);
		const companyId = this.getValue(LIFERAY_COMPANYID_VAR);
		const company = this._companyChoices.find(
			company => company.value === companyId
		);

		let updatePromise = Promise.resolve();
		let queuedUpdate = false;

		return new Promise(() =>
			chokidar.watch(watchPath).on('all', async () => {
				if (!queuedUpdate) {
					queuedUpdate = true;
					await updatePromise;

					// eslint-disable-next-line no-console
					console.clear();
					log(`Watching changes in ${watchPath}`);
					log('Press Ctrl+C to stop watching\n');
					logData('Host', host);
					logData('User', user);
					logData('Company', company.name);
					logData('Group', group.name);

					queuedUpdate = false;
					updatePromise = this._importProject();
				}
			})
		);
	}

	/**
	 * Wraps API calls with current host and user information
	 */
	_wrapApi() {
		const user = this.getValue(LIFERAY_USERNAME_VAR);
		const pass = this.getValue(LIFERAY_PASSWORD_VAR);

		this._api = api.wrap(
			this.getValue(LIFERAY_HOST_VAR),
			Buffer.from(`${user}:${pass}`).toString('base64')
		);
	}
};
