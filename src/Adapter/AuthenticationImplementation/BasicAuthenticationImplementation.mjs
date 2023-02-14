import { AuthenticationImplementation } from "./AuthenticationImplementation.mjs";
import { AUTHORIZATION_SCHEMA_BASIC } from "../../../../flux-http-api/src/Adapter/Authorization/AUTHORIZATION_SCHEMA.mjs";
import { HttpServerResponse } from "../../../../flux-http-api/src/Adapter/Server/HttpServerResponse.mjs";
import { STATUS_CODE_400, STATUS_CODE_403 } from "../../../../flux-http-api/src/Adapter/Status/STATUS_CODE.mjs";

/** @typedef {import("../../../../flux-http-api/src/Adapter/Api/HttpApi.mjs").HttpApi} HttpApi */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */

export class BasicAuthenticationImplementation extends AuthenticationImplementation {
    /**
     * @type {HttpApi}
     */
    #http_api;
    /**
     * @type {{[key: string]: string}}
     */
    #users;

    /**
     * @param {HttpApi} http_api
     * @param {{[key: string]: string}} users
     * @returns {BasicAuthenticationImplementation}
     */
    static new(http_api, users) {
        return new this(
            http_api,
            users
        );
    }

    /**
     * @param {HttpApi} http_api
     * @param {{[key: string]: string}} users
     * @private
     */
    constructor(http_api, users) {
        super();

        this.#http_api = http_api;
        this.#users = users;
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | null>}
     */
    async handleAuthentication(request) {
        const authorization_parameters = await this.#http_api.getAuthorizationParameters(
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
            user_name,
            ..._password
        ] = parameters.split(":");
        const password = _password.join(":");

        if (user_name === "" || password === "") {
            return HttpServerResponse.text(
                "Invalid authorization parameters",
                STATUS_CODE_400
            );
        }

        if (!Object.hasOwn(this.#users, user_name) || this.#users[user_name] !== password) {
            return HttpServerResponse.text(
                "No access",
                STATUS_CODE_403
            );
        }

        request._user_name = user_name;

        return null;
    }
}
