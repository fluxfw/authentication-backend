/** @typedef {import("../AuthenticationImplementation/AuthenticationImplementation.mjs").AuthenticationImplementation} AuthenticationImplementation */
/** @typedef {import("../../Service/Authentication/Port/AuthenticationService.mjs").AuthenticationService} AuthenticationService */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */

export class AuthenticationBackendApi {
    /**
     * @type {AuthenticationImplementation}
     */
    #authentication_implementation;
    /**
     * @type {AuthenticationService | null}
     */
    #authentication_service = null;

    /**
     * @param {AuthenticationImplementation} authentication_implementation
     * @returns {AuthenticationBackendApi}
     */
    static new(authentication_implementation) {
        return new this(
            authentication_implementation
        );
    }

    /**
     * @param {AuthenticationImplementation} authentication_implementation
     * @private
     */
    constructor(authentication_implementation) {
        this.#authentication_implementation = authentication_implementation;
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | null>}
     */
    async handleAuthentication(request) {
        return (await this.#getAuthenticationService()).handleAuthentication(
            request
        );
    }

    /**
     * @returns {Promise<AuthenticationService>}
     */
    async #getAuthenticationService() {
        this.#authentication_service ??= (await import("../../Service/Authentication/Port/AuthenticationService.mjs")).AuthenticationService.new(
            this.#authentication_implementation
        );

        return this.#authentication_service;
    }
}
