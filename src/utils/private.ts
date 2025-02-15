import _sodium from "libsodium-wrappers";
import YAML from "yaml";
import { MergedConfig, Payload } from "../types";
import { Context } from "probot";
import merge from "lodash/merge";

import { DefaultConfig } from "../configs";
import { validate } from "./ajv";
import { Config, RepositoryConfig, ConfigSchema } from "../types";

const CONFIG_REPO = "ubiquibot-config";
const CONFIG_PATH = ".github/ubiquibot-config.yml";
const KEY_NAME = "privateKeyEncrypted";
const KEY_PREFIX = "HSK_";

export const getConfigSuperset = async (context: Context, type: "org" | "repo", filePath: string): Promise<string | undefined> => {
  try {
    const payload = context.payload as Payload;
    const repo = type === "org" ? CONFIG_REPO : payload.repository.name;
    const owner = type === "org" ? payload.organization?.login : payload.repository.owner.login;
    if (!repo || !owner) return undefined;
    const { data } = await context.octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      mediaType: {
        format: "raw",
      },
    });
    return data as unknown as string;
  } catch (error: unknown) {
    return undefined;
  }
};

export interface MergedConfigs {
  parsedRepo: RepositoryConfig | undefined;
  parsedOrg: RepositoryConfig | undefined;
  parsedDefault: MergedConfig;
}

export const parseYAML = (data?: string): Config | undefined => {
  try {
    if (data) {
      const parsedData = YAML.parse(data);
      return parsedData ?? undefined;
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};

export const getOrgAndRepoFromPath = (path: string) => {
  const parts = path.split("/");

  if (parts.length !== 2) {
    return { org: null, repo: null };
  }

  const [org, repo] = parts;

  return { org, repo };
};

export const getPrivateKey = async (cipherText: string): Promise<string | undefined> => {
  try {
    await _sodium.ready;
    const sodium = _sodium;

    const privateKey = process.env.X25519_PRIVATE_KEY;
    const publicKey = await getScalarKey(privateKey);

    if (!publicKey || !privateKey) {
      return undefined;
    }

    const binPub = sodium.from_base64(publicKey, sodium.base64_variants.URLSAFE_NO_PADDING);
    const binPriv = sodium.from_base64(privateKey, sodium.base64_variants.URLSAFE_NO_PADDING);
    const binCipher = sodium.from_base64(cipherText, sodium.base64_variants.URLSAFE_NO_PADDING);

    let walletPrivateKey: string | undefined = sodium.crypto_box_seal_open(binCipher, binPub, binPriv, "text");
    walletPrivateKey = walletPrivateKey.replace(KEY_PREFIX, "");
    return walletPrivateKey;
  } catch (error: unknown) {
    return undefined;
  }
};

export const getScalarKey = async (X25519_PRIVATE_KEY: string | undefined): Promise<string | undefined> => {
  try {
    if (X25519_PRIVATE_KEY !== undefined) {
      await _sodium.ready;
      const sodium = _sodium;

      const binPriv = sodium.from_base64(X25519_PRIVATE_KEY, sodium.base64_variants.URLSAFE_NO_PADDING);
      const scalerPub = sodium.crypto_scalarmult_base(binPriv, "base64");
      return scalerPub;
    }
    return undefined;
  } catch (error: unknown) {
    return undefined;
  }
};

const mergeConfigs = (configs: MergedConfigs) => {
  return merge({}, configs.parsedDefault, configs.parsedOrg, configs.parsedRepo);
};

export const getConfig = async (context: Context) => {
  const orgConfig = await getConfigSuperset(context, "org", CONFIG_PATH);
  const repoConfig = await getConfigSuperset(context, "repo", CONFIG_PATH);

  const parsedOrg: RepositoryConfig | undefined = parseYAML(orgConfig);

  if (parsedOrg) {
    const { valid, error } = validate(ConfigSchema, parsedOrg);
    if (!valid) {
      throw new Error(`Invalid org config: ${error}`);
    }
  }
  const parsedRepo: RepositoryConfig | undefined = parseYAML(repoConfig);
  if (parsedRepo) {
    const { valid, error } = validate(ConfigSchema, parsedRepo);
    if (!valid) {
      throw new Error(`Invalid repo config: ${error}`);
    }
  }
  const parsedDefault: MergedConfig = DefaultConfig;

  let privateKeyDecrypted;
  if (parsedRepo && parsedRepo[KEY_NAME]) {
    privateKeyDecrypted = await getPrivateKey(parsedRepo[KEY_NAME]);
  } else if (parsedOrg && parsedOrg[KEY_NAME]) {
    privateKeyDecrypted = await getPrivateKey(parsedOrg[KEY_NAME]);
  } else {
    privateKeyDecrypted = undefined;
  }

  const configs: MergedConfigs = { parsedDefault, parsedOrg, parsedRepo };
  const mergedConfigData: MergedConfig = mergeConfigs(configs);

  const configData = {
    assistivePricing: mergedConfigData.assistivePricing,
    baseMultiplier: mergedConfigData.priceMultiplier,
    commandSettings: mergedConfigData.commandSettings,
    defaultLabels: mergedConfigData.defaultLabels,
    disableAnalytics: mergedConfigData.disableAnalytics,
    evmNetworkId: mergedConfigData.evmNetworkId,
    incentiveMode: mergedConfigData.commentIncentives,
    incentives: mergedConfigData.incentives,
    issueCreatorMultiplier: mergedConfigData.issueCreatorMultiplier,
    maxConcurrentTasks: mergedConfigData.maxConcurrentAssigns,
    newContributorGreeting: mergedConfigData.newContributorGreeting,
    openAIKey: mergedConfigData.openAIKey,
    openAITokenLimit: mergedConfigData.openAITokenLimit,
    permitMaxPrice: mergedConfigData.permitMaxPrice,
    priorityLabels: mergedConfigData.priorityLabels,
    privateKey: privateKeyDecrypted ?? "",
    promotionComment: mergedConfigData.promotionComment,
    publicAccessControl: mergedConfigData.publicAccessControl,
    registerWalletWithVerification: mergedConfigData.registerWalletWithVerification,
    staleTaskTime: mergedConfigData.staleTaskTime,
    timeLabels: mergedConfigData.timeLabels,
  };

  return configData;
};
