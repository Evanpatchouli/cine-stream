import type Resp from "@/models/Resp";
import type { Cine } from "@/types";
import { createAppRequest } from "./http";

const appRequest = createAppRequest("/cines");

export const fetchCines = (keyword?: string): Promise<Resp<Cine[]>> =>
  appRequest.get("/", {
    params: keyword?.trim() ? { keyword: keyword.trim() } : undefined,
  });

export const fetchCineDetail = (id: string): Promise<Resp<Cine>> =>
  appRequest.get(`/${id}`);
