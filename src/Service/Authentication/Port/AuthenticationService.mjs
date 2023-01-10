/** @typedef {import("../../../../../flux-http-api/src/Adapter/Request/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("../../../../../flux-http-api/src/Adapter/Response/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */

export class AuthenticationService {
    /**
     * @type {string | null}
     */
    #open_id_connect_rest_api_url;
    /**
     * @type {Map}
     */
    #user_infos_cache;

    /**
     * @param {Map} user_infos_cache
     * @param {string | null} open_id_connect_rest_api_url
     * @returns {AuthenticationService}
     */
    static new(user_infos_cache, open_id_connect_rest_api_url = null) {
        return new this(
            user_infos_cache,
            open_id_connect_rest_api_url
        );
    }

    /**
     * @param {Map} user_infos_cache
     * @param {string | null} open_id_connect_rest_api_url
     * @private
     */
    constructor(user_infos_cache, open_id_connect_rest_api_url) {
        this.#user_infos_cache = user_infos_cache;
        this.#open_id_connect_rest_api_url = open_id_connect_rest_api_url;
    }

    /**
     * @param {HttpServerRequest} request
     * @param {string} authentication_base_route
     * @param {string} api_route
     * @param {string} authentication_success_url
     * @returns {Promise<HttpServerResponse | null>}
     */
    async handleAuthentication(request, authentication_base_route, api_route, authentication_success_url) {
        return (await import("../Command/HandleAuthenticationCommand.mjs")).HandleAuthenticationCommand.new(
            this.#user_infos_cache,
            this.#open_id_connect_rest_api_url
        )
            .handleAuthentication(
                request,
                authentication_base_route,
                api_route,
                authentication_success_url
            );
    }
}
