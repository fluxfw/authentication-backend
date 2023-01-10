/** @typedef {import("../../Service/Authentication/Port/AuthenticationService.mjs").AuthenticationService} AuthenticationService */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Request/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Response/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */

export class AuthenticationBackendApi {
    /**
     * @type {AuthenticationService | null}
     */
    #authentication_service = null;
    /**
     * @type {string | null}
     */
    #open_id_connect_rest_api_url;
    /**
     * @type {Map}
     */
    #user_infos_cache;

    /**
     * @param {string | null} open_id_connect_rest_api_url
     * @returns {AuthenticationBackendApi}
     */
    static new(open_id_connect_rest_api_url = null) {
        return new this(
            open_id_connect_rest_api_url
        );
    }

    /**
     * @param {string | null} open_id_connect_rest_api_url
     * @private
     */
    constructor(open_id_connect_rest_api_url) {
        this.#open_id_connect_rest_api_url = open_id_connect_rest_api_url;
        this.#user_infos_cache = new Map();
    }

    /**
     * @param {HttpServerRequest} request
     * @param {string} authentication_base_route
     * @param {string} api_route
     * @param {string} authentication_success_url
     * @returns {Promise<HttpServerResponse | null>}
     */
    async handleAuthentication(request, authentication_base_route, api_route, authentication_success_url) {
        return (await this.#getAuthenticationService()).handleAuthentication(
            request,
            authentication_base_route,
            api_route,
            authentication_success_url
        );
    }

    /**
     * @returns {Promise<AuthenticationService>}
     */
    async #getAuthenticationService() {
        this.#authentication_service ??= (await import("../../Service/Authentication/Port/AuthenticationService.mjs")).AuthenticationService.new(
            this.#user_infos_cache,
            this.#open_id_connect_rest_api_url
        );

        return this.#authentication_service;
    }
}
