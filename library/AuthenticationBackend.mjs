/** @typedef {import("http/Server/HttpServerRequest.mjs").HttpServerRequest} HttpServerRequest */
/** @typedef {import("http/Server/HttpServerResponse.mjs").HttpServerResponse} HttpServerResponse */
/** @typedef {import("./UserInfo.mjs").UserInfo} UserInfo */

/**
 * @typedef {{handleAuthentication: (request: HttpServerRequest) => Promise<HttpServerResponse | UserInfo>}} AuthenticationBackend
 */
