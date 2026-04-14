-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: internmatch
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `user_id` int NOT NULL,
  `access_level` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SuperAdmin',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_admin_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application`
--

DROP TABLE IF EXISTS `application`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application` (
  `application_id` int NOT NULL AUTO_INCREMENT,
  `student_user_id` int NOT NULL,
  `internship_id` int NOT NULL,
  `resume_id` int DEFAULT NULL,
  `submitted_resume_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_resume_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_letter` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','under_review','interview_scheduled','accepted','rejected','withdrawn') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `match_score` decimal(5,2) DEFAULT NULL,
  `applied_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status_updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `employer_note` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`application_id`),
  UNIQUE KEY `uq_student_internship_application` (`student_user_id`,`internship_id`),
  KEY `fk_application_resume` (`resume_id`,`student_user_id`),
  KEY `idx_application_student_status` (`student_user_id`,`status`),
  KEY `idx_application_internship_status` (`internship_id`,`status`),
  KEY `idx_application_applied_date` (`applied_date`),
  CONSTRAINT `fk_application_internship` FOREIGN KEY (`internship_id`) REFERENCES `internship` (`internship_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_application_resume` FOREIGN KEY (`resume_id`, `student_user_id`) REFERENCES `resume` (`resume_id`, `student_user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_application_student` FOREIGN KEY (`student_user_id`) REFERENCES `student` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application`
--

LOCK TABLES `application` WRITE;
/*!40000 ALTER TABLE `application` DISABLE KEYS */;
/*!40000 ALTER TABLE `application` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_status_history`
--

DROP TABLE IF EXISTS `application_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_status_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `old_status` enum('pending','under_review','interview_scheduled','accepted','rejected','withdrawn') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` enum('pending','under_review','interview_scheduled','accepted','rejected','withdrawn') COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_user_id` int DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `fk_app_history_changed_by` (`changed_by_user_id`),
  KEY `idx_app_history_application_created` (`application_id`,`created_at`),
  CONSTRAINT `fk_app_history_application` FOREIGN KEY (`application_id`) REFERENCES `application` (`application_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_history_changed_by` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_status_history`
--

LOCK TABLES `application_status_history` WRITE;
/*!40000 ALTER TABLE `application_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookmark`
--

DROP TABLE IF EXISTS `bookmark`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookmark` (
  `student_user_id` int NOT NULL,
  `internship_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_user_id`,`internship_id`),
  KEY `fk_bookmark_internship` (`internship_id`),
  CONSTRAINT `fk_bookmark_internship` FOREIGN KEY (`internship_id`) REFERENCES `internship` (`internship_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookmark_student` FOREIGN KEY (`student_user_id`) REFERENCES `student` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookmark`
--

LOCK TABLES `bookmark` WRITE;
/*!40000 ALTER TABLE `bookmark` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookmark` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation`
--

DROP TABLE IF EXISTS `conversation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation` (
  `conversation_id` int NOT NULL AUTO_INCREMENT,
  `student_user_id` int NOT NULL,
  `employer_user_id` int NOT NULL,
  `internship_id` int DEFAULT NULL,
  `context_type` enum('general','internship') COLLATE utf8mb4_unicode_ci NOT NULL,
  `context_key` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`),
  UNIQUE KEY `uq_conversation_context` (`student_user_id`,`employer_user_id`,`context_type`,`context_key`),
  KEY `fk_conversation_internship` (`internship_id`),
  KEY `idx_conversation_student` (`student_user_id`),
  KEY `idx_conversation_employer` (`employer_user_id`),
  CONSTRAINT `fk_conversation_employer` FOREIGN KEY (`employer_user_id`) REFERENCES `employer` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_internship` FOREIGN KEY (`internship_id`) REFERENCES `internship` (`internship_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_conversation_student` FOREIGN KEY (`student_user_id`) REFERENCES `student` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_conversation_context` CHECK (
    (`context_type` = 'general' AND `context_key` = 0) OR
    (`context_type` = 'internship' AND `context_key` > 0)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation`
--

LOCK TABLES `conversation` WRITE;
/*!40000 ALTER TABLE `conversation` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employer`
--

DROP TABLE IF EXISTS `employer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employer` (
  `user_id` int NOT NULL,
  `company_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `industry` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_size` enum('1-50','51-200','201-500','500+') COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_description` text COLLATE utf8mb4_unicode_ci,
  `company_logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `twitter_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_employer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employer`
--

LOCK TABLES `employer` WRITE;
/*!40000 ALTER TABLE `employer` DISABLE KEYS */;
/*!40000 ALTER TABLE `employer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `has_skill`
--

DROP TABLE IF EXISTS `has_skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `has_skill` (
  `student_user_id` int NOT NULL,
  `skill_id` int NOT NULL,
  `proficiency_level` enum('beginner','intermediate','advanced') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'intermediate',
  `source` enum('manual','extracted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  PRIMARY KEY (`student_user_id`,`skill_id`),
  KEY `fk_has_skill_skill` (`skill_id`),
  CONSTRAINT `fk_has_skill_skill` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`skill_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_has_skill_student` FOREIGN KEY (`student_user_id`) REFERENCES `student` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `has_skill`
--

LOCK TABLES `has_skill` WRITE;
/*!40000 ALTER TABLE `has_skill` DISABLE KEYS */;
/*!40000 ALTER TABLE `has_skill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship`
--

DROP TABLE IF EXISTS `internship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship` (
  `internship_id` int NOT NULL AUTO_INCREMENT,
  `employer_user_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_months` int NOT NULL,
  `work_type` enum('remote','hybrid','on-site') COLLATE utf8mb4_unicode_ci NOT NULL,
  `salary_min` decimal(10,2) DEFAULT NULL,
  `salary_max` decimal(10,2) DEFAULT NULL,
  `status` enum('pending_approval','active','closed','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_approval',
  `admin_review_note` text COLLATE utf8mb4_unicode_ci,
  `deadline` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`internship_id`),
  KEY `idx_internship_employer` (`employer_user_id`),
  UNIQUE KEY `idx_internship_ownership` (`internship_id`,`employer_user_id`),
  KEY `idx_internship_status` (`status`),
  KEY `idx_internship_status_deadline` (`status`,`deadline`),
  KEY `idx_internship_created_at` (`created_at`),
  CONSTRAINT `fk_internship_employer` FOREIGN KEY (`employer_user_id`) REFERENCES `employer` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_internship_duration` CHECK (((`duration_months` > 0) and (`duration_months` <= 24))),
  CONSTRAINT `chk_salary_max` CHECK (((`salary_max` is null) or ((`salary_max` >= 0) and ((`salary_min` is null) or (`salary_max` >= `salary_min`))))),
  CONSTRAINT `chk_salary_min` CHECK (((`salary_min` is null) or (`salary_min` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship`
--

LOCK TABLES `internship` WRITE;
/*!40000 ALTER TABLE `internship` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_embedding`
--

DROP TABLE IF EXISTS `internship_embedding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_embedding` (
  `internship_id` int NOT NULL,
  `embedding` json NOT NULL,
  `source_text_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text-embedding-004',
  `dimensions` int NOT NULL DEFAULT '768',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`internship_id`),
  CONSTRAINT `fk_internship_embedding_internship` FOREIGN KEY (`internship_id`) REFERENCES `internship` (`internship_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_embedding`
--

LOCK TABLES `internship_embedding` WRITE;
/*!40000 ALTER TABLE `internship_embedding` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_embedding` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_invitation`
--

DROP TABLE IF EXISTS `internship_invitation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_invitation` (
  `invitation_id` int NOT NULL AUTO_INCREMENT,
  `internship_id` int NOT NULL,
  `student_user_id` int NOT NULL,
  `employer_user_id` int NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','viewed','applied','dismissed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`invitation_id`),
  UNIQUE KEY `uq_internship_student_invite` (`internship_id`,`student_user_id`),
  KEY `fk_invitation_employer` (`employer_user_id`),
  KEY `idx_invitation_student_status` (`student_user_id`,`status`),
  KEY `idx_invitation_internship` (`internship_id`),
  KEY `fk_invitation_ownership` (`internship_id`,`employer_user_id`),
  CONSTRAINT `fk_invitation_ownership` FOREIGN KEY (`internship_id`, `employer_user_id`) REFERENCES `internship` (`internship_id`, `employer_user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invitation_student` FOREIGN KEY (`student_user_id`) REFERENCES `student` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_invitation`
--

LOCK TABLES `internship_invitation` WRITE;
/*!40000 ALTER TABLE `internship_invitation` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_invitation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_view`
--

DROP TABLE IF EXISTS `internship_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_view` (
  `view_id` int NOT NULL AUTO_INCREMENT,
  `internship_id` int NOT NULL,
  `viewer_user_id` int DEFAULT NULL,
  `viewed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`view_id`),
  KEY `idx_view_internship_viewed` (`internship_id`,`viewed_at`),
  KEY `idx_view_internship_user_viewed` (`internship_id`,`viewer_user_id`,`viewed_at`),
  CONSTRAINT `fk_view_internship` FOREIGN KEY (`internship_id`) REFERENCES `internship` (`internship_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_view_user` FOREIGN KEY (`viewer_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_view`
--

LOCK TABLES `internship_view` WRITE;
/*!40000 ALTER TABLE `internship_view` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_view` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_user_id` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `fk_message_sender` (`sender_user_id`),
  KEY `idx_message_conversation_created` (`conversation_id`,`created_at`),
  KEY `idx_message_conversation_read` (`conversation_id`,`is_read`),
  CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `email_sent` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notification_user_read_created` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preference`
--

DROP TABLE IF EXISTS `notification_preference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preference` (
  `user_id` int NOT NULL,
  `email_application_status` tinyint(1) NOT NULL DEFAULT '1',
  `email_new_application` tinyint(1) NOT NULL DEFAULT '1',
  `email_new_message` tinyint(1) NOT NULL DEFAULT '1',
  `email_recommendations` tinyint(1) NOT NULL DEFAULT '1',
  `email_internship_approved` tinyint(1) NOT NULL DEFAULT '1',
  `email_invitation` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_notification_preference_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preference`
--

LOCK TABLES `notification_preference` WRITE;
/*!40000 ALTER TABLE `notification_preference` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_preference` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_token`
--

DROP TABLE IF EXISTS `password_reset_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_token` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_password_reset_user_expires_used` (`user_id`,`expires_at`,`used`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_token`
--

LOCK TABLES `password_reset_token` WRITE;
/*!40000 ALTER TABLE `password_reset_token` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `admin_user_id` int DEFAULT NULL,
  `report_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_description` text COLLATE utf8mb4_unicode_ci,
  `filters_json` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `fk_report_admin` (`admin_user_id`),
  CONSTRAINT `fk_report_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report`
--

LOCK TABLES `report` WRITE;
/*!40000 ALTER TABLE `report` DISABLE KEYS */;
/*!40000 ALTER TABLE `report` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requires_skill`
--

DROP TABLE IF EXISTS `requires_skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requires_skill` (
  `internship_id` int NOT NULL,
  `skill_id` int NOT NULL,
  `required_level` enum('beginner','intermediate','advanced') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'intermediate',
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`internship_id`,`skill_id`),
  KEY `fk_requires_skill_skill` (`skill_id`),
  CONSTRAINT `fk_requires_skill_internship` FOREIGN KEY (`internship_id`) REFERENCES `internship` (`internship_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_requires_skill_skill` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`skill_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requires_skill`
--

LOCK TABLES `requires_skill` WRITE;
/*!40000 ALTER TABLE `requires_skill` DISABLE KEYS */;
/*!40000 ALTER TABLE `requires_skill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resume`
--

DROP TABLE IF EXISTS `resume`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resume` (
  `resume_id` int NOT NULL AUTO_INCREMENT,
  `student_user_id` int NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` enum('pdf','docx') COLLATE utf8mb4_unicode_ci NOT NULL,
  `extracted_text` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`resume_id`),
  UNIQUE KEY `idx_resume_ownership` (`resume_id`,`student_user_id`),
  UNIQUE KEY `uq_resume_student` (`student_user_id`),
  CONSTRAINT `fk_resume_student` FOREIGN KEY (`student_user_id`) REFERENCES `student` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resume`
--

LOCK TABLES `resume` WRITE;
/*!40000 ALTER TABLE `resume` DISABLE KEYS */;
/*!40000 ALTER TABLE `resume` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skill`
--

DROP TABLE IF EXISTS `skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skill` (
  `skill_id` int NOT NULL AUTO_INCREMENT,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalized_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('programming','web','data','ai_ml','devops','mobile','design','soft_skill','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  PRIMARY KEY (`skill_id`),
  UNIQUE KEY `normalized_name` (`normalized_name`),
  KEY `idx_skill_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skill`
--

LOCK TABLES `skill` WRITE;
/*!40000 ALTER TABLE `skill` DISABLE KEYS */;
/*!40000 ALTER TABLE `skill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
  `user_id` int NOT NULL,
  `major` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `university` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `university_start_date` date DEFAULT NULL,
  `gpa` decimal(3,2) DEFAULT NULL,
  `graduation_year` int NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `github_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_resume_id` int DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `fk_student_primary_resume` (`primary_resume_id`,`user_id`),
  CONSTRAINT `fk_student_primary_resume` FOREIGN KEY (`primary_resume_id`, `user_id`) REFERENCES `resume` (`resume_id`, `student_user_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_student_gpa` CHECK (((`gpa` is null) or (`gpa` between 0.00 and 4.00))),
  CONSTRAINT `chk_student_grad_year` CHECK ((`graduation_year` between 2000 and 2100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_embedding`
--

DROP TABLE IF EXISTS `student_embedding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_embedding` (
  `student_user_id` int NOT NULL,
  `embedding` json NOT NULL,
  `source_text_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text-embedding-004',
  `dimensions` int NOT NULL DEFAULT '768',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_user_id`),
  CONSTRAINT `fk_student_embedding_student` FOREIGN KEY (`student_user_id`) REFERENCES `student` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_embedding`
--

LOCK TABLES `student_embedding` WRITE;
/*!40000 ALTER TABLE `student_embedding` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_embedding` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_log`
--

DROP TABLE IF EXISTS `system_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_system_log_user` (`user_id`),
  KEY `idx_system_log_action` (`action`),
  KEY `idx_system_log_created` (`created_at`),
  CONSTRAINT `fk_system_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_log`
--

LOCK TABLES `system_log` WRITE;
/*!40000 ALTER TABLE `system_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('student','employer','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `profile_picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `token_version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role_active` (`role`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-16  2:10:11