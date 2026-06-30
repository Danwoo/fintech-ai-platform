"use client";

import { FC, useState, useRef } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import PolicyPopup, { PolicyPopupRef } from "@/components/features/Common/Policy/PolicyPopup";
import { showMessage } from "@/components/shared/Feedback";

// DevExtreme 컴포넌트 및 유틸리티 임포트
import { Button } from "@/components/shared/ui/Button";
import { CheckBox } from "devextreme-react/check-box";

interface Props {}

export const Agreettac: FC<Props> = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isChecked2, setIsChecked2] = useState(false);
  const router = useRouter();
  const policyPopupRef = useRef<PolicyPopupRef>(null);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    //체크 상태 확인
    if (isChecked && isChecked2) {
      router.push("/signup");
    } else {
      showMessage("알림", <div>필수 약관을 동의 하셔야 서비스 이용이 가능합니다.</div>);
    }
  };

  const handleChange = (e: any) => {
    setIsChecked(e.value);
  };

  const handleChange2 = (e: any) => {
    setIsChecked2(e.value);
  };

  const allChecked = () => {
    setIsChecked(true);
    setIsChecked2(true);
  };

  return (
    <div className="relative h-[100dvh] w-screen">
      <div
        className="absolute z-10 m-auto w-full px-4 py-8 h-full min-h-[667px]"
        style={{ backgroundImage: `url('../../bg2.png')` }}
      >
        <PolicyPopup ref={policyPopupRef} />
        <div className="card lg:card-side rounded-3xl bg-[#F0F1F2] w-full h-full sm:max-h-[700px] sm:max-w-[800px] m-auto">
          <div className="card-body">
            <div className="w-full lg:max-w-3xl sm:mx-auto sm:w-full sm:max-w-sm sm:pt-10">
              <h2 className="font-bold text-2xl sm:text-4xl mt-10 text-center tracking-tight text-[#303F67]">
                이용약관 동의
              </h2>
              <div className="text-center mt-3 text-[#303F67] text-sm font-semibold">
                더 좋은 서비스 제공을 위한 정보를 수집하고 있습니다.
              </div>
            </div>

            <div className="border-t-[1px] mt-10 mb-8 border-t-[#DDE2EC] w-full "></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
              <form action="#" method="POST" className="space-y-4" onSubmit={handleSubmit}>
                <div className="flex items-center w-full rounded-2xl bg-gray-300 h-12 px-2 pr-5">
                  <div className="flex justify-start w-full">
                    <Button
                      stylingMode="text"
                      className="text-sm sm:text-base w-full"
                      render={() => (
                        <div className="text-left w-full">
                          <span className="whitespace-nowrap">
                            <span className="font-bold">(필수)</span> 이용약관
                          </span>
                        </div>
                      )}
                      onClick={() => policyPopupRef.current?.showTerms()}
                    />
                  </div>

                  <div className="flex justify-end w-full">
                    <CheckBox
                      id="agree"
                      value={isChecked}
                      onValueChanged={handleChange}
                      text="동의합니다"
                      className={
                        isChecked
                          ? "bg-blue-500 text-white rounded-2xl pl-4 py-1"
                          : "bg-gray-500 text-white rounded-2xl pl-4 py-1"
                      }
                      width={120}
                    />
                  </div>
                </div>

                <div className="flex items-center w-full rounded-2xl bg-gray-300 h-12 px-2 pr-5">
                  <div className="flex justify-start w-full">
                    <Button
                      stylingMode="text"
                      className="text-sm sm:text-base w-full"
                      render={() => (
                        <div className="text-left w-full">
                          <span className="whitespace-nowrap">
                            <span className="font-bold">(필수)</span> 개인정보처리방침
                          </span>
                        </div>
                      )}
                      onClick={() => policyPopupRef.current?.showPrivacy()}
                    />
                  </div>

                  <div className="flex justify-end w-full">
                    <CheckBox
                      id="agree2"
                      value={isChecked2}
                      onValueChanged={handleChange2}
                      text="동의합니다"
                      width={120}
                      className={
                        isChecked2
                          ? "bg-blue-500 text-white rounded-2xl pl-4 py-1"
                          : "bg-gray-500 text-white rounded-2xl pl-4 py-1"
                      }
                    />
                  </div>
                </div>

                <div className="w-full flex gap-4">
                  <Button
                    text="전체선택"
                    onClick={allChecked}
                    width={144}
                    height={48}
                    stylingMode="contained"
                    type="default"
                    className="rounded-md bg-black text-white text-sm font-semibold"
                  />
                  <Button
                    useSubmitBehavior={true}
                    text="동의하기"
                    width="100%"
                    height={48}
                    stylingMode="contained"
                    type="default"
                    className="rounded-md bg-[#2C64F8] text-sm font-semibold text-white"
                  />
                </div>
              </form>

              <p className="mt-5 text-center text-sm text-gray-500">
                <Link href="/" className="font-medium text-[#192850] hover:text-blue-500">
                  다른 계정으로 로그인
                </Link>
              </p>
            </div>

            <ul className="mt-5 sm:mt-10 max-w-md w-full hidden sm:flex m-auto list-none justify-between p-0 transition-[height] duration-200 ease-in-out">
              <li className="flex-auto">
                <div className="flex items-center pl-2 leading-[1.3rem] no-underline after:ml-2 after:h-px after:w-full after:flex-1 after:bg-[#e0e0e0] dark:after:bg-neutral-600 dark:hover:bg-[#3b3b3b] pointer-events-none select-none">
                  <span className="my-6 mr-2 flex h-[1.938rem] w-[1.938rem] items-center justify-center rounded-full bg-[#e0e0e0] text-sm font-medium text-[#40464f]">
                    1
                  </span>
                  <span className="font-semibold text-xs sm:text-base text-[#192850] after:flex after:text-[0.8rem] after:content-[data-content] dark:text-neutral-700">
                    이메일 인증
                  </span>
                </div>
              </li>

              <li className="flex-auto">
                <div className="flex items-center pr-2 leading-[1.3rem] no-underline before:mr-2 before:h-px before:w-full before:flex-1 before:bg-[#e0e0e0] before:content-[''] focus:outline-none dark:before:bg-neutral-600 dark:after:bg-neutral-600 dark:hover:bg-[#3b3b3b] pointer-events-none select-none">
                  <span className="text-[#192850] my-6 mr-2 flex h-[1.938rem] w-[1.938rem] items-center justify-center rounded-full bg-[#DFE1E8] text-sm font-medium ">
                    2
                  </span>
                  <span className="font-semibold text-xs sm:text-base text-[#192850] after:flex after:text-[0.8rem] after:content-[data-content] dark:text-neutral-300">
                    비밀번호만들기
                  </span>
                </div>
              </li>

              <li className="flex-auto">
                <div className="flex items-center pr-2 leading-[1.3rem] no-underline before:mr-2 before:h-px before:w-full before:flex-1 before:bg-[#e0e0e0] before:content-[''] focus:outline-none dark:before:bg-neutral-600 dark:after:bg-neutral-600 dark:hover:bg-[#3b3b3b] pointer-events-none select-none">
                  <span className="text-[#192850] my-6 mr-2 flex h-[1.938rem] w-[1.938rem] items-center justify-center rounded-full bg-[#DFE1E8] text-sm font-medium ">
                    3
                  </span>
                  <span className="font-semibold text-xs sm:text-base text-[#192850] after:flex after:text-[0.8rem] after:content-[data-content] dark:text-neutral-300">
                    완료
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
