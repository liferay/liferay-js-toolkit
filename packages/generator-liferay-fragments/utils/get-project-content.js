const fs = require('fs');
const glob = require('glob');
const path = require('path');

/**
 * Get a list of project collections from a given basePath
 * @param {@string} basePath Base path
 * @return {Array<{slug: string, metadata: Object, fragments: Array}>} Collections
 */
function _getProjectCollections(basePath) {
  return glob
    .sync(path.join(basePath, 'src', '*', 'collection.json'))
    .map(collectionJSON => path.resolve(collectionJSON, '..'))
    .map(directory => {
      const metadata = require(path.resolve(directory, 'collection.json'));
      const fragments = _getCollectionFragments(directory);

      return {
        slug: path.basename(directory),
        metadata,
        fragments
      };
    });
}

/**
 * Get a list of fragments from a given collection directory
 * @param {string} collectionDirectory Collection directory
 * @return {Array<{slug: string, metadata: Object, html: string, css: string, js: string}>}} Fragments
 */
function _getCollectionFragments(collectionDirectory) {
  return glob
    .sync(path.join(collectionDirectory, '*', 'fragment.json'))
    .map(fragmentJSON => path.resolve(fragmentJSON, '..'))
    .map(directory => {
      const metadata = require(path.resolve(directory, 'fragment.json'));

      return {
        slug: path.basename(directory),
        metadata,

        html: fs.readFileSync(
          path.resolve(directory, metadata.htmlPath),
          'utf-8'
        ),

        css: fs.readFileSync(
          path.resolve(directory, metadata.cssPath),
          'utf-8'
        ),

        js: fs.readFileSync(path.resolve(directory, metadata.jsPath), 'utf-8')
      };
    });
}

/**
 * Gets a project definition from a given basePath
 * @param {string} basePath Base path
 * @return {{project: Object, collections: Array<Object>}} Project
 */
function getProjectContent(basePath) {
  return {
    project: require(path.join(basePath, 'package.json')),
    collections: _getProjectCollections(basePath)
  };
}

module.exports = getProjectContent;
