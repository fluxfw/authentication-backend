import { AUTHENTICATION_BACKEND_DEFAULT_OPEN_ID_CONNECT_REST_API_URL } from "../../../Adapter/Authentication/AUTHENTICATION_BACKEND.mjs";
import { CONTENT_TYPE_HTML } from "../../../../../flux-http-api/src/Adapter/ContentType/CONTENT_TYPE.mjs";
import express from "express";
import { HEADER_ACCEPT, HEADER_CONTENT_TYPE, HEADER_COOKIE, HEADER_LOCATION, HEADER_SET_COOKIE } from "../../../../../flux-http-api/src/Adapter/Header/HEADER.mjs";
import { STATUS_302, STATUS_400, STATUS_401, STATUS_500 } from "../../../../../flux-http-api/src/Adapter/Status/STATUS.mjs";

/** @typedef {import("../../../../../flux-http-api/src/Adapter/Api/HttpApi.mjs").HttpApi} HttpApi */

export class GetAuthenticationRouterCommand {
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
     * @returns {GetAuthenticationRouterCommand}
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
        const open_id_connect_rest_api_url = this.#open_id_connect_rest_api_url ?? AUTHENTICATION_BACKEND_DEFAULT_OPEN_ID_CONNECT_REST_API_URL;

        const router = express.Router();

        for (const route of [
            "callback",
            "login",
            "logout"
        ]) {
            router.get(`${authentication_base_route}/${route}`, async (req, res) => {
                let request;
                try {
                    request = await this.#http_api.mapServerRequestToRequest(
                        req
                    );
                } catch (error) {
                    console.error(error);

                    await this.#http_api.mapResponseToServerResponse(
                        new Response(null, {
                            status: STATUS_400
                        }),
                        res
                    );
                    return;
                }

                let response;
                try {
                    const url = new URL(`${open_id_connect_rest_api_url}/${route}`);
                    for (const [
                        key,
                        value
                    ] of request._urlObject.searchParams.entries()) {
                        url.searchParams.append(key, value);
                    }

                    const fetch_response = await fetch(`${url}`, {
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

                    response = new Response(fetch_response.body, {
                        status: fetch_response.status,
                        headers: [
                            HEADER_CONTENT_TYPE,
                            HEADER_LOCATION,
                            HEADER_SET_COOKIE
                        ].reduce((headers, key) => {
                            if (!fetch_response.headers.has(key)) {
                                return headers;
                            }

                            headers[key] = fetch_response.headers.get(key);

                            return headers;
                        }, {})
                    });
                } catch (error) {
                    console.error(error);

                    await this.#http_api.mapResponseToServerResponse(
                        new Response(null, {
                            status: STATUS_500
                        }),
                        res,
                        request
                    );
                    return;
                }

                await this.#http_api.mapResponseToServerResponse(
                    response,
                    res,
                    request
                );
            });
        }

        const user_infos_cache = new Map();

        router.use(protect_route, async (req, res, next) => {
            req.userInfos = null;

            try {
                if (HEADER_COOKIE in req.headers) {
                    const { [HEADER_COOKIE]: cookie } = req.headers;

                    if (user_infos_cache.has(cookie)) {
                        req.userInfos = user_infos_cache.get(cookie);
                    } else {
                        const response = await fetch(`${open_id_connect_rest_api_url}/userinfos`, {
                            headers: {
                                cookie
                            }
                        });

                        if (!response.ok) {
                            throw response;
                        }

                        req.userInfos = await response.json();
                        user_infos_cache.set(cookie, req.userInfos);

                        for (const key of [
                            HEADER_SET_COOKIE
                        ]) {
                            if (!response.headers.has(key)) {
                                continue;
                            }

                            res.setHeader(key, response.headers.get(key));
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }

            if (req.userInfos === null) {
                await this.#http_api.mapResponseToServerResponse(
                    req.headers[HEADER_ACCEPT]?.includes(CONTENT_TYPE_HTML) ?? false ? Response.redirect(`${authentication_base_route}/login`, STATUS_302) : new Response(null, {
                        status: STATUS_401
                    }),
                    res
                );
                return;
            }

            next();
        });

        router.get(protect_route, async (req, res) => {
            await this.#http_api.mapResponseToServerResponse(
                Response.redirect(authentication_success_url, STATUS_302),
                res
            );
        });

        return router;
    }
}
