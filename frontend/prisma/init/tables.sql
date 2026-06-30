-- ============================================================================
-- Prisma Complete Database Generator (MSSQL)
-- ============================================================================

-- ============================================================================
-- 1. 기존 EXTENDED PROPERTIES 삭제
-- ============================================================================

-- Drop extended properties for TN_User
IF OBJECT_ID('dbo.TN_User', 'U') IS NOT NULL
BEGIN
    -- Drop column description for id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'id';
    -- Drop column description for email
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'email'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'email';
    -- Drop column description for name
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'name'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'name';
    -- Drop column description for dept
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'dept'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'dept';
    -- Drop column description for company_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'company_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'company_id';
    -- Drop column description for use_at
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'use_at'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'use_at';
    -- Drop column description for appr_at
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'appr_at'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'appr_at';
    -- Drop column description for emailVerified
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'emailVerified'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'emailVerified';
    -- Drop column description for image
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'image'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'image';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_ip
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'reg_ip'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'reg_ip';
    -- Drop column description for reg_pid
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'reg_pid'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'reg_pid';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_ip
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'mod_ip'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'mod_ip';
    -- Drop column description for mod_pid
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_User') AND name = N'mod_pid'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'mod_pid';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_User') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User';
END
GO

-- Drop extended properties for TN_Company
IF OBJECT_ID('dbo.TN_Company', 'U') IS NOT NULL
BEGIN
    -- Drop column description for id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Company') AND name = N'id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'id';
    -- Drop column description for company_code
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Company') AND name = N'company_code'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'company_code';
    -- Drop column description for company_nm
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Company') AND name = N'company_nm'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'company_nm';
    -- Drop column description for use_at
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Company') AND name = N'use_at'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'use_at';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Company') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Company') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Company') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Company') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Company') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company';
END
GO

-- Drop extended properties for TN_CompanyMenu
IF OBJECT_ID('dbo.TN_CompanyMenu', 'U') IS NOT NULL
BEGIN
    -- Drop column description for company_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'company_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'company_id';
    -- Drop column description for menu_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'menu_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'menu_id';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyMenu') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu';
END
GO

-- Drop extended properties for TN_CompanyDomain
IF OBJECT_ID('dbo.TN_CompanyDomain', 'U') IS NOT NULL
BEGIN
    -- Drop column description for domain
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'domain'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'domain';
    -- Drop column description for company_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'company_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'company_id';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_CompanyDomain') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain';
END
GO

-- Drop extended properties for BA_Session
IF OBJECT_ID('dbo.BA_Session', 'U') IS NOT NULL
BEGIN
    -- Drop column description for id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'id';
    -- Drop column description for expiresAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'expiresAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'expiresAt';
    -- Drop column description for token
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'token'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'token';
    -- Drop column description for createdAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'createdAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'createdAt';
    -- Drop column description for updatedAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'updatedAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'updatedAt';
    -- Drop column description for ipAddress
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'ipAddress'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'ipAddress';
    -- Drop column description for userAgent
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'userAgent'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'userAgent';
    -- Drop column description for userId
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'userId'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'userId';
    -- Drop column description for authorId
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'authorId'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'authorId';
    -- Drop column description for companyId
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Session') AND name = N'companyId'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session', @level2type = N'COLUMN', @level2name = N'companyId';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Session') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session';
END
GO

-- Drop extended properties for BA_Account
IF OBJECT_ID('dbo.BA_Account', 'U') IS NOT NULL
BEGIN
    -- Drop column description for id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'id';
    -- Drop column description for accountId
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'accountId'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'accountId';
    -- Drop column description for providerId
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'providerId'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'providerId';
    -- Drop column description for userId
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'userId'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'userId';
    -- Drop column description for accessToken
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'accessToken'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'accessToken';
    -- Drop column description for refreshToken
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'refreshToken'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'refreshToken';
    -- Drop column description for idToken
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'idToken'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'idToken';
    -- Drop column description for accessTokenExpiresAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'accessTokenExpiresAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'accessTokenExpiresAt';
    -- Drop column description for refreshTokenExpiresAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'refreshTokenExpiresAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'refreshTokenExpiresAt';
    -- Drop column description for scope
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'scope'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'scope';
    -- Drop column description for password
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'password'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'password';
    -- Drop column description for createdAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'createdAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'createdAt';
    -- Drop column description for updatedAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Account') AND name = N'updatedAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account', @level2type = N'COLUMN', @level2name = N'updatedAt';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Account') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account';
