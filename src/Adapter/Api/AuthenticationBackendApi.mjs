/** @typedef {import("../../Service/Authentication/Port/AuthenticationService.mjs").AuthenticationService} AuthenticationService */
/** @typedef {import("express")} express */

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
    }

    /**
     * @param {string} authentication_base_route
     * @param {string} protect_route
     * @param {string} authentication_success_url
     * @returns {Promise<express.Router>}
     */
    async getAuthenticationRouter(authentication_base_route, protect_route, authentication_success_url) {
        return (await this.#getAuthenticationService()).getAuthenticationRouter(
            authentication_base_route,
            protect_route,
            authentication_success_url
        );
    }

    /**
     * @returns {Promise<AuthenticationService>}
     */
    async #getAuthenticationService() {
        this.#authentication_service ??= (await import("../../Service/Authentication/Port/AuthenticationService.mjs")).AuthenticationService.new(
            this.#open_id_connect_rest_api_url
        );

        return this.#authentication_service;
    }
}
