const fs = require('fs');
const { logData, logNewLine } = require('../../utils/log');

/**
 * Exports existing collections from Liferay server to the current project
 * @param {function} api Wrapped API with valid host and authorization
 * @param {string} groupId Group ID
 * @param {Object} project Project object
 */
async function exportCollections(api, groupId, project) {
  logData('\nExporting collections to', project.project.name);

  const response = await api(
    '/fragment.fragmentcollection/get-fragment-collections',
    {
      start: -1,
      end: -1,
      groupId
    }
  );

  const collections = JSON.parse(response.body);

  await Promise.all(
    collections.map(collection =>
      _exportCollection(api, groupId, collection, project.basePath)
    )
  );

  logNewLine('Collections exported successfully');
}

/**
 * Exports a collection from server
 * @param {function} api Wrapped API with valid host and authorization
 * @param {string} groupId Group ID
 * @param {Object} collection Collection
 * @param {string} basePath Project directory
 */
async function _exportCollection(api, groupId, collection, basePath) {
  logData('Exporting collection', collection.name);

  const collectionJSON = {
    name: collection.name,
    description: collection.description
  };

  const collectionDirectory = `${basePath}/src/${
    collection.fragmentCollectionKey
  }`;

  if (!fs.existsSync(collectionDirectory)) {
    fs.mkdirSync(collectionDirectory);
  }

  fs.writeFileSync(
    `${collectionDirectory}/collection.json`,
    JSON.stringify(collectionJSON)
  );

  const response = await api('/fragment.fragmententry/get-fragment-entries', {
    fragmentCollectionId: collection.fragmentCollectionId,
    status: 0,
    start: -1,
    end: -1,
    groupId
  });

  const fragments = JSON.parse(response.body);

  await Promise.all(
    fragments.map(fragment => _exportFragment(collection, fragment, basePath))
  );
}

/**
 * Exports a given fragment from Liferay server
 * @param {object} collection Collection
 * @param {object} fragment Fragment
 * @param {string} basePath Project directory
 */
async function _exportFragment(collection, fragment, basePath) {
  logData('Exporting fragment', fragment.name);

  let fragmentJSON = {
    cssPath: 'styles.css',
    htmlPath: 'index.html',
    jsPath: 'main.js',
    name: fragment.name
  };

  const fragmentDirectory = `${basePath}/src/${
    collection.fragmentCollectionKey
  }/${fragment.fragmentEntryKey}`;

  if (!fs.existsSync(fragmentDirectory)) {
    fs.mkdirSync(fragmentDirectory);
  } else if (fs.existsSync(`${fragmentDirectory}/fragment.json`)) {
    fragmentJSON = JSON.parse(
      fs.readFileSync(`${fragmentDirectory}/fragment.json`)
    );
  }

  fs.writeFileSync(
    `${fragmentDirectory}/${fragmentJSON.cssPath}`,
    fragment.css
  );

  fs.writeFileSync(
    `${fragmentDirectory}/${fragmentJSON.htmlPath}`,
    fragment.html
  );

  fs.writeFileSync(`${fragmentDirectory}/${fragmentJSON.jsPath}`, fragment.js);

  fs.writeFileSync(
    `${fragmentDirectory}/fragment.json`,
    JSON.stringify(fragmentJSON)
  );
}

module.exports = exportCollections;