END
GO

-- Drop extended properties for BA_Verification
IF OBJECT_ID('dbo.BA_Verification', 'U') IS NOT NULL
BEGIN
    -- Drop column description for id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Verification') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Verification') AND name = N'id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Verification', @level2type = N'COLUMN', @level2name = N'id';
    -- Drop column description for identifier
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Verification') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Verification') AND name = N'identifier'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Verification', @level2type = N'COLUMN', @level2name = N'identifier';
    -- Drop column description for value
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Verification') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Verification') AND name = N'value'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Verification', @level2type = N'COLUMN', @level2name = N'value';
    -- Drop column description for expiresAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Verification') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Verification') AND name = N'expiresAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Verification', @level2type = N'COLUMN', @level2name = N'expiresAt';
    -- Drop column description for createdAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Verification') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Verification') AND name = N'createdAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Verification', @level2type = N'COLUMN', @level2name = N'createdAt';
    -- Drop column description for updatedAt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Verification') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BA_Verification') AND name = N'updatedAt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Verification', @level2type = N'COLUMN', @level2name = N'updatedAt';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.BA_Verification') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Verification';
END
GO

-- Drop extended properties for TN_Author
IF OBJECT_ID('dbo.TN_Author', 'U') IS NOT NULL
BEGIN
    -- Drop column description for author_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Author') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Author') AND name = N'author_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'author_id';
    -- Drop column description for author_nm
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Author') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Author') AND name = N'author_nm'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'author_nm';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Author') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Author') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Author') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Author') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Author') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Author') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Author') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Author') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Author') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author';
END
GO

-- Drop extended properties for TN_AuthorMember
IF OBJECT_ID('dbo.TN_AuthorMember', 'U') IS NOT NULL
BEGIN
    -- Drop column description for author_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'author_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'author_id';
    -- Drop column description for user_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'user_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'user_id';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMember') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember';
END
GO

-- Drop extended properties for TN_Menu
IF OBJECT_ID('dbo.TN_Menu', 'U') IS NOT NULL
BEGIN
    -- Drop column description for menu_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'menu_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'menu_id';
    -- Drop column description for menu_nm
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'menu_nm'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'menu_nm';
    -- Drop column description for upper_menu_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'upper_menu_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'upper_menu_id';
    -- Drop column description for menu_level
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'menu_level'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'menu_level';
    -- Drop column description for sort_ordr
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'sort_ordr'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'sort_ordr';
    -- Drop column description for url
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'url'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'url';
    -- Drop column description for use_at
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'use_at'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'use_at';
    -- Drop column description for icon
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'icon'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'icon';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_Menu') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_Menu') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu';
END
GO

-- Drop extended properties for TN_AuthorMenu
IF OBJECT_ID('dbo.TN_AuthorMenu', 'U') IS NOT NULL
BEGIN
    -- Drop column description for author_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'author_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'author_id';
    -- Drop column description for menu_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'menu_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'menu_id';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TN_AuthorMenu') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu';
END
GO

-- Drop extended properties for TC_GroupCode
IF OBJECT_ID('dbo.TC_GroupCode', 'U') IS NOT NULL
BEGIN
    -- Drop column description for group_code
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'group_code'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'group_code';
    -- Drop column description for group_code_nm
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'group_code_nm'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'group_code_nm';
    -- Drop column description for group_code_dc
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'group_code_dc'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'group_code_dc';
    -- Drop column description for use_at
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'use_at'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'use_at';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_GroupCode') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode';
END
GO

