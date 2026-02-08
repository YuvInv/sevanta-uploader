/**
 * IVC DOM selectors using [id$="suffix"] pattern
 * Resilient to DNN module ID prefix changes
 */

// Header card fields
export const COMPANY_NAME = '[id$="HeaderCard1_lFullName"]';
export const WEBSITE_ROW = '[id$="HeaderCard1_trWebSite"]';
export const LINKEDIN_TABLE = '[id$="HeaderCard1_TblAccount"]';

// General data fields
export const SECTOR = '[id$="GeneralData1_lSector"]';
export const STAGE = '[id$="GeneralData1_lStage"]';
export const ESTABLISHED = '[id$="GeneralData1_lEstYear"]';
export const EMPLOYEES = '[id$="GeneralData1_lEmployees"]';
export const DESCRIPTION = '[id$="GeneralData1_lDisc"]';
export const TECHNOLOGY = '[id$="GeneralData1_lTech"]';
export const TARGET_MARKETS = '[id$="GeneralData1_lTarCos"]';
export const BUSINESS_MODEL = '[id$="GeneralData1_lBusMod"]';

// Deals section
export const TOTAL_CAPITAL = '[id$="Deals1_lblTotal"]';

// Management section - template for iterating
export const MANAGEMENT_NAME_PREFIX = 'ManagementBoard1_RptMang_link_';
export const CONTACT_EMAIL = 'a[id*="htContactEmail"]';

// Tags
export const TAG_LINKS = 'a[href*="Advanced-Search?Tag="]';
