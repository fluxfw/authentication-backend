/** @typedef {import("express")} express */

export class AuthenticationService {
    /**
     * @type {string | null}
     */
    #open_id_connect_rest_api_url;

    /**
     * @param {string | null} open_id_connect_rest_api_url
     * @returns {AuthenticationService}
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
        return (await import("../Command/GetAuthenticationRouterCommand.mjs")).GetAuthenticationRouterCommand.new(
            this.#open_id_connect_rest_api_url
        )
            .getAuthenticationRouter(
                authentication_base_route,
                protect_route,
                authentication_success_url
            );
    }
}
