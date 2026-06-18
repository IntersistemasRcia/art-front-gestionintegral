import dayjs from "dayjs";
import { AbstractIntermediateContextualInterpreter, type InterpreterContextualExpression } from "./Interpreter";

export type FieldType = "boolean" | "number" | "string" | "date" | "time" | "datetime";
export type FieldFormatter = (value: any) => string;
export interface Field {
  type?: FieldType;
  formatter?: FieldFormatter;
}
export interface Context {
  fields?: Record<string, Field>
}

export const DateFormatter: FieldFormatter = (v: any) => dayjs(v).format("DD/MM/YYYY");
export const TimeFormatter: FieldFormatter = (v: any) => dayjs(v).format("HH:mm:ss.SSS");
export const DateTimeFormatter: FieldFormatter = (v: any) => dayjs(v).format("YYYY-MM-DDTHH:mm:ss.SSS");

class PropositionQueryBuilderJSONContextualExpression implements InterpreterContextualExpression<string | null, Context> {
  private expression: object;

  constructor(expression: object) { this.expression = expression; }

  interpret(context: Context = {}): string | null {
    return interpret(this.expression);

    function interpret(expression: object) {
      if ("combinator" in expression) return interpretCombinator(expression);
      if ("operator" in expression) return interpretOperator(expression);
      return null;
    }

    function interpretCombinator(expression: { combinator: any }): string | null {
      if (typeof expression.combinator !== "string"
        || !("rules" in expression)
        || !Array.isArray(expression.rules)
        || expression.rules.length === 0
      ) return null;
      const params = expression.rules.map(interpret).filter((v) => v != null);
      let args = params.join(",");
      switch (params.length) {
        case 0: return null;
        case 1: return evaluate();
        default: args = `${expression.combinator}(${args})`;
      }
      return evaluate();

      function evaluate() { return ("not" in expression && !!expression.not) ? `not(${args})` : args; }
    }

    function interpretOperator(expression: { operator: any }): string | null {
      if (typeof expression.operator !== "string"
        || !("field" in expression)
        || typeof expression.field !== "string"
      ) return null;
      const field = expression.field;
      let source: "value" | "field" = "value";
      if ("valueSource" in expression) switch (expression.valueSource) {
        case "field": case "value": source = expression.valueSource;
        default: break;
      }
      let value: any = undefined;
      if ("value" in expression) value = expression.value;
      if (value === undefined) return null;
      const { type, formatter } = ((context.fields ?? {})[field]) ?? {};
      if (formatter) value = formatter(value);
      if (!["string", "number", "boolean", "date", "time", "datetime"].includes(getType())
        && !Array.isArray(value)
        && value != null
      ) return null;
      switch(expression.operator) {
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
      
      function getType(v = value) { return type ?? typeof v; }

      function formatValue(v = value): string {
        if (v == null) v = "null";
        if (source === "field") return `${v}`;
        if (Array.isArray(v)) return v.map(e => formatValue(e)).join(",");
        v = reduxValue()
        switch (typeof v) {
          case "boolean": return !v ? "0" : "1";
          case "number": return `${v}`;
          case "string": return `'${v.replace("\\", "\\\\").replace("'", "\\'")}'`;
          default: return "";
        }
        function reduxValue() {
          switch (getType(v)) {
            case "date": return DateFormatter(v);
            case "time": return TimeFormatter(v);
            case "datetime": return DateTimeFormatter(v);
            default: return v;
          }
        }
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
  }
}

export class PropositionQueryBuilderJSONInterpreter extends AbstractIntermediateContextualInterpreter<string | null, object, Context> {
  interpretExpression = (expression: object) => new PropositionQueryBuilderJSONContextualExpression(expression);
}