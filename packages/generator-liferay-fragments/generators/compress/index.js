const compress = require('./compress');
const CustomGenerator = require('../../utils/custom-generator');

module.exports = class extends CustomGenerator {
  /**
   * @inheritdoc
   */
  async writting() {
    await compress(this.destinationPath());
  }
};
