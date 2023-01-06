/** @typedef {import("express")} express */
/** @typedef {import("../../../../../flux-http-api/src/Adapter/Api/HttpApi.mjs").HttpApi} HttpApi */

export class AuthenticationService {
    /**
     * @type {HttpApi}
     */
    #http_api;
    /**
     * @type {string | null}
     */
    #open_id_connect_rest_api_url;

    /**
     * @param {HttpApi} http_api
     * @param {string | null} open_id_connect_rest_api_url
     * @returns {AuthenticationService}
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
    }

    /**
     * @param {string} authentication_base_route
     * @param {string} protect_route
     * @param {string} authentication_success_url
     * @returns {Promise<express.Router>}
     */
    async getAuthenticationRouter(authentication_base_route, protect_route, authentication_success_url) {
        return (await import("../Command/GetAuthenticationRouterCommand.mjs")).GetAuthenticationRouterCommand.new(
            this.#http_api,
            this.#open_id_connect_rest_api_url
        )
            .getAuthenticationRouter(
                authentication_base_route,
                protect_route,
                authentication_success_url
            );
    }
}
