import { createTRPCReact } from "@trpc/react-query";
// Using ndespanels.com backend via Vercel proxy - see vercel.json
// Type is generic since we're calling external backend
export const trpc = createTRPCReact<any>();
