// components/shared/ui/HtmlEditor.tsx
import DevHtmlEditor from "devextreme-react/html-editor";

interface Props<T = any> {
  fieldName: keyof T;
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  width?: number | string;
  height?: number | string;
  toolbar?: {
    items: (
      | string
      | {
          name?: string;
          acceptedValues?: any[];
          [key: string]: any;
        }
    )[];
  };
  mediaResizing?: {
    enabled: boolean;
  };
  mentions?: {
    dataSource?: any[];
    displayExpr?: string;
    valueExpr?: string;
  };
  variables?: {
    dataSource?: string[];
  };
  onValueChanged: (fieldName: keyof T, value: any) => void;
  getFieldProps?: (fieldName: keyof T) => any;
}

/**
 * HTML 에디터 컴포넌트
 *
 * 리치 텍스트 편집이 필요한 경우 사용합니다.
 * 게시글 작성, 이메일 템플릿, 공지사항 등 서식이 있는 텍스트 입력에 적합합니다.
 *
 * @example
 * <HtmlEditor
 *   fieldName="content"
 *   height={300}
 *   variables={{ dataSource: ['{{name}}', '{{email}}'] }}
 * />
 */
export function HtmlEditor<T = any>({
  fieldName,
  value,
  placeholder,
  readOnly = false,
  width,
  height = 300,
  toolbar = {
    items: [
      "undo",
      "redo",
      "separator",
      "font",
      "size",
      "bold",
      "italic",
      "underline",
      "strike",
      "separator",
      "alignLeft",
      "alignCenter",
      "alignRight",
      "alignJustify",
      "separator",
      "orderedList",
      "bulletList",
      "separator",
      "header",
      "separator",
      "color",
      "background",
      "separator",
      "link",
      "image",
      "separator",
      "clear",
      "codeBlock",
      "blockquote",
    ],
  },
  mediaResizing = { enabled: true },
  mentions,
  variables,
  onValueChanged,
  getFieldProps,
}: Props<T>) {
  const handleValueChanged = (e: any) => {
    onValueChanged(fieldName, e.value);
  };

  return (
    <DevHtmlEditor
      value={value || ""}
      placeholder={readOnly ? "" : placeholder}
      readOnly={readOnly}
      width={width}
      height={height}
      toolbar={toolbar}
      mediaResizing={mediaResizing}
      mentions={mentions}
      variables={variables}
      onValueChanged={handleValueChanged}
      {...(getFieldProps ? getFieldProps(fieldName) : {})}
    />
  );
}
