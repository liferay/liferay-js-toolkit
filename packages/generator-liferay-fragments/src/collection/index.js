const CustomGenerator = require('../../utils/custom-generator');
const voca = require('voca');

const {
	COLLECTION_DESCRIPTION_DEFAULT,
	COLLECTION_DESCRIPTION_MESSAGE,
	COLLECTION_DESCRIPTION_VAR,
	COLLECTION_NAME_MESSAGE,
	COLLECTION_NAME_VAR,
	COLLECTION_SLUG_VAR,
	FRAGMENT_COLLECTION_SLUG_VAR,
	FRAGMENT_DESCRIPTION_VAR,
	FRAGMENT_NAME_VAR,
	FRAGMENT_TYPE_VAR,
} = require('../../utils/constants');

module.exports = class extends CustomGenerator {
	/**
	 * @inheritdoc
	 */
	async prompting() {
		await this.ask([
			{
				type: 'input',
				name: COLLECTION_NAME_VAR,
				message: COLLECTION_NAME_MESSAGE,
				when: !this.hasValue(COLLECTION_NAME_VAR),
			},
			{
				type: 'input',
				name: COLLECTION_DESCRIPTION_VAR,
				message: COLLECTION_DESCRIPTION_MESSAGE,
				when: !this.hasValue(COLLECTION_DESCRIPTION_VAR),
			},
		]);

		this.setValue(
			COLLECTION_DESCRIPTION_VAR,
			COLLECTION_DESCRIPTION_DEFAULT
		);

		this.setValue(
			COLLECTION_SLUG_VAR,
			voca.slugify(this.getValue(COLLECTION_NAME_VAR))
		);

		this.isRequired(COLLECTION_SLUG_VAR);
	}

	/**
	 * @inheritdoc
	 */
	writing() {
		this.copyTemplates(`src/${this.getValue(COLLECTION_SLUG_VAR)}`, [
			'collection.json',
		]);
	}

	/**
	 * @inheritdoc
	 */
	end() {
		const fragmentName = this.getValue(FRAGMENT_NAME_VAR);

		if (fragmentName) {
			const fragmentCollection = this.getValue(COLLECTION_SLUG_VAR);
			const fragmentDescription = this.getValue(FRAGMENT_DESCRIPTION_VAR);
			const fragmentType = this.getValue(FRAGMENT_TYPE_VAR);

			this.composeWith(require.resolve('../fragment'), {
				[FRAGMENT_NAME_VAR]: fragmentName,
				[FRAGMENT_DESCRIPTION_VAR]: fragmentDescription,
				[FRAGMENT_TYPE_VAR]: fragmentType,
				[FRAGMENT_COLLECTION_SLUG_VAR]: fragmentCollection,
			});
		}
	}
};
