/**
 * Helper functions for payout config
 *
 * We support payouts (permit2 + gnosis chain) for 2 networks:
 * - ethereum mainnet
 * - gnosis chain
 *
 * To support a new chain add RPC URL and payment token to the "getPayoutConfigByChainId()" method.
 * Notice that chain should be compatible with gelato network, i.e.:
 * 1. Gelato network should support the added chain (https://docs.gelato.network/developer-services/relay/api#oracles)
 * 2. Gelato network should support the added payment token (https://docs.gelato.network/developer-services/relay/api#oracles-chainid-paymenttokens)
 */

import { Static } from "@sinclair/typebox";
import { DEFAULT_RPC_ENDPOINT } from "../configs";
import { PayoutConfigSchema } from "../types";

// available tokens for payouts
const PAYMENT_TOKEN_PER_NETWORK: Record<string, { rpc: string; token: string }> = {
  "1": {
    rpc: DEFAULT_RPC_ENDPOINT,
    token: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
  },
  "100": {
    rpc: "https://rpc.gnosischain.com",
    token: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d", // WXDAI
  },
};

type PayoutConfigPartial = Omit<Static<typeof PayoutConfigSchema>, "evmNetworkId" | "privateKey" | "permitBaseUrl">;

/**
 * Returns payout config for a particular network
 * @param evmNetworkId network id
 * @returns RPC URL and payment token
 */
export const getPayoutConfigByNetworkId = (evmNetworkId: number): PayoutConfigPartial => {
  const paymentToken = PAYMENT_TOKEN_PER_NETWORK[evmNetworkId.toString()];
  if (!paymentToken) {
    throw new Error(`No config setup for evmNetworkId: ${evmNetworkId}`);
  }

  return {
    rpc: paymentToken.rpc,
    paymentToken: paymentToken.token,
  };
};
