import { PriceConfig } from "../types";

export const DefaultPriceConfig: PriceConfig = {
  baseMultiplier: 1000,
  timeLabels: [
    {
      name: "Time: <1 Hour",
      weight: 0.125,
      value: 3600,
      target: "Price: 12.5+ USD",
    },
    {
      name: "Time: <1 Day",
      weight: 1,
      value: 3600 * 24,
      target: "Price: 100+ USD",
    },
    {
      name: "Time: <1 Week",
      weight: 2,
      value: 3600 * 24 * 7,
      target: "Price: 200+ USD",
    },
    {
      name: "Time: <2 Weeks",
      weight: 3,
      value: 3600 * 24 * 14,
      target: "Price: 300+ USD",
    },
    {
      name: "Time: <1 Month",
      weight: 4,
      value: 3600 * 24 * 30,
      target: "Price: 400+ USD",
    },
  ],
  priorityLabels: [
    {
      name: "Priority: 0 (Normal)",
      weight: 1,
      target: "Price: 100+ USD",
    },
    {
      name: "Priority: 1 (Medium)",
      weight: 2,
      target: "Price: 200+ USD",
    },
    {
      name: "Priority: 2 (High)",
      weight: 3,
      target: "Price: 300+ USD",
    },
    {
      name: "Priority: 3 (Urgent)",
      weight: 4,
      target: "Price: 400+ USD",
    },
    {
      name: "Priority: 4 (Emergency)",
      weight: 5,
      target: "Price: 500+ USD",
    },
  ],
};
