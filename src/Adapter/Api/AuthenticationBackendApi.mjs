/** @typedef {import("../../Service/Authentication/Port/AuthenticationService.mjs").AuthenticationService} AuthenticationService */
/** @typedef {import("../../../../../flux-http-api/src/Adapter/Api/HttpApi.mjs").HttpApi} HttpApi */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Request/HttpRequest.mjs").HttpRequest} HttpRequest */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Response/HttpResponse.mjs").HttpResponse} HttpResponse */

export class AuthenticationBackendApi {
    /**
     * @type {AuthenticationService | null}
     */
    #authentication_service = null;
    /**
     * @type {HttpApi}
     */
    #http_api;
    /**
     * @type {string | null}
     */
    #open_id_connect_rest_api_url;
    /**
     * @type {Map}
     */
    #user_infos_cache;

    /**
     * @param {HttpApi} http_api
     * @param {string | null} open_id_connect_rest_api_url
     * @returns {AuthenticationBackendApi}
     */
    static new(http_api, open_id_connect_rest_api_url = null) {
        return new this(
            http_api,
            open_id_connect_rest_api_url
        );
    }

    /**
     * @param {HttpApi} http_api
     * @param {string | null} open_id_connect_rest_api_url
     * @private
     */
    constructor(http_api, open_id_connect_rest_api_url) {
        this.#http_api = http_api;
        this.#open_id_connect_rest_api_url = open_id_connect_rest_api_url;
        this.#user_infos_cache = new Map();
    }

    /**
     * @param {HttpRequest} request
     * @param {string} authentication_base_route
     * @param {string} api_route
     * @param {string} authentication_success_url
     * @returns {Promise<HttpResponse | null>}
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
            this.#http_api,
            this.#user_infos_cache,
            this.#open_id_connect_rest_api_url
        );

        return this.#authentication_service;
    }
}
