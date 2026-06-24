// import { type BaseQueryPageParams, type PaginatedResult } from '@cine-stream/common';
import Resp from "@/models/Resp";
import { createAppRequest } from "./request";

const appRequest = createAppRequest("/login-log");

export const count = (
  range: "daily" | "weekly" | "monthly" | "yearly",
): Promise<Resp<number>> => appRequest.get(`/count/${range}`);

export const getTrendData = (): Promise<
  Resp<Array<{ date: string; count: number; growth: number }>>
> => appRequest.get("/trend/daily");
