-- Migration: Add gender, date_of_birth, location to student table
-- Run: mysql -u root -p internmatch < migration_add_student_fields.sql

ALTER TABLE student
  ADD COLUMN gender VARCHAR(20) DEFAULT NULL AFTER bio,
  ADD COLUMN date_of_birth DATE DEFAULT NULL AFTER gender,
  ADD COLUMN location VARCHAR(150) DEFAULT NULL AFTER date_of_birth;
