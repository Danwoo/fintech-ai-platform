// lib/devextreme/filters.ts
export function convertFilterToPrismaWhere(filter: any): any {
  if (!filter) return {};

  if (typeof filter === "string") {
    try {
      filter = JSON.parse(filter);
    } catch {
      return {};
    }
  }

  if (!Array.isArray(filter)) return {};

  return parseFilterArray(filter);
}

function parseFilterArray(filter: any[]): any {
  if (filter.length === 3 && typeof filter[0] === "string") {
    // 단일 조건: ["field", "operator", value]
    const [field, operator, value] = filter;
    return createFieldCondition(field, operator, value);
  }

  // 복합 조건 처리
  const conditions: any[] = [];
  let logicalOperator = "AND";

  for (let i = 0; i < filter.length; i++) {
    const item = filter[i];

    if (Array.isArray(item)) {
      const condition = parseFilterArray(item);
      if (Object.keys(condition).length > 0) {
        conditions.push(condition);
      }
    } else if (typeof item === "string" && (item.toLowerCase() === "and" || item.toLowerCase() === "or")) {
      logicalOperator = item.toUpperCase();
    }
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];

  return logicalOperator === "OR" ? { OR: conditions } : { AND: conditions };
}

function coerceValue(value: any): any {
  if (typeof value !== "string") return value;
  if (/\d{4}[-/]\d{2}[-/]\d{2}/.test(value)) {
    // 슬래시를 하이픈으로, 공백을 T로 변환 후 Z 추가 → UTC로 강제 해석
    const normalized = value.replace(/\//g, "-").replace(" ", "T") + "Z";
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
}

function createFieldCondition(field: string, operator: string, value: any): any {
  switch (operator) {
    case "contains":
      return { [field]: { contains: value } };

    case "notcontains":
      return { [field]: { not: { contains: value } } };

    case "startswith":
      return { [field]: { startsWith: value } };

    case "endswith":
      return { [field]: { endsWith: value } };

    case "=":
      return value === null ? { [field]: null } : { [field]: { equals: coerceValue(value) } };

    case "<>":
    case "!=":
      return value === null ? { [field]: { not: null } } : { [field]: { not: coerceValue(value) } };

    case ">":
      return { [field]: { gt: coerceValue(value) } };

    case ">=":
      return { [field]: { gte: coerceValue(value) } };

    case "<":
      return { [field]: { lt: coerceValue(value) } };

    case "<=":
      return { [field]: { lte: coerceValue(value) } };

    case "between":
      if (Array.isArray(value) && value.length === 2) {
        return { [field]: { gte: coerceValue(value[0]), lte: coerceValue(value[1]) } };
      }
      return {};

    case "in":
    case "anyof":
      return Array.isArray(value) ? { [field]: { in: value } } : {};

    case "notin":
    case "noneof":
      return Array.isArray(value) ? { [field]: { notIn: value } } : {};

    case "isblank":
      return {
        OR: [{ [field]: null }, { [field]: { equals: "" } }],
      };

    case "isnotblank":
      return {
        AND: [{ [field]: { not: null } }, { [field]: { not: "" } }],
      };

    default:
      return { [field]: { equals: value } };
  }
}

export function convertSortToPrismaOrderBy(sort: any): any[] | undefined {
  if (!sort) return undefined;

  if (typeof sort === "string") {
    try {
      sort = JSON.parse(sort);
    } catch {
      return undefined;
    }
  }

  if (!Array.isArray(sort) || sort.length === 0) return undefined;

  const orderBy: any[] = [];

  for (const sortItem of sort) {
    if (sortItem.selector) {
      orderBy.push({
        [sortItem.selector]: sortItem.desc ? "desc" : "asc",
      });
    }
  }

  return orderBy.length > 0 ? orderBy : undefined;
}
