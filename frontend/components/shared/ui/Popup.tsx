"use client";

import React from "react";
import { Popup as DxPopup } from "devextreme-react/popup";

export interface Props {
  visible: boolean;
  title?: string;
  width?: number | string;
  height?: number | string;
  onHiding?: () => void;
  showCloseButton?: boolean;
  dragEnabled?: boolean;
  resizeEnabled?: boolean;
  children?: React.ReactNode;
  contentRender?: () => React.ReactNode;
  className?: string;
  position?: any;
  animation?: any;
  shading?: boolean;
  shadingColor?: string;
  hideOnOutsideClick?: boolean | ((e: any) => boolean);
  showTitle?: boolean;
  rtlEnabled?: boolean;
  maxWidth?: number | string;
  maxHeight?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  fullScreen?: boolean;
  hideOnParentScroll?: boolean;
  container?: string | Element;
  wrapperAttr?: any;
}

/**
 * 모달 팝업 컴포넌트
 *
 * - DevExtreme Popup 래퍼
 * - shading=true 시 모달 동작
 * - hideOnOutsideClick 기본 true
 */
export function Popup({
  visible,
  title,
  width = "auto",
  height = "auto",
  onHiding,
  showCloseButton = true,
  dragEnabled = true,
  resizeEnabled = false,
  children,
  contentRender,
  className,
  position,
  animation,
  shading = true,
  shadingColor,
  hideOnOutsideClick = true,
  showTitle = true,
  rtlEnabled = false,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
  fullScreen = false,
  hideOnParentScroll = true,
  container,
  wrapperAttr,
}: Props) {
  return (
    <DxPopup
      visible={visible}
      title={title}
      width={width}
      height={height}
      onHiding={onHiding}
      showCloseButton={showCloseButton}
      dragEnabled={dragEnabled}
      resizeEnabled={resizeEnabled}
      contentRender={contentRender}
      className={className}
      position={position}
      animation={animation}
      shading={shading}
      shadingColor={shadingColor}
      hideOnOutsideClick={hideOnOutsideClick}
      showTitle={showTitle}
      rtlEnabled={rtlEnabled}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      minWidth={minWidth}
      minHeight={minHeight}
      fullScreen={fullScreen}
      hideOnParentScroll={hideOnParentScroll}
      container={container}
      wrapperAttr={wrapperAttr}
    >
      {children}
    </DxPopup>
  );
}