-- Drop extended properties for TC_Code
IF OBJECT_ID('dbo.TC_Code', 'U') IS NOT NULL
BEGIN
    -- Drop column description for group_code
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'group_code'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'group_code';
    -- Drop column description for code
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'code'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'code';
    -- Drop column description for code_nm
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'code_nm'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'code_nm';
    -- Drop column description for code_nm_eng
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'code_nm_eng'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'code_nm_eng';
    -- Drop column description for code_dc
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'code_dc'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'code_dc';
    -- Drop column description for sort_ordr
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'sort_ordr'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'sort_ordr';
    -- Drop column description for use_at
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'use_at'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'use_at';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop column description for reg_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'reg_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'reg_id';
    -- Drop column description for mod_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'mod_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'mod_dt';
    -- Drop column description for mod_id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TC_Code') AND name = N'mod_id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'mod_id';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TC_Code') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code';
END
GO

-- Drop extended properties for TH_EmailLog
IF OBJECT_ID('dbo.TH_EmailLog', 'U') IS NOT NULL
BEGIN
    -- Drop column description for id
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'id'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'id';
    -- Drop column description for to
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'to'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'to';
    -- Drop column description for subject
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'subject'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'subject';
    -- Drop column description for status
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'status'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'status';
    -- Drop column description for error_msg
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'error_msg'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'error_msg';
    -- Drop column description for reg_dt
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'reg_dt'))
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'reg_dt';
    -- Drop table description
    IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('dbo.TH_EmailLog') AND name = N'MS_Description' AND minor_id = 0)
        EXEC sp_dropextendedproperty @name = N'MS_Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog';
END
GO


-- ============================================================================
-- 2. 테이블 생성
-- ============================================================================

-- Drop foreign key constraints for TN_User
IF OBJECT_ID('dbo.TN_User', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TN_User] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TN_User');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TN_Company
IF OBJECT_ID('dbo.TN_Company', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TN_Company] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TN_Company');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TN_CompanyMenu
IF OBJECT_ID('dbo.TN_CompanyMenu', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TN_CompanyMenu] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TN_CompanyMenu');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TN_CompanyDomain
IF OBJECT_ID('dbo.TN_CompanyDomain', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TN_CompanyDomain] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TN_CompanyDomain');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for BA_Session
IF OBJECT_ID('dbo.BA_Session', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[BA_Session] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.BA_Session');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for BA_Account
IF OBJECT_ID('dbo.BA_Account', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[BA_Account] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.BA_Account');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for BA_Verification
IF OBJECT_ID('dbo.BA_Verification', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[BA_Verification] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.BA_Verification');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TN_Author
IF OBJECT_ID('dbo.TN_Author', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TN_Author] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TN_Author');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TN_AuthorMember
IF OBJECT_ID('dbo.TN_AuthorMember', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TN_AuthorMember] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TN_AuthorMember');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TN_Menu
IF OBJECT_ID('dbo.TN_Menu', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TN_Menu] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TN_Menu');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TN_AuthorMenu
IF OBJECT_ID('dbo.TN_AuthorMenu', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TN_AuthorMenu] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TN_AuthorMenu');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TC_GroupCode
IF OBJECT_ID('dbo.TC_GroupCode', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TC_GroupCode] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TC_GroupCode');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TC_Code
IF OBJECT_ID('dbo.TC_Code', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TC_Code] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TC_Code');
    EXEC sp_executesql @sql;
END
GO

-- Drop foreign key constraints for TH_EmailLog
IF OBJECT_ID('dbo.TH_EmailLog', 'U') IS NOT NULL
BEGIN
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'ALTER TABLE [dbo].[TH_EmailLog] DROP CONSTRAINT ' + QUOTENAME(name) + ';'
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.TH_EmailLog');
    EXEC sp_executesql @sql;
END
GO

-- Drop and create table TN_User
IF OBJECT_ID('dbo.TN_User', 'U') IS NOT NULL
    DROP TABLE [dbo].[TN_User];
GO

CREATE TABLE [dbo].[TN_User] (
    [id] NVARCHAR(36) NOT NULL,
    [email] NVARCHAR(100) NOT NULL UNIQUE,
    [name] NVARCHAR(100) NULL,
    [dept] NVARCHAR(50) NULL,
    [company_id] INT NULL,
    [use_at] NVARCHAR(5) NOT NULL DEFAULT N'Y',
    [appr_at] NVARCHAR(5) NOT NULL DEFAULT N'N',
    [emailVerified] BIT NOT NULL,
    [image] NVARCHAR(500) NULL,
    [reg_id] NVARCHAR(100) NULL,
    [reg_dt] DATETIME2 NULL,
    [reg_ip] NVARCHAR(45) NULL,
    [reg_pid] NVARCHAR(30) NULL,
    [mod_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_ip] NVARCHAR(45) NULL,
    [mod_pid] NVARCHAR(30) NULL
    CONSTRAINT [PK_TN_User] PRIMARY KEY CLUSTERED ([id])
);
GO

-- Drop and create table TN_Company
IF OBJECT_ID('dbo.TN_Company', 'U') IS NOT NULL
    DROP TABLE [dbo].[TN_Company];
GO

CREATE TABLE [dbo].[TN_Company] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [company_code] NVARCHAR(30) NOT NULL UNIQUE,
    [company_nm] NVARCHAR(200) NOT NULL,
    [use_at] NVARCHAR(5) NOT NULL DEFAULT N'Y',
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TN_Company] PRIMARY KEY CLUSTERED ([id])
);
GO

-- Drop and create table TN_CompanyMenu
IF OBJECT_ID('dbo.TN_CompanyMenu', 'U') IS NOT NULL
    DROP TABLE [dbo].[TN_CompanyMenu];
GO

CREATE TABLE [dbo].[TN_CompanyMenu] (
    [company_id] INT NOT NULL,
    [menu_id] NVARCHAR(20) NOT NULL,
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TN_CompanyMenu] PRIMARY KEY CLUSTERED ([company_id], [menu_id])
);
GO

