import type { ApiFormularioRGRL } from "@/app/inicio/empleador/formularioRGRL/types/rgrl";

export type { ApiFormularioRGRL };

export type RgrlLotesResponse = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: ApiFormularioRGRL[];
};
