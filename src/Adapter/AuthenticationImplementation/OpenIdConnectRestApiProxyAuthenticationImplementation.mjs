import { AuthenticationImplementation } from "./AuthenticationImplementation.mjs";
import { HttpClientRequest } from "../../../../flux-http-api/src/Adapter/Client/HttpClientRequest.mjs";
import { HttpServerResponse } from "../../../../flux-http-api/src/Adapter/Server/HttpServerResponse.mjs";
import { OPEN_ID_CONNECT_REST_API_PROXY_DEFAULT_OPEN_ID_CONNECT_REST_API_URL } from "../OpenIdConnectRestApiProxy/OPEN_ID_CONNECT_REST_API_PROXY.mjs";
import { STATUS_CODE_401 } from "../../../../flux-http-api/src/Adapter/Status/STATUS_CODE.mjs";
import { CONTENT_TYPE_HTML, CONTENT_TYPE_JSON } from "../../../../flux-http-api/src/Adapter/ContentType/CONTENT_TYPE.mjs";
import { HEADER_ACCEPT, HEADER_CONTENT_TYPE, HEADER_COOKIE, HEADER_LOCATION, HEADER_SET_COOKIE, HEADER_X_FLUX_AUTHENTICATION_FRONTEND_URL } from "../../../../flux-http-api/src/Adapter/Header/HEADER.mjs";

/** @typedef {import("../../../../flux-http-api/src/Adapter/Api/HttpApi.mjs").HttpApi} HttpApi */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */

export class OpenIdConnectRestApiProxyAuthenticationImplementation extends AuthenticationImplementation {
    /**
     * @type {string}
     */
    #api_route;
    /**
     * @type {string}
     */
    #authentication_base_route;
    /**
     * @type {string}
     */
    #authentication_success_url;
    /**
     * @type {HttpApi}
     */
    #http_api;
    /**
     * @type {string}
     */
    #open_id_connect_rest_api_url;
    /**
     * @type {Map}
     */
    #user_infos_cache;

    /**
     * @param {HttpApi} http_api
     * @param {string} authentication_base_route
     * @param {string} api_route
     * @param {string | null} authentication_success_url
     * @param {string | null} open_id_connect_rest_api_url
     * @returns {OpenIdConnectRestApiProxyAuthenticationImplementation}
     */
    static new(http_api, authentication_base_route, api_route, authentication_success_url = null, open_id_connect_rest_api_url = null) {
        return new this(
            http_api,
            authentication_base_route,
            api_route,
            authentication_success_url ?? "/Libs/flux-authentication-frontend-api/src/Adapter/Authentication/AuthenticationSuccess.html",
            open_id_connect_rest_api_url ?? OPEN_ID_CONNECT_REST_API_PROXY_DEFAULT_OPEN_ID_CONNECT_REST_API_URL
        );
    }

    /**
     * @param {HttpApi} http_api
     * @param {string} authentication_base_route
     * @param {string} api_route
     * @param {string} authentication_success_url
     * @param {string} open_id_connect_rest_api_url
     * @private
     */
    constructor(http_api, authentication_base_route, api_route, authentication_success_url, open_id_connect_rest_api_url) {
        super();

        this.#http_api = http_api;
        this.#authentication_base_route = authentication_base_route;
        this.#api_route = api_route;
        this.#authentication_success_url = authentication_success_url;
        this.#open_id_connect_rest_api_url = open_id_connect_rest_api_url;
        this.#user_infos_cache = new Map();
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | null>}
     */
    async handleAuthentication(request) {
        for (const route of [
            "callback",
            "login",
            "logout"
        ]) {
            if (request.url.pathname === `${this.#authentication_base_route}/${route}`) {
                return this.#http_api.proxyRequest(
                    {
                        url: `${this.#open_id_connect_rest_api_url}/${route}`,
                        request,
                        request_query_params: true,
                        request_headers: [
                            HEADER_COOKIE
                        ],
                        response_redirect: true,
                        response_headers: [
                            HEADER_CONTENT_TYPE,
                            HEADER_LOCATION,
                            HEADER_SET_COOKIE
                        ]
                    }
                );
            }
        }

        let user_infos = null;

        try {
            const cookie = request.header(
                HEADER_COOKIE
            );

            if (cookie !== null) {
                if (this.#user_infos_cache.has(cookie)) {
                    user_infos = this.#user_infos_cache.get(cookie);
                } else {
                    const response = await this.#http_api.request(
                        HttpClientRequest.new(
                            new URL(`${this.#open_id_connect_rest_api_url}/userinfos`),
                            null,
                            null,
                            {
                                [HEADER_ACCEPT]: CONTENT_TYPE_JSON,
                                [HEADER_COOKIE]: cookie
                            }
                        )
                    );

                    this.#user_infos_cache.set(cookie, user_infos = await response.body.json());

                    for (const key of [
                        HEADER_SET_COOKIE
                    ]) {
                        const value = response.header(
                            key
                        );

                        if (value === null) {
                            continue;
                        }

                        request._res?.setHeader(key, value);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }

        if (user_infos === null) {
            const frontend_url = `${this.#authentication_base_route}/login`;

            if (request.header(
                HEADER_ACCEPT
            )?.includes(CONTENT_TYPE_HTML) ?? false) {
                return HttpServerResponse.redirect(
                    frontend_url
                );
            } else {
                return HttpServerResponse.text(
                    "Authorization needed",
                    STATUS_CODE_401,
                    {
                        [HEADER_X_FLUX_AUTHENTICATION_FRONTEND_URL]: frontend_url
                    }
                );
            }
        }

        if (request.url.pathname === this.#api_route) {
            return HttpServerResponse.redirect(
                this.#authentication_success_url
            );
        }

        request._user_infos = user_infos;

        return null;
    }
}