-- Drop and create table TN_CompanyDomain
IF OBJECT_ID('dbo.TN_CompanyDomain', 'U') IS NOT NULL
    DROP TABLE [dbo].[TN_CompanyDomain];
GO

CREATE TABLE [dbo].[TN_CompanyDomain] (
    [domain] NVARCHAR(100) NOT NULL,
    [company_id] INT NOT NULL,
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TN_CompanyDomain] PRIMARY KEY CLUSTERED ([domain])
);
GO

-- Drop and create table BA_Session
IF OBJECT_ID('dbo.BA_Session', 'U') IS NOT NULL
    DROP TABLE [dbo].[BA_Session];
GO

CREATE TABLE [dbo].[BA_Session] (
    [id] NVARCHAR(36) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [token] NVARCHAR(500) NOT NULL UNIQUE,
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    [ipAddress] NVARCHAR(45) NULL,
    [userAgent] NVARCHAR(500) NULL,
    [userId] NVARCHAR(36) NOT NULL,
    [authorId] NVARCHAR(20) NULL,
    [companyId] INT NULL
    CONSTRAINT [PK_BA_Session] PRIMARY KEY CLUSTERED ([id])
);
GO

-- Drop and create table BA_Account
IF OBJECT_ID('dbo.BA_Account', 'U') IS NOT NULL
    DROP TABLE [dbo].[BA_Account];
GO

CREATE TABLE [dbo].[BA_Account] (
    [id] NVARCHAR(36) NOT NULL,
    [accountId] NVARCHAR(100) NOT NULL,
    [providerId] NVARCHAR(100) NOT NULL,
    [userId] NVARCHAR(36) NOT NULL,
    [accessToken] NVARCHAR(500) NULL,
    [refreshToken] NVARCHAR(500) NULL,
    [idToken] NVARCHAR(MAX) NULL,
    [accessTokenExpiresAt] DATETIME2 NULL,
    [refreshTokenExpiresAt] DATETIME2 NULL,
    [scope] NVARCHAR(500) NULL,
    [password] NVARCHAR(255) NULL,
    [createdAt] DATETIME2 NOT NULL,
    [updatedAt] DATETIME2 NOT NULL
    CONSTRAINT [PK_BA_Account] PRIMARY KEY CLUSTERED ([id])
);
GO

-- Drop and create table BA_Verification
IF OBJECT_ID('dbo.BA_Verification', 'U') IS NOT NULL
    DROP TABLE [dbo].[BA_Verification];
