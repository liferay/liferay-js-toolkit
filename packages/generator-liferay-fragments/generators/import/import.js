const { logData, logNewLine } = require('../../utils/log');

/**
 * Imports current project to Liferay server
 * @param {function} api Wrapped API with valid host and authorization
 * @param {string} groupId Group ID
 * @param {Object} project Local project description
 */
async function importProject(api, groupId, project) {
  logData('\nImporting project', project.project.name);

  await Promise.all(
    project.collections.map(collection =>
      _importCollection(api, groupId, collection)
    )
  );

  logNewLine('Project sent successfully');
}

/**
 * Checks if the given existingFragment is outdated comparing
 * with the given fragment.
 * @param {object} existingFragment Server fragment
 * @param {object} fragment Local fragment
 * @return {boolean} True if it has any new change
 */
function _fragmentHasChanges(existingFragment, fragment) {
  const hasChanges =
    fragment.css !== existingFragment.css ||
    fragment.html !== existingFragment.html ||
    fragment.js !== existingFragment.js ||
    fragment.metadata.name !== existingFragment.name;

  if (!hasChanges) {
    logData('Up-to-date', fragment.metadata.name);
  }

  return hasChanges;
}

/**
 * Imports a collection to server
 * @param {function} api Wrapped API with valid host and authorization
 * @param {string} groupId Group ID
 * @param {Object} collection Collection
 */
async function _importCollection(api, groupId, collection) {
  logData('Importing collection', collection.metadata.name);

  let existingCollection;

  try {
    await api('/fragment.fragmentcollection/add-fragment-collection', {
      groupId,
      fragmentCollectionKey: collection.slug,
      name: collection.metadata.name,
      description: collection.metadata.description
    });

    existingCollection = await _getExistingCollection(api, groupId, collection);
  } catch (error) {
    existingCollection = await _getExistingCollection(api, groupId, collection);

    await api(
      '/fragment.fragmentcollection/update-fragment-collection',
      {
        fragmentCollectionId: existingCollection.fragmentCollectionId,
        name: collection.metadata.name,
        description: collection.metadata.description
      },
      { method: 'POST' }
    );
  }

  await Promise.all(
    collection.fragments.map(fragment =>
      _importFragment(api, groupId, existingCollection, fragment)
    )
  );
}

/**
 * Imports a given fragment to Liferay server
 * @param {function} api Wrapped API with valid host and authorization
 * @param {string} groupId Group ID
 * @param {object} existingCollection Collection
 * @param {object} fragment Fragment
 */
async function _importFragment(api, groupId, existingCollection, fragment) {
  try {
    await api('/fragment.fragmententry/add-fragment-entry', {
      groupId,
      fragmentCollectionId: existingCollection.fragmentCollectionId,
      fragmentEntryKey: fragment.slug,
      name: fragment.metadata.name,
      css: fragment.css,
      html: fragment.html,
      js: fragment.js,
      status: 0
    });

    logData('Added', fragment.metadata.name);
  } catch (error) {
    const existingFragment = await _getExistingFragment(
      api,
      groupId,
      existingCollection,
      fragment
    );

    if (_fragmentHasChanges(existingFragment, fragment)) {
      await api('/fragment.fragmententry/update-fragment-entry', {
        fragmentEntryId: existingFragment.fragmentEntryId,
        name: fragment.metadata.name,
        html: fragment.html,
        css: fragment.css,
        js: fragment.js,
        status: existingFragment.status
      });

      logData('Updated', fragment.metadata.name);
    }
  }
}

/**
 * Gets an existing collection from server
 * @param {function} api Wrapped API with valid host and authorization
 * @param {string} groupId Group ID
 * @param {Object} collection Local collection
 */
async function _getExistingCollection(api, groupId, collection) {
  const response = await api(
    '/fragment.fragmentcollection/get-fragment-collections',
    {
      name: collection.metadata.name,
      groupId
    }
  );

  const existingCollections = JSON.parse(response.body);

  return existingCollections.find(
    existingCollection => existingCollection.name === collection.metadata.name
  );
}

/**
 * Gets an existing fragment from server
 * @param {function} api Wrapped API with valid host and authorization
 * @param {string} groupId Group ID
 * @param {Object} existingCollection Existing collection
 * @param {Object} fragment Local fragment
 */
async function _getExistingFragment(
  api,
  groupId,
  existingCollection,
  fragment
) {
  const response = await api('/fragment.fragmententry/get-fragment-entries', {
    fragmentCollectionId: existingCollection.fragmentCollectionId,
    name: fragment.metadata.name,
    groupId
  });

  const existingFragments = JSON.parse(response.body);

  return existingFragments.find(
    existingFragment => existingFragment.name === fragment.metadata.name
  );
}

module.exports = importProject;
