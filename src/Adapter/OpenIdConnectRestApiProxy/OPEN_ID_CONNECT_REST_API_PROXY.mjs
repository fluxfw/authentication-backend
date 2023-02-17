import { OPEN_ID_CONNECT_DEFAULT_FRONTEND_BASE_ROUTE } from "../OpenIdConnect/OPEN_ID_CONNECT.mjs";
import { PROTOCOL_HTTP } from "../../../../flux-http-api/src/Adapter/Protocol/PROTOCOL.mjs";

export const OPEN_ID_CONNECT_REST_API_PROXY_DEFAULT_BASE_ROUTE = OPEN_ID_CONNECT_DEFAULT_FRONTEND_BASE_ROUTE;

export const OPEN_ID_CONNECT_REST_API_PROXY_DEFAULT_URL = `${PROTOCOL_HTTP}://open-id-connect-rest-api`;
