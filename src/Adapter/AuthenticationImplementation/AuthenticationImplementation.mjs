/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */

/**
 * @interface
 */
export class AuthenticationImplementation {
    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | null>}
     * @abstract
     */
    handleAuthentication(request) { }
}
