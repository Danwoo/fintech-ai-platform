"use client";

import { useState, useEffect } from "react";
import { Toast } from "devextreme-react/toast";

// 토스트 큐를 관리할 전역 변수들
const toastQueue: { message: string; type: string; duration: number }[] = [];
let setVisibleFn: ((value: boolean) => void) | null = null;
let setMessageFn: ((value: string) => void) | null = null;
let setTypeFn: ((value: string) => void) | null = null;
let setDurationFn: ((value: number) => void) | null = null;
let isProcessing = false;

// 토스트 메시지 표시 함수
export function showToast(
  message: string | undefined,
  type: "success" | "error" | "info" | "warning" = "info",
  duration = 2000,
) {
  if (!message) {
    return;
  }

  // 큐에 메시지 추가
  toastQueue.push({ message, type, duration });

  // 현재 처리 중이 아니면 처리 시작
  if (!isProcessing && setVisibleFn) {
    processNextToast();
  }
}

// 큐에서 다음 토스트 처리
function processNextToast() {
  if (toastQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { message, type, duration } = toastQueue.shift()!;

  if (setMessageFn && setTypeFn && setDurationFn && setVisibleFn) {
    setMessageFn(message);
    setTypeFn(type);
    setDurationFn(duration);
    setVisibleFn(true);
  }
}

// 토스트 알림 컴포넌트
export function ToastNotification() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<string>("info");
  const [duration, setDuration] = useState(2000);

  // 상태 업데이트 함수 저장
  useEffect(() => {
    setVisibleFn = setVisible;
    setMessageFn = setMessage;
    setTypeFn = setType;
    setDurationFn = setDuration;

    // 컴포넌트 마운트 시 대기 중인 메시지가 있으면 처리
    if (toastQueue.length > 0 && !isProcessing) {
      processNextToast();
    }

    return () => {
      setVisibleFn = null;
      setMessageFn = null;
      setTypeFn = null;
      setDurationFn = null;
    };
  }, []);

  // 토스트 닫기 처리
  const handleHiding = () => {
    setVisible(false);

    // 약간의 지연 후 다음 메시지 처리
    setTimeout(() => {
      processNextToast();
    }, 300);
  };

  return (
    <Toast
      visible={visible}
      message={message}
      type={type as any}
      displayTime={duration}
      onHiding={handleHiding}
      position={{
        my: { x: "right", y: "top" },
        at: { x: "right", y: "top" },
        offset: { x: -10, y: 10 },
      }}
      width={300}
    />
  );
}
