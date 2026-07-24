-- ============================================================================
--  에디션별 셋업   (NEXT_PUBLIC_APP_EDITION — utils/common/edition.ts)
-- ============================================================================
--  [SAAS] 멀티테넌트. 회사 N개 + 이메일도메인 매핑 → signup 이 도메인으로 회사
--         자동배정 + 즉시 활성. 아래 회사/도메인을 실제 테넌트로 구성.
--
--  [OEM]  단일 고객사. signup 이 활성 회사(정확히 1개)로 배정 + 항상 승인대기.
--         → 활성 회사 1개만 · 관리자(벤더)는 company_id=NULL ·
--           회사관리/권한관리 숨김(1회):
--           UPDATE TN_Menu SET use_at='N' WHERE menu_id IN ('msys1002','msys1003');
--           (msys 접두사는 UI 에서 use_at 변경 차단 → SQL 필수)
-- ============================================================================

-- 삭제 (FK 역순)
DELETE FROM TN_AuthorMenu;
DELETE FROM TN_AuthorMember;
DELETE FROM TC_Code;
DELETE FROM TC_GroupCode;
DELETE FROM TN_CompanyMenu;
DELETE FROM TN_Menu;
DELETE FROM BA_Session;
DELETE FROM BA_Account;
DELETE FROM BA_Verification;
DELETE FROM TN_User;
DELETE FROM TN_CompanyDomain;
DELETE FROM TN_Company;
DELETE FROM TN_Author;

