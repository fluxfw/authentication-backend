import { AUTHENTICATION_BACKEND_DEFAULT_OPEN_ID_CONNECT_REST_API_URL } from "../../../Adapter/Authentication/AUTHENTICATION_BACKEND.mjs";
import express from "express";
import { HEADER_CONTENT_TYPE } from "../../../../../flux-fetch-api/src/Adapter/Header/HEADER.mjs";
import { Writable } from "node:stream";

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
                        "cookie"
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
                    ] of Object.entries(req.query)) {
                        url.searchParams.append(key, value);
                    }

                    const response = await fetch(url, {
                        headers,
                        redirect: "manual"
                    });

                    for (const key of [
                        HEADER_CONTENT_TYPE,
                        "location",
                        "set-cookie"
                    ]) {
                        if (!response.headers.has(key)) {
                            continue;
                        }

                        res.header(key, response.headers.get(key));
                    }

                    res.status(response.status);

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
                if ("cookie" in req.headers) {
                    const { cookie } = req.headers;

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
                            "set-cookie"
                        ]) {
                            if (!response.headers.has(key)) {
                                continue;
                            }

                            res.header(key, response.headers.get(key));
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }

            if (req.userInfos === null) {
                if (req.accepts("html")) {
                    res.redirect(302, `${authentication_base_route}/login`);
                } else {
                    res.sendStatus(401);
                }
                return;
            }

            next();
        });

        router.get(protect_route, (req, res) => {
            res.redirect(302, authentication_success_url);
        });

        return router;
    }
}
