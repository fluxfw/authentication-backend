import { AUTHORIZATION_SCHEMA_BASIC } from "flux-http/src/Authorization/AUTHORIZATION_SCHEMA.mjs";
import { HttpServerResponse } from "flux-http/src/Server/HttpServerResponse.mjs";
import { STATUS_CODE_400, STATUS_CODE_403 } from "flux-http/src/Status/STATUS_CODE.mjs";

/** @typedef {import("./FluxAuthenticationBackend.mjs").FluxAuthenticationBackend} FluxAuthenticationBackend */
/** @typedef {import("flux-http/src/FluxHttp.mjs").FluxHttp} FluxHttp */
/** @typedef {import("flux-http/src/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("./UserInfo.mjs").UserInfo} UserInfo */

/**
 * @implements {FluxAuthenticationBackend}
 */
export class FluxBasicAuthenticationBackend {
    /**
     * @type {FluxHttp}
     */
    #flux_http;
    /**
     * @type {{[key: string]: string}}
     */
    #users;

    /**
     * @param {FluxHttp} flux_http
     * @param {{[key: string]: string}} users
     * @returns {FluxBasicAuthenticationBackend}
     */
    static new(flux_http, users) {
        return new this(
            flux_http,
            users
        );
    }

    /**
     * @param {FluxHttp} flux_http
     * @param {{[key: string]: string}} users
     * @private
     */
    constructor(flux_http, users) {
        this.#flux_http = flux_http;
        this.#users = users;
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | UserInfo>}
     */
    async handleAuthentication(request) {
        const authorization_parameters = await this.#flux_http.getAuthorizationParameters(
            request,
            AUTHORIZATION_SCHEMA_BASIC
        );

        if (authorization_parameters instanceof HttpServerResponse) {
            return authorization_parameters;
        }

        let parameters;
        try {
            parameters = atob(authorization_parameters);
        } catch (error) {
            console.error(error);

            return HttpServerResponse.text(
                "Invalid authorization parameters",
                STATUS_CODE_400
            );
        }

        if (!parameters.includes(":")) {
            return HttpServerResponse.text(
                "Invalid authorization parameters",
                STATUS_CODE_400
            );
        }

        const [
            user,
            ..._password
        ] = parameters.split(":");
        const password = _password.join(":");

        if (user === "" || password === "") {
            return HttpServerResponse.text(
                "Invalid authorization parameters",
                STATUS_CODE_400
            );
        }

        if (!Object.hasOwn(this.#users, user) || this.#users[user] !== password) {
            return HttpServerResponse.text(
                "No access",
                STATUS_CODE_403
            );
        }

        return {
            user
        };
    }
}
