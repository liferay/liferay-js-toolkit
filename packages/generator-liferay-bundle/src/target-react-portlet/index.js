import Generator from 'yeoman-generator';

/**
 * Generator for React portlets.
 */
export default class extends Generator {
	/**
	 * Standard Yeoman initialization function
	 */
	initializing() {
		this.composeWith(require.resolve('../facet-project'));
		this.composeWith(require.resolve('../facet-localization'));
		this.composeWith(require.resolve('../facet-settings'));
		this.composeWith(require.resolve('../facet-portlet'));
		this.composeWith(require.resolve('../facet-deploy'));
		this.composeWith(require.resolve('../facet-start'));
		this.composeWith(require.resolve('./react'));
	}

	/**
	 * Standard Yeoman dependencies installation function
	 */
	install() {
		this.installDependencies({
			bower: false,
		});
	}
}
