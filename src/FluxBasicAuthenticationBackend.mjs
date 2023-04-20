import { AUTHORIZATION_SCHEMA_BASIC } from "../../flux-http-api/src/Authorization/AUTHORIZATION_SCHEMA.mjs";
import { HttpServerResponse } from "../../flux-http-api/src/Server/HttpServerResponse.mjs";
import { STATUS_CODE_400, STATUS_CODE_403 } from "../../flux-http-api/src/Status/STATUS_CODE.mjs";

/** @typedef {import("./FluxAuthenticationBackend.mjs").FluxAuthenticationBackend} FluxAuthenticationBackend */
/** @typedef {import("../../flux-http-api/src/FluxHttpApi.mjs").FluxHttpApi} FluxHttpApi */
/** @typedef {import("../../flux-http-api/src/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("./UserInfo.mjs").UserInfo} UserInfo */

/**
 * @implements {FluxAuthenticationBackend}
 */
export class FluxBasicAuthenticationBackend {
    /**
     * @type {FluxHttpApi}
     */
    #flux_http_api;
    /**
     * @type {{[key: string]: string}}
     */
    #users;

    /**
     * @param {FluxHttpApi} flux_http_api
     * @param {{[key: string]: string}} users
     * @returns {FluxBasicAuthenticationBackend}
     */
    static new(flux_http_api, users) {
        return new this(
            flux_http_api,
            users
        );
    }

    /**
     * @param {FluxHttpApi} flux_http_api
     * @param {{[key: string]: string}} users
     * @private
     */
    constructor(flux_http_api, users) {
        this.#flux_http_api = flux_http_api;
        this.#users = users;
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | UserInfo>}
     */
    async handleAuthentication(request) {
        const authorization_parameters = await this.#flux_http_api.getAuthorizationParameters(
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
