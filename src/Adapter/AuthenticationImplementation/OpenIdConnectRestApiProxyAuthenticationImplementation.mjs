import { AuthenticationImplementation } from "./AuthenticationImplementation.mjs";
import { HttpClientRequest } from "../../../../flux-http-api/src/Adapter/Client/HttpClientRequest.mjs";
import { HttpServerResponse } from "../../../../flux-http-api/src/Adapter/Server/HttpServerResponse.mjs";
import { HEADER_ACCEPT, HEADER_CONTENT_TYPE, HEADER_COOKIE, HEADER_LOCATION, HEADER_SET_COOKIE, HEADER_X_FLUX_AUTHENTICATION_FRONTEND_URL } from "../../../../flux-http-api/src/Adapter/Header/HEADER.mjs";
import { METHOD_GET, METHOD_OPTIONS } from "../../../../flux-http-api/src/Adapter/Method/METHOD.mjs";
import { OPEN_ID_CONNECT_REST_API_PROXY_DEFAULT_BASE_ROUTE, OPEN_ID_CONNECT_REST_API_PROXY_DEFAULT_URL } from "../OpenIdConnectRestApiProxy/OPEN_ID_CONNECT_REST_API_PROXY.mjs";
import { STATUS_CODE_302, STATUS_CODE_401 } from "../../../../flux-http-api/src/Adapter/Status/STATUS_CODE.mjs";

/** @typedef {import("../../../../flux-http-api/src/Adapter/Api/HttpApi.mjs").HttpApi} HttpApi */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */

export class OpenIdConnectRestApiProxyAuthenticationImplementation extends AuthenticationImplementation {
    /**
     * @type {string}
     */
    #base_route;
    /**
     * @type {HttpApi}
     */
    #http_api;
    /**
     * @type {string}
     */
    #url;
    /**
     * @type {Map}
     */
    #user_infos_cache;

    /**
     * @param {HttpApi} http_api
     * @param {string | null} base_route
     * @param {string | null} url
     * @returns {OpenIdConnectRestApiProxyAuthenticationImplementation}
     */
    static new(http_api, base_route = null, url = null) {
        return new this(
            http_api,
            base_route ?? OPEN_ID_CONNECT_REST_API_PROXY_DEFAULT_BASE_ROUTE,
            url ?? OPEN_ID_CONNECT_REST_API_PROXY_DEFAULT_URL
        );
    }

    /**
     * @param {HttpApi} http_api
     * @param {string} base_route
     * @param {string} url
     * @private
     */
    constructor(http_api, base_route, url) {
        super();

        this.#http_api = http_api;
        this.#base_route = base_route;
        this.#url = url;
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
            if (request.url.pathname === `${this.#base_route}/${route}`) {
                const response = await this.#http_api.validateMethods(
                    request,
                    [
                        METHOD_GET,
                        METHOD_OPTIONS
                    ]
                );

                if (response !== null) {
                    return response;
                }

                return this.#http_api.proxyRequest(
                    {
                        url: `${this.#url}${request.url.pathname}`,
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

        const cookie = request.header(
            HEADER_COOKIE
        );

        if (cookie !== null) {
            if (this.#user_infos_cache.has(cookie)) {
                user_infos = this.#user_infos_cache.get(cookie);
            } else {
                const response = await this.#http_api.request(
                    HttpClientRequest.new(
                        new URL(`${this.#url}${this.#base_route}/user-infos`),
                        null,
                        null,
                        [
                            HEADER_ACCEPT,
                            HEADER_COOKIE
                        ].reduce((headers, key) => {
                            const value = request.header(
                                key
                            );

                            if (value === null) {
                                return headers;
                            }

                            headers[key] = value;

                            return headers;
                        }, {}),
                        false,
                        null,
                        false
                    )
                );

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

                if (response.status_code === STATUS_CODE_302 || response.status_code === STATUS_CODE_401) {
                    return HttpServerResponse.new(
                        response.body,
                        response.status_code,
                        [
                            HEADER_CONTENT_TYPE,
                            HEADER_LOCATION,
                            HEADER_X_FLUX_AUTHENTICATION_FRONTEND_URL
                        ].reduce((headers, key) => {
                            const value = response.header(
                                key
                            );

                            if (value === null) {
                                return headers;
                            }

                            headers[key] = value;

                            return headers;
                        }, {})
                    );
                }

                if (!response.status_code_is_ok) {
                    return Promise.reject(response);
                }

                this.#user_infos_cache.set(cookie, user_infos = await response.body.json());
            }
        }

        request._user_infos = user_infos;

        return null;
    }
}
