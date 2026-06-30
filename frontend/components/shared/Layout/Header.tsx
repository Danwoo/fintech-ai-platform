"use client";

import { Toolbar, Item } from "devextreme-react/toolbar";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/auth-client";
import { showMessage } from "@/components/shared/Feedback";

interface Props {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
}

export function Header({ isDrawerOpen, setIsDrawerOpen }: Props) {
  const router = useRouter();

  return (
    <Toolbar className="flex-none">
      <Item
        widget="dxButton"
        location="before"
        options={{
          icon: isDrawerOpen ? "close" : "menu",
          stylingMode: "text",
          onClick: () => setIsDrawerOpen(!isDrawerOpen),
          elementAttr: {
            class: "dx-button-no-border",
          },
        }}
      />

      <Item location="center" text="관리자 페이지" />

      <Item
        widget="dxButton"
        location="after"
        options={{
          icon: "user",
          text: "마이페이지",
          stylingMode: "text",
          onClick: () => {
            router.push("/admin/common/mypage");
          },
          elementAttr: {
            class: "dx-button-no-border",
          },
        }}
      />
      <Item
        widget="dxButton"
        location="after"
        options={{
          icon: "runner",
          text: "로그아웃",
          stylingMode: "text",
          onClick: async () => {
            showMessage("알림", <div>로그아웃 하시겠습니까?</div>, {
              type: "confirm",
              callback: {
                onCancel: () => {
                  return;
                },
                onConfirm: async () => {
                  sessionStorage.clear();
                  await signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = "/";
                      },
                    },
                  });
                },
              },
            });
          },
          elementAttr: {
            class: "dx-button-no-border",
          },
        }}
      />
    </Toolbar>
  );
}
