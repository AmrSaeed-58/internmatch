-- InternMatch — full database schema (single file, no migrations).
-- Engine: MySQL 8.0+. Charset: utf8mb4 / utf8mb4_unicode_ci.
--
-- Usage (from a fresh MySQL instance):
--   CREATE DATABASE internmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   mysql -u root -p internmatch < Schema.sql
--   mysql -u root -p internmatch < seed.sql
--
-- The script is idempotent: dropping and re-running it on the same database
-- rebuilds every table. Drop order is reverse of create order so foreign
-- keys do not block.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS system_log;
DROP TABLE IF EXISTS report;
DROP TABLE IF EXISTS internship_view;
DROP TABLE IF EXISTS internship_invitation;
DROP TABLE IF EXISTS password_reset_token;
DROP TABLE IF EXISTS notification_preference;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS message;
DROP TABLE IF EXISTS conversation;
DROP TABLE IF EXISTS bookmark;
DROP TABLE IF EXISTS application_status_history;
DROP TABLE IF EXISTS application;
DROP TABLE IF EXISTS match_score_cache;
DROP TABLE IF EXISTS requires_skill;
DROP TABLE IF EXISTS has_skill;
DROP TABLE IF EXISTS skill;
DROP TABLE IF EXISTS resume;
DROP TABLE IF EXISTS internship;
DROP TABLE IF EXISTS student;
DROP TABLE IF EXISTS employer;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- users  — single account row for every actor (student, employer, admin)
-- =============================================================================
CREATE TABLE users (
  user_id         INT             NOT NULL AUTO_INCREMENT,
  full_name       VARCHAR(100)    NOT NULL,
  email           VARCHAR(150)    NOT NULL,
  password        VARCHAR(255)    NOT NULL,
  role            ENUM('student','employer','admin') NOT NULL,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  profile_picture VARCHAR(255)    DEFAULT NULL,
  token_version   INT             NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- admin / employer / student  — role-specific profile rows
-- =============================================================================
CREATE TABLE admin (
  user_id      INT          NOT NULL,
  access_level VARCHAR(50)  NOT NULL DEFAULT 'SuperAdmin',
  PRIMARY KEY (user_id),
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE employer (
  user_id             INT          NOT NULL,
  company_name        VARCHAR(150) NOT NULL,
  industry            VARCHAR(100) NOT NULL,
  company_size        ENUM('1-50','51-200','201-500','500+') NOT NULL,
  company_description TEXT         DEFAULT NULL,
  company_logo        VARCHAR(255) DEFAULT NULL,
  website_url         VARCHAR(255) DEFAULT NULL,
  linkedin_url        VARCHAR(255) DEFAULT NULL,
  twitter_url         VARCHAR(255) DEFAULT NULL,
  facebook_url        VARCHAR(255) DEFAULT NULL,
  instagram_url       VARCHAR(255) DEFAULT NULL,
  city                VARCHAR(100) DEFAULT NULL,
  country             VARCHAR(100) DEFAULT NULL,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_employer_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- student references resume(primary_resume_id) below; resume references student.
-- We declare student first without that FK and add it after resume exists.
CREATE TABLE student (
  user_id               INT          NOT NULL,
  major                 VARCHAR(100) NOT NULL,
  university            VARCHAR(150) NOT NULL,
  university_start_date DATE         DEFAULT NULL,
  graduation_year       INT          NOT NULL,
  gpa                   DECIMAL(3,2) DEFAULT NULL,
  bio                   TEXT         DEFAULT NULL,
  gender                VARCHAR(20)  DEFAULT NULL,
  date_of_birth         DATE         DEFAULT NULL,
  city                  VARCHAR(100) DEFAULT NULL,
  country               VARCHAR(100) DEFAULT NULL,
  linkedin_url          VARCHAR(255) DEFAULT NULL,
  github_url            VARCHAR(255) DEFAULT NULL,
  instagram_url         VARCHAR(255) DEFAULT NULL,
  phone                 VARCHAR(20)  DEFAULT NULL,
  primary_resume_id     INT          DEFAULT NULL,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY fk_student_primary_resume (primary_resume_id, user_id),
  CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT chk_student_gpa       CHECK (gpa IS NULL OR (gpa BETWEEN 0.00 AND 4.00)),
  CONSTRAINT chk_student_grad_year CHECK (graduation_year BETWEEN 2000 AND 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- internship  — postings owned by an employer
-- =============================================================================
CREATE TABLE internship (
  internship_id     INT           NOT NULL AUTO_INCREMENT,
  employer_user_id  INT           NOT NULL,
  title             VARCHAR(200)  NOT NULL,
  description       TEXT          NOT NULL,
  city              VARCHAR(100)  NOT NULL,
  country           VARCHAR(100)  NOT NULL,
  duration_months   INT           NOT NULL,
  work_type         ENUM('remote','hybrid','on-site') NOT NULL,
  salary_min        DECIMAL(10,2) DEFAULT NULL,
  salary_max        DECIMAL(10,2) DEFAULT NULL,
  minimum_gpa       DECIMAL(3,2)  DEFAULT NULL,
  status            ENUM('pending_approval','active','closed','rejected') NOT NULL DEFAULT 'pending_approval',
  admin_review_note TEXT          DEFAULT NULL,
  deadline          DATE          DEFAULT NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (internship_id),
  UNIQUE KEY idx_internship_ownership (internship_id, employer_user_id),
  KEY idx_internship_employer        (employer_user_id),
  KEY idx_internship_status          (status),
  KEY idx_internship_status_deadline (status, deadline),
  KEY idx_internship_created_at      (created_at),
  CONSTRAINT fk_internship_employer  FOREIGN KEY (employer_user_id) REFERENCES employer (user_id) ON DELETE CASCADE,
  CONSTRAINT chk_internship_duration CHECK (duration_months > 0 AND duration_months <= 24),
  CONSTRAINT chk_salary_min          CHECK (salary_min IS NULL OR salary_min >= 0),
  CONSTRAINT chk_salary_max          CHECK (salary_max IS NULL OR (salary_max >= 0 AND (salary_min IS NULL OR salary_max >= salary_min))),
  CONSTRAINT chk_internship_min_gpa  CHECK (minimum_gpa IS NULL OR (minimum_gpa BETWEEN 0.00 AND 4.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- resume  — at most one per student (uq_resume_student)
-- =============================================================================
CREATE TABLE resume (
  resume_id         INT          NOT NULL AUTO_INCREMENT,
  student_user_id   INT          NOT NULL,
  file_path         VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_type         ENUM('pdf','docx') NOT NULL,
  extracted_text    LONGTEXT     DEFAULT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resume_id),
  UNIQUE KEY idx_resume_ownership (resume_id, student_user_id),
  UNIQUE KEY uq_resume_student    (student_user_id),
  CONSTRAINT fk_resume_student FOREIGN KEY (student_user_id) REFERENCES student (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Now that resume exists, wire the student -> resume FK.
ALTER TABLE student
  ADD CONSTRAINT fk_student_primary_resume
  FOREIGN KEY (primary_resume_id, user_id)
  REFERENCES resume (resume_id, student_user_id)
  ON DELETE RESTRICT;

-- =============================================================================
-- skill catalog and the two many-to-many join tables
-- =============================================================================
CREATE TABLE skill (
  skill_id        INT          NOT NULL AUTO_INCREMENT,
  display_name    VARCHAR(100) NOT NULL,
  normalized_name VARCHAR(100) NOT NULL,
  category        ENUM('programming','web','data','ai_ml','devops','mobile','design','soft_skill','other') NOT NULL DEFAULT 'other',
  name_embedding  JSON         DEFAULT NULL,  -- used by skillResolver for synonym detection (e.g. "ReactJS" -> "React"); independent of the matching engine
  PRIMARY KEY (skill_id),
  UNIQUE KEY uq_skill_normalized (normalized_name),
  KEY idx_skill_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE has_skill (
  student_user_id   INT NOT NULL,
  skill_id          INT NOT NULL,
  proficiency_level ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
  source            ENUM('manual','extracted') NOT NULL DEFAULT 'manual',
  PRIMARY KEY (student_user_id, skill_id),
  KEY fk_has_skill_skill (skill_id),
  CONSTRAINT fk_has_skill_student FOREIGN KEY (student_user_id) REFERENCES student (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_has_skill_skill   FOREIGN KEY (skill_id)        REFERENCES skill   (skill_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE requires_skill (
  internship_id  INT NOT NULL,
  skill_id       INT NOT NULL,
  required_level ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
  is_mandatory   TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (internship_id, skill_id),
  KEY fk_requires_skill_skill (skill_id),
  CONSTRAINT fk_requires_skill_internship FOREIGN KEY (internship_id) REFERENCES internship (internship_id) ON DELETE CASCADE,
  CONSTRAINT fk_requires_skill_skill      FOREIGN KEY (skill_id)      REFERENCES skill      (skill_id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- match_score_cache  — precomputed (student, internship) scores for the
-- matching engine. Read-through cache: missing rows are computed on first
-- request and inserted; rows are deleted on profile/internship updates so
-- the next request rebuilds from scratch.
-- =============================================================================
CREATE TABLE match_score_cache (
  student_user_id INT          NOT NULL,
  internship_id   INT          NOT NULL,
  final_score     DECIMAL(5,2) NOT NULL,
  breakdown       JSON         NOT NULL,
  computed_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_user_id, internship_id),
  KEY idx_cache_student_score (student_user_id, final_score DESC),
  KEY idx_cache_internship    (internship_id),
  CONSTRAINT fk_cache_student    FOREIGN KEY (student_user_id) REFERENCES student   (user_id)        ON DELETE CASCADE,
  CONSTRAINT fk_cache_internship FOREIGN KEY (internship_id)   REFERENCES internship (internship_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- application + status history
-- =============================================================================
CREATE TABLE application (
  application_id            INT           NOT NULL AUTO_INCREMENT,
  student_user_id           INT           NOT NULL,
  internship_id             INT           NOT NULL,
  resume_id                 INT           DEFAULT NULL,
  submitted_resume_path     VARCHAR(255)  NOT NULL,
  submitted_resume_filename VARCHAR(255)  NOT NULL,
  cover_letter              TEXT          DEFAULT NULL,
  status                    ENUM('pending','under_review','interview_scheduled','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
  match_score               DECIMAL(5,2)  DEFAULT NULL,
  applied_date              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status_updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  employer_note             TEXT          DEFAULT NULL,
  interview_date            DATETIME      DEFAULT NULL,
  updated_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (application_id),
  UNIQUE KEY uq_student_internship_application (student_user_id, internship_id),
  KEY fk_application_resume                    (resume_id, student_user_id),
  KEY idx_application_student_status           (student_user_id, status),
  KEY idx_application_internship_status        (internship_id, status),
  KEY idx_application_applied_date             (applied_date),
  CONSTRAINT fk_application_internship FOREIGN KEY (internship_id) REFERENCES internship (internship_id) ON DELETE CASCADE,
  CONSTRAINT fk_application_student    FOREIGN KEY (student_user_id) REFERENCES student (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_application_resume     FOREIGN KEY (resume_id, student_user_id) REFERENCES resume (resume_id, student_user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_status_history (
  history_id         INT NOT NULL AUTO_INCREMENT,
  application_id     INT NOT NULL,
  old_status         ENUM('pending','under_review','interview_scheduled','accepted','rejected','withdrawn') DEFAULT NULL,
  new_status         ENUM('pending','under_review','interview_scheduled','accepted','rejected','withdrawn') NOT NULL,
  changed_by_user_id INT DEFAULT NULL,
  note               TEXT DEFAULT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (history_id),
  KEY fk_app_history_changed_by              (changed_by_user_id),
  KEY idx_app_history_application_created    (application_id, created_at),
  CONSTRAINT fk_app_history_application FOREIGN KEY (application_id)     REFERENCES application (application_id) ON DELETE CASCADE,
  CONSTRAINT fk_app_history_changed_by  FOREIGN KEY (changed_by_user_id) REFERENCES users       (user_id)        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- bookmark, conversation, message
-- =============================================================================
CREATE TABLE bookmark (
  student_user_id INT NOT NULL,
  internship_id   INT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_user_id, internship_id),
  KEY fk_bookmark_internship (internship_id),
  CONSTRAINT fk_bookmark_student    FOREIGN KEY (student_user_id) REFERENCES student    (user_id)       ON DELETE CASCADE,
  CONSTRAINT fk_bookmark_internship FOREIGN KEY (internship_id)   REFERENCES internship (internship_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE conversation (
  conversation_id  INT NOT NULL AUTO_INCREMENT,
  student_user_id  INT NOT NULL,
  employer_user_id INT NOT NULL,
  internship_id    INT DEFAULT NULL,
  context_type     ENUM('general','internship') NOT NULL,
  context_key      INT NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id),
  UNIQUE KEY uq_conversation_context (student_user_id, employer_user_id, context_type, context_key),
  KEY fk_conversation_internship     (internship_id),
  KEY idx_conversation_student       (student_user_id),
  KEY idx_conversation_employer      (employer_user_id),
  CONSTRAINT fk_conversation_student    FOREIGN KEY (student_user_id)  REFERENCES student    (user_id)       ON DELETE CASCADE,
  CONSTRAINT fk_conversation_employer   FOREIGN KEY (employer_user_id) REFERENCES employer   (user_id)       ON DELETE CASCADE,
  CONSTRAINT fk_conversation_internship FOREIGN KEY (internship_id)    REFERENCES internship (internship_id) ON DELETE SET NULL,
  CONSTRAINT chk_conversation_context CHECK (
    (context_type = 'general'    AND context_key = 0) OR
    (context_type = 'internship' AND context_key > 0)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE message (
  message_id      INT NOT NULL AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_user_id  INT DEFAULT NULL,
  content         TEXT NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id),
  KEY fk_message_sender                  (sender_user_id),
  KEY idx_message_conversation_created   (conversation_id, created_at),
  KEY idx_message_conversation_read      (conversation_id, is_read),
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES conversation (conversation_id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender       FOREIGN KEY (sender_user_id)  REFERENCES users        (user_id)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- notifications + per-user channel preferences
-- =============================================================================
CREATE TABLE notification (
  notification_id INT          NOT NULL AUTO_INCREMENT,
  user_id         INT          NOT NULL,
  type            VARCHAR(50)  NOT NULL,
  title           VARCHAR(200) NOT NULL,
  message         TEXT         NOT NULL,
  reference_id    INT          DEFAULT NULL,
  reference_type  VARCHAR(50)  DEFAULT NULL,
  is_read         TINYINT(1)   NOT NULL DEFAULT 0,
  email_sent      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  KEY idx_notification_user_read_created (user_id, is_read, created_at),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_preference (
  user_id                    INT NOT NULL,
  email_application_status   TINYINT(1) NOT NULL DEFAULT 1,
  email_new_application      TINYINT(1) NOT NULL DEFAULT 1,
  email_new_message          TINYINT(1) NOT NULL DEFAULT 1,
  email_recommendations      TINYINT(1) NOT NULL DEFAULT 1,
  email_internship_approved  TINYINT(1) NOT NULL DEFAULT 1,
  email_invitation           TINYINT(1) NOT NULL DEFAULT 1,
  updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_notification_preference_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- password_reset_token  — single-use, hashed, time-bound
-- =============================================================================
CREATE TABLE password_reset_token (
  token_id   INT      NOT NULL AUTO_INCREMENT,
  user_id    INT      NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_id),
  UNIQUE KEY uq_password_reset_token (token_hash),
  KEY idx_password_reset_user_expires_used (user_id, expires_at, used),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- internship_invitation  — employer invites a student to apply
-- =============================================================================
CREATE TABLE internship_invitation (
  invitation_id    INT NOT NULL AUTO_INCREMENT,
  internship_id    INT NOT NULL,
  student_user_id  INT NOT NULL,
  employer_user_id INT NOT NULL,
  message          TEXT DEFAULT NULL,
  status           ENUM('pending','viewed','applied','dismissed') NOT NULL DEFAULT 'pending',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (invitation_id),
  UNIQUE KEY uq_internship_student_invite (internship_id, student_user_id),
  KEY idx_invitation_student_status (student_user_id, status),
  KEY idx_invitation_internship     (internship_id),
  KEY fk_invitation_ownership       (internship_id, employer_user_id),
  CONSTRAINT fk_invitation_student   FOREIGN KEY (student_user_id) REFERENCES student (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_invitation_ownership FOREIGN KEY (internship_id, employer_user_id) REFERENCES internship (internship_id, employer_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- internship_view  — view log used for analytics
-- =============================================================================
CREATE TABLE internship_view (
  view_id        INT NOT NULL AUTO_INCREMENT,
  internship_id  INT NOT NULL,
  viewer_user_id INT DEFAULT NULL,
  viewed_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (view_id),
  KEY idx_view_internship_viewed         (internship_id, viewed_at),
  KEY idx_view_internship_user_viewed    (internship_id, viewer_user_id, viewed_at),
  CONSTRAINT fk_view_internship FOREIGN KEY (internship_id)  REFERENCES internship (internship_id) ON DELETE CASCADE,
  CONSTRAINT fk_view_user       FOREIGN KEY (viewer_user_id) REFERENCES users      (user_id)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- report  — admin-generated reports (metadata only; data exported on demand)
-- =============================================================================
CREATE TABLE report (
  report_id          INT          NOT NULL AUTO_INCREMENT,
  admin_user_id      INT          DEFAULT NULL,
  report_type        VARCHAR(100) NOT NULL,
  report_description TEXT         DEFAULT NULL,
  filters_json       TEXT         DEFAULT NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  KEY fk_report_admin (admin_user_id),
  CONSTRAINT fk_report_admin FOREIGN KEY (admin_user_id) REFERENCES admin (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- system_log  — audit trail of significant actions (auth, admin, etc.)
-- =============================================================================
CREATE TABLE system_log (
  log_id     INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          DEFAULT NULL,
  action     VARCHAR(200) NOT NULL,
  details    TEXT         DEFAULT NULL,
  ip_address VARCHAR(45)  DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_system_log_user    (user_id),
  KEY idx_system_log_action  (action),
  KEY idx_system_log_created (created_at),
  CONSTRAINT fk_system_log_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
