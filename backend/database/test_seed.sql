-- InternMatch Test Seed Data
-- Run AFTER seed.sql (requires skills to exist)
-- Passwords are all "Test@1234" (bcrypt hash below)
-- Usage: mysql -u root -p internmatch < test_seed.sql
--
-- All values below match the app's whitelists:
--   Industries: see backend/src/controllers/authController.js VALID_INDUSTRIES
--               (Technology, Finance, Healthcare, Education, Marketing, Engineering, Other)
--   Universities: see frontend/src/utils/academicData.js JORDAN_UNIVERSITIES
--   Majors: see frontend/src/utils/academicData.js MAJORS
--   Notification types: see backend/src/utils/notificationService.js TYPE_TO_PREF

SET @test_pw = '$2a$12$so4aZC2Fgc7eYvRByIUr3.MBJskiPnv3p5VatBrm6WqGdM8ditMQy';

-- =============================================================================
-- 1. Test Employers (industries restricted to whitelist)
-- =============================================================================

INSERT IGNORE INTO users (full_name, email, password, role, is_active, token_version)
VALUES
  ('Sarah Khaled',  'sarah@techcorp.jo',   @test_pw, 'employer', 1, 0),
  ('Mahmoud Chen',  'mahmoud@dataflow.jo', @test_pw, 'employer', 1, 0),
  ('Lana Williams', 'lana@designhub.jo',   @test_pw, 'employer', 1, 0);

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, location)
SELECT user_id, 'TechCorp Solutions', 'Technology', '51-200', 'https://techcorp.example.com',
       'TechCorp Solutions is a leading software company in Amman specializing in enterprise SaaS products. We build tools that help businesses streamline operations and improve productivity.',
       'Amman, Jordan'
FROM users WHERE email = 'sarah@techcorp.jo';

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, location)
SELECT user_id, 'DataFlow Analytics', 'Technology', '1-50', 'https://dataflow.example.com',
       'DataFlow Analytics helps companies harness the power of their data through machine learning and advanced analytics solutions.',
       'Amman, Jordan'
FROM users WHERE email = 'mahmoud@dataflow.jo';

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, location)
SELECT user_id, 'DesignHub Creative', 'Marketing', '1-50', 'https://designhub.example.com',
       'DesignHub Creative is a boutique design and brand agency creating digital experiences for startups and established brands across the MENA region.',
       'Irbid, Jordan'
FROM users WHERE email = 'lana@designhub.jo';

-- Notification preferences for employers
INSERT IGNORE INTO notification_preference (user_id)
SELECT user_id FROM users WHERE email IN ('sarah@techcorp.jo', 'mahmoud@dataflow.jo', 'lana@designhub.jo');

-- =============================================================================
-- 2. Test Students (universities + majors restricted to whitelist)
-- =============================================================================

INSERT IGNORE INTO users (full_name, email, password, role, is_active, token_version)
VALUES
  ('Alex Rivera',   'alex@psut.edu.jo',   @test_pw, 'student', 1, 0),
  ('Jordan Lee',    'jordan@just.edu.jo', @test_pw, 'student', 1, 0),
  ('Taylor Smith',  'taylor@uj.edu.jo',   @test_pw, 'student', 1, 0),
  ('Morgan Davis',  'morgan@gju.edu.jo',  @test_pw, 'student', 1, 0);

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, phone, linkedin_url, github_url, location)
SELECT user_id,
       'Computer Science', 'Princess Sumaya University for Technology', 2026, 3.85,
       'Passionate full-stack developer with experience in React, Node.js, and cloud technologies. Looking for opportunities to build impactful products.',
       '+962-79-555-0101', 'https://linkedin.com/in/alexrivera', 'https://github.com/alexrivera', 'Amman, Jordan'
FROM users WHERE email = 'alex@psut.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, phone, linkedin_url, location)
SELECT user_id,
       'Data Science', 'Jordan University of Science and Technology', 2025, 3.72,
       'Data science enthusiast skilled in Python, machine learning, and statistical analysis. Experience with real-world datasets and predictive modeling.',
       '+962-79-555-0102', 'https://linkedin.com/in/jordanlee', 'Irbid, Jordan'
FROM users WHERE email = 'jordan@just.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, github_url, location)
SELECT user_id,
       'Graphic Design', 'University of Jordan', 2027, 3.50,
       'Creative designer with a strong eye for aesthetics and user experience. Proficient in Figma, Adobe Suite, and modern web design principles.',
       'https://github.com/taylorsmith', 'Amman, Jordan'
