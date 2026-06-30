"use client";

import React, { useEffect } from "react";
import { Popup, Button } from "@/components/shared/ui";
import { useMessageStore } from "@/stores/shared/messageStore";

export function MessagePopup() {
  const { currentMessage, handleConfirm, handleCancel } = useMessageStore();

  useEffect(() => {
    if (!currentMessage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentMessage, handleConfirm]);

  if (!currentMessage) return null;

  return (
    <Popup
      visible={true}
      onHiding={handleCancel}
      dragEnabled={false}
      hideOnOutsideClick={false}
      shading={true}
      showTitle={true}
      title={currentMessage.title}
      width={currentMessage.width}
      height={currentMessage.height}
    >
      <div className="text-base" style={{ whiteSpace: "pre-line" }}>
        {currentMessage.content}
      </div>
      <div className="flex justify-end gap-2 pt-10">
        {currentMessage.type === "confirm" ? (
          <>
            <Button
              text={currentMessage.confirmText}
              onClick={handleConfirm}
              width="auto"
              height={40}
              stylingMode={currentMessage.confirmButtonStyle}
              type={currentMessage.confirmButtonType}
              className="min-w-[60px]"
            />
            <Button
              text={currentMessage.cancelText}
              onClick={handleCancel}
              width="auto"
              height={40}
              stylingMode={currentMessage.cancelButtonStyle}
              type={currentMessage.cancelButtonType}
              className="min-w-[60px]"
            />
          </>
        ) : (
          <Button
            text={currentMessage.confirmText}
            onClick={handleConfirm}
            width="auto"
            height={40}
            stylingMode={currentMessage.confirmButtonStyle}
            type={currentMessage.confirmButtonType}
            className="min-w-[60px]"
          />
        )}
      </div>
    </Popup>
  );
}
