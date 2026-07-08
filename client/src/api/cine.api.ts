import type Resp from "@/models/Resp";
import type { Cine } from "@/types";
import { createAppRequest } from "./http";

const appRequest = createAppRequest("/cines");

export interface QueryCinesParams {
  keyword?: string;
  genre?: string;
}

export const fetchCines = (
  params: QueryCinesParams = {},
): Promise<Resp<Cine[]>> => {
  const keyword = params.keyword?.trim();
  const genre = params.genre?.trim();

  return appRequest.get("/", {
    params: {
      ...(keyword ? { keyword } : {}),
      ...(genre ? { genre } : {}),
    },
  });
};

export const fetchCineDetail = (id: string): Promise<Resp<Cine>> =>
  appRequest.get(`/${id}`);
