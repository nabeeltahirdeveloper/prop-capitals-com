import { mt5EngineAdapter } from "./Mt5EngineAdapter";
import { bybitEngine } from "./BybitEngine";
import { pt5Engine } from "./Pt5Engine";
import type { TradingEngine } from "./types";

export type { TradingEngine } from "./types";

const engineByPlatform: Record<string, TradingEngine> = {
  mt5: mt5EngineAdapter,
  bybit: bybitEngine,
  pt5: pt5Engine,
};

export const getTradingEngineForPlatform = (
  platform: string,
): TradingEngine => {
  const key = String(platform || "mt5").toLowerCase();
  return engineByPlatform[key] || mt5EngineAdapter;
};