GO

CREATE TABLE [dbo].[BA_Verification] (
    [id] NVARCHAR(36) NOT NULL,
    [identifier] NVARCHAR(200) NOT NULL,
    [value] NVARCHAR(MAX) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NULL,
    [updatedAt] DATETIME2 NULL
    CONSTRAINT [PK_BA_Verification] PRIMARY KEY CLUSTERED ([id])
);
GO

-- Drop and create table TN_Author
IF OBJECT_ID('dbo.TN_Author', 'U') IS NOT NULL
    DROP TABLE [dbo].[TN_Author];
GO

CREATE TABLE [dbo].[TN_Author] (
    [author_id] NVARCHAR(20) NOT NULL,
    [author_nm] NVARCHAR(200) NOT NULL,
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TN_Author] PRIMARY KEY CLUSTERED ([author_id])
);
GO

-- Drop and create table TN_AuthorMember
IF OBJECT_ID('dbo.TN_AuthorMember', 'U') IS NOT NULL
    DROP TABLE [dbo].[TN_AuthorMember];
GO

CREATE TABLE [dbo].[TN_AuthorMember] (
    [author_id] NVARCHAR(20) NOT NULL,
    [user_id] NVARCHAR(100) NOT NULL,
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TN_AuthorMember] PRIMARY KEY CLUSTERED ([author_id], [user_id])
);
GO

-- Drop and create table TN_Menu
IF OBJECT_ID('dbo.TN_Menu', 'U') IS NOT NULL
    DROP TABLE [dbo].[TN_Menu];
GO

CREATE TABLE [dbo].[TN_Menu] (
    [menu_id] NVARCHAR(20) NOT NULL,
    [menu_nm] NVARCHAR(200) NOT NULL,
    [upper_menu_id] NVARCHAR(20) NULL,
    [menu_level] INT NULL DEFAULT 1,
    [sort_ordr] INT NULL DEFAULT 1,
    [url] NVARCHAR(400) NULL,
    [use_at] NVARCHAR(5) NULL DEFAULT N'Y',
    [icon] NVARCHAR(50) NULL,
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TN_Menu] PRIMARY KEY CLUSTERED ([menu_id])
);
GO

-- Drop and create table TN_AuthorMenu
IF OBJECT_ID('dbo.TN_AuthorMenu', 'U') IS NOT NULL
    DROP TABLE [dbo].[TN_AuthorMenu];
GO

CREATE TABLE [dbo].[TN_AuthorMenu] (
    [author_id] NVARCHAR(20) NOT NULL,
    [menu_id] NVARCHAR(20) NOT NULL,
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TN_AuthorMenu] PRIMARY KEY CLUSTERED ([author_id], [menu_id])
);
GO

-- Drop and create table TC_GroupCode
IF OBJECT_ID('dbo.TC_GroupCode', 'U') IS NOT NULL
    DROP TABLE [dbo].[TC_GroupCode];
GO

CREATE TABLE [dbo].[TC_GroupCode] (
    [group_code] NVARCHAR(5) NOT NULL,
    [group_code_nm] NVARCHAR(200) NOT NULL,
    [group_code_dc] NVARCHAR(200) NULL,
    [use_at] NVARCHAR(5) NOT NULL DEFAULT N'Y',
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TC_GroupCode] PRIMARY KEY CLUSTERED ([group_code])
);
GO

-- Drop and create table TC_Code
IF OBJECT_ID('dbo.TC_Code', 'U') IS NOT NULL
    DROP TABLE [dbo].[TC_Code];
GO

CREATE TABLE [dbo].[TC_Code] (
    [group_code] NVARCHAR(5) NOT NULL,
    [code] NVARCHAR(20) NOT NULL,
    [code_nm] NVARCHAR(200) NOT NULL,
    [code_nm_eng] NVARCHAR(200) NULL,
    [code_dc] NVARCHAR(200) NULL,
    [sort_ordr] INT NULL DEFAULT 1,
    [use_at] NVARCHAR(5) NOT NULL DEFAULT N'Y',
    [reg_dt] DATETIME2 NULL,
    [reg_id] NVARCHAR(100) NULL,
    [mod_dt] DATETIME2 NULL,
    [mod_id] NVARCHAR(100) NULL
    CONSTRAINT [PK_TC_Code] PRIMARY KEY CLUSTERED ([group_code], [code])
);
GO

