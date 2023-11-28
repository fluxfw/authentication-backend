/** @typedef {import("../../flux-http/src/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("../../flux-http/src/Server/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */
/** @typedef {import("./UserInfo.mjs").UserInfo} UserInfo */

/**
 * @interface
 */
export class FluxAuthenticationBackend {
    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | UserInfo>}
     * @abstract
     */
    handleAuthentication(request) { }
}