FROM users WHERE email = 'taylor@uj.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, location)
SELECT user_id,
       'Software Engineering', 'German Jordanian University', 2026, 3.90,
       'Backend-focused engineer interested in distributed systems, databases, and API design. Strong algorithmic skills from competitive programming.',
       'Amman, Jordan'
FROM users WHERE email = 'morgan@gju.edu.jo';

-- Notification preferences for students
INSERT IGNORE INTO notification_preference (user_id)
SELECT user_id FROM users WHERE email IN ('alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo');

-- =============================================================================
-- 3. Student Skills
-- =============================================================================

-- Alex Rivera: Full-stack web dev
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name = 'javascript';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name = 'react';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name = 'nodejs';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name = 'typescript';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name = 'tailwindcss';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name = 'mysql';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'beginner', 'manual'
FROM users u, skill s WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name = 'docker';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name = 'git';

-- Jordan Lee: Data / ML
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name = 'python';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name = 'machinelearning';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name = 'tensorflow';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name = 'pandas';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name = 'sql';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'beginner', 'manual'
FROM users u, skill s WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name = 'docker';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name = 'datavisualization';

-- Taylor Smith: Design
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name = 'figma';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name = 'uidesign';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name = 'uxdesign';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name = 'html';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name = 'css';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'beginner', 'manual'
FROM users u, skill s WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name = 'javascript';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name = 'photoshop';

-- Morgan Davis: Backend / Systems
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name = 'java';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name = 'python';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name = 'nodejs';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name = 'mysql';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name = 'postgresql';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name = 'docker';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual'
FROM users u, skill s WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name = 'aws';
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual'
FROM users u, skill s WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name = 'git';

-- =============================================================================
-- 4. Test Internships (active, approved). Salaries in JOD.
-- =============================================================================

-- TechCorp: Full-Stack Developer Intern
INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Full-Stack Developer Intern',
       'Join our engineering team to build and maintain web applications using React and Node.js. You will work on real customer-facing features, participate in code reviews, and collaborate with senior engineers.\n\nResponsibilities:\n- Develop frontend components with React and TypeScript\n- Build RESTful APIs with Node.js and Express\n- Write unit and integration tests\n- Participate in agile ceremonies and sprint planning',
       'Amman, Jordan', 'hybrid', 3, 400, 700,
       DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo';

-- TechCorp: Backend Engineering Intern
INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Backend Engineering Intern',
       'Work on our backend microservices architecture. You will help design and implement APIs, optimize database queries, and improve system reliability.\n\nRequirements:\n- Strong foundation in Java or Python\n- Understanding of relational databases\n- Familiarity with cloud services (AWS preferred)\n- Good communication skills',
       'Amman, Jordan', 'on-site', 6, 500, 800,
       DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo';

-- DataFlow: Data Science Intern
INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Data Science Intern',
       'Help our data team build predictive models and analyze large datasets. You will work with Python, TensorFlow, and SQL to derive insights that drive product decisions.\n\nWhat you will do:\n- Clean and preprocess datasets\n- Build and evaluate ML models\n- Create data visualizations and dashboards\n- Present findings to stakeholders',
       'Remote', 'remote', 3, 350, 600,
       DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'active'
FROM users WHERE email = 'mahmoud@dataflow.jo';

-- DataFlow: ML Engineer Intern
INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Machine Learning Engineer Intern',
       'Join our AI research team to develop and deploy machine learning models. You will work on NLP and computer vision projects using PyTorch and TensorFlow.\n\nIdeal candidate:\n- Strong Python programming skills\n- Experience with deep learning frameworks\n- Understanding of linear algebra and statistics\n- Interest in production ML systems',
       'Amman, Jordan', 'hybrid', 6, 600, 900,
       DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'active'
FROM users WHERE email = 'mahmoud@dataflow.jo';

-- DesignHub: UI/UX Design Intern
INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'UI/UX Design Intern',
       'Create beautiful and intuitive user interfaces for our clients. You will conduct user research, create wireframes, and deliver high-fidelity designs in Figma.\n\nYour responsibilities:\n- Conduct user interviews and usability testing\n- Create wireframes and interactive prototypes\n- Design responsive layouts for web and mobile\n- Collaborate with developers on implementation',
       'Irbid, Jordan', 'remote', 3, 300, 500,
       DATE_ADD(CURDATE(), INTERVAL 50 DAY), 'active'