-- Drop and create table TH_EmailLog
IF OBJECT_ID('dbo.TH_EmailLog', 'U') IS NOT NULL
    DROP TABLE [dbo].[TH_EmailLog];
GO

CREATE TABLE [dbo].[TH_EmailLog] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [to] NVARCHAR(100) NOT NULL,
    [subject] NVARCHAR(200) NOT NULL,
    [status] NVARCHAR(10) NOT NULL,
    [error_msg] NVARCHAR(500) NULL,
    [reg_dt] DATETIME2 NOT NULL
    CONSTRAINT [PK_TH_EmailLog] PRIMARY KEY CLUSTERED ([id])
);
GO


-- ============================================================================
-- 3. 외래키 생성
-- ============================================================================

-- Add foreign key for TN_User.company_id
ALTER TABLE [dbo].[TN_User] ADD CONSTRAINT [FK_TN_User_company_id] FOREIGN KEY ([company_id]) REFERENCES [dbo].[TN_Company] ([id]);
GO

-- Add foreign key for TN_CompanyMenu.company_id
ALTER TABLE [dbo].[TN_CompanyMenu] ADD CONSTRAINT [FK_TN_CompanyMenu_company_id] FOREIGN KEY ([company_id]) REFERENCES [dbo].[TN_Company] ([id]);
GO

-- Add foreign key for TN_CompanyDomain.company_id
ALTER TABLE [dbo].[TN_CompanyDomain] ADD CONSTRAINT [FK_TN_CompanyDomain_company_id] FOREIGN KEY ([company_id]) REFERENCES [dbo].[TN_Company] ([id]);
GO

-- Add foreign key for BA_Session.userId
ALTER TABLE [dbo].[BA_Session] ADD CONSTRAINT [FK_BA_Session_userId] FOREIGN KEY ([userId]) REFERENCES [dbo].[TN_User] ([id]);
GO

-- Add foreign key for BA_Account.userId
ALTER TABLE [dbo].[BA_Account] ADD CONSTRAINT [FK_BA_Account_userId] FOREIGN KEY ([userId]) REFERENCES [dbo].[TN_User] ([id]);
GO

-- Add foreign key for TN_AuthorMember.author_id
ALTER TABLE [dbo].[TN_AuthorMember] ADD CONSTRAINT [FK_TN_AuthorMember_author_id] FOREIGN KEY ([author_id]) REFERENCES [dbo].[TN_Author] ([author_id]);
GO

