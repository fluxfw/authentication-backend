/** @typedef {import("http/src/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("http/src/Server/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */
/** @typedef {import("./UserInfo.mjs").UserInfo} UserInfo */

/**
 * @interface
 */
export class AuthenticationBackend {
    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | UserInfo>}
     * @abstract
     */
    handleAuthentication(request) { }
}
