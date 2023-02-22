import { AuthenticationImplementation } from "./AuthenticationImplementation.mjs";
import { HttpClientRequest } from "../../../../flux-http-api/src/Adapter/Client/HttpClientRequest.mjs";
import { HttpServerResponse } from "../../../../flux-http-api/src/Adapter/Server/HttpServerResponse.mjs";
import { SET_COOKIE_OPTION_MAX_AGE } from "../../../../flux-http-api/src/Adapter/Cookie/SET_COOKIE_OPTION.mjs";
import { CONTENT_TYPE_HTML, CONTENT_TYPE_JSON } from "../../../../flux-http-api/src/Adapter/ContentType/CONTENT_TYPE.mjs";
import { HEADER_ACCEPT, HEADER_AUTHORIZATION, HEADER_X_FLUX_AUTHENTICATION_FRONTEND_URL } from "../../../../flux-http-api/src/Adapter/Header/HEADER.mjs";
import { METHOD_GET, METHOD_HEAD, METHOD_OPTIONS, METHOD_POST } from "../../../../flux-http-api/src/Adapter/Method/METHOD.mjs";
import { OPEN_ID_CONNECT_DEFAULT_BASE_ROUTE, OPEN_ID_CONNECT_DEFAULT_COOKIE_NAME, OPEN_ID_CONNECT_DEFAULT_FRONTEND_BASE_ROUTE, OPEN_ID_CONNECT_DEFAULT_PROVIDER_SCOPE, OPEN_ID_CONNECT_DEFAULT_REDIRECT_AFTER_LOGIN_URL, OPEN_ID_CONNECT_DEFAULT_REDIRECT_AFTER_LOGOUT_URL, OPEN_ID_CONNECT_PROVIDER_CODE_CHALLENGE_S256, OPEN_ID_CONNECT_PROVIDER_GRANT_TYPE_AUTHORIZATION_CODE, OPEN_ID_CONNECT_PROVIDER_RESPONSE_TYPE_CODE } from "../OpenIdConnect/OPEN_ID_CONNECT.mjs";
import { STATUS_CODE_401, STATUS_CODE_403 } from "../../../../flux-http-api/src/Adapter/Status/STATUS_CODE.mjs";

/** @typedef {import("../../../../flux-http-api/src/Adapter/Api/HttpApi.mjs").HttpApi} HttpApi */
/** @typedef {import("../../../../flux-http-api/src/Adapter/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("../UserInfo/UserInfo.mjs").UserInfo} UserInfo */

export class OpenIdConnectAuthenticationImplementation extends AuthenticationImplementation {
    /**
     * @type {string}
     */
    #base_route;
    /**
     * @type {string}
     */
    #cookie_name;
    /**
     * @type {string}
     */
    #frontend_base_route;
    /**
     * @type {HttpApi}
     */
    #http_api;
    /**
     * @type {string}
     */
    #provider_client_id;
    /**
     * @type {string}
     */
    #provider_client_secret;
    /**
     * @type {{[key: string]: *} | null}
     */
    #provider_config = null;
    /**
     * @type {string | null}
     */
    #provider_https_certificate;
    /**
     * @type {string | null}
     */
    #provider_redirect_uri;
    /**
     * @type {string}
     */
    #provider_scope;
    /**
     * @type {string}
     */
    #provider_url;
    /**
     * @type {string}
     */
    #redirect_after_login_url;
    /**
     * @type {string}
     */
    #redirect_after_logout_url;
    /**
     * @type {Map<string, [{[key: string]: *}, [number, number]]>}
     */
    #sessions;
    /**
     * @type {{[key: string]: *} | null}
     */
    #set_cookie_options;

