// components/shared/ui/index.ts

// 앱 i18n locale 부트스트랩 — DevExtreme/Zod (side-effect, 1회 로드)
import "@/utils/common/locale";

// ========================================
// 🔥 필수 컴포넌트들 (90% 사용)
// ========================================
export { Button } from "./Button";
export type { Props as ButtonProps, ActionButton } from "./Button";
export { TextBox } from "./TextBox"; // 텍스트 입력 (마스크 기능 포함)
export { NumberBox } from "./NumberBox"; // 숫자 입력
export { SelectBox } from "./SelectBox"; // 드롭다운 선택
export { DateBox } from "./DateBox"; // 날짜 선택
export { DateRangeBox } from "./DateRangeBox"; // 날짜 범위 선택
export { TextArea } from "./TextArea"; // 긴 텍스트 입력
export { CheckBox } from "./CheckBox"; // 체크박스
export { CheckBoxGroup } from "./CheckBoxGroup"; // 체크박스그룹
export { RadioGroup } from "./RadioGroup"; // 라디오 버튼

// ========================================
// ⭐ 자주 사용 컴포넌트들 (70% 사용)
// ========================================
export { TagBox } from "./TagBox"; // 다중 선택 태그
export { Switch } from "./Switch"; // 토글 스위치
export { TabPanel, TabContent } from "./TabPanel"; // 탭 네비게이션
export { Popup } from "./Popup"; // 팝업/모달 다이얼로그

// ========================================
// 💡 고급 컴포넌트들 (40% 사용)
// ========================================
export { Autocomplete } from "./Autocomplete"; // 자동완성 입력
export { Lookup } from "./Lookup"; // 대용량 데이터 선택
export { FileUploader, type FileUploaderRef } from "./FileUploader"; // 파일 업로드

// ========================================
// 🎨 특수 목적 컴포넌트들 (20% 사용)
// ========================================
export { Slider } from "./Slider"; // 슬라이더
export { RangeSlider } from "./RangeSlider"; // 범위 슬라이더
export { ColorBox } from "./ColorBox"; // 색상 선택
export { DropDownBox } from "./DropDownBox"; // 복잡한 커스텀 드롭다운
export { Calendar } from "./Calendar"; // 시각적 달력 선택
export { HtmlEditor } from "./HtmlEditor"; // 리치 텍스트 편집
export { ProgressBar } from "./ProgressBar"; // 진행률 표시

// ========================================
// 📋 표시 컴포넌트들
// ========================================
export { FileListDisplay } from "./FileListDisplay"; // 파일 목록 표시
export { StarRating } from "./StarRating"; // 별점 입력
export { MarkdownRenderer } from "./MarkdownRenderer"; // 별점 입력
export { EditableTextList } from "./EditableTextList"; // 인라인 편집 텍스트 리스트 (행 + 추가 + max)
export { ExpandableCard } from "./ExpandableCard"; // 펼침/접힘 가능한 카드 (청크/이미지 등)
