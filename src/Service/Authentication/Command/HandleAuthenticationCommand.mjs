import { AUTHENTICATION_BACKEND_DEFAULT_OPEN_ID_CONNECT_REST_API_URL } from "../../../Adapter/Authentication/AUTHENTICATION_BACKEND.mjs";
import { CONTENT_TYPE_HTML } from "../../../../../flux-http-api/src/Adapter/ContentType/CONTENT_TYPE.mjs";
import { HEADER_ACCEPT, HEADER_CONTENT_TYPE, HEADER_COOKIE, HEADER_LOCATION, HEADER_SET_COOKIE } from "../../../../../flux-http-api/src/Adapter/Header/HEADER.mjs";
import { STATUS_302, STATUS_401 } from "../../../../../flux-http-api/src/Adapter/Status/STATUS.mjs";

/** @typedef {import("../../../../../flux-http-api/src/Adapter/Request/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("../../../../../flux-http-api/src/Adapter/Response/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */

export class HandleAuthenticationCommand {
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
     * @returns {HandleAuthenticationCommand}
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
        const open_id_connect_rest_api_url = this.#open_id_connect_rest_api_url ?? AUTHENTICATION_BACKEND_DEFAULT_OPEN_ID_CONNECT_REST_API_URL;

        for (const route of [
            "callback",
            "login",
            "logout"
        ]) {
            if (request._urlObject.pathname === `${authentication_base_route}/${route}`) {
                const url = new URL(`${open_id_connect_rest_api_url}/${route}`);
                for (const [
                    key,
                    value
                ] of request._urlObject.searchParams.entries()) {
                    url.searchParams.append(key, value);
                }

                const response = await fetch(`${url}`, {
                    headers: [
                        HEADER_COOKIE
                    ].reduce((headers, key) => {
                        if (!request.headers.has(key)) {
                            return headers;
                        }

                        headers[key] = request.headers.get(key);

                        return headers;
                    }, {}),
                    redirect: "manual"
                });

                return new Response(response.body, {
                    status: response.status,
                    headers: [
                        HEADER_CONTENT_TYPE,
                        HEADER_LOCATION,
                        HEADER_SET_COOKIE
                    ].reduce((headers, key) => {
                        if (!response.headers.has(key)) {
                            return headers;
                        }

                        headers[key] = response.headers.get(key);

                        return headers;
                    }, {})
                });
            }
        }

        request._userInfos = null;

        try {
            const cookie = request.headers.get(HEADER_COOKIE);

            if (cookie !== null) {
                if (this.#user_infos_cache.has(cookie)) {
                    request._userInfos = this.#user_infos_cache.get(cookie);
                } else {
                    const response = await fetch(`${open_id_connect_rest_api_url}/userinfos`, {
                        headers: {
                            cookie
                        }
                    });

                    if (!response.ok) {
                        throw response;
                    }

                    request._userInfos = await response.json();
                    this.#user_infos_cache.set(cookie, request._userInfos);

                    for (const key of [
                        HEADER_SET_COOKIE
                    ]) {
                        if (!response.headers.has(key)) {
                            continue;
                        }

                        request._res.setHeader(key, response.headers.get(key));
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }

        if (request._userInfos === null) {
            if (request.headers.get(HEADER_ACCEPT)?.includes(CONTENT_TYPE_HTML) ?? false) {
                return Response.redirect(`${authentication_base_route}/login`, STATUS_302);
            } else {
                return new Response(null, {
                    status: STATUS_401
                });
            }
        }

        if (request._urlObject.pathname === api_route) {
            return Response.redirect(authentication_success_url, STATUS_302);
        }

        return null;
    }
}
