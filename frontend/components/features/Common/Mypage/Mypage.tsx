"use client";

import { FC, useState, useCallback, useEffect, useMemo } from "react";
import { signOut } from "@/lib/auth/auth-client";

import { fetchMyInfo, updateMyInfo, deleteMyAccount } from "@/services/common/mypageService";
import { getApiErrorMessage } from "@/utils/common/errors";

// DevExtreme 컴포넌트 및 유틸리티 임포트
import { Button } from "@/components/shared/ui/Button";
import { TextBox, Button as TextBoxButton } from "devextreme-react/text-box";
import { type TextBoxTypes } from "devextreme-react/text-box";
import { type ButtonTypes } from "devextreme-react/button";

// MessagePopup 컴포넌트 임포트
import { showMessage } from "@/components/shared/Feedback";

interface Props {}

export const Mypage: FC<Props> = () => {
  const [data, setData] = useState<any>(null);
  const [passwordMode, setPasswordMode] = useState<TextBoxTypes.TextBoxType>("password");
  const [confirmPasswordMode, setConfirmPasswordMode] = useState<TextBoxTypes.TextBoxType>("password");
  const [passwordError, setPasswordError] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    dept: "",
  });

  const passwordButton = useMemo<ButtonTypes.Properties>(
    () => ({
      icon: passwordMode === "password" ? "eyeclose" : "eyeopen",
      stylingMode: "text",
      onClick: () => {
        setPasswordMode((prevPasswordMode: string) => (prevPasswordMode === "text" ? "password" : "text"));
      },
    }),
    [passwordMode],
  );

  const confirmPasswordButton = useMemo<ButtonTypes.Properties>(
    () => ({
      icon: confirmPasswordMode === "password" ? "eyeclose" : "eyeopen",
      stylingMode: "text",
      onClick: () => {
        setConfirmPasswordMode((prevPasswordMode: string) => (prevPasswordMode === "text" ? "password" : "text"));
      },
    }),
    [confirmPasswordMode],
  );

  // 비밀번호 일치 여부 확인
  const validatePassword = (password: string, confirmPassword: string) => {
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setPasswordError("비밀번호가 일치하지 않습니다.");
        return false;
      } else if (password && password.length < 8) {
        setPasswordError("비밀번호는 8자리 이상이어야 합니다.");
        return false;
      } else {
        setPasswordError("");
        return true;
      }
    }
    return true;
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e: any) => {
    const newPassword = e.value;
    setFormData((prev) => ({
      ...prev,
      password: newPassword,
    }));
    validatePassword(newPassword, formData.confirmPassword);
  };

  // 비밀번호 확인 변경 핸들러
  const handleConfirmPasswordChange = (e: any) => {
    const newConfirmPassword = e.value;
    setFormData((prev) => ({
      ...prev,
      confirmPassword: newConfirmPassword,
    }));
    validatePassword(formData.password, newConfirmPassword);
  };

  // 회원정보 수정
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const userEmail = e.target.email.value;
    const userPass = e.target.password.value;
    const userConfirmPass = e.target.confirmPassword.value;
    const userName = e.target.name.value;
    const userDept = e.target.dept.value;

    // 비밀번호 확인 로직
    if (userPass && !validatePassword(userPass, userConfirmPass)) {
      showMessage("알림", <div>{passwordError}</div>);
      return;
    }

    const isValid = await memberMyInfoChangeApi(userEmail, userPass, userName, userDept);

    if (isValid) {
      showMessage("알림", <div>마이페이지 정보가 변경되었습니다.</div>);
    }
  };

  const memberMyInfoChangeApi = async (userEmail: string, userPass: string, userName: string, userDept: string) => {
    try {
      const result = await updateMyInfo({
        email: userEmail,
        password: userPass || undefined,
        name: userName,
        dept: userDept,
      });
      if (result?.name === "password") {
        showMessage("알림", <div>비밀번호 8자리 이상 입력해주세요.</div>);
        return false;
      }
      if (result?.name === "name") {
        showMessage("알림", <div>이름을 2자리 이상 다시 입력해주세요.</div>);
        return false;
      }
      return result?.result ?? false;
    } catch (error) {
      showMessage("오류", <div>{getApiErrorMessage(error)}</div>);
      return false;
    }
  };

  // 회원탈퇴
  const AccountDeletion = async () => {
    showMessage(
      "회원탈퇴 안내",
      <div className="whitespace-pre-line max-w-[800px] p-4 mx-auto">
        <p>안녕하세요, 예시회사 입니다.</p>
        <p className="mt-4 mb-3"> 회원 탈퇴를 진행하시려면 아래 안내 사항을 확인해 주세요 : </p>
        <div className="mt-2">
          1. <b>탈퇴 후 데이터 삭제:</b> 회원 탈퇴가 완료되면, 회원님의 계정 및 관련 데이터는 영구적으로 삭제됩니다.
          복구할 수 없으니 신중히 결정해 주세요.
        </div>
        <div className="mt-4">
          2. <b>서비스 이용 불가:</b> 탈퇴 후에는 사이트의 모든 기능과 서비스에 접근할 수 없습니다. 탈퇴를 원하신다면
          현재 사용 중인 서비스 및 데이터가 더 이상 필요 없는지 확인해 주세요.
        </div>
        <p className="mt-4">
          <b>문의:</b> 탈퇴 과정에서 문제가 발생하거나 추가적인 도움이 필요하시면 02-0000-0000 로 문의해 주세요.
        </p>
        <p className="mt-4 font-semibold">탈퇴를 진행하시겠습니까?</p>
        <p className="mt-2 text-red-500">탈퇴 후에는 복구할 수 없으니 신중히 결정해 주세요.</p>
      </div>,
      {
        type: "confirm",
        width: 800,
        height: "auto",
        confirmText: "탈퇴하기",
        cancelText: "취소",
        confirmButtonType: "danger",
        callback: {
          onCancel: () => {
            return;
          },
          onConfirm: async () => {
            try {
              await deleteMyAccount();

              showMessage("알림", <div>회원탈퇴가 완료되었습니다.</div>, {
                callback: {
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
            } catch (error) {
              showMessage("오류", <div style={{ whiteSpace: "pre-line" }}>{getApiErrorMessage(error)}</div>);
            }
          },
        },
      },
    );
  };

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchMyInfo();
      if (result) setData(result);
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      {data && (
        <div className="w-full">
          <h1 className="flex items-center text-[#192850] font-semibold text-xl w-full border-b-[1px] border-[#E5E9F2] p-5 sm:p-7">
            마이페이지
          </h1>
          <div className="p-5">
            <div className="text-[#192850] font-semibold text-xl pt-5">내 정보 설정</div>
            <div className="text-[#979FB1] font-medium text-sm py-5">내 정보 및 비밀번호를 변경하실 수 있습니다.</div>

            <form action="#" method="POST" className="space-y-4" onSubmit={handleSubmit}>
              <div className="sm:flex w-full sm:gap-5 sm:max-w-3xl">
                <div className="w-full items-center">
                  <label htmlFor="email" className="block text-sm font-medium leading-9 text-[#192850]">
                    이메일 주소
                  </label>
                  <TextBox
                    id="email"
                    name="email"
                    mode="email"
                    stylingMode="outlined"
                    width="100%"
                    height={48}
                    readOnly={true}
                    defaultValue={data.email}
                    className="rounded-xl bg-[#FBFBFB] text-black text-opacity-40"
                  />
                </div>
                <div className="w-full items-center">
                  <label htmlFor="name" className="block text-sm font-medium leading-9 text-[#192850]">
                    이름
                  </label>
                  <TextBox
                    id="name"
                    name="name"
                    stylingMode="outlined"
                    width="100%"
                    height={48}
                    defaultValue={data.name}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="sm:flex w-full sm:gap-5 sm:max-w-3xl">
                <div className="w-full items-center">
                  <label htmlFor="dept" className="block text-sm font-medium leading-9 text-[#192850]">
                    소속
                  </label>
                  <TextBox
                    id="dept"
                    name="dept"
                    stylingMode="outlined"
                    width="100%"
                    height={48}
                    defaultValue={data.dept}
                    className="rounded-xl"
                  />
                </div>
                <div className="w-full items-center">
                  <label htmlFor="company" className="block text-sm font-medium leading-9 text-[#192850]">
                    회사
                  </label>
                  <TextBox
                    id="company"
                    name="company"
                    stylingMode="outlined"
                    width="100%"
                    height={48}
                    readOnly={true}
                    defaultValue={data.company_nm ?? "미배정"}
                    className="rounded-xl bg-[#FBFBFB] text-black text-opacity-40"
                  />
                </div>
              </div>

              <div className="sm:flex w-full sm:gap-5 sm:max-w-3xl">
                <div className="w-full items-center">
                  <label htmlFor="password" className="block text-sm font-medium leading-9 text-[#192850]">
                    비밀번호
                  </label>
                  <TextBox
                    id="password"
                    name="password"
                    mode={passwordMode}
                    stylingMode="outlined"
                    width="100%"
                    height={48}
                    maxLength={16}
                    defaultValue=""
                    onValueChanged={handlePasswordChange}
                    className="rounded-xl"
                  >
                    <TextBoxButton name="password-toggle" location="after" options={passwordButton} />
                  </TextBox>
                </div>
                <div className="w-full items-center">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium leading-9 text-[#192850]">
                    비밀번호 확인
                  </label>
                  <TextBox
                    id="confirmPassword"
                    name="confirmPassword"
                    mode={confirmPasswordMode}
                    stylingMode="outlined"
                    width="100%"
                    height={48}
                    maxLength={16}
                    defaultValue=""
                    onValueChanged={handleConfirmPasswordChange}
                    className="rounded-xl"
                  >
                    <TextBoxButton name="confirm-password-toggle" location="after" options={confirmPasswordButton} />
                  </TextBox>
                  {passwordError && <div className="text-red-500 text-sm mt-1">{passwordError}</div>}
                </div>
              </div>

              <div className="block items-center max-w-sm pt-5">
                <Button
                  useSubmitBehavior={true}
                  text="변경하기"
                  width={100}
                  height={48}
                  stylingMode="contained"
                  type="default"
                  className="rounded-md bg-[#2C64F8] text-sm font-semibold text-white"
                />
              </div>

              <div className="text-[#192850] font-semibold text-xl pt-5 border-t-[1px] border-[#E5E9F2]">회원탈퇴</div>

              <div className="mt-10 text-sm text-[#979FB1] font-medium">
                회원탈퇴를 하시겠습니까? <br />
                <Button
                  text="회원탈퇴"
                  onClick={AccountDeletion}
                  width={100}
                  height={48}
                  stylingMode="outlined"
                  type="normal"
                  className="rounded-xl mt-5 text-[#7E8293]"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
