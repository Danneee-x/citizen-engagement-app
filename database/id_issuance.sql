-- ==============================================================================
-- CIVENTRAL CITIZEN ENGAGEMENT PLATFORM - ID ISSUANCE SUBSYSTEM DATABASE
-- Target Databases: `civentral_certificates` & `citizen_verification`
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.4+, and Dokploy Cloud MySQL
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. DATABASE INITIALIZATION
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `civentral_certificates` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `citizen_verification` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `civentral_certificates`;

-- ------------------------------------------------------------------------------
-- 2. TABLE STRUCTURE: id_issuance_applications
-- Main applications filed from Citizen Mobile App & City Hall Walk-in Counters
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `id_issuance_applications`;

CREATE TABLE `id_issuance_applications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `reference_no` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Application ref code (e.g. CAL-CIT-2026-4412)',
  `citizen_user_id` INT UNSIGNED NULL DEFAULT NULL COMMENT 'FK referencing citizen_users if authenticated',
  
  -- ID Classification matching Citizen App categories
  `id_category` ENUM('citizen_id', 'barangay_id', 'solo_parent_id', 'pwd_id', 'senior_citizen_id') NOT NULL DEFAULT 'citizen_id',
  `id_title` VARCHAR(150) NOT NULL DEFAULT 'Caloocan Citizen Unified ID Card',
  `application_type` ENUM('New Application', 'Renewal', 'Replacement') NOT NULL DEFAULT 'New Application',
  
  -- Applicant Demographics & Civil Registry Data
  `first_name` VARCHAR(100) NOT NULL,
  `middle_name` VARCHAR(100) NULL DEFAULT '',
  `last_name` VARCHAR(100) NOT NULL,
  `suffix` VARCHAR(20) NULL DEFAULT '',
  `gender` VARCHAR(20) NOT NULL DEFAULT 'Male',
  `birthdate` DATE NULL DEFAULT NULL,
  `civil_status` VARCHAR(50) NOT NULL DEFAULT 'Single',
  `contact_number` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NULL DEFAULT NULL,
  
  -- Residency & Geographic Address
  `street_address` VARCHAR(255) NOT NULL,
  `barangay` VARCHAR(100) NOT NULL,
  `district` VARCHAR(50) NOT NULL DEFAULT 'District 1',
  `resident_since` VARCHAR(50) NOT NULL DEFAULT '2015',
  
  -- Administrative Bureau Routing
  `issuing_bureau` VARCHAR(200) NOT NULL DEFAULT 'Caloocan Civil Registry & Identity Management Bureau',
  `claim_office` VARCHAR(200) NOT NULL DEFAULT 'Caloocan Main City Hall - Window 6',
  `estimated_turnaround` VARCHAR(100) NOT NULL DEFAULT '3 to 5 Business Days',
  
  -- Uploaded Document Requirements & Photos (Data URLs or S3/Upload paths)
  `primary_doc_name` VARCHAR(150) NULL DEFAULT 'Valid Identification Document',
  `primary_doc_url` MEDIUMTEXT NULL DEFAULT NULL,
  `photo_2x2_url` MEDIUMTEXT NULL DEFAULT NULL,
  `support_doc_name` VARCHAR(150) NULL DEFAULT NULL,
  `support_doc_url` MEDIUMTEXT NULL DEFAULT NULL,
  
  -- Multi-Stage Verification & Production Lifecycle
  `status` ENUM(
    'Pending Review',
    'Under Review',
    'Approved',
    'Ready for Release',
    'Claimed',
    'Rejected'
  ) NOT NULL DEFAULT 'Pending Review',
  
  -- Administrative Review & Sign-Off
  `review_notes` TEXT NULL DEFAULT NULL,
  `rejection_reason` TEXT NULL DEFAULT NULL,
  `reviewed_by` VARCHAR(100) NULL DEFAULT NULL,
  `reviewed_at` DATETIME NULL DEFAULT NULL,
  `released_by` VARCHAR(100) NULL DEFAULT NULL,
  `released_at` DATETIME NULL DEFAULT NULL,
  
  -- System Timestamps
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_id_category` (`id_category`),
  INDEX `idx_app_status` (`status`),
  INDEX `idx_barangay` (`barangay`),
  INDEX `idx_ref_no` (`reference_no`),
  INDEX `idx_user_id` (`citizen_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABLE STRUCTURE: id_cards_issued
-- Permanent Ledger of Printed & Released Physical/Digital ID Credentials
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `id_cards_issued`;

CREATE TABLE `id_cards_issued` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `card_control_no` VARCHAR(60) NOT NULL UNIQUE COMMENT 'Unique embossed ID serial number',
  `application_id` INT UNSIGNED NOT NULL COMMENT 'FK to id_issuance_applications',
  `reference_no` VARCHAR(50) NOT NULL,
  `citizen_name` VARCHAR(150) NOT NULL,
  `id_category` VARCHAR(50) NOT NULL,
  `barangay` VARCHAR(100) NOT NULL,
  `date_issued` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_expiry` DATE NULL DEFAULT NULL,
  `qr_security_hash` VARCHAR(128) NOT NULL COMMENT 'Cryptographic hash for City Hall scanner verification',
  `issued_by` VARCHAR(100) NOT NULL DEFAULT 'ID Production Desk Officer',
  `status` ENUM('Active', 'Expired', 'Revoked', 'Lost') NOT NULL DEFAULT 'Active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_control_no` (`card_control_no`),
  INDEX `idx_card_status` (`status`),
  CONSTRAINT `fk_issued_application` 
    FOREIGN KEY (`application_id`) 
    REFERENCES `id_issuance_applications` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABLE STRUCTURE: id_issuance_audit_logs
-- Immutable History of Status Transitions & Review Events
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `id_issuance_audit_logs`;

CREATE TABLE `id_issuance_audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(50) NOT NULL COMMENT 'e.g. SUBMITTED, REVIEW_STARTED, APPROVED, REJECTED, CLAIMED',
  `previous_status` VARCHAR(50) NULL DEFAULT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `officer_name` VARCHAR(100) NOT NULL,
  `remarks` TEXT NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_audit_app_id` (`application_id`),
  CONSTRAINT `fk_audit_application` 
    FOREIGN KEY (`application_id`) 
    REFERENCES `id_issuance_applications` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. INITIAL SEED DATA (5 ID CATEGORIES FROM CITIZEN APP)
-- ------------------------------------------------------------------------------
INSERT INTO `id_issuance_applications` 
(
  `reference_no`, `citizen_user_id`, `id_category`, `id_title`, `application_type`,
  `first_name`, `middle_name`, `last_name`, `suffix`, `gender`, `birthdate`, `civil_status`,
  `contact_number`, `email`, `street_address`, `barangay`, `district`, `resident_since`,
  `issuing_bureau`, `claim_office`, `estimated_turnaround`, `primary_doc_name`, `status`,
  `review_notes`, `reviewed_by`, `reviewed_at`, `created_at`
)
VALUES
(
  'CAL-CIT-2026-4412', 1001, 'citizen_id', 'Caloocan Citizen Unified ID Card', 'New Application',
  'Juan', 'Santos', 'dela Cruz', '', 'Male', '1995-06-12', 'Single',
  '0917-123-4567', 'juan.delacruz@example.com', '124 Rizal Avenue Extension', 'Barangay 171', 'District 1', '2012',
  'Caloocan Civil Registry & Identity Management Bureau', 'Caloocan Main City Hall - Window 6', '3 to 5 Business Days',
  'PhilSys National ID Document', 'Approved',
  'Primary identity authenticated via PhilSys national registry cross-reference. Card scheduled for printing.',
  'Officer Danny Espelita', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)
),
(
  'CAL-BRGY-2026-7812', 1002, 'barangay_id', 'Barangay Resident Identification Card', 'New Application',
  'Maria', 'Clara', 'Santos', '', 'Female', '1998-03-24', 'Married',
  '0918-765-4321', 'maria.santos@example.com', 'Phase 4 Package 1 Block 12 Lot 8', 'Barangay 176', 'District 1', '2016',
  'Respective Barangay Executive Office & Secretariat', 'Local Barangay Hall - Records Desk', '1 to 2 Business Days',
  'PSA Birth Certificate & Electric Utility Bill', 'Ready for Release',
  'Barangay residency validated by Executive Secretariat. Card minted with holographic seal.',
  'Barangay Records Officer', DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY)
),
(
  'CAL-SP-2026-3190', 1003, 'solo_parent_id', 'Solo Parent Welfare Identification Card (RA 11861)', 'New Application',
  'Elena', 'Reyes', 'Bautista', '', 'Female', '1990-11-05', 'Single Parent',
  '0920-111-2233', 'elena.bautista@example.com', '78 Camarin Road, Area D', 'Barangay 178', 'District 1', '2010',
  'City Social Welfare & Development Office (CSWDO)', 'Caloocan CSWDO Office - Solo Parent Desk', '5 to 7 Business Days',
  'Dependent Child PSA Birth Certificate & Solo Parent Affidavit', 'Under Review',
  'Social case worker evaluating dependent civil registry records under RA 11861 welfare guidelines.',
  'CSWDO Social Worker J. Perez', NOW(), DATE_SUB(NOW(), INTERVAL 3 DAY)
),
(
  'CAL-PWD-2026-6120', 1004, 'pwd_id', 'Persons with Disability Card (Republic Act 10754)', 'New Application',
  'Roberto', 'Mendoza', 'Gomez', 'Jr.', 'Male', '2001-08-19', 'Single',
  '0922-333-4455', 'roberto.gomez@example.com', '45 Deparo Road', 'Barangay 168', 'District 1', '2015',
  'Persons with Disability Affairs Office (PDAO)', 'PDAO Counter - City Hall Ground Floor', '3 to 5 Business Days',
  'Clinical Medical Certificate signed by Licensed Physician', 'Pending Review',
  'New application submitted via Citizen Mobile App. Pending medical certificate clearance.',
  NULL, NULL, NOW()
),
(
  'CAL-SR-2026-9041', 1005, 'senior_citizen_id', 'OSCA Senior Citizen Card (Republic Act 9994)', 'Renewal',
  'Fernando', 'Perez', 'Morales', '', 'Male', '1959-04-10', 'Widowed',
  '0919-555-6677', 'fernando.morales@example.com', '12 Bagumbong Road', 'Barangay 173', 'District 1', '1985',
  'Office of Senior Citizens Affairs (OSCA)', 'OSCA Main Building - Caloocan City Complex', '2 to 4 Business Days',
  'PSA Birth Certificate confirming Age 65+', 'Claimed',
  'Senior booklet and OSCA ID card handed over to citizen at main counter. Valid for all municipal benefits.',
  'OSCA Release Desk Officer', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)
);

