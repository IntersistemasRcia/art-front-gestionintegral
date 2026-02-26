// src/utils/PropositionFormatQuery.ts

import type {
  FormatQueryOptions,
  RuleGroupProcessor,
  RuleGroupType,
  RuleGroupTypeIC,
  RuleProcessor,
  RuleType,
  ValueProcessorOptions,
  Field
} from "react-querybuilder";
import dayjs from 'dayjs';
import { parseNumber } from "./utils";

type CustomFields = Field[] | (() => Field[]);

// 2. Extiende o crea un nuevo tipo de opciones que use CustomFields
interface CustomFormatQueryOptions extends Omit<FormatQueryOptions, 'fields'> {
 fields?: CustomFields;
}

export const ruleGroupProcessor: RuleGroupProcessor = (ruleGroup, options, meta) => {
  const params = ruleGroup.rules.map(processor).filter(r => r != null);
  const args = params.join(",");
  switch (params.length) {
    case 0: return;
    case 1: return evaluate(args);
    default: break;
  }
  return evaluate(`${ruleGroup.combinator}(${args})`);
  function processor(rule: RuleType | RuleGroupType | RuleGroupTypeIC | string) {
    if (typeof rule === "string") return rule;
    return ("operator" in rule)
      ? options.ruleProcessor(rule, options as ValueProcessorOptions, meta)
      : ruleGroupProcessor(rule, options, meta);
  }
  function evaluate(args: string) { return (!ruleGroup.not) ? args : `not(${args})`; }
}

export const ruleProcessor: RuleProcessor = (rule, options, meta) => {
  const { field, operator, valueSource: source } = rule;

    // Ahora, TypeScript sabe que options.fields puede ser una función.
  const fieldsValue = (options as CustomFormatQueryOptions)?.fields;
  const fieldsArray = typeof fieldsValue === 'function' 
    ? fieldsValue()
    : fieldsValue ?? []; 

  const fieldInfo = fieldsArray.find(f => "name" in f && f.name === field) ?? {};

  const inputType = ("inputType" in fieldInfo) ? fieldInfo.inputType : undefined;
  const value = rule.value;
  if (value === undefined) return null;
  if (!["string", "number", "boolean"].includes(typeof value)
    && !Array.isArray(value)
    && value != null
  ) return null;
  switch (operator) {
    case "=": return `eq(${field},${formatValue()})`;
    case "!=": return `neq(${field},${formatValue()})`;
    case "<": return `lt(${field},${formatValue()})`;
    case ">": return `gt(${field},${formatValue()})`;
    case "<=": return `lte(${field},${formatValue()})`;
    case ">=": return `gte(${field},${formatValue()})`;
    case "contains": return like({ pre: "%", pos: "%" });
    case "beginsWith": return like({ pos: "%" });
    case "endsWith": return like({ pre: "%" });
    case "doesNotContain": return `not(${like({ pre: "%", pos: "%" })})`;
    case "doesNotBeginWith": return `not(${like({ pos: "%" })})`;
    case "doesNotEndWith": return `not(${like({ pre: "%" })})`;
    case "null": return `eq(${field},null)`;
    case "notNull": return `neq(${field},null)`;
    case "in": return `in(${field},${formatValue(asArray())})`;
    case "notIn": return `not(in(${field},${formatValue(asArray())}))`;
    case "between": return between();
    case "notBetween": return between({ a: "lt", b: "gt" });
    default: return null;
  }
  function formatValue(v = value): string {
    if (v == null) v = "null";
    if (source === "field") return `${v}`;
    if (Array.isArray(v)) return v.map(e => formatValue(e)).join(",");
    v = getInputValue();
    switch (typeof v) {
      case "string": return `'${sanitizeStringValue(v)}'`;
      case "number": return `${v}`;
      case "boolean": return !v ? "0" : "1";
      default: return "";
    }
    function getInputValue() {
      switch (typeof inputType === "string" ? inputType.toLowerCase() : "") {
        case "date": return dayjs(v).format("YYYY-MM-DD");
        case "time": return dayjs(v).format("HH:mm:ss.SSS");
        case "number": return options?.parseNumbers ? parseNumber(v) ?? v : v;
        case "datetime":
        case "datetime-local": return dayjs(v).format("YYYY-MM-DDTHH:mm:ss.SSS");
        default: return v;
      }
    }
  }

  function sanitizeStringValue(input: string) {
    return String(input)
      .replace(/[\t\r\n]+/g, " ")
      .trim()
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
  }
  function like(opc?: { pre?: string, value?: any, pos?: string }) {
    if (source === "field") return formatValue();
    const pre = opc?.pre ?? "";
    const val = opc?.value ?? value;
    const pos = opc?.pos ?? "";
    return `like(${formatValue(`${pre}${val}${pos}`)},${field})`;
  }
  function asArray(v = value) {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.includes(",")) return v.split(",");
    return [v];
  }
  function between(opc?: { value?: any, a?: string, b?: string }) {
    const v = opc?.value ?? value;
    const a = opc?.a ?? "gte";
    const b = opc?.b ?? "lte";
    const array = asArray(v);
    if (array.length === 0) return null;
    let v0 = formatValue(array[0]);
    let v1 = (array.length > 1) ? formatValue(array[1]) : v0;
    return `and(${a}(${field},${v0}),${b}(${field},${v1}))`;
  }
}

export const propositionFormatOptions: FormatQueryOptions = { ruleProcessor, ruleGroupProcessor, parseNumbers: true }

export default function propositionFormat(options?: FormatQueryOptions): FormatQueryOptions {
  return { ...options, ...propositionFormatOptions }
};