-- Add foreign key for TN_AuthorMember.user_id
ALTER TABLE [dbo].[TN_AuthorMember] ADD CONSTRAINT [FK_TN_AuthorMember_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[TN_User] ([email]);
GO

-- Add foreign key for TN_Menu.upper_menu_id
ALTER TABLE [dbo].[TN_Menu] ADD CONSTRAINT [FK_TN_Menu_upper_menu_id] FOREIGN KEY ([upper_menu_id]) REFERENCES [dbo].[TN_Menu] ([menu_id]);
GO

-- Add foreign key for TN_AuthorMenu.author_id
ALTER TABLE [dbo].[TN_AuthorMenu] ADD CONSTRAINT [FK_TN_AuthorMenu_author_id] FOREIGN KEY ([author_id]) REFERENCES [dbo].[TN_Author] ([author_id]);
GO

-- Add foreign key for TN_AuthorMenu.menu_id
ALTER TABLE [dbo].[TN_AuthorMenu] ADD CONSTRAINT [FK_TN_AuthorMenu_menu_id] FOREIGN KEY ([menu_id]) REFERENCES [dbo].[TN_Menu] ([menu_id]);
GO

-- Add foreign key for TC_Code.group_code
ALTER TABLE [dbo].[TC_Code] ADD CONSTRAINT [FK_TC_Code_group_code] FOREIGN KEY ([group_code]) REFERENCES [dbo].[TC_GroupCode] ([group_code]);
GO


-- ============================================================================
-- 4. 인덱스 생성
-- ============================================================================

-- Add index for TN_CompanyDomain.company_id
CREATE NONCLUSTERED INDEX [IX_TN_CompanyDomain_company_id] ON [dbo].[TN_CompanyDomain] ([company_id]);
GO

-- Add index for BA_Session.userId
CREATE NONCLUSTERED INDEX [IX_BA_Session_userId] ON [dbo].[BA_Session] ([userId]);
GO

-- Add index for BA_Account.userId
CREATE NONCLUSTERED INDEX [IX_BA_Account_userId] ON [dbo].[BA_Account] ([userId]);
GO

-- Add index for BA_Account.providerId, accountId
CREATE UNIQUE NONCLUSTERED INDEX [IX_BA_Account_providerId_accountId] ON [dbo].[BA_Account] ([providerId], [accountId]);
GO

-- Add index for TN_Menu.upper_menu_id, sort_ordr
CREATE NONCLUSTERED INDEX [IX_TN_Menu_upper_menu_id_sort_ordr] ON [dbo].[TN_Menu] ([upper_menu_id], [sort_ordr]);
GO


-- ============================================================================
-- 5. EXTENDED PROPERTIES 추가
-- ============================================================================

-- Add extended properties for TN_User
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용자', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'이메일', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'email';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용자명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'name';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'부서', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'dept';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'company_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용여부', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'use_at';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'승인여부', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'appr_at';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'이메일 인증 여부', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'emailVerified';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'프로필 이미지', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'image';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성 IP', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'reg_ip';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성 프로그램 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'reg_pid';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'mod_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정 IP', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'mod_ip';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정 프로그램 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_User', @level2type = N'COLUMN', @level2name = N'mod_pid';
GO

-- Add extended properties for TN_Company
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사 코드', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'company_code';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'company_nm';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용여부', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'use_at';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Company', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for TN_CompanyMenu
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사별 메뉴', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'company_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'메뉴 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'menu_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyMenu', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for TN_CompanyDomain
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사 이메일 도메인 매핑', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'이메일 도메인', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'domain';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'회사 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'company_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_CompanyDomain', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for BA_Session
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'인증 세션', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Session';
GO

-- Add extended properties for BA_Account
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'인증 계정', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Account';
GO

-- Add extended properties for BA_Verification
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'인증 토큰', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'BA_Verification';
GO

-- Add extended properties for TN_Author
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'권한', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'권한 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'author_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'권한명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'author_nm';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Author', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for TN_AuthorMember
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'권한별 사용자', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'권한 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'author_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'user_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMember', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for TN_Menu
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'메뉴', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'메뉴 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'menu_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'메뉴명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'menu_nm';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'상위 메뉴 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'upper_menu_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'메뉴 레벨', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'menu_level';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'정렬순서', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'sort_ordr';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'URL', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'url';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용여부', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'use_at';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'아이콘', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'icon';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_Menu', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for TN_AuthorMenu
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'권한별 메뉴', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'권한 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'author_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'메뉴 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'menu_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TN_AuthorMenu', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for TC_GroupCode
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'그룹코드', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'그룹코드', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'group_code';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'그룹코드명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'group_code_nm';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'그룹코드 설명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'group_code_dc';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용여부', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'use_at';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_GroupCode', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for TC_Code
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'상세코드', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'그룹코드', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'group_code';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'코드', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'code';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'코드명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'code_nm';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'영문 코드명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'code_nm_eng';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'코드 설명', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'code_dc';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'정렬순서', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'sort_ordr';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'사용여부', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'use_at';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'생성자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'reg_id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'mod_dt';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수정자 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TC_Code', @level2type = N'COLUMN', @level2name = N'mod_id';
GO

-- Add extended properties for TH_EmailLog
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'이메일 발송 로그', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'로그 ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'id';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'수신자 이메일', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'to';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'제목', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'subject';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'발송 상태', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'status';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'에러 메시지', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'error_msg';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'발송일시', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'TH_EmailLog', @level2type = N'COLUMN', @level2name = N'reg_dt';
GO