    /**
     * @param {HttpApi} http_api
     * @param {string} provider_url
     * @param {string} provider_client_id
     * @param {string} provider_client_secret
     * @param {string | null} provider_redirect_uri
     * @param {string | null} provider_scope
     * @param {string | null} provider_https_certificate
     * @param {string | null} cookie_name
     * @param {{[key: string]: *} | null} set_cookie_options
     * @param {string | null} base_route
     * @param {string | null} frontend_base_route
     * @param {string | null} redirect_after_login_url
     * @param {string | null} redirect_after_logout_url
     * @returns {OpenIdConnectAuthenticationImplementation}
     */
    static new(http_api, provider_url, provider_client_id, provider_client_secret, provider_redirect_uri = null, provider_scope = null, provider_https_certificate = null, cookie_name = null, set_cookie_options = null, base_route = null, frontend_base_route = null, redirect_after_login_url = null, redirect_after_logout_url = null) {
        return new this(
            http_api,
            provider_url,
            provider_client_id,
            provider_client_secret,
            provider_redirect_uri,
            provider_scope ?? OPEN_ID_CONNECT_DEFAULT_PROVIDER_SCOPE,
            provider_https_certificate,
            cookie_name ?? OPEN_ID_CONNECT_DEFAULT_COOKIE_NAME,
            set_cookie_options,
            base_route ?? OPEN_ID_CONNECT_DEFAULT_BASE_ROUTE,
            frontend_base_route ?? base_route ?? OPEN_ID_CONNECT_DEFAULT_FRONTEND_BASE_ROUTE,
            redirect_after_login_url ?? OPEN_ID_CONNECT_DEFAULT_REDIRECT_AFTER_LOGIN_URL,
            redirect_after_logout_url ?? OPEN_ID_CONNECT_DEFAULT_REDIRECT_AFTER_LOGOUT_URL
        );
    }

    /**
     * @param {HttpApi} http_api
     * @param {string} provider_url
     * @param {string} provider_client_id
     * @param {string} provider_client_secret
     * @param {string | null} provider_redirect_uri
     * @param {string} provider_scope
     * @param {string | null} provider_https_certificate
     * @param {string} cookie_name
     * @param {{[key: string]: *} | null} set_cookie_options
     * @param {string} base_route
     * @param {string} frontend_base_route
     * @param {string} redirect_after_login_url
     * @param {string} redirect_after_logout_url
     * @private
     */
    constructor(http_api, provider_url, provider_client_id, provider_client_secret, provider_redirect_uri, provider_scope, provider_https_certificate, cookie_name, set_cookie_options, base_route, frontend_base_route, redirect_after_login_url, redirect_after_logout_url) {
        super();

        this.#http_api = http_api;
        this.#provider_url = provider_url;
        this.#provider_client_id = provider_client_id;
        this.#provider_client_secret = provider_client_secret;
        this.#provider_redirect_uri = provider_redirect_uri;
        this.#provider_scope = provider_scope;
        this.#provider_https_certificate = provider_https_certificate;
        this.#cookie_name = cookie_name;
        this.#set_cookie_options = set_cookie_options;
        this.#base_route = base_route;
        this.#frontend_base_route = frontend_base_route;
        this.#redirect_after_login_url = redirect_after_login_url;
        this.#redirect_after_logout_url = redirect_after_logout_url;
        this.#sessions = new Map();

        setInterval(() => {
            this.#removeInvalidSessions();
        }, 5 * 60 * 1000);
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse | UserInfo>}
     */
    async handleAuthentication(request) {
        if (request.url.pathname === `${this.#base_route !== "/" ? this.#base_route : ""}/callback`) {
            return this.#callback(
                request
            );
        }