FROM users WHERE email = 'lana@designhub.jo';

-- DesignHub: Frontend Developer Intern
INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Frontend Developer Intern',
       'Build pixel-perfect web interfaces using modern frontend technologies. You will translate Figma designs into responsive React components with Tailwind CSS.\n\nWe are looking for:\n- Solid HTML/CSS fundamentals\n- Experience with React or similar framework\n- Eye for design and attention to detail\n- Portfolio of web projects',
       'Irbid, Jordan', 'hybrid', 4, 350, 600,
       DATE_ADD(CURDATE(), INTERVAL 35 DAY), 'active'
FROM users WHERE email = 'lana@designhub.jo';

-- =============================================================================
-- 5. Required Skills for Internships
-- =============================================================================

-- Full-Stack Developer Intern (TechCorp)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Full-Stack Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'javascript';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Full-Stack Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'react';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1
FROM internship i, skill s WHERE i.title = 'Full-Stack Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'nodejs';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'Full-Stack Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'typescript';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'Full-Stack Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'git';

-- Backend Engineering Intern (TechCorp)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Backend Engineering Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'java';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Backend Engineering Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'mysql';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1
FROM internship i, skill s WHERE i.title = 'Backend Engineering Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'aws';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'Backend Engineering Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'docker';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'Backend Engineering Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo') AND s.normalized_name = 'git';

-- Data Science Intern (DataFlow)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Data Science Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'python';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1
FROM internship i, skill s WHERE i.title = 'Data Science Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'machinelearning';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1
FROM internship i, skill s WHERE i.title = 'Data Science Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'sql';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'Data Science Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'pandas';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'Data Science Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'datavisualization';

-- ML Engineer Intern (DataFlow)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'advanced', 1
FROM internship i, skill s WHERE i.title = 'Machine Learning Engineer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'python';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Machine Learning Engineer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'machinelearning';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Machine Learning Engineer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'tensorflow';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'Machine Learning Engineer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo') AND s.normalized_name = 'docker';

-- UI/UX Design Intern (DesignHub)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'UI/UX Design Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'figma';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'UI/UX Design Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'uidesign';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1
FROM internship i, skill s WHERE i.title = 'UI/UX Design Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'uxdesign';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'UI/UX Design Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'photoshop';

-- Frontend Developer Intern (DesignHub)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Frontend Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'javascript';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1
FROM internship i, skill s WHERE i.title = 'Frontend Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'react';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Frontend Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'html';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1
FROM internship i, skill s WHERE i.title = 'Frontend Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'css';
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0
FROM internship i, skill s WHERE i.title = 'Frontend Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo') AND s.normalized_name = 'tailwindcss';

-- =============================================================================
-- 6. Test Notifications (types match notificationService.js TYPE_TO_PREF)
-- =============================================================================

-- Welcome notifications for all test users
INSERT INTO notification (user_id, type, title, message, reference_type)
SELECT user_id, 'welcome', 'Welcome to InternMatch!',
       'Your account has been created. Complete your profile to start matching with opportunities.', 'user'
FROM users WHERE email IN ('alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo');

INSERT INTO notification (user_id, type, title, message, reference_type)
SELECT user_id, 'welcome', 'Welcome to InternMatch!',
       'Your employer account is ready. Post your first internship to start receiving applications.', 'user'
FROM users WHERE email IN ('sarah@techcorp.jo', 'mahmoud@dataflow.jo', 'lana@designhub.jo');

-- Internship approved notifications for employers
INSERT INTO notification (user_id, type, title, message, reference_id, reference_type)
SELECT i.employer_user_id, 'internship_approved',
       CONCAT('Internship Approved: ', i.title),
       CONCAT('Your internship "', i.title, '" has been approved and is now active.'),
       i.internship_id, 'internship'
FROM internship i WHERE i.status = 'active';

-- Admin notification for new users
INSERT INTO notification (user_id, type, title, message, reference_type)
SELECT u.user_id, 'new_user_registered', 'New Users Registered',
       'Multiple new users have registered on the platform. Review their profiles in the admin panel.', 'user'
FROM users u WHERE u.email = 'admin@internmatch.com';

SELECT 'Test seed data inserted successfully!' AS status;
