// stores/shared/messageStore.ts
import { create } from "zustand";

interface MessageItem {
  id: string;
  title: string;
  content: React.ReactNode;
  type: "alert" | "confirm";
  confirmText?: string;
  cancelText?: string;
  resolve?: (value: boolean) => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  width?: number | string;
  height?: number | string;
  confirmButtonType?: "default" | "success" | "danger" | "normal";
  cancelButtonType?: "default" | "success" | "danger" | "normal";
  confirmButtonStyle?: "text" | "outlined" | "contained";
  cancelButtonStyle?: "text" | "outlined" | "contained";
}

interface MessageOptions {
  type?: "alert" | "confirm";
  confirmText?: string;
  cancelText?: string;
  width?: number | string;
  height?: number | string;
  confirmButtonType?: "default" | "success" | "danger" | "normal";
  cancelButtonType?: "default" | "success" | "danger" | "normal";
  confirmButtonStyle?: "text" | "outlined" | "contained";
  cancelButtonStyle?: "text" | "outlined" | "contained";
  callback?: {
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
  };
}

// 기본값 상수 정의
const DEFAULT_MESSAGE_CONFIG = {
  type: "alert" as const,
  confirmText: "확인",
  cancelText: "취소",
  width: 400,
  height: "auto" as const,
  confirmButtonType: "default" as const,
  cancelButtonType: "normal" as const,
  confirmButtonStyle: "contained" as const,
  cancelButtonStyle: "outlined" as const,
};

interface MessageStore {
  messages: MessageItem[];
  currentMessage: MessageItem | null;

  showMessage: (title: string, content: React.ReactNode, options?: MessageOptions) => Promise<boolean>;

  processNext: () => void;
  resolveMessage: (result: boolean) => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  currentMessage: null,

  showMessage: (title: string, content: React.ReactNode, options: MessageOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = Date.now().toString() + Math.random();
      const newMessage: MessageItem = {
        id,
        title,
        content,
        type: options.type || DEFAULT_MESSAGE_CONFIG.type,
        confirmText: options.confirmText || DEFAULT_MESSAGE_CONFIG.confirmText,
        cancelText: options.cancelText || DEFAULT_MESSAGE_CONFIG.cancelText,
        width: options.width || DEFAULT_MESSAGE_CONFIG.width,
        height: options.height || DEFAULT_MESSAGE_CONFIG.height,
        confirmButtonType: options.confirmButtonType || DEFAULT_MESSAGE_CONFIG.confirmButtonType,
        cancelButtonType: options.cancelButtonType || DEFAULT_MESSAGE_CONFIG.cancelButtonType,
        confirmButtonStyle: options.confirmButtonStyle || DEFAULT_MESSAGE_CONFIG.confirmButtonStyle,
        cancelButtonStyle: options.cancelButtonStyle || DEFAULT_MESSAGE_CONFIG.cancelButtonStyle,
        resolve,
        onConfirm: options.callback?.onConfirm,
        onCancel: options.callback?.onCancel,
      };

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      if (!get().currentMessage) {
        setTimeout(() => get().processNext(), 0);
      }
    });
  },

  processNext: () => {
    const { messages } = get();
    if (messages.length > 0) {
      set({
        currentMessage: messages[0],
        messages: messages.slice(1),
      });
    }
  },

  resolveMessage: (result: boolean) => {
    const { currentMessage } = get();
    if (currentMessage?.resolve) {
      currentMessage.resolve(result);
    }
    set({ currentMessage: null });
    setTimeout(() => get().processNext(), 100);
  },

  handleConfirm: async () => {
    const { currentMessage } = get();

    if (currentMessage?.onConfirm) {
      try {
        await currentMessage.onConfirm();
      } catch (error) {
        console.error("Confirm callback error:", error);
      }
    }

    get().resolveMessage(true);
  },

  handleCancel: async () => {
    const { currentMessage } = get();

    if (currentMessage?.onCancel) {
      try {
        await currentMessage.onCancel();
      } catch (error) {
        console.error("Cancel callback error:", error);
      }
    }

    get().resolveMessage(false);
  },
}));

export const showMessage = (title: string, content: React.ReactNode, options?: MessageOptions): Promise<boolean> => {
  return useMessageStore.getState().showMessage(title, content, options);
};