-- Seed an issued card sample for the claimed senior citizen
INSERT INTO `id_cards_issued`
(`card_control_no`, `application_id`, `reference_no`, `citizen_name`, `id_category`, `barangay`, `date_issued`, `date_expiry`, `qr_security_hash`, `issued_by`, `status`)
VALUES
('CAL-OSCA-2026-00892', 1005, 'CAL-SR-2026-9041', 'Fernando Perez Morales', 'senior_citizen_id', 'Barangay 173', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 YEAR), SHA2('CAL-SR-2026-9041-OSCA-FERNANDO', 256), 'OSCA Release Desk Officer', 'Active');

-- ------------------------------------------------------------------------------
-- 6. DUAL-DATABASE SYNCHRONIZATION
-- Mirror tables into `citizen_verification` database for unified local & Dokploy access
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `citizen_verification`.`id_issuance_audit_logs`;
DROP TABLE IF EXISTS `citizen_verification`.`id_cards_issued`;
DROP TABLE IF EXISTS `citizen_verification`.`id_issuance_applications`;

CREATE TABLE `citizen_verification`.`id_issuance_applications` LIKE `civentral_certificates`.`id_issuance_applications`;
CREATE TABLE `citizen_verification`.`id_cards_issued` LIKE `civentral_certificates`.`id_cards_issued`;
CREATE TABLE `citizen_verification`.`id_issuance_audit_logs` LIKE `civentral_certificates`.`id_issuance_audit_logs`;

REPLACE INTO `citizen_verification`.`id_issuance_applications` SELECT * FROM `civentral_certificates`.`id_issuance_applications`;
REPLACE INTO `citizen_verification`.`id_cards_issued` SELECT * FROM `civentral_certificates`.`id_cards_issued`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- END OF ID ISSUANCE SUBSYSTEM DATABASE SCHEMA
-- ==============================================================================
