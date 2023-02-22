/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */
/** @typedef {import("../UserInfo/UserInfo.mjs").UserInfo} UserInfo */

/**
 * @interface
 */
export class AuthenticationImplementation {
    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | UserInfo>}
     * @abstract
     */
    handleAuthentication(request) { }
}
