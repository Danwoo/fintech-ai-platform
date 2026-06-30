// components/features/Common/Policy/PolicyPopup.tsx
"use client";

import { useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/shared/ui/Button";
import { Terms } from "./Terms";
import { Privacy } from "./Privacy";
import { showMessage } from "@/components/shared/Feedback";

interface Props {
  showButtons?: boolean;
  buttonClassName?: string;
  additionalClassName?: string;
}

export interface PolicyPopupRef {
  showTerms: () => void;
  showPrivacy: () => void;
}

const PolicyPopup = forwardRef<PolicyPopupRef, Props>(
  ({ showButtons = true, buttonClassName = "text-sm sm:text-base", additionalClassName = "" }, ref) => {
    // ref를 통해 메서드 노출
    useImperativeHandle(ref, () => ({
      showTerms: () => showTermsPopup(),
      showPrivacy: () => showPrivacyPopup(),
    }));

    const showTermsPopup = async () => {
      await showMessage("이용약관", <Terms />, {
        width: 1000,
        height: 700,
      });
    };

    const showPrivacyPopup = async () => {
      await showMessage("개인정보처리방침", <Privacy />, {
        width: 1000,
        height: 700,
      });
    };

    const finalClassName = `${buttonClassName} ${additionalClassName}`.trim();

    return (
      <>
        {showButtons && (
          <ul className="hidden sm:flex justify-end text-white pb-5">
            <li className="mr-5">
              <Button text="이용약관" onClick={showTermsPopup} stylingMode="text" className={finalClassName} />
            </li>
            <li className="mr-0">
              <Button
                text="개인정보처리방침"
                onClick={showPrivacyPopup}
                stylingMode="text"
                className={finalClassName}
              />
            </li>
          </ul>
        )}
      </>
    );
  },
);

PolicyPopup.displayName = "PolicyPopup";

export default PolicyPopup;
