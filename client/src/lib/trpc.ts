import { createTRPCReact } from "@trpc/react-query";

/**
 * Client for the ndespanels CRM backend, reached through the Vercel proxy in
 * vercel.json. Procedures live under `crm.*`.
 *
 * The router type lives in the other repo and cannot be imported here, so this
 * is deliberately untyped. `createTRPCReact<any>` alone is not enough: with
 * `any`, tRPC's conditional types collapse to its "collides with a built-in
 * method" diagnostic union, so every call site — including `.Provider` and
 * `.useUtils()` — reports a phantom error. The cast restores the intent the
 * original comment described. Runtime behaviour is unchanged.
 *
 * The real fix is publishing the backend's AppRouter type as a shared package;
 * until then, backend contract changes are caught by the acceptance suite in
 * the CRM repo, not by this compiler.
 */
export const trpc = createTRPCReact<any>() as any;
