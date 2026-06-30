/* eslint-env node */
const { generatorHandler } = require("@prisma/generator-helper");
const fs = require("fs");
const path = require("path");

/**
 * Prisma Schema Complete SQL Generator for SQL Server
 *
 * Prisma 스키마 파일을 파싱하여 완전한 MSSQL 데이터베이스 생성 스크립트를 만듭니다.
 * - 기존 EXTENDED PROPERTIES 삭제
 * - 테이블 생성 (DROP 포함)
 * - EXTENDED PROPERTIES 추가
 */

generatorHandler({
  onManifest() {
    return {
      defaultOutput: "../init",
      prettyName: "Prisma Complete SQL Generator",
      requiresGenerators: [],
    };
  },

  async onGenerate(options) {
    const outputDir = options.generator.output?.value || path.join(options.schemaPath, "..", "init");
    const outputPath = path.join(outputDir, "tables.sql");

    console.log("🔍 Generating complete database SQL...");

    try {
      const models = parseSchema(options.dmmf.datamodel.models, options.dmmf.datamodel.indexes);
      const sql = generateCompleteSQL(models);

      // 출력 디렉토리 생성
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, sql, "utf-8");

      console.log(`✅ Complete SQL file generated: ${outputPath}`);
      console.log(`📊 Models: ${models.length}`);
    } catch (error) {
      console.error("❌ Error generating SQL:", error.message);
      throw error;
    }
  },
});

/**
 * Prisma DMMF 모델을 파싱합니다
 */
function parseSchema(dmmfModels, dmmfIndexes) {
  const models = [];

  for (const model of dmmfModels) {
    const parsedModel = {
      name: model.name,
      comment: model.documentation || null,
      tableName: model.dbName || model.name,
      allFields: [], // 모든 필드 정보 (테이블 생성용 + EXTENDED PROPERTIES용)
      foreignKeys: [], // 외래키 정보
      indexes: [], // 인덱스 정보
    };

    for (const field of model.fields) {
      // 모든 필드 정보 저장 (테이블 생성용 + EXTENDED PROPERTIES용)
      if (field.kind !== "object") {
        // relation 필드 제외

        // nativeType 정보 추출 - Prisma는 [typeName, [args]] 형태로 전달
        let nativeTypeInfo = null;
        if (field.nativeType && Array.isArray(field.nativeType)) {
          nativeTypeInfo = {
            name: field.nativeType[0],
            args: field.nativeType[1] || [],
          };
        }

        parsedModel.allFields.push({
          name: field.name,
          type: typeof field.type === "string" ? field.type : field.type?.name || field.type,
          isRequired: field.isRequired,
          isList: field.isList,
          isId: field.isId,
          isUnique: field.isUnique,
          hasDefaultValue: field.hasDefaultValue,
          default: field.default,
          isUpdatedAt: field.isUpdatedAt,
          documentation: field.documentation, // 주석 포함
          dbName: field.dbName,
          nativeType: nativeTypeInfo,
        });
      } else if (field.kind === "object" && field.relationName) {
        // 외래키 관계 정보 추출
        if (field.relationFromFields && field.relationFromFields.length > 0) {
          parsedModel.foreignKeys.push({
            name: field.relationName,
            fields: field.relationFromFields,
            references: field.relationToFields || [],
            referencedTable: field.type,
          });
        }
      }
    }

    // 복합 키 정보
    if (model.primaryKey) {
      parsedModel.primaryKey = model.primaryKey.fields;
    }

    // 인덱스 정보 - DMMF의 최상위 indexes 배열에서 가져오기
    if (dmmfIndexes && dmmfIndexes.length > 0) {
      const modelIndexes = dmmfIndexes.filter((idx) => idx.model === model.name);

      for (const index of modelIndexes) {
        // type이 'id'인 것은 기본키이므로 제외
        // type이 'normal'인 것이 @@index, 'unique'인 것이 @@unique (필드 레벨이 아닌 경우)
        if (index.type !== "id" && !index.isDefinedOnField) {
          const fieldNames = index.fields.map((f) => f.name);
          parsedModel.indexes.push({
            name: index.name || null,
            fields: fieldNames,
            isUnique: index.type === "unique",
          });
        }
      }
    }

    models.push(parsedModel);
  }

  return models;
}

/**
 * 완전한 MSSQL 데이터베이스 생성 스크립트를 생성합니다
 */
