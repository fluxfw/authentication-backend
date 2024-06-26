import { AUTHORIZATION_SCHEMA_BASIC } from "http/src/Authorization/AUTHORIZATION_SCHEMA.mjs";
import { HttpServerResponse } from "http/src/Server/HttpServerResponse.mjs";
import { STATUS_CODE_400, STATUS_CODE_403 } from "http/src/Status/STATUS_CODE.mjs";

/** @typedef {import("./AuthenticationBackend.mjs").AuthenticationBackend} AuthenticationBackend */
/** @typedef {import("http/src/Http.mjs").Http} Http */
/** @typedef {import("http/src/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("./UserInfo.mjs").UserInfo} UserInfo */

/**
 * @implements {AuthenticationBackend}
 */
export class BasicAuthenticationBackend {
    /**
     * @type {Http}
     */
    #http;
    /**
     * @type {{[key: string]: string}}
     */
    #users;

    /**
     * @param {Http} http
     * @param {{[key: string]: string}} users
     * @returns {Promise<BasicAuthenticationBackend>}
     */
    static async new(http, users) {
        return new this(
            http,
            users
        );
    }

    /**
     * @param {Http} http
     * @param {{[key: string]: string}} users
     * @private
     */
    constructor(http, users) {
        this.#http = http;
        this.#users = users;
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | UserInfo>}
     */
    async handleAuthentication(request) {
        const authorization_parameters = await this.#http.getAuthorizationParameters(
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
                "Invalid authorization parameters!",
                STATUS_CODE_400
            );
        }

        if (!parameters.includes(":")) {
            return HttpServerResponse.text(
                "Invalid authorization parameters!",
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
                "Invalid authorization parameters!",
                STATUS_CODE_400
            );
        }

        if (!Object.hasOwn(this.#users, user) || this.#users[user] !== password) {
            return HttpServerResponse.text(
                "No access!",
                STATUS_CODE_403
            );
        }

        return {
            user
        };
    }
}
