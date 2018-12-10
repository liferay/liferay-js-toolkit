const util = require('util');
const request = require('request');

/**
 * Sends a HTTP request to liferay host api url
 * @param {object} [options={}] request options
 * @param {string} options.url request options
 * @return {Promise<response>} Request response
 */
const api = async (options = {}) => {
  const promiseRequest = util.promisify(request);
  const response = await promiseRequest(options);

  if (response.status >= 400) {
    throw response;
  } else {
    let responseBody = {};

    try {
      responseBody = JSON.parse(response.body);
    } catch (error) {}

    if (responseBody.exception) {
      throw new Error(responseBody.exception);
    }

    if (responseBody.error) {
      throw new Error(responseBody.error);
    }
  }

  return response;
};

/**
 * Performs a wrapped API call and returns the result
 * @param {string} host Liferay host
 * @param {string} auth Basic auth string
 * @param {string} path API method path
 * @param {Object} formData Form data
 * @param {Object} options Request options
 * @param {string} [options.method='GET'] HTTP method
 * @return {Promise} Request result promise
 */
api.wrap = (host, auth) => (path, formData, options = { method: 'GET' }) => {
  const method = options ? options.method || 'GET' : 'GET';

  return api(
    Object.assign(
      {
        url: `${host}/api/jsonws${path}`,
        headers: { Authorization: `Basic ${auth}` },
        formData
      },
      Object.assign({}, options, { method })
    )
  );
};

module.exports = api;
