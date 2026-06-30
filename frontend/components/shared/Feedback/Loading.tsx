// components/shared/Feedback/Loading.tsx
import { LoadPanel } from "devextreme-react/load-panel";
import { PositionConfig } from "devextreme/animation/position";

// 간단한 위치 프리셋 타입
type PositionPreset = "center" | "top" | "bottom";

// Loading 기본값 상수
const DEFAULT_LOADING_WIDTH = 200;
const DEFAULT_LOADING_HEIGHT = 90;

interface Props {
  visible: boolean;
  message?: string;
  showIndicator?: boolean;
  showPane?: boolean;
  shading?: boolean;
  shadingColor?: string;
  width?: number | string;
  height?: number | string;
  position?: PositionConfig | PositionPreset;
}

/**
 * Loading 컴포넌트
 *
 * 데이터 로딩 중 표시하는 스피너 및 오버레이입니다.
 * 페이지 전체 또는 특정 영역에 적용할 수 있습니다.
 * DevExtreme LoadPanel의 모든 기능을 지원합니다.
 *
 * @example
 * // 기본 로딩
 * <Loading visible={isLoading} message="데이터를 불러오는 중..." />
 *
 * // 특정 영역에 로딩
 * <Loading
 *   visible={isLoading}
 *   showIndicator={true}
 *   showPane={true}
 *   shading={true}
 *   position={{ of: '#detailPanel' }}
 *   height={120}
 *   width={200}
 *   shadingColor="rgba(0,0,0,0.3)"
 * />
 *
 * // 간단한 위치 설정
 * <Loading visible={isLoading} position="center" />
 */
export function Loading({
  visible,
  message = "Loading...",
  showIndicator = true,
  showPane = true,
  shading = true,
  shadingColor = "rgba(0,0,0,0)",
  width = DEFAULT_LOADING_WIDTH,
  height = DEFAULT_LOADING_HEIGHT,
  position = "center",
}: Props) {
  // position이 문자열인 경우 DevExtreme PositionConfig로 변환
  const getPositionConfig = (): PositionConfig => {
    if (typeof position === "string") {
      const presetPositions: Record<PositionPreset, PositionConfig> = {
        center: {
          my: { x: "center", y: "center" },
          at: { x: "center", y: "center" },
        },
        top: {
          my: { x: "center", y: "top" },
          at: { x: "center", y: "top" },
          offset: { x: 0, y: 50 },
        },
        bottom: {
          my: { x: "center", y: "bottom" },
          at: { x: "center", y: "bottom" },
          offset: { x: 0, y: -50 },
        },
      };
      return presetPositions[position];
    }

    return position as PositionConfig;
  };

  return (
    <LoadPanel
      visible={visible}
      message={message}
      showIndicator={showIndicator}
      showPane={showPane}
      shading={shading}
      shadingColor={shadingColor}
      width={width}
      height={height}
      position={getPositionConfig()}
    />
  );
}
