import { AUTHENTICATION_BACKEND_DEFAULT_OPEN_ID_CONNECT_REST_API_URL } from "../../../Adapter/Authentication/AUTHENTICATION_BACKEND.mjs";
import { CONTENT_TYPE_HTML } from "../../../../../flux-http-api/src/Adapter/ContentType/CONTENT_TYPE.mjs";
import express from "express";
import { Writable } from "node:stream";
import { HEADER_ACCEPT, HEADER_CONTENT_TYPE, HEADER_COOKIE, HEADER_LOCATION, HEADER_SET_COOKIE } from "../../../../../flux-http-api/src/Adapter/Header/HEADER.mjs";
import { STATUS_302, STATUS_401 } from "../../../../../flux-http-api/src/Adapter/Status/STATUS.mjs";

export class GetAuthenticationRouterCommand {
    /**
     * @type {string | null}
     */
    #open_id_connect_rest_api_url;

    /**
     * @param {string | null} open_id_connect_rest_api_url
     * @returns {GetAuthenticationRouterCommand}
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
        const open_id_connect_rest_api_url = this.#open_id_connect_rest_api_url ?? AUTHENTICATION_BACKEND_DEFAULT_OPEN_ID_CONNECT_REST_API_URL;

        const router = express.Router();

        for (const route of [
            "callback",
            "login",
            "logout"
        ]) {
            router.get(`${authentication_base_route}/${route}`, async (req, res) => {
                try {
                    const headers = new Headers();
                    for (const key of [
                        HEADER_COOKIE
                    ]) {
                        if (!(key in req.headers)) {
                            continue;
                        }

                        headers.set(key, req.headers[key]);
                    }

                    const url = new URL(`${open_id_connect_rest_api_url}/${route}`);
                    for (const [
                        key,
                        value
                    ] of new URL(req.url, "http://host").searchParams.entries()) {
                        url.searchParams.append(key, value);
                    }

                    const response = await fetch(url, {
                        headers,
                        redirect: "manual"
                    });

                    res.statusCode = response.status;

                    for (const key of [
                        HEADER_CONTENT_TYPE,
                        HEADER_LOCATION,
                        HEADER_SET_COOKIE
                    ]) {
                        if (!response.headers.has(key)) {
                            continue;
                        }

                        res.setHeader(key, response.headers.get(key));
                    }

                    await response.body.pipeTo(Writable.toWeb(res));
                } catch (error) {
                    console.error(error);

                    res.end();
                }
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
                if (HEADER_ACCEPT in req.headers && req.headers[HEADER_ACCEPT].includes(CONTENT_TYPE_HTML)) {
                    res.statusCode = STATUS_302;
                    res.setHeader(HEADER_LOCATION, `${authentication_base_route}/login`);
                } else {
                    res.statusCode = STATUS_401;
                }
                res.end();
                return;
            }

            next();
        });

        router.get(protect_route, (req, res) => {
            res.statusCode = STATUS_302;
            res.setHeader(HEADER_LOCATION, authentication_success_url);
            res.end();
        });

        return router;
    }
}
