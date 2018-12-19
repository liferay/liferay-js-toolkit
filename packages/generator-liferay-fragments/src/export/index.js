const api = require('../../utils/api');
const CustomGenerator = require('../../utils/custom-generator');
const getProjectContent = require('../../utils/get-project-content');
const exportCollections = require('./export');
const {log, logNewLine, logError} = require('../../utils/log');

const {
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
	 * @inheritdoc
	 */
	async asking() {
		this._api = api;

		await this._askHostData();
		await this._askSiteData();

		await exportCollections(
			this._api,
			this.getValue(LIFERAY_GROUPID_VAR),
			getProjectContent(this.destinationPath())
		);
	}

	/**
	 * Requests host information and tries to connect
	 * @return {Promise}
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
		await this.ask([
			{
				type: 'list',
				name: LIFERAY_COMPANYID_VAR,
				message: LIFERAY_COMPANYID_MESSAGE,
				choices: await this._getCompanyChoices(),
				default: this.getValue(LIFERAY_COMPANYID_VAR),
			},
		]);

		await this.ask([
			{
				type: 'list',
				name: LIFERAY_GROUPID_VAR,
				message: LIFERAY_GROUPID_MESSAGE,
				choices: await this._getGroupChoices(),
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