function generateCompleteSQL(models) {
  const sqlLines = [];

  sqlLines.push("-- ============================================================================");
  sqlLines.push("-- Prisma Complete Database Generator (MSSQL)");
  sqlLines.push("-- ============================================================================");
  sqlLines.push("");

  // 1. 기존 EXTENDED PROPERTIES 삭제
  sqlLines.push("-- ============================================================================");
  sqlLines.push("-- 1. 기존 EXTENDED PROPERTIES 삭제");
  sqlLines.push("-- ============================================================================");
  sqlLines.push("");
  sqlLines.push(...generateDropExtendedProperties(models));
  sqlLines.push("");

  // 2. 테이블 생성 (DROP 포함)
  sqlLines.push("-- ============================================================================");
  sqlLines.push("-- 2. 테이블 생성");
  sqlLines.push("-- ============================================================================");
  sqlLines.push("");
  sqlLines.push(...generateTableCreation(models));
  sqlLines.push("");

  // 3. 외래키 생성
  sqlLines.push("-- ============================================================================");
  sqlLines.push("-- 3. 외래키 생성");
  sqlLines.push("-- ============================================================================");
  sqlLines.push("");
  sqlLines.push(...generateForeignKeys(models));
  sqlLines.push("");

  // 4. 인덱스 생성
  sqlLines.push("-- ============================================================================");
  sqlLines.push("-- 4. 인덱스 생성");
  sqlLines.push("-- ============================================================================");
  sqlLines.push("");
  sqlLines.push(...generateIndexes(models));
  sqlLines.push("");

  // 5. EXTENDED PROPERTIES 추가
  sqlLines.push("-- ============================================================================");
  sqlLines.push("-- 5. EXTENDED PROPERTIES 추가");
  sqlLines.push("-- ============================================================================");
  sqlLines.push("");
  sqlLines.push(...generateExtendedProperties(models));

  return sqlLines.join("\n");
}

/**
 * 기존 EXTENDED PROPERTIES 삭제 쿼리 생성
 */
function generateDropExtendedProperties(models) {
  const sqlLines = [];

  for (const model of models) {
    const tableName = model.tableName;

    sqlLines.push(`-- Drop extended properties for ${tableName}`);
    sqlLines.push(`IF OBJECT_ID('dbo.${tableName}', 'U') IS NOT NULL`);
    sqlLines.push(`BEGIN`);

    // 컬럼 주석 삭제
    for (const field of model.allFields) {
      sqlLines.push(`    -- Drop column description for ${field.name}`);
      sqlLines.push(
        `    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.${tableName}') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.${tableName}') AND name = N'${field.name}'))`,
      );
      sqlLines.push(
        `        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'${tableName}', @level2type = N'COLUMN', @level2name = N'${field.name}';`,
      );
    }

    // 테이블 주석 삭제
    sqlLines.push(`    -- Drop table description`);
    sqlLines.push(
      `    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.${tableName}') AND name = N'MS_Description' AND minor_id = 0)`,
    );
    sqlLines.push(
      `        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'${tableName}';`,
    );

    sqlLines.push(`END`);
    sqlLines.push(`GO`);
    sqlLines.push("");
  }

  return sqlLines;
}

/**
 * 테이블 생성 쿼리 생성
 */
