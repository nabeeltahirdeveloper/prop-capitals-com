import { mt5Engine } from "./mt5Engine";

const engineByPlatform: Record<string, typeof mt5Engine> = {
  mt5: mt5Engine,
  bybit: mt5Engine,
  pt5: mt5Engine,
};

export const getTradingEngineForPlatform = (platform: string) => {
  const key = String(platform || "mt5").toLowerCase();
  return engineByPlatform[key] || mt5Engine;
};
