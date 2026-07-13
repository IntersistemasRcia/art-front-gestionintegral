export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object | undefined ? DeepPartial<T[P]>
  : T[P];
};

export type DeepRecord<T, V> = {
  [P in keyof T]: T[P] extends (infer U)[] | undefined ? DeepRecord<U | T[P], V>
  : T[P] extends object | undefined ? DeepRecord<T[P], V>
  : V;
}

export function camelCaseKeys<Out = any>(o: any): Out {
  if (typeof o !== "object" || !o) return o;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [
    k.charAt(0).toLowerCase() + k.slice(1),
    camelCaseKeys(v)
  ])) as Out;
}

/**
 * Selecciona de `source` propiedades presentes en `select`
 * @param source Objeto desde el que obtener las propiedades
 * @param select Propiedades a obtener de `source`
 * @param keep Mantener propiedades presentes en `select`
 */
export function pick(source: any, select: any, keep = false) {
	if (select == null) return Array.isArray(source) ? [] : {};
  const type = typeof select;
	if (type === "function") return pick(source, select(), keep);
	const keys = type === "object"
    ? Array.isArray(select) ? select : Object.keys(select)
    : [["number", "symbol"].includes(type) ? select : `${select}`];
  return Array.isArray(source)
    ? keep && keys.length ? load(new Array(Math.max(...keys) + 1)) : load([])
    : load({});
  function load(d: any): any {
    keys.filter(k =>  keep || k in source).forEach(k => d[k] = source[k]);
    return d;
  }
};

export function parseNumber<T = any>(value: T) {
  if (value == null) return undefined;
  const result = Number(value);
  return isNaN(result) ? undefined : result;
}

export type TryParseNumberParam<T = any> = { in: T, out?: number };
export function tryParseNumber<T = any>(param: TryParseNumberParam<T>) {
  const result = parseNumber(param.in);
  if (result === undefined) return false;
  param.out = result;
  return true;
}

export function toURLSearch(o: any, execute = false): URLSearchParams | undefined {
  const s = new URLSearchParams();
  if (typeof o === "object") {
    if (Array.isArray(o)) o.filter(v => typeof v !== "function" || execute).forEach((v, i) => load(`${i}`, v));
    else Object.entries(o).filter(([,v]) => typeof v !== "function" || execute).forEach(([k, v]) => load(k, v));
  } else {
    load("", value(o));
  }
  if (s.size > 0) return s;
  return undefined;
  function value(v: any): string | undefined {
    switch (typeof v) {
      case "undefined": return undefined;
      case "function": return execute ? value(v()) : undefined;
      case "object": return JSON.stringify(v);
      default: return `${v}`;
    }
  }
  function load(k: string, v: any) {
    if (Array.isArray(v)) return v.forEach(item => load(k, item));
    v = value(v);
    if (v === undefined) return;
    s.append(k, v);
  }
}

export function isObjectKey<T extends object>(key: any, obj: T): key is keyof T {
  return key in obj;
}

export function getObjectKeys<T extends object>(o: T): Array<keyof T> {
  // Usamos reduce + type guard para construir Array<keyof T> sin casts inseguros
  return Object.keys(o).reduce<Array<keyof T>>((acc, k) => {
    if (isObjectKey(k, o)) acc.push(k);
    return acc;
  }, []);
}

export function arrayToRecord<T = any, K extends keyof any = number, V = any>(
  array: readonly T[],
  entryBuilder: (item: T, index: number) => [K, V] | undefined = (e, i) => [i as K, e as unknown as V],
) {
  const result = {} as Record<K, V>;
  array.forEach((e, i) => {
    const r = entryBuilder(e, i);
    if (!r) return;
    result[r[0]] = r[1];
  });
  return result;
}