function generateTableCreation(models) {
  const sqlLines = [];

  for (const model of models) {
    const tableName = model.tableName;

    // 외래키 제약조건 삭제 (역순으로)
    sqlLines.push(`-- Drop foreign key constraints for ${tableName}`);
    sqlLines.push(`IF OBJECT_ID('dbo.${tableName}', 'U') IS NOT NULL`);
    sqlLines.push(`BEGIN`);
    sqlLines.push(`    DECLARE @sql NVARCHAR(MAX) = '';`);
    sqlLines.push(
      `    SELECT @sql = @sql + 'ALTER TABLE [dbo].[${tableName}] DROP CONSTRAINT ' + QUOTENAME(name) + ';'`,
    );
    sqlLines.push(`    FROM sys.foreign_keys`);
    sqlLines.push(`    WHERE parent_object_id = OBJECT_ID('dbo.${tableName}');`);
    sqlLines.push(`    EXEC sp_executesql @sql;`);
    sqlLines.push(`END`);
    sqlLines.push(`GO`);
    sqlLines.push("");
  }

  // 테이블 삭제 및 생성
  for (const model of models) {
    const tableName = model.tableName;

    sqlLines.push(`-- Drop and create table ${tableName}`);
    sqlLines.push(`IF OBJECT_ID('dbo.${tableName}', 'U') IS NOT NULL`);
    sqlLines.push(`    DROP TABLE [dbo].[${tableName}];`);
    sqlLines.push(`GO`);
    sqlLines.push("");

    sqlLines.push(`CREATE TABLE [dbo].[${tableName}] (`);

    // 컬럼 정의
    const columnDefs = model.allFields.map((field, index) => {
      const columnDef = generateColumnDefinition(field);
      return `    ${columnDef}${index < model.allFields.length - 1 ? "," : ""}`;
    });

    sqlLines.push(...columnDefs);

    // Primary Key 정의
    if (model.primaryKey && model.primaryKey.length > 0) {
      const pkColumns = model.primaryKey.join("], [");
      sqlLines.push(`    CONSTRAINT [PK_${tableName}] PRIMARY KEY CLUSTERED ([${pkColumns}])`);
    } else {
      // 단일 @id 필드 찾기
      const idField = model.allFields.find((f) => f.isId);
      if (idField) {
        sqlLines.push(`    CONSTRAINT [PK_${tableName}] PRIMARY KEY CLUSTERED ([${idField.name}])`);
      }
    }

    sqlLines.push(`);`);
    sqlLines.push(`GO`);
    sqlLines.push("");
  }

  return sqlLines;
}

/**
 * 컬럼 정의 생성
 */
function generateColumnDefinition(field) {
  let columnDef = `[${field.name}] `;

  // 데이터 타입 매핑
  columnDef += mapPrismaTypeToSQL(field);

  // IDENTITY (autoincrement)
  if (field.hasDefaultValue && field.default && field.default.name === "autoincrement") {
    columnDef += " IDENTITY(1,1)";
  }

  // NULL 여부
  columnDef += field.isRequired ? " NOT NULL" : " NULL";

  // DEFAULT 값
  if (field.hasDefaultValue && field.default) {
    if (field.default.name === "now") {
      columnDef += " DEFAULT GETDATE()";
    } else if (field.default.name === "dbgenerated") {
      // dbgenerated는 스킵
    } else if (field.default.name !== "autoincrement") {
      const defaultValue = typeof field.default === "object" ? field.default.args?.[0] : field.default;
      if (defaultValue !== undefined) {
        columnDef += ` DEFAULT ${formatDefaultValue(defaultValue, field.type)}`;
      }
    }
  }

  // UNIQUE
  if (field.isUnique) {
    columnDef += " UNIQUE";
  }

  return columnDef;
}

/**
 * Prisma 타입을 SQL Server 타입으로 매핑
 */
function mapPrismaTypeToSQL(field) {
  const type = field.type;

  // Prisma의 native type 정보 확인 (@db.NVarChar(100) 등)
  if (field.nativeType && field.nativeType.name) {
    const nativeType = field.nativeType;

    // NVarChar, VarChar 등의 타입 처리
    if (nativeType.name === "NVarChar" || nativeType.name === "VarChar") {
      const length = nativeType.args?.[0];
      // length가 숫자인지 확인
      if (length !== undefined && length !== null) {
        // 숫자로 변환 가능한지 확인
        const numLength = Number(length);
        if (!isNaN(numLength) && numLength > 0) {
          return `${nativeType.name.toUpperCase()}(${numLength})`;
        }
      }
      // length가 없거나 유효하지 않으면 MAX 사용
      return `${nativeType.name.toUpperCase()}(MAX)`;
    }

    // Text 타입
    if (nativeType.name === "Text") {
      return "NVARCHAR(MAX)";
    }

    // Decimal 타입
    if (nativeType.name === "Decimal") {
      const precision = nativeType.args?.[0] || 18;
      const scale = nativeType.args?.[1] || 2;
      return `DECIMAL(${precision},${scale})`;
    }

    // DateTime 타입
    if (nativeType.name === "DateTime" || nativeType.name === "DateTime2") {
      return "DATETIME2";
    }

    // 기타 native type은 그대로 사용
    if (nativeType.args && nativeType.args.length > 0) {
      return `${nativeType.name.toUpperCase()}(${nativeType.args.join(",")})`;
    }
    return nativeType.name.toUpperCase();
  }

  // 기본 타입 매핑 (native type이 없는 경우)
  switch (type) {
    case "String":
      return "NVARCHAR(MAX)";
    case "Int":
      return "INT";
    case "BigInt":
      return "BIGINT";
    case "Float":
      return "FLOAT";
    case "Decimal":
      return "DECIMAL(18,2)";
    case "Boolean":
      return "BIT";
    case "DateTime":
      return "DATETIME2";
    case "Json":
      return "NVARCHAR(MAX)";
    case "Bytes":
      return "VARBINARY(MAX)";
    default:
      return "NVARCHAR(MAX)";
  }
}