        if (request.url.pathname === `${this.#base_route !== "/" ? this.#base_route : ""}/login`) {
            return this.#login(
                request
            );
        }

        if (request.url.pathname === `${this.#base_route !== "/" ? this.#base_route : ""}/logout`) {
            return this.#logout(
                request
            );
        }

        const [
            user_infos,
            cookies
        ] = await this.#userInfos(
            request
        );

        if (user_infos === null) {
            const frontend_url = `${this.#frontend_base_route !== "/" ? this.#frontend_base_route : ""}/login`;

            if (request.header(
                HEADER_ACCEPT
            )?.includes(CONTENT_TYPE_HTML) ?? false) {
                return HttpServerResponse.redirect(
                    frontend_url,
                    null,
                    null,
                    cookies
                );
            } else {
                return HttpServerResponse.text(
                    "Authorization needed",
                    STATUS_CODE_401,
                    {
                        [HEADER_X_FLUX_AUTHENTICATION_FRONTEND_URL]: frontend_url
                    },
                    cookies
                );
            }
        }

        if (cookies !== null && request._res !== null) {
            await this.#http_api._setCookies(
                request._res,
                cookies
            );
        }

        return user_infos;
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse>}
     */
    async #callback(request) {
        const response = await this.#http_api.validateMethods(
            request,
            [
                METHOD_GET,
                METHOD_HEAD,
                METHOD_OPTIONS
            ]
        );

        if (response !== null) {
            return response;
        }

        const [
            session_number,
            session
        ] = this.#getSession(
            request
        );

        let token_type, access_token, created_at, expires_in;
        try {
            if (session_number === null || session === null) {
                throw new Error("Missing session");
            }

            if (request.url.searchParams.has("error_description")) {
                throw new Error(request.url.searchParams.get("error_description"));
            }
            if (request.url.searchParams.has("error")) {
                throw new Error(request.url.searchParams.get("error"));
            }

            if (!request.url.searchParams.has("code")) {
                throw new Error("Invalid code");
            }
            if (!request.url.searchParams.has("state")) {
                throw new Error("Invalid state");
            }

            const state = request.url.searchParams.get("state");

            if ((session.state ?? null) === null || session.state !== state) {
                throw new Error("Invalid state");
            }

            if ((session.code_verifier ?? null) === null) {
                throw new Error("Invalid code verifier");
            }

            const provider_config = await this.#getProviderConfig();

            if (!provider_config.grant_types_supported.includes(OPEN_ID_CONNECT_PROVIDER_GRANT_TYPE_AUTHORIZATION_CODE)) {
                throw new Error(`Provider does not supports grant type ${OPEN_ID_CONNECT_PROVIDER_GRANT_TYPE_AUTHORIZATION_CODE}`);
            }

            const token = await (await this.#http_api.request(
                HttpClientRequest.json(
                    new URL(provider_config.token_endpoint),
                    {
                        client_id: this.#provider_client_id,
                        client_secret: this.#provider_client_secret,
                        grant_type: OPEN_ID_CONNECT_PROVIDER_GRANT_TYPE_AUTHORIZATION_CODE,
                        code: request.url.searchParams.get("code"),
                        code_verifier: session.code_verifier,
                        redirect_uri: this.#getProviderRedirectUri(
                            request
                        )
                    },
                    METHOD_POST,
                    null,
                    null,
                    null,
                    null,
                    this.#provider_https_certificate
                )
            )).body.json();

            if ((token.error_description ?? null) !== null) {
                throw new Error(token.error_description);
            }
            if ((token.error ?? null) !== null) {
                throw new Error(token.error);
            }
            if ((token.message ?? null) !== null) {
                throw new Error(token.message);
            }

            token_type = token.token_type ?? null;
            access_token = token.access_token ?? null;
            created_at = token.created_at ?? null;
            expires_in = token.expires_in ?? null;

            if (token_type === null || access_token === null || created_at === null || expires_in === null) {
                throw new Error("Invalid access token");
            }
        } catch (error) {
            console.error(error);

            return HttpServerResponse.text(
                "Invalid authorization",
                STATUS_CODE_403,
                null,
                this.#setSession(
                    request,
                    session_number
                )
            );
        }

        return HttpServerResponse.redirect(
            this.#redirect_after_login_url,
            null,
            null,
            this.#setSession(
                request,
                session_number,
                {
                    authorization: `${token_type} ${access_token}`
                },
                expires_in,
                created_at * 1000
            )
        );
    }

    /**
     * @returns {Promise<{[key: string]: *}>}
     */
    async #getProviderConfig() {
        this.#provider_config ??= await (await this.#http_api.request(
            HttpClientRequest.new(
                new URL(`${this.#provider_url}/.well-known/openid-configuration`),
                null,
                null,
                null,
                null,
                null,
                null,
                this.#provider_https_certificate
            )
        )).body.json();

        return this.#provider_config;
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {string}
     */
    #getProviderRedirectUri(request) {
        return this.#provider_redirect_uri ?? `${request.url.origin}${this.#frontend_base_route !== "/" ? this.#frontend_base_route : ""}/callback`;
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {[string | null, {[key: string]: *} | null]}
     */
    #getSession(request) {
        const session_number = request.cookie(
            this.#cookie_name
        );

        if (session_number === null) {
            return [
                null,
                null
            ];
        }

        return this.#getValidSession(
            session_number
        );
    }

    /**
     * @param {string} session_number
     * @returns {[string | null, {[key: string]: *} | null]}
     */
    #getValidSession(session_number) {
        const session = this.#sessions.get(session_number) ?? null;

        if (session === null) {
            return [
                null,
                null
            ];
        }

        if ((Date.now() - session[1][0]) > session[1][1]) {
            this.#sessions.delete(session_number);

            return [
                null,
                null
            ];
        }

        return [
            session_number,
            session[0]
        ];
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse>}
     */
    async #login(request) {
        const response = await this.#http_api.validateMethods(
            request,
            [
                METHOD_GET,
                METHOD_HEAD,
                METHOD_OPTIONS
            ]
        );

        if (response !== null) {
            return response;
        }

        const state = crypto.randomUUID();

        const provider_config = await this.#getProviderConfig();

        if (!provider_config.code_challenge_methods_supported.includes(OPEN_ID_CONNECT_PROVIDER_CODE_CHALLENGE_S256)) {
            throw new Error(`Provider does not supports code challenge ${OPEN_ID_CONNECT_PROVIDER_CODE_CHALLENGE_S256}`);
        }

        if (!provider_config.response_types_supported.includes(OPEN_ID_CONNECT_PROVIDER_RESPONSE_TYPE_CODE)) {
            throw new Error(`Provider does not supports response type ${OPEN_ID_CONNECT_PROVIDER_RESPONSE_TYPE_CODE}`);
        }

        const code_verifier = crypto.randomUUID();

        const location = new URL(provider_config.authorization_endpoint);

        for (const [
            key,
            value
        ] of Object.entries({
            client_id: this.#provider_client_id,
            redirect_uri: this.#getProviderRedirectUri(
                request
            ),
            response_type: OPEN_ID_CONNECT_PROVIDER_RESPONSE_TYPE_CODE,
            state,
            scope: this.#provider_scope,
            code_challenge_method: OPEN_ID_CONNECT_PROVIDER_CODE_CHALLENGE_S256,
            code_challenge: Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code_verifier))).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/[=]+$/, "")
        })) {
            location.searchParams.append(key, value);
        }

        return HttpServerResponse.redirect(
            `${location}`,
            null,
            null,
            this.#setSession(
                request,
                this.#getSession(
                    request
                )[0],
                {
                    state,
                    code_verifier
                }
            )
        );
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<HttpServerResponse>}
     */
    async #logout(request) {
        const response = await this.#http_api.validateMethods(
            request,
            [
                METHOD_GET,
                METHOD_HEAD,
                METHOD_OPTIONS
            ]
        );

        if (response !== null) {
            return response;
        }

        return HttpServerResponse.redirect(
            this.#redirect_after_logout_url,
            null,
            null,
            this.#setSession(
                request,
                this.#getSession(
                    request
                )[0]
            )
        );
    }

    /**
     * @returns {void}
     */
    #removeInvalidSessions() {
        for (const session_number of Array.from(this.#sessions.keys())) {
            this.#getValidSession(
                session_number
            );
        }
    }

    /**
     * @param {HttpServerRequest} request
     * @param {string | null} session_number
     * @param {{[key: string]: *} | null} session
     * @param {number | null} max_age
     * @param {number | null} created_at
     * @returns {{[key: string]: {value: string | null, options: {[key: string]: *} | null}} | null}
     */
    #setSession(request, session_number = null, session = null, max_age = null, created_at = null) {
        if (session === null) {
            if (session_number !== null) {
                this.#sessions.delete(session_number);
            }

            if (request.cookie(
                this.#cookie_name
            ) === null) {
                return null;
            }

            return {
                [this.#cookie_name]: {
                    value: null,
                    options: this.#set_cookie_options
                }
            };
        }

        const _session_number = session_number ?? crypto.randomUUID();

        const _max_age = max_age ?? (5 * 60);

        const now = Date.now();

        this.#sessions.set(_session_number, [
            session,
            [
                created_at ?? now,
                _max_age * 1000
            ]
        ]);

        return {
            [this.#cookie_name]: {
                value: _session_number,
                options: {
                    ...this.#set_cookie_options,
                    [SET_COOKIE_OPTION_MAX_AGE]: created_at !== null ? Math.max(1, _max_age - (now - created_at)) : _max_age
                }
            }
        };
    }

    /**
     * @param {HttpServerRequest} request
     * @returns {Promise<[UserInfo | null, {[key: string]: {value: string | null, options: {[key: string]: *} | null}} | null]>}
     */
    async #userInfos(request) {
        const [
            session_number,
            session
        ] = this.#getSession(
            request
        );
        if (session_number === null || session === null) {
            return [
                null,
                this.#setSession(
                    request,
                    session_number
                )
            ];
        }

        if ((session.authorization ?? null) === null) {
            return [
                null,
                this.#setSession(
                    request,
                    session_number
                )
            ];
        }

        try {
            session.user_infos ??= await (await this.#http_api.request(
                HttpClientRequest.new(
                    new URL((await this.#getProviderConfig()).userinfo_endpoint),
                    null,
                    null,
                    {
                        [HEADER_ACCEPT]: CONTENT_TYPE_JSON,
                        [HEADER_AUTHORIZATION]: session.authorization
                    },
                    null,
                    null,
                    null,
                    this.#provider_https_certificate
                )
            )).body.json();
        } catch (error) {
            console.error(error);

            return [
                null,
                this.#setSession(
                    request,
                    session_number
                )
            ];
        }

        return [
            session.user_infos,
            null
        ];
    }
}