-- 1. 권한
INSERT INTO TN_Author (author_id, author_nm, reg_dt, reg_id, mod_dt, mod_id)
VALUES
('admin', '시스템관리자', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('operator', '운영자',       CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('user', '일반사용자',   CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');

-- 1-1. 회사
SET IDENTITY_INSERT TN_Company ON;
INSERT INTO TN_Company (id, company_code, company_nm, use_at, reg_dt, reg_id, mod_dt, mod_id)
VALUES
(1, 'acme',       '예시회사', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');
SET IDENTITY_INSERT TN_Company OFF;

-- 1-2. 회사 이메일 도메인 매핑
INSERT INTO TN_CompanyDomain (domain, company_id, reg_dt, reg_id, mod_dt, mod_id)
VALUES
('example.com',       1, CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');

-- 2. 사용자 (Better Auth 통합)
--    admin    — 시스템관리자(벤더). 특정 회사에 속하지 않으므로 company_id = NULL.
--    operator — 테넌트 소속 업무 사용자. company_id 가 있어야 업무 메뉴(TN_CompanyMenu 교집합)와
--               테넌트 API(JWT company_id 요구)가 열린다. 역할 분리를 위해 admin 과 별도 계정으로 둔다.
INSERT INTO TN_User (id, email, name, company_id, use_at, appr_at, emailVerified, reg_dt, reg_id, mod_dt, mod_id)
VALUES
('019d9c31-bdc9-7706-b940-246010c814d7', 'admin@example.com', '관리자', NULL, 'Y', 'Y', 0, CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('019d9c31-be10-7a1c-8f3d-4b6a2c9e5d10', 'operator@example.com', '운영자', 1, 'Y', 'Y', 0, CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');

-- 2-1. Better Auth 계정 (비밀번호: 둘 다 changeme1234, scrypt 해시)
--      password 는 `salt:key` 한 값에 salt 가 들어 있고 사용자 식별자가 섞이지 않는다
--      (hashPassword(password) — frontend/lib/auth/authUtils.ts). 그래서 같은 값을 두 계정이 공유해도
--      각각 changeme1234 로 로그인된다. 데모용 고정 비밀번호이므로 salt 재사용을 감수한다.
INSERT INTO BA_Account (id, accountId, providerId, userId, password, createdAt, updatedAt)
VALUES
('dmx10fwDIJInixzkC3XbxxGM7FOMSdQQ', '019d9c31-bdc9-7706-b940-246010c814d7', 'credential', '019d9c31-bdc9-7706-b940-246010c814d7', '96b3e92b13e00d02f4aaa317b8b381fb:79e41a2de1681fbdb8ae02c61316ace74f04b71abfdae97fbe81099a7943b481ff6338ab5de90778eddc72dc0858e6893a277b540cd4bb8e2f765f228476e3fa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('019d9c31-be10-7b2e-9c05-7d1e4a8f6b32', '019d9c31-be10-7a1c-8f3d-4b6a2c9e5d10', 'credential', '019d9c31-be10-7a1c-8f3d-4b6a2c9e5d10', '96b3e92b13e00d02f4aaa317b8b381fb:79e41a2de1681fbdb8ae02c61316ace74f04b71abfdae97fbe81099a7943b481ff6338ab5de90778eddc72dc0858e6893a277b540cd4bb8e2f765f228476e3fa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. 메뉴
INSERT INTO TN_Menu (menu_id, menu_nm, upper_menu_id, menu_level, sort_ordr, use_at, url, icon, reg_dt, reg_id, mod_dt, mod_id)
VALUES
('mbiz0000', '업무관리',   NULL,       1, 10,  'Y', NULL,                            'event',       CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('msys0000', '시스템관리', NULL,       1, 999, 'Y', NULL,                            'preferences', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('mbiz1001', '회원관리',   'mbiz0000', 2, 10,  'Y', 'admin/todo',                    'check',       CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('mbiz1002', '카테고리관리', 'mbiz0000', 2, 20,  'Y', 'admin/category',                'box',         CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('mbiz1003', '대시보드',     'mbiz0000', 2, 30,  'Y', 'admin/dashboard',               'chart',       CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('mbiz1004', '개발활동 조회', 'mbiz0000', 2, 40,  'Y', 'admin/devactivity',                'search',   CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('mbiz1005', '스케줄러 관리', 'mbiz0000', 2, 50,  'Y', 'admin/devactivity/scheduler', 'event',    CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('msys1001', '코드관리',     'msys0000', 2, 10, 'Y', 'admin/common/system/code',      'doc',         CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('msys1002', '회사관리',     'msys0000', 2, 20, 'Y', 'admin/common/system/company',   'home',        CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('msys1003', '권한관리',     'msys0000', 2, 30, 'Y', 'admin/common/system/author',    'key',         CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('msys1004', '메뉴관리',     'msys0000', 2, 40, 'Y', 'admin/common/system/menu',      'hierarchy',   CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('msys1005', '사용자관리',   'msys0000', 2, 50, 'Y', 'admin/common/system/adminuser', 'group',       CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('msys1006', '메일발송로그', 'msys0000', 2, 60, 'Y', 'admin/common/system/email-log', 'email',       CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');

-- 3-1. 회사별 메뉴 (회사가 부여받은 업무 기능)
--      네비게이션은 일반 사용자에게 "권한 메뉴 ∩ 회사 메뉴" 만 노출한다
--      (frontend/app/api/common/system/menu/navigation/route.ts 의 isVisible).
--      시스템 메뉴(msys*)는 회사 매핑 대상이 아니라 권한만으로 결정되므로 여기 넣지 않는다.
--      상위 메뉴(mbiz0000)도 넣지 않는다 — isVisible 은 menu_level 2 에만 적용되고,
--      상위는 보이는 하위가 하나라도 있으면 자동 노출된다.
INSERT INTO TN_CompanyMenu (company_id, menu_id, reg_dt, reg_id, mod_dt, mod_id)
VALUES
(1, 'mbiz1001', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
(1, 'mbiz1002', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
(1, 'mbiz1003', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
(1, 'mbiz1004', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
(1, 'mbiz1005', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');

-- 4. 권한별 회원
INSERT INTO TN_AuthorMember (author_id, user_id, reg_dt, reg_id, mod_dt, mod_id)
VALUES
('admin', 'admin@example.com', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('operator', 'operator@example.com', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');

-- 5. 권한별 메뉴
INSERT INTO TN_AuthorMenu (author_id, menu_id, reg_dt, reg_id, mod_dt, mod_id)
VALUES
-- operator: 전 업무 화면 접근 (mbiz1001~1005). isVisible = 권한메뉴 ∩ 회사메뉴 라, TN_CompanyMenu 만
-- 부여하고 여기를 mbiz1001 로 두면 나머지 업무 화면(카테고리·대시보드·개발활동·스케줄러)이 안 보인다.
('operator', 'mbiz1001', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('operator', 'mbiz1002', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('operator', 'mbiz1003', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('operator', 'mbiz1004', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('operator', 'mbiz1005', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('user', 'mbiz1001', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');

-- 6. 그룹코드 (전 프로젝트 공통코드 합집합 + 템플릿 데모 9900번대)
INSERT INTO TC_GroupCode (group_code, group_code_nm, use_at, reg_dt, reg_id, mod_dt, mod_id)
VALUES
-- [공통] 전 프로젝트 합집합
('1000', '사용여부', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2000', '데이터타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2100', '전처리작업타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2101', '결측치처리방법타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2102', '이상치탐지모델타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2103', '정규화방법타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', '컬럼생성처리방법타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2200', '모델타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2201', '알고리즘타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2300', '특성중요도분석타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2400', '작업상태타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2500', 'MLflow 라이프사이클 단계', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2501', 'MLflow Run 상태', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2502', '예측 타깃 시점', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2503', 'MLflow 모델 스테이지', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2504', 'MLflow 모델 버전 상태', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3000', 'OPC UA 노드 구독 활성상태', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3001', 'OPC UA 연결 상태', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3002', '데이터 상태 코드', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3003', 'OPC UA 이벤트 심각도', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4000', '동기화상태타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4100', '버전타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4101', '충돌타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4102', '제안타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4200', '중요도타입', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4300', '채팅가능상태', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),

-- [템플릿 데모] 성별/부서/혈액형/취미
('9900', '성별', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9901', '부서', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9902', '혈액형', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9903', '취미', 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');

-- 7. 코드
INSERT INTO TC_Code (group_code, code, code_nm, sort_ordr, use_at, reg_dt, reg_id, mod_dt, mod_id)
VALUES
-- [공통] 전 프로젝트 합집합
('1000', 'Y', '사용', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('1000', 'N', '미사용', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2000', 'numeric', '수치형', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2000', 'categorical', '범주형', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2000', 'datetime', '날짜시간', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2000', 'text', '텍스트', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2000', 'numeric_array', '수치형배열', 5, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2000', 'text_array', '문자형배열', 6, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2100', 'remove_missing', '결측치 제거', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2100', 'fill_missing', '결측치 채우기', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2100', 'remove_outliers', '이상치 제거', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2100', 'normalize', '데이터 정규화', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2100', 'drop_columns', '컬럼 삭제', 5, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2100', 'add_columns', '컬럼 추가', 6, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2101', 'mean', '평균값', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2101', 'median', '중간값', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2101', 'mode', '최빈값', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2101', 'constant', '고정값', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2102', 'IQR', 'IQR (사분위수)', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2102', 'Z-score', 'Z-Score (표준편차)', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2102', 'Modified_Z', 'Modified Z-Score (Robust)', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2102', 'Percentile', 'Percentile (백분위수)', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2102', 'IF', 'Isolation Forest (ML)', 5, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2103', 'minmax', 'Min-Max 정규화', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2103', 'z_score', 'Z-Score 정규화', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'mean', '평균값', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'median', '중간값', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'min', '최소값', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'max', '최대값', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'sum', '합계', 5, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'diff', '차이', 6, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'prod', '곱셈', 7, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'div', '나눗셈', 8, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2104', 'deviation_rate', '편차율', 9, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2200', 'regression', '회귀', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2200', 'classification', '분류', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2201', 'xgboost', 'XGBoost', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2201', 'rf', '랜덤포레스트', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2300', 'shap', 'SHAP', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2300', 'feature_importances', 'Feature Importances', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2400', 'running', '실행중', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2400', 'pending', '대기', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2400', 'completed', '완료', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2400', 'failed', '실패', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2400', 'cancelled', '취소', 5, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2500', 'active', '활성', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2500', 'deleted', '삭제', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2501', 'RUNNING', '실행중', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2501', 'SCHEDULED', '예약', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2501', 'FINISHED', '완료', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2501', 'FAILED', '실패', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2501', 'KILLED', '중단', 5, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2502', 'current', '현재(t)', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2502', 'future', '미래(t+분)', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2503', 'none', '없음', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2503', 'staging', '스테이징', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2503', 'production', '프로덕션', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2504', 'READY', '준비됨', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2504', 'PENDING_REGISTRATION', '등록대기', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('2504', 'FAILED_REGISTRATION', '등록실패', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3000', 'true', '활성', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3000', 'false', '비활성', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3001', 'success', '연결됨', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3001', 'error', '오류', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3001', 'disconnected', '서버 끊김', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3001', 'unknown', '테스트 불가', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3002', 'Good', '정상', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3002', 'Bad', '오류', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3002', 'Uncertain', '불확실', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3003', 'Low', '낮음', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3003', 'Medium', '보통', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3003', 'High', '높음', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('3003', 'Critical', '위험', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4000', 'pending', '대기중', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4000', 'syncing', '동기화중', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4000', 'synced', '완료', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4000', 'failed', '실패', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4100', 'auto_backup', '자동 백업', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4100', 'pre_regeneration', '재생성 전', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4100', 'manual_snapshot', '수동 저장', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4101', 'none', '없음', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4101', 'content_after_chunks', '문서 내용이 청크보다 나중에 수정됨', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4101', 'chunks_after_content', '청크가 문서 내용보다 나중에 수정됨', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4101', 'chunks_modified', '청크만 수정됨', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4102', 'chunk_regenerate', '재생성 제안', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4102', 'content_change', '내용 변경 제안', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4200', '0', '참고', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4200', '1', '일반', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4200', '2', '중요', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4200', '3', '필수', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4300', 'active', '활성', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('4300', 'inactive', '비활성', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),

-- [템플릿 데모] 성별/부서/혈액형/취미
('9900', '001', '남', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9900', '002', '여', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9901', '001', '개발사업부 1팀', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9901', '002', '개발사업부 2팀', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9901', '003', '기술연구소 1팀', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9901', '004', '기술연구소 2팀', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9902', '001', 'A', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9902', '002', 'B', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9902', '003', 'AB', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9902', '004', 'O', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9903', '001', '야구', 1, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9903', '002', '축구', 2, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9903', '003', '독서', 3, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR'),
('9903', '004', '음악감상', 4, 'Y', CURRENT_TIMESTAMP, 'MGR', CURRENT_TIMESTAMP, 'MGR');