/**
 * DEFAULT 값 포맷팅
 */
function formatDefaultValue(value, type) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (type === "String") {
    return `N'${escapeSQLString(value)}'`;
  }

  if (type === "Boolean") {
    return value ? "1" : "0";
  }

  return value;
}

/**
 * 외래키 생성 쿼리 생성
 */
function generateForeignKeys(models) {
  const sqlLines = [];

  for (const model of models) {
    const tableName = model.tableName;

    if (model.foreignKeys && model.foreignKeys.length > 0) {
      for (const fk of model.foreignKeys) {
        // 참조 테이블 찾기
        const referencedModel = models.find((m) => m.name === fk.referencedTable);
        if (!referencedModel) continue;

        const referencedTableName = referencedModel.tableName;
        const fkName = `FK_${tableName}_${fk.fields.join("_")}`;
        const fkColumns = fk.fields.join("], [");
        const refColumns = fk.references.join("], [");

        sqlLines.push(`-- Add foreign key for ${tableName}.${fk.fields.join(", ")}`);
        sqlLines.push(
          `ALTER TABLE [dbo].[${tableName}] ADD CONSTRAINT [${fkName}] ` +
            `FOREIGN KEY ([${fkColumns}]) REFERENCES [dbo].[${referencedTableName}] ([${refColumns}]);`,
        );
        sqlLines.push(`GO`);
        sqlLines.push("");
      }
    }
  }

  return sqlLines;
}

/**
 * 인덱스 생성 쿼리 생성
 */
function generateIndexes(models) {
  const sqlLines = [];

  for (const model of models) {
    const tableName = model.tableName;

    if (model.indexes && model.indexes.length > 0) {
      for (let i = 0; i < model.indexes.length; i++) {
        const index = model.indexes[i];
        const indexName = index.name || `IX_${tableName}_${index.fields.join("_")}`;
        const indexColumns = index.fields.join("], [");
        const uniqueKeyword = index.isUnique ? "UNIQUE " : "";

        sqlLines.push(`-- Add index for ${tableName}.${index.fields.join(", ")}`);
        sqlLines.push(
          `CREATE ${uniqueKeyword}NONCLUSTERED INDEX [${indexName}] ON [dbo].[${tableName}] ([${indexColumns}]);`,
        );
        sqlLines.push(`GO`);
        sqlLines.push("");
      }
    }
  }

  return sqlLines;
}

/**
 * EXTENDED PROPERTIES 추가 쿼리 생성
 */
function generateExtendedProperties(models) {
  const sqlLines = [];

  for (const model of models) {
    const tableName = model.tableName;

    sqlLines.push(`-- Add extended properties for ${tableName}`);

    // 테이블 주석
    if (model.comment) {
      sqlLines.push(
        `EXEC sp_addextendedproperty ` +
          `@name = N'MS_Description', ` +
          `@value = N'${escapeSQLString(model.comment)}', ` +
          `@level0type = N'SCHEMA', @level0name = N'dbo', ` +
          `@level1type = N'TABLE', @level1name = N'${tableName}';`,
      );
      sqlLines.push(`GO`);
    }

    // 컬럼 주석 (allFields에서 가져오기 - 모든 필드 포함)
    for (const field of model.allFields) {
      if (field.documentation) {
        sqlLines.push(
          `EXEC sp_addextendedproperty ` +
            `@name = N'MS_Description', ` +
            `@value = N'${escapeSQLString(field.documentation)}', ` +
            `@level0type = N'SCHEMA', @level0name = N'dbo', ` +
            `@level1type = N'TABLE', @level1name = N'${tableName}', ` +
            `@level2type = N'COLUMN', @level2name = N'${field.name}';`,
        );
        sqlLines.push(`GO`);
      }
    }

    sqlLines.push("");
  }

  return sqlLines;
}

/**
 * SQL 문자열 이스케이프 처리
 */
function escapeSQLString(str) {
  return str.replace(/'/g, "''");
}
