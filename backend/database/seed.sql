-- InternMatch — full seed data (admin + skill catalog + test accounts).
--
-- Run AFTER Schema.sql:
--   mysql -u root -p internmatch < seed.sql
--
-- The script is idempotent: every insert uses INSERT IGNORE so re-running it
-- does not create duplicates. Application/notification rows that have no
-- natural unique key are guarded with NOT EXISTS subqueries.
--
-- Test passwords:
--   every seeded account         Test@1234

SET NAMES utf8mb4;
-- MySQL Workbench runs with safe-updates by default, which blocks any UPDATE
-- whose WHERE clause doesn't filter on a key column. Several seed UPDATEs
-- intentionally filter on non-key columns (e.g. WHERE primary_resume_id IS NULL),
-- so disable safe-updates for the duration of this script.
SET SQL_SAFE_UPDATES = 0;

SET @test_pw = '$2a$12$so4aZC2Fgc7eYvRByIUr3.MBJskiPnv3p5VatBrm6WqGdM8ditMQy';

-- =============================================================================
-- 1. Default admin
-- =============================================================================

INSERT IGNORE INTO users (full_name, email, password, role, is_active, token_version)
VALUES (
  'System Admin',
  'admin@internmatch.com',
  @test_pw,
  'admin', 1, 0
);

INSERT IGNORE INTO admin (user_id, access_level)
SELECT user_id, 'SuperAdmin' FROM users WHERE email = 'admin@internmatch.com';

INSERT IGNORE INTO notification_preference (user_id)
SELECT user_id FROM users WHERE email = 'admin@internmatch.com';

-- =============================================================================
-- 2. Skill catalog (~155 entries across 9 categories)
-- =============================================================================

-- Programming Languages
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('JavaScript', 'javascript', 'programming'),
('Python',     'python',     'programming'),
('Java',       'java',       'programming'),
('C++',        'cpp',        'programming'),
('C#',         'csharp',     'programming'),
('C',          'c',          'programming'),
('TypeScript', 'typescript', 'programming'),
('PHP',        'php',        'programming'),
('Ruby',       'ruby',       'programming'),
('Swift',      'swift',      'programming'),
('Kotlin',     'kotlin',     'programming'),
('Go',         'go',         'programming'),
('Rust',       'rust',       'programming'),
('R',          'r',          'programming'),
('MATLAB',     'matlab',     'programming'),
('Scala',      'scala',      'programming'),
('Perl',       'perl',       'programming'),
('Dart',       'dart',       'programming'),
('Lua',        'lua',        'programming'),
('Shell/Bash', 'shellbash',  'programming'),
('Assembly',   'assembly',   'programming'),
('Objective-C','objectivec', 'programming'),
('Haskell',    'haskell',    'programming'),
('Elixir',     'elixir',     'programming'),
('Clojure',    'clojure',    'programming'),
('F#',         'fsharp',     'programming'),
('COBOL',      'cobol',      'programming'),
('Fortran',    'fortran',    'programming'),
('SQL',        'sql',        'programming'),
('GraphQL',    'graphql',    'programming');

-- Web Development
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('React',         'react',         'web'),
('Angular',       'angular',       'web'),
('Vue.js',        'vuejs',         'web'),
('Next.js',       'nextjs',        'web'),
('Node.js',       'nodejs',        'web'),
('Express.js',    'expressjs',     'web'),
('Django',        'django',        'web'),
('Flask',         'flask',         'web'),
('Spring Boot',   'springboot',    'web'),
('ASP.NET',       'aspnet',        'web'),
('HTML',          'html',          'web'),
('CSS',           'css',           'web'),
('Tailwind CSS',  'tailwindcss',   'web'),
('Bootstrap',     'bootstrap',     'web'),
('SASS',          'sass',          'web'),
('jQuery',        'jquery',        'web'),
('WordPress',     'wordpress',     'web'),
('Laravel',       'laravel',       'web'),
('Ruby on Rails', 'rubyonrails',   'web'),
('Svelte',        'svelte',        'web'),
('Gatsby',        'gatsby',        'web'),
('REST API',      'restapi',       'web'),
('GraphQL API',   'graphqlapi',    'web'),
('WebSocket',     'websocket',     'web'),
('OAuth',         'oauth',         'web');

-- Data & Databases
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('MySQL',              'mysql',             'data'),
('PostgreSQL',         'postgresql',        'data'),
('MongoDB',            'mongodb',           'data'),
('Firebase',           'firebase',          'data'),
('Redis',              'redis',             'data'),
('SQLite',             'sqlite',            'data'),
('Oracle',             'oracle',            'data'),
('SQL Server',         'sqlserver',         'data'),
('Elasticsearch',      'elasticsearch',     'data'),
('DynamoDB',           'dynamodb',          'data'),
('Cassandra',          'cassandra',         'data'),
('Data Analysis',      'dataanalysis',      'data'),
('Data Visualization', 'datavisualization', 'data'),
('Pandas',             'pandas',            'data'),
('NumPy',              'numpy',             'data'),
('Tableau',            'tableau',           'data'),
('Power BI',           'powerbi',           'data'),
('ETL',                'etl',               'data'),
('Data Warehousing',   'datawarehousing',   'data'),
('Big Data',           'bigdata',           'data');

-- AI & Machine Learning
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('Machine Learning',         'machinelearning',       'ai_ml'),
('Deep Learning',            'deeplearning',          'ai_ml'),
('TensorFlow',               'tensorflow',            'ai_ml'),
('PyTorch',                  'pytorch',               'ai_ml'),
('scikit-learn',             'scikitlearn',           'ai_ml'),
('NLP',                      'nlp',                   'ai_ml'),
('Computer Vision',          'computervision',        'ai_ml'),
('Neural Networks',          'neuralnetworks',        'ai_ml'),
('Reinforcement Learning',   'reinforcementlearning', 'ai_ml'),
('OpenCV',                   'opencv',                'ai_ml'),
('Keras',                    'keras',                 'ai_ml'),
('Hugging Face',             'huggingface',           'ai_ml'),
('LLM',                      'llm',                   'ai_ml'),
('Prompt Engineering',       'promptengineering',     'ai_ml'),
('Data Science',             'datascience',           'ai_ml');

-- DevOps & Cloud
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('AWS',             'aws',            'devops'),
('Azure',           'azure',          'devops'),
('Google Cloud',    'googlecloud',    'devops'),
('Docker',          'docker',         'devops'),
('Kubernetes',      'kubernetes',     'devops'),
('CI/CD',           'cicd',           'devops'),
('Jenkins',         'jenkins',        'devops'),
('GitHub Actions',  'githubactions',  'devops'),
('Terraform',       'terraform',      'devops'),
('Ansible',         'ansible',        'devops'),
('Linux',           'linux',          'devops'),
('Nginx',           'nginx',          'devops'),
('Apache',          'apache',         'devops'),
('Git',             'git',            'devops'),
('GitHub',          'github',         'devops'),
('GitLab',          'gitlab',         'devops'),
('Heroku',          'heroku',         'devops'),
('Vercel',          'vercel',         'devops'),
('Netlify',         'netlify',        'devops'),
('Serverless',      'serverless',     'devops');

-- Mobile Development
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('React Native',     'reactnative',    'mobile'),
('Flutter',          'flutter',        'mobile'),
('Android',          'android',        'mobile'),
('iOS',              'ios',            'mobile'),
('Xamarin',          'xamarin',        'mobile'),
('Ionic',            'ionic',          'mobile'),
('Expo',             'expo',           'mobile'),
('Mobile UI',        'mobileui',       'mobile'),
('SwiftUI',          'swiftui',        'mobile'),
('Jetpack Compose',  'jetpackcompose', 'mobile');

-- Design & Tools
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('Figma',             'figma',             'design'),
('Adobe XD',          'adobexd',           'design'),
('Photoshop',         'photoshop',         'design'),
('Illustrator',       'illustrator',       'design'),
('Canva',             'canva',             'design'),
('UI Design',         'uidesign',          'design'),
('UX Design',         'uxdesign',          'design'),
('Wireframing',       'wireframing',       'design'),
('Prototyping',       'prototyping',       'design'),
('User Research',     'userresearch',      'design'),
('Accessibility',     'accessibility',     'design'),
('Responsive Design', 'responsivedesign',  'design'),
('Design Systems',    'designsystems',     'design'),
('Sketch',            'sketch',            'design'),
('InVision',          'invision',          'design');

-- Soft Skills
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('Communication',        'communication',      'soft_skill'),
('Teamwork',             'teamwork',           'soft_skill'),
('Leadership',           'leadership',         'soft_skill'),
('Problem Solving',      'problemsolving',     'soft_skill'),
('Critical Thinking',    'criticalthinking',   'soft_skill'),
('Project Management',   'projectmanagement',  'soft_skill'),
('Agile',                'agile',              'soft_skill'),
('Scrum',                'scrum',              'soft_skill'),
('Time Management',      'timemanagement',     'soft_skill'),
('Presentation',         'presentation',       'soft_skill'),
('Writing',              'writing',            'soft_skill'),
('Research',             'research',           'soft_skill'),
('Adaptability',         'adaptability',       'soft_skill'),
('Creativity',           'creativity',         'soft_skill'),
('Attention to Detail',  'attentiontodetail',  'soft_skill');

-- Other
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('Blockchain',       'blockchain',      'other'),
('Cybersecurity',    'cybersecurity',   'other'),
('IoT',              'iot',             'other'),
('Game Development', 'gamedevelopment', 'other'),
('AR/VR',            'arvr',            'other'),
('Digital Marketing','digitalmarketing','other'),
('QA Testing',       'qatesting',       'other'),
('Excel',            'excel',           'data'),
('Content Strategy', 'contentstrategy', 'other');

-- =============================================================================
-- 3. Test employer accounts (industries restricted to authController whitelist)
-- =============================================================================

INSERT IGNORE INTO users (full_name, email, password, role, is_active, token_version)
VALUES
  ('Sarah Khaled',  'sarah@techcorp.jo',   @test_pw, 'employer', 1, 0),
  ('Mahmoud Chen',  'mahmoud@dataflow.jo', @test_pw, 'employer', 1, 0),
  ('Lana Williams', 'lana@designhub.jo',   @test_pw, 'employer', 1, 0),
  ('Nour Haddad',   'nour@brightbank.jo',  @test_pw, 'employer', 1, 0),
  ('Omar Mansour',  'omar@carebridge.jo',  @test_pw, 'employer', 1, 0),
  ('Rania Nasser',  'rania@edubridge.jo',  @test_pw, 'employer', 1, 0),
  ('Kareem Haddad', 'kareem@buildright.jo', @test_pw, 'employer', 1, 0),
  -- Foreign-country employer for testing the country-mismatch cap.
  ('Sami Khalil',   'sami@globaltech.ae',  @test_pw, 'employer', 1, 0);

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, city, country)
SELECT user_id, 'TechCorp Solutions', 'Technology', '51-200', 'https://techcorp.example.com',
       'TechCorp Solutions is a leading software company in Amman specializing in enterprise SaaS products. We build tools that help businesses streamline operations and improve productivity.',
       'Amman', 'Jordan'
FROM users WHERE email = 'sarah@techcorp.jo';

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, city, country)
SELECT user_id, 'DataFlow Analytics', 'Technology', '1-50', 'https://dataflow.example.com',
       'DataFlow Analytics helps companies harness the power of their data through machine learning and advanced analytics solutions.',
       'Amman', 'Jordan'
FROM users WHERE email = 'mahmoud@dataflow.jo';

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, city, country)
SELECT user_id, 'DesignHub Creative', 'Marketing', '1-50', 'https://designhub.example.com',
       'DesignHub Creative is a boutique design and brand agency creating digital experiences for startups and established brands across the MENA region.',
       'Irbid', 'Jordan'
FROM users WHERE email = 'lana@designhub.jo';

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, city, country)
SELECT user_id, 'BrightBank Labs', 'Finance', '201-500', 'https://brightbank.example.com',
       'BrightBank Labs builds digital banking products, reporting tools, and customer analytics for modern financial services teams.',
       'Amman', 'Jordan'
FROM users WHERE email = 'nour@brightbank.jo';

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, city, country)
SELECT user_id, 'CareBridge Health', 'Healthcare', '51-200', 'https://carebridge.example.com',
       'CareBridge Health develops patient engagement and health informatics tools for clinics, hospitals, and care providers.',
       'Amman', 'Jordan'
FROM users WHERE email = 'omar@carebridge.jo';

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, city, country)
SELECT user_id, 'EduBridge Learning', 'Education', '1-50', 'https://edubridge.example.com',
       'EduBridge Learning creates online courses, learning analytics, and digital classroom experiences for schools and training teams.',
       'Amman', 'Jordan'
FROM users WHERE email = 'rania@edubridge.jo';

INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, city, country)
SELECT user_id, 'BuildRight Engineering', 'Engineering', '500+', 'https://buildright.example.com',
       'BuildRight Engineering manages infrastructure, civil engineering, and construction technology projects across Jordan.',
       'Aqaba', 'Jordan'
FROM users WHERE email = 'kareem@buildright.jo';

-- Foreign-country tech employer (UAE) — used to exercise the matching engine's
-- country-mismatch cap (final_score ≤ 50 + alert) for hybrid/onsite postings.
INSERT IGNORE INTO employer (user_id, company_name, industry, company_size, website_url, company_description, city, country)
SELECT user_id, 'GlobalTech UAE', 'Technology', '201-500', 'https://globaltech.example.com',
       'GlobalTech UAE is a regional software company building platforms used across the GCC and the wider Middle East.',
       'Dubai', 'UAE'
FROM users WHERE email = 'sami@globaltech.ae';

INSERT IGNORE INTO notification_preference (user_id)
SELECT user_id FROM users
WHERE email IN (
  'sarah@techcorp.jo', 'mahmoud@dataflow.jo', 'lana@designhub.jo',
  'nour@brightbank.jo', 'omar@carebridge.jo', 'rania@edubridge.jo', 'kareem@buildright.jo',
  'sami@globaltech.ae'
);

-- =============================================================================
-- 4. Test student accounts (universities + majors from frontend whitelists)
-- =============================================================================

INSERT IGNORE INTO users (full_name, email, password, role, is_active, token_version)
VALUES
  ('Alex Rivera',  'alex@psut.edu.jo',   @test_pw, 'student', 1, 0),
  ('Jordan Lee',   'jordan@just.edu.jo', @test_pw, 'student', 1, 0),
  ('Taylor Smith', 'taylor@uj.edu.jo',   @test_pw, 'student', 1, 0),
  ('Morgan Davis', 'morgan@gju.edu.jo',  @test_pw, 'student', 1, 0),
  ('Samira Nasser', 'samira@uj.edu.jo',  @test_pw, 'student', 1, 0),
  ('Omar Haddad',   'omar@yarmouk.edu.jo', @test_pw, 'student', 1, 0),
  ('Leen Abdullah', 'leen@hu.edu.jo',    @test_pw, 'student', 1, 0),
  ('Dina Awad',     'dina@petra.edu.jo', @test_pw, 'student', 1, 0),
  ('Zaid Hassan',   'zaid@just.edu.jo',  @test_pw, 'student', 1, 0);

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, phone, linkedin_url, github_url, city, country)
SELECT user_id,
       'Computer Science', 'Princess Sumaya University for Technology', 2026, 3.85,
       'Passionate full-stack developer with experience in React, Node.js, and cloud technologies. Looking for opportunities to build impactful products.',
       '+962-79-555-0101', 'https://linkedin.com/in/alexrivera', 'https://github.com/alexrivera', 'Amman', 'Jordan'
FROM users WHERE email = 'alex@psut.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, phone, linkedin_url, city, country)
SELECT user_id,
       'Data Science', 'Jordan University of Science and Technology', 2025, 3.72,
       'Data science enthusiast skilled in Python, machine learning, and statistical analysis. Experience with real-world datasets and predictive modeling.',
       '+962-79-555-0102', 'https://linkedin.com/in/jordanlee', 'Irbid', 'Jordan'
FROM users WHERE email = 'jordan@just.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, github_url, city, country)
SELECT user_id,
       'Graphic Design', 'University of Jordan', 2027, 3.50,
       'Creative designer with a strong eye for aesthetics and user experience. Proficient in Figma, Adobe Suite, and modern web design principles.',
       'https://github.com/taylorsmith', 'Amman', 'Jordan'
FROM users WHERE email = 'taylor@uj.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, city, country)
SELECT user_id,
       'Software Engineering', 'German Jordanian University', 2026, 3.90,
       'Backend-focused engineer interested in distributed systems, databases, and API design. Strong algorithmic skills from competitive programming.',
       'Amman', 'Jordan'
FROM users WHERE email = 'morgan@gju.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, phone, linkedin_url, city, country)
SELECT user_id,
       'Finance', 'University of Jordan', 2026, 3.68,
       'Finance student interested in fintech, risk analysis, and business intelligence. Comfortable with Excel, SQL, and dashboard storytelling.',
       '+962-79-555-0105', 'https://linkedin.com/in/samiranasser', 'Amman', 'Jordan'
FROM users WHERE email = 'samira@uj.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, github_url, city, country)
SELECT user_id,
       'Computer Engineering', 'Yarmouk University', 2025, 3.44,
       'Computer engineering student who enjoys mobile apps, embedded systems, QA automation, and practical software testing.',
       'https://github.com/omarhaddad', 'Irbid', 'Jordan'
FROM users WHERE email = 'omar@yarmouk.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, phone, city, country)
SELECT user_id,
       'Public Health', 'The Hashemite University', 2027, 3.81,
       'Public health student focused on digital health, patient education, and data-informed healthcare operations.',
       '+962-79-555-0107', 'Zarqa', 'Jordan'
FROM users WHERE email = 'leen@hu.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, linkedin_url, city, country)
SELECT user_id,
       'Marketing', 'Petra University', 2026, 3.59,
       'Marketing student with experience in content planning, social campaigns, brand research, and basic analytics.',
       'https://linkedin.com/in/dinaawad', 'Amman', 'Jordan'
FROM users WHERE email = 'dina@petra.edu.jo';

INSERT IGNORE INTO student (user_id, major, university, graduation_year, gpa, bio, github_url, city, country)
SELECT user_id,
       'Electrical Engineering', 'Jordan University of Science and Technology', 2025, 3.63,
       'Electrical engineering student interested in project delivery, site coordination, IoT, and infrastructure systems.',
       'https://github.com/zaidhassan', 'Irbid', 'Jordan'
FROM users WHERE email = 'zaid@just.edu.jo';

INSERT IGNORE INTO notification_preference (user_id)
SELECT user_id FROM users
WHERE email IN (
  'alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo',
  'samira@uj.edu.jo', 'omar@yarmouk.edu.jo', 'leen@hu.edu.jo', 'dina@petra.edu.jo',
  'zaid@just.edu.jo'
);

UPDATE users
SET password = @test_pw
WHERE email IN (
  'admin@internmatch.com',
  'sarah@techcorp.jo', 'mahmoud@dataflow.jo', 'lana@designhub.jo',
  'nour@brightbank.jo', 'omar@carebridge.jo', 'rania@edubridge.jo', 'kareem@buildright.jo',
  'alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo',
  'samira@uj.edu.jo', 'omar@yarmouk.edu.jo', 'leen@hu.edu.jo', 'dina@petra.edu.jo',
  'zaid@just.edu.jo'
);

-- =============================================================================
-- 4a. Sample resumes
-- =============================================================================

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/alex-rivera-fullstack.pdf', 'alex-rivera-fullstack.pdf', 'pdf',
       'Alex Rivera resume. React, JavaScript, TypeScript, Node.js, Express, MySQL, Git, Docker, full-stack projects and cloud deployment.'
FROM users WHERE email = 'alex@psut.edu.jo';

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/jordan-lee-data-science.pdf', 'jordan-lee-data-science.pdf', 'pdf',
       'Jordan Lee resume. Python, machine learning, TensorFlow, Pandas, SQL, data visualization, dashboards and predictive modeling.'
FROM users WHERE email = 'jordan@just.edu.jo';

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/taylor-smith-design.pdf', 'taylor-smith-design.pdf', 'pdf',
       'Taylor Smith resume. Figma, UI design, UX design, Photoshop, HTML, CSS, responsive design and client brand work.'
FROM users WHERE email = 'taylor@uj.edu.jo';

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/morgan-davis-backend.pdf', 'morgan-davis-backend.pdf', 'pdf',
       'Morgan Davis resume. Java, Python, MySQL, PostgreSQL, Node.js, Docker, AWS, backend systems and API design.'
FROM users WHERE email = 'morgan@gju.edu.jo';

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/samira-nasser-finance.pdf', 'samira-nasser-finance.pdf', 'pdf',
       'Samira Nasser resume. Finance, Excel, SQL, Power BI, Tableau, risk analysis, reporting and business intelligence.'
FROM users WHERE email = 'samira@uj.edu.jo';

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/omar-haddad-qa-mobile.pdf', 'omar-haddad-qa-mobile.pdf', 'pdf',
       'Omar Haddad resume. Computer engineering, JavaScript, React Native, Android, testing, Git, QA automation and mobile projects.'
FROM users WHERE email = 'omar@yarmouk.edu.jo';

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/leen-abdullah-health.pdf', 'leen-abdullah-health.pdf', 'pdf',
       'Leen Abdullah resume. Public health, data analysis, communication, research, patient education and healthcare operations.'
FROM users WHERE email = 'leen@hu.edu.jo';

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/dina-awad-marketing.pdf', 'dina-awad-marketing.pdf', 'pdf',
       'Dina Awad resume. Marketing, communications, writing, social campaigns, content planning, Canva and analytics.'
FROM users WHERE email = 'dina@petra.edu.jo';

INSERT IGNORE INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text)
SELECT user_id, '/uploads/resumes/zaid-hassan-engineering.pdf', 'zaid-hassan-engineering.pdf', 'pdf',
       'Zaid Hassan resume. Electrical engineering, project management, IoT, communication, site coordination and technical documentation.'
FROM users WHERE email = 'zaid@just.edu.jo';

UPDATE student s
JOIN resume r ON r.student_user_id = s.user_id
SET s.primary_resume_id = r.resume_id
WHERE s.primary_resume_id IS NULL;

-- =============================================================================
-- 5. Student skills
-- =============================================================================

-- Helper macro: insert (student email, skill normalized_name, level)
-- We do this inline because MySQL has no parameterized macros.

-- Alex Rivera — full-stack web
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name IN ('javascript','react','git');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name IN ('nodejs','typescript','tailwindcss','mysql');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'beginner', 'manual' FROM users u, skill s
WHERE u.email = 'alex@psut.edu.jo' AND s.normalized_name IN ('docker');

-- Jordan Lee — data / ML
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name IN ('python','machinelearning');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name IN ('tensorflow','pandas','sql','datavisualization');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'beginner', 'manual' FROM users u, skill s
WHERE u.email = 'jordan@just.edu.jo' AND s.normalized_name IN ('docker');

-- Taylor Smith — design
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name IN ('figma','uidesign','photoshop');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name IN ('uxdesign','html','css');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'beginner', 'manual' FROM users u, skill s
WHERE u.email = 'taylor@uj.edu.jo' AND s.normalized_name IN ('javascript');

-- Morgan Davis — backend / systems
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name IN ('java','python','mysql','git');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'morgan@gju.edu.jo' AND s.normalized_name IN ('nodejs','postgresql','docker','aws');

-- Samira Nasser - finance / BI
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'samira@uj.edu.jo' AND s.normalized_name IN ('sql','excel','powerbi','communication');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'samira@uj.edu.jo' AND s.normalized_name IN ('dataanalysis','tableau','presentation','attentiontodetail');

-- Omar Haddad - QA / mobile
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'omar@yarmouk.edu.jo' AND s.normalized_name IN ('java','git','qatesting');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'omar@yarmouk.edu.jo' AND s.normalized_name IN ('javascript','reactnative','android','problemsolving');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'beginner', 'manual' FROM users u, skill s
WHERE u.email = 'omar@yarmouk.edu.jo' AND s.normalized_name IN ('docker','mobileui');

-- Leen Abdullah - healthcare / research
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'leen@hu.edu.jo' AND s.normalized_name IN ('research','communication');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'leen@hu.edu.jo' AND s.normalized_name IN ('dataanalysis','writing','presentation','accessibility');

-- Dina Awad - marketing / content
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'dina@petra.edu.jo' AND s.normalized_name IN ('digitalmarketing','writing','communication');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'dina@petra.edu.jo' AND s.normalized_name IN ('canva','creativity','presentation','datavisualization','contentstrategy');

-- Zaid Hassan - engineering / project delivery
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'advanced', 'manual' FROM users u, skill s
WHERE u.email = 'zaid@just.edu.jo' AND s.normalized_name IN ('projectmanagement','communication');
INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
SELECT u.user_id, s.skill_id, 'intermediate', 'manual' FROM users u, skill s
WHERE u.email = 'zaid@just.edu.jo' AND s.normalized_name IN ('iot','research','problemsolving','attentiontodetail');

-- =============================================================================
-- 6. Test internships (active, approved). Salaries in JOD.
-- =============================================================================

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Full-Stack Developer Intern',
       'Join our engineering team to build and maintain web applications using React and Node.js. You will work on real customer-facing features, participate in code reviews, and collaborate with senior engineers.\n\nResponsibilities:\n- Develop frontend components with React and TypeScript\n- Build RESTful APIs with Node.js and Express\n- Write unit and integration tests\n- Participate in agile ceremonies and sprint planning',
       'Amman', 'Jordan', 'hybrid', 3, 400, 700,
       DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Full-Stack Developer Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Backend Engineering Intern',
       'Work on our backend microservices architecture. You will help design and implement APIs, optimize database queries, and improve system reliability.\n\nRequirements:\n- Strong foundation in Java or Python\n- Understanding of relational databases\n- Familiarity with cloud services (AWS preferred)\n- Good communication skills',
       'Amman', 'Jordan', 'on-site', 6, 500, 800,
       DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Backend Engineering Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Data Science Intern',
       'Help our data team build predictive models and analyze large datasets. You will work with Python, TensorFlow, and SQL to derive insights that drive product decisions.\n\nWhat you will do:\n- Clean and preprocess datasets\n- Build and evaluate ML models\n- Create data visualizations and dashboards\n- Present findings to stakeholders',
       'Remote', 'Jordan', 'remote', 3, 350, 600,
       DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'active'
FROM users WHERE email = 'mahmoud@dataflow.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Data Science Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Machine Learning Engineer Intern',
       'Join our AI research team to develop and deploy machine learning models. You will work on NLP and computer vision projects using PyTorch and TensorFlow.\n\nIdeal candidate:\n- Strong Python programming skills\n- Experience with deep learning frameworks\n- Understanding of linear algebra and statistics\n- Interest in production ML systems',
       'Amman', 'Jordan', 'hybrid', 6, 600, 900,
       DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'active'
FROM users WHERE email = 'mahmoud@dataflow.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Machine Learning Engineer Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'UI/UX Design Intern',
       'Create beautiful and intuitive user interfaces for our clients. You will conduct user research, create wireframes, and deliver high-fidelity designs in Figma.\n\nYour responsibilities:\n- Conduct user interviews and usability testing\n- Create wireframes and interactive prototypes\n- Design responsive layouts for web and mobile\n- Collaborate with developers on implementation',
       'Irbid', 'Jordan', 'remote', 3, 300, 500,
       DATE_ADD(CURDATE(), INTERVAL 50 DAY), 'active'
FROM users WHERE email = 'lana@designhub.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'UI/UX Design Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Frontend Developer Intern',
       'Build pixel-perfect web interfaces using modern frontend technologies. You will translate Figma designs into responsive React components with Tailwind CSS.\n\nWe are looking for:\n- Solid HTML/CSS fundamentals\n- Experience with React or similar framework\n- Eye for design and attention to detail\n- Portfolio of web projects',
       'Irbid', 'Jordan', 'hybrid', 4, 350, 600,
       DATE_ADD(CURDATE(), INTERVAL 35 DAY), 'active'
FROM users WHERE email = 'lana@designhub.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Frontend Developer Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'QA Automation Intern',
       'Help the engineering team build reliable test coverage for web and API releases. You will write test cases, automate regression checks, and report issues clearly to product teams.\n\nYou will practice:\n- API and UI testing workflows\n- Regression planning and bug reports\n- JavaScript-based automation\n- Working closely with developers during releases',
       'Amman', 'Jordan', 'hybrid', 3, 300, 500,
       DATE_ADD(CURDATE(), INTERVAL 28 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'QA Automation Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Business Intelligence Intern',
       'Turn raw operational data into useful dashboards and weekly insights. You will clean datasets, write SQL, and create reports for product and sales teams.\n\nResponsibilities:\n- Build SQL queries for recurring reports\n- Prepare dashboards in Power BI or Tableau\n- Summarize trends for non-technical stakeholders\n- Help maintain reporting documentation',
       'Remote', 'Jordan', 'remote', 4, 350, 650,
       DATE_ADD(CURDATE(), INTERVAL 42 DAY), 'active'
FROM users WHERE email = 'mahmoud@dataflow.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Business Intelligence Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Digital Marketing Intern',
       'Support campaign planning, content calendars, and performance reporting for regional clients. You will write briefs, draft social copy, and review campaign analytics.\n\nResponsibilities:\n- Create content calendars and campaign briefs\n- Review social media analytics\n- Coordinate with designers and account managers\n- Prepare weekly performance summaries',
       'Amman', 'Jordan', 'hybrid', 3, 250, 450,
       DATE_ADD(CURDATE(), INTERVAL 38 DAY), 'active'
FROM users WHERE email = 'lana@designhub.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Digital Marketing Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Financial Analyst Intern',
       'Join a fintech analytics team to support financial reporting, risk summaries, and internal dashboards. This role is ideal for finance students who enjoy structured analysis.\n\nResponsibilities:\n- Prepare spreadsheet and SQL-based reports\n- Review transaction trends and anomalies\n- Support risk and compliance documentation\n- Present findings to business stakeholders',
       'Amman', 'Jordan', 'on-site', 6, 450, 750,
       DATE_ADD(CURDATE(), INTERVAL 55 DAY), 'active'
FROM users WHERE email = 'nour@brightbank.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Financial Analyst Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Health Informatics Intern',
       'Help organize patient education content and operational health data for digital care programs. You will support research, reporting, and accessibility reviews.\n\nResponsibilities:\n- Review health education material for clarity\n- Analyze basic operational datasets\n- Support patient communication workflows\n- Document insights for care managers',
       'Amman', 'Jordan', 'hybrid', 4, 350, 550,
       DATE_ADD(CURDATE(), INTERVAL 47 DAY), 'active'
FROM users WHERE email = 'omar@carebridge.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Health Informatics Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Education Technology Content Intern',
       'Work with curriculum and product teams to create digital learning material, review course engagement data, and improve learner experience.\n\nResponsibilities:\n- Draft lesson summaries and learner guides\n- Review analytics for course completion\n- Help organize content in the learning platform\n- Support accessibility and readability checks',
       'Remote', 'Jordan', 'remote', 3, 250, 450,
       DATE_ADD(CURDATE(), INTERVAL 33 DAY), 'active'
FROM users WHERE email = 'rania@edubridge.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Education Technology Content Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Civil Engineering Project Intern',
       'Support project engineers with site coordination, documentation, and progress tracking for infrastructure projects. You will learn how engineering plans become field execution.\n\nResponsibilities:\n- Assist with project documentation\n- Track site progress and issue logs\n- Coordinate with engineering and operations teams\n- Prepare weekly project summaries',
       'Aqaba', 'Jordan', 'on-site', 6, 400, 650,
       DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'active'
FROM users WHERE email = 'kareem@buildright.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Civil Engineering Project Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Mobile App Developer Intern',
       'Build and polish cross-platform mobile features for student-facing products. This posting is intentionally pending approval so admin review screens have realistic test data.',
       'Amman', 'Jordan', 'hybrid', 4, 350, 650,
       DATE_ADD(CURDATE(), INTERVAL 52 DAY), 'pending_approval'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Mobile App Developer Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status, admin_review_note)
SELECT user_id,
       'Social Media Strategy Intern',
       'Draft campaign strategy and social content for several client accounts. This rejected posting is seeded to test employer resubmission and admin rejection notes.',
       'Irbid', 'Jordan', 'remote', 3, 200, 350,
       DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'rejected',
       'Please add clearer responsibilities, expected weekly hours, and portfolio requirements before resubmitting.'
FROM users WHERE email = 'lana@designhub.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Social Media Strategy Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Cloud DevOps Intern',
       'Support infrastructure automation and deployment monitoring for internal platforms. This closed posting is seeded for employer history and analytics testing.',
       'Amman', 'Jordan', 'hybrid', 3, 500, 800,
       DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'closed'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Cloud DevOps Intern' AND employer_user_id = users.user_id);

-- =============================================================================
-- 6b. Sample minimum_gpa values on a few internships (most stay NULL = no min).
-- =============================================================================

UPDATE internship
   SET minimum_gpa = 3.00
 WHERE title = 'Backend Engineering Intern'
   AND employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo');

UPDATE internship
   SET minimum_gpa = 3.50
 WHERE title = 'Machine Learning Engineer Intern'
   AND employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo');

UPDATE internship
   SET minimum_gpa = 3.00
 WHERE title = 'Financial Analyst Intern'
   AND employer_user_id = (SELECT user_id FROM users WHERE email = 'nour@brightbank.jo');

-- =============================================================================
-- 7. Required skills per internship
-- =============================================================================

-- Full-Stack Developer Intern (TechCorp)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Full-Stack Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('javascript','react');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1 FROM internship i, skill s
WHERE i.title = 'Full-Stack Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('nodejs');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Full-Stack Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('typescript','git');

-- Backend Engineering Intern (TechCorp)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Backend Engineering Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('java','mysql');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1 FROM internship i, skill s
WHERE i.title = 'Backend Engineering Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('aws');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Backend Engineering Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('docker','git');

-- Data Science Intern (DataFlow)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Data Science Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo')
  AND s.normalized_name IN ('python');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1 FROM internship i, skill s
WHERE i.title = 'Data Science Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo')
  AND s.normalized_name IN ('machinelearning','sql');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Data Science Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo')
  AND s.normalized_name IN ('pandas','datavisualization');

-- Machine Learning Engineer Intern (DataFlow)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'advanced', 1 FROM internship i, skill s
WHERE i.title = 'Machine Learning Engineer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo')
  AND s.normalized_name IN ('python');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Machine Learning Engineer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo')
  AND s.normalized_name IN ('machinelearning','tensorflow');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Machine Learning Engineer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo')
  AND s.normalized_name IN ('docker');

-- UI/UX Design Intern (DesignHub)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'UI/UX Design Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('figma','uidesign');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1 FROM internship i, skill s
WHERE i.title = 'UI/UX Design Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('uxdesign');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'UI/UX Design Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('photoshop');

-- Frontend Developer Intern (DesignHub)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Frontend Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('javascript','html','css');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1 FROM internship i, skill s
WHERE i.title = 'Frontend Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('react');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Frontend Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('tailwindcss');

-- QA Automation Intern (TechCorp)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1 FROM internship i, skill s
WHERE i.title = 'QA Automation Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('javascript','git','qatesting','problemsolving');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'QA Automation Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('react','restapi');

-- Business Intelligence Intern (DataFlow)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Business Intelligence Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo')
  AND s.normalized_name IN ('sql','dataanalysis');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Business Intelligence Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'mahmoud@dataflow.jo')
  AND s.normalized_name IN ('powerbi','tableau','presentation');

-- Digital Marketing Intern (DesignHub)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Digital Marketing Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('digitalmarketing','communication','writing','creativity');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Digital Marketing Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('canva','datavisualization','contentstrategy');

-- Financial Analyst Intern (BrightBank)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Financial Analyst Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'nour@brightbank.jo')
  AND s.normalized_name IN ('sql','excel','dataanalysis','attentiontodetail');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Financial Analyst Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'nour@brightbank.jo')
  AND s.normalized_name IN ('powerbi','presentation');

-- Health Informatics Intern (CareBridge)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Health Informatics Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'omar@carebridge.jo')
  AND s.normalized_name IN ('research','communication','dataanalysis');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Health Informatics Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'omar@carebridge.jo')
  AND s.normalized_name IN ('writing','accessibility');

-- Education Technology Content Intern (EduBridge)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Education Technology Content Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'rania@edubridge.jo')
  AND s.normalized_name IN ('writing','research','communication');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Education Technology Content Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'rania@edubridge.jo')
  AND s.normalized_name IN ('accessibility','datavisualization');

-- Civil Engineering Project Intern (BuildRight)
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Civil Engineering Project Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'kareem@buildright.jo')
  AND s.normalized_name IN ('projectmanagement','communication','attentiontodetail');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Civil Engineering Project Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'kareem@buildright.jo')
  AND s.normalized_name IN ('iot','problemsolving');

-- Pending/rejected/closed postings
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Mobile App Developer Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('reactnative','javascript','mobileui');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 1 FROM internship i, skill s
WHERE i.title = 'Social Media Strategy Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('writing','communication','creativity');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Cloud DevOps Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('aws','docker','githubactions');

-- =============================================================================
-- 7b. Matching-engine test internships
--
-- These postings exist specifically to exercise the new matching engine's
-- caps and edge cases end-to-end. Each is annotated with the engine behavior
-- it demonstrates so a manual tester knows what to look for.
-- =============================================================================

-- (a) Hybrid + different country -> location score 0, alert visible on student
--     and employer side, final score CAPPED at 50.
INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Remote-First Backend Intern (UAE)',
       'Join our distributed engineering team building backend services used across the GCC. You will work on APIs, observability, and reliability tooling alongside senior engineers.',
       'Dubai', 'UAE', 'hybrid', 6, 700, 1100,
       DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'active'
FROM users WHERE email = 'sami@globaltech.ae'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Remote-First Backend Intern (UAE)' AND employer_user_id = users.user_id);

-- (b) Onsite + different country -> location score 0, alert + cap 50.
INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Cloud Infrastructure Intern (UAE)',
       'Help operate our Kubernetes platform and CI/CD pipelines from our Dubai HQ. Daily on-site collaboration with our SRE team.',
       'Dubai', 'UAE', 'on-site', 4, 800, 1200,
       DATE_ADD(CURDATE(), INTERVAL 35 DAY), 'active'
FROM users WHERE email = 'sami@globaltech.ae'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Cloud Infrastructure Intern (UAE)' AND employer_user_id = users.user_id);

-- (c) Remote + different country -> location score 10, NO alert (remote
--     ignores location). Useful baseline alongside (a) and (b).
INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Remote Data Engineering Intern (UAE)',
       'Build data pipelines for our analytics platform. Fully remote with overlapping hours with the Dubai team.',
       'Dubai', 'UAE', 'remote', 3, 600, 900,
       DATE_ADD(CURDATE(), INTERVAL 50 DAY), 'active'
FROM users WHERE email = 'sami@globaltech.ae'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Remote Data Engineering Intern (UAE)' AND employer_user_id = users.user_id);

-- (d) N=1 mandatory skill -> if the student lacks that skill, the count-based
--     mandatory cap fires at 50 (sole_mandatory_skill_missing). If they have
--     it, the score is capped only by the other components.
INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'React-Only Bootcamp Intern',
       'Twelve-week deep-dive on building React component libraries. The single mandatory requirement is intermediate React; everything else is taught on the job.',
       'Amman', 'Jordan', 'hybrid', 3, 350, 550,
       DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'React-Only Bootcamp Intern' AND employer_user_id = users.user_id);

-- (e) N=2 mandatory skills -> when the student is missing 1 of 2, the cap is
--     60 (half_mandatory_skills_missing). When missing both, cap drops to 50.
INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'SQL & MySQL Database Intern',
       'Help our platform team write efficient SQL and tune MySQL for our reporting workloads. Both SQL and MySQL are mandatory; database tuning experience is a plus.',
       'Amman', 'Jordan', 'on-site', 4, 400, 650,
       DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'SQL & MySQL Database Intern' AND employer_user_id = users.user_id);

-- (f) High minimum_gpa (3.80) -> students below get a proportional GPA score
--     instead of the full 10. Useful for testing the GPA component
--     independent of caps.
INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Brand Strategy Lead Intern',
       'High-bar marketing internship working directly with senior brand strategists on regional campaigns. Strong communication and analytics required.',
       'Amman', 'Jordan', 'hybrid', 4, 350, 600,
       DATE_ADD(CURDATE(), INTERVAL 32 DAY), 'active'
FROM users WHERE email = 'lana@designhub.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Brand Strategy Lead Intern' AND employer_user_id = users.user_id);

-- (g) Tiebreak demo: two near-identical internships posted same day with
--     different deadlines. When their final_scores tie, sort by deadline ASC
--     should put 'Junior Developer (Sprint A)' first.
INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Junior Developer (Sprint A)',
       'Short sprint-style internship building internal tooling. Identical scope to Sprint B; closes sooner so it should rank first when scores tie.',
       'Amman', 'Jordan', 'hybrid', 3, 350, 550,
       DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Junior Developer (Sprint A)' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, city, country, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Junior Developer (Sprint B)',
       'Identical scope to Sprint A; later deadline so it should rank below Sprint A on tied scores.',
       'Amman', 'Jordan', 'hybrid', 3, 350, 550,
       DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Junior Developer (Sprint B)' AND employer_user_id = users.user_id);

-- minimum_gpa for the engine-test internships above.
UPDATE internship
   SET minimum_gpa = 3.80
 WHERE title = 'Brand Strategy Lead Intern'
   AND employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo');

-- Required skills for the engine-test internships.

-- (a) Remote-First Backend Intern (UAE) — N=2 mandatory, several optional.
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Remote-First Backend Intern (UAE)' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sami@globaltech.ae')
  AND s.normalized_name IN ('nodejs','restapi');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Remote-First Backend Intern (UAE)' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sami@globaltech.ae')
  AND s.normalized_name IN ('postgresql','docker','aws');

-- (b) Cloud Infrastructure Intern (UAE) — N=3 mandatory.
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Cloud Infrastructure Intern (UAE)' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sami@globaltech.ae')
  AND s.normalized_name IN ('aws','docker','linux');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Cloud Infrastructure Intern (UAE)' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sami@globaltech.ae')
  AND s.normalized_name IN ('kubernetes','terraform');

-- (c) Remote Data Engineering Intern (UAE) — N=2 mandatory.
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Remote Data Engineering Intern (UAE)' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sami@globaltech.ae')
  AND s.normalized_name IN ('python','sql');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Remote Data Engineering Intern (UAE)' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sami@globaltech.ae')
  AND s.normalized_name IN ('pandas','etl');

-- (d) React-Only Bootcamp Intern — N=1 mandatory (React).
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'React-Only Bootcamp Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('react');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'React-Only Bootcamp Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('javascript','typescript');

-- (e) SQL & MySQL Database Intern — N=2 mandatory.
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'SQL & MySQL Database Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('sql','mysql');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'SQL & MySQL Database Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('python','dataanalysis');

-- (f) Brand Strategy Lead Intern — N=2 mandatory + minimum_gpa 3.80.
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title = 'Brand Strategy Lead Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('communication','digitalmarketing');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title = 'Brand Strategy Lead Intern' AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'lana@designhub.jo')
  AND s.normalized_name IN ('writing','contentstrategy','dataanalysis');

-- (g) Tiebreak demo internships (same skills, same level, different deadlines).
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'intermediate', 1 FROM internship i, skill s
WHERE i.title IN ('Junior Developer (Sprint A)', 'Junior Developer (Sprint B)')
  AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('javascript','git');
INSERT IGNORE INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
SELECT i.internship_id, s.skill_id, 'beginner', 0 FROM internship i, skill s
WHERE i.title IN ('Junior Developer (Sprint A)', 'Junior Developer (Sprint B)')
  AND i.employer_user_id = (SELECT user_id FROM users WHERE email = 'sarah@techcorp.jo')
  AND s.normalized_name IN ('react','html');

-- =============================================================================
-- 8. Applications, bookmarks, invitations, conversations, and analytics
-- =============================================================================

INSERT IGNORE INTO application
  (student_user_id, internship_id, resume_id, submitted_resume_path, submitted_resume_filename,
   cover_letter, status, match_score, applied_date, status_updated_at, employer_note)
SELECT su.user_id, i.internship_id, r.resume_id, r.file_path, r.original_filename,
       seed.cover_letter, seed.status, seed.match_score,
       DATE_SUB(NOW(), INTERVAL seed.applied_days_ago DAY),
       DATE_SUB(NOW(), INTERVAL seed.updated_days_ago DAY),
       seed.employer_note
FROM (
  SELECT 'alex@psut.edu.jo' AS student_email, 'sarah@techcorp.jo' AS employer_email, 'Full-Stack Developer Intern' AS internship_title, 'pending' AS status, 94.25 AS match_score, 8 AS applied_days_ago, 8 AS updated_days_ago, 'I have built several React and Node.js projects and would like to contribute to customer-facing features at TechCorp.' AS cover_letter, NULL AS employer_note
  UNION ALL SELECT 'alex@psut.edu.jo', 'sarah@techcorp.jo', 'QA Automation Intern', 'under_review', 82.40, 5, 2, 'I enjoy improving release quality and have experience testing APIs and frontend workflows.', 'Strong web background; review testing experience.'
  UNION ALL SELECT 'jordan@just.edu.jo', 'mahmoud@dataflow.jo', 'Data Science Intern', 'under_review', 96.10, 12, 4, 'My coursework and projects focus on Python, machine learning, and dashboarding with real datasets.', 'Good ML and SQL alignment.'
  UNION ALL SELECT 'jordan@just.edu.jo', 'mahmoud@dataflow.jo', 'Machine Learning Engineer Intern', 'interview_scheduled', 91.75, 10, 1, 'I am excited by production ML work and have used TensorFlow for model experiments.', 'Technical interview scheduled.'
  UNION ALL SELECT 'taylor@uj.edu.jo', 'lana@designhub.jo', 'UI/UX Design Intern', 'rejected', 88.00, 18, 6, 'I would love to support user research, wireframes, and high-fidelity product design.', 'Portfolio was strong, but availability did not match this cycle.'
  UNION ALL SELECT 'taylor@uj.edu.jo', 'lana@designhub.jo', 'Frontend Developer Intern', 'pending', 76.50, 4, 4, 'I can translate Figma designs into responsive HTML, CSS, and React interfaces.', NULL
  UNION ALL SELECT 'morgan@gju.edu.jo', 'sarah@techcorp.jo', 'Backend Engineering Intern', 'accepted', 95.00, 20, 3, 'My backend projects use Java, Python, databases, and API design, which matches this role closely.', 'Accepted after final review.'
  UNION ALL SELECT 'morgan@gju.edu.jo', 'sarah@techcorp.jo', 'Cloud DevOps Intern', 'accepted', 84.80, 35, 18, 'I have practiced Docker and AWS basics and want more infrastructure experience.', 'Accepted for the previous closed cohort.'
  UNION ALL SELECT 'samira@uj.edu.jo', 'nour@brightbank.jo', 'Financial Analyst Intern', 'pending', 93.60, 7, 7, 'My finance background and reporting experience align well with fintech analytics work.', NULL
  UNION ALL SELECT 'samira@uj.edu.jo', 'mahmoud@dataflow.jo', 'Business Intelligence Intern', 'rejected', 86.30, 16, 9, 'I am interested in SQL dashboards and business reporting for product teams.', 'Selected candidates had more BI tooling experience.'
  UNION ALL SELECT 'omar@yarmouk.edu.jo', 'sarah@techcorp.jo', 'QA Automation Intern', 'withdrawn', 87.25, 14, 2, 'I am interested in QA automation and mobile testing workflows.', 'Student withdrew application.'
  UNION ALL SELECT 'omar@yarmouk.edu.jo', 'lana@designhub.jo', 'Frontend Developer Intern', 'pending', 70.25, 3, 3, 'I have JavaScript experience and want to strengthen frontend delivery skills.', NULL
  UNION ALL SELECT 'leen@hu.edu.jo', 'omar@carebridge.jo', 'Health Informatics Intern', 'accepted', 92.15, 11, 2, 'My public health coursework and research experience fit this health informatics role.', 'Accepted; strong healthcare domain fit.'
  UNION ALL SELECT 'dina@petra.edu.jo', 'lana@designhub.jo', 'Digital Marketing Intern', 'under_review', 90.35, 6, 1, 'I can support content calendars, campaign briefs, and weekly analytics summaries.', 'Reviewing campaign writing samples.'
  UNION ALL SELECT 'zaid@just.edu.jo', 'kareem@buildright.jo', 'Civil Engineering Project Intern', 'interview_scheduled', 89.20, 9, 2, 'I want to support site coordination and project reporting for infrastructure work.', 'Site coordination interview scheduled.'
) seed
JOIN users su ON su.email = seed.student_email
JOIN users eu ON eu.email = seed.employer_email
JOIN internship i ON i.title = seed.internship_title AND i.employer_user_id = eu.user_id
JOIN resume r ON r.student_user_id = su.user_id;

INSERT INTO application_status_history (application_id, old_status, new_status, changed_by_user_id, note, created_at)
SELECT a.application_id, NULL, 'pending', a.student_user_id, 'Application submitted.',
       DATE_SUB(a.applied_date, INTERVAL 1 MINUTE)
FROM application a
JOIN users seed_student ON seed_student.user_id = a.student_user_id
WHERE seed_student.email IN (
    'alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo',
    'samira@uj.edu.jo', 'omar@yarmouk.edu.jo', 'leen@hu.edu.jo', 'dina@petra.edu.jo',
    'zaid@just.edu.jo'
  )
  AND NOT EXISTS (
  SELECT 1 FROM application_status_history h
  WHERE h.application_id = a.application_id AND h.new_status = 'pending' AND h.note = 'Application submitted.'
);

INSERT INTO application_status_history (application_id, old_status, new_status, changed_by_user_id, note, created_at)
SELECT a.application_id, 'pending', a.status, i.employer_user_id,
       COALESCE(a.employer_note, CONCAT('Status changed to ', a.status, '.')),
       a.status_updated_at
FROM application a
JOIN internship i ON i.internship_id = a.internship_id
JOIN users seed_student ON seed_student.user_id = a.student_user_id
WHERE seed_student.email IN (
    'alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo',
    'samira@uj.edu.jo', 'omar@yarmouk.edu.jo', 'leen@hu.edu.jo', 'dina@petra.edu.jo',
    'zaid@just.edu.jo'
  )
  AND a.status <> 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM application_status_history h
    WHERE h.application_id = a.application_id AND h.new_status = a.status
  );

INSERT IGNORE INTO bookmark (student_user_id, internship_id, created_at)
SELECT su.user_id, i.internship_id, DATE_SUB(NOW(), INTERVAL seed.days_ago DAY)
FROM (
  SELECT 'alex@psut.edu.jo' AS student_email, 'mahmoud@dataflow.jo' AS employer_email, 'Data Science Intern' AS internship_title, 2 AS days_ago
  UNION ALL SELECT 'jordan@just.edu.jo', 'sarah@techcorp.jo', 'Backend Engineering Intern', 3
  UNION ALL SELECT 'taylor@uj.edu.jo', 'lana@designhub.jo', 'Digital Marketing Intern', 4
  UNION ALL SELECT 'samira@uj.edu.jo', 'mahmoud@dataflow.jo', 'Business Intelligence Intern', 1
  UNION ALL SELECT 'omar@yarmouk.edu.jo', 'sarah@techcorp.jo', 'Mobile App Developer Intern', 5
  UNION ALL SELECT 'leen@hu.edu.jo', 'rania@edubridge.jo', 'Education Technology Content Intern', 6
  UNION ALL SELECT 'dina@petra.edu.jo', 'lana@designhub.jo', 'UI/UX Design Intern', 2
  UNION ALL SELECT 'zaid@just.edu.jo', 'kareem@buildright.jo', 'Civil Engineering Project Intern', 7
) seed
JOIN users su ON su.email = seed.student_email
JOIN users eu ON eu.email = seed.employer_email
JOIN internship i ON i.title = seed.internship_title AND i.employer_user_id = eu.user_id;

INSERT IGNORE INTO internship_invitation (internship_id, student_user_id, employer_user_id, message, status, created_at)
SELECT i.internship_id, su.user_id, eu.user_id, seed.message, seed.status,
       DATE_SUB(NOW(), INTERVAL seed.days_ago DAY)
FROM (
  SELECT 'sarah@techcorp.jo' AS employer_email, 'omar@yarmouk.edu.jo' AS student_email, 'Mobile App Developer Intern' AS internship_title, 'Your mobile and JavaScript experience looks like a good fit for our pending mobile app role.' AS message, 'pending' AS status, 1 AS days_ago
  UNION ALL SELECT 'nour@brightbank.jo', 'samira@uj.edu.jo', 'Financial Analyst Intern', 'Your finance and reporting background fits this analyst internship well.', 'viewed', 3
  UNION ALL SELECT 'omar@carebridge.jo', 'leen@hu.edu.jo', 'Health Informatics Intern', 'Your public health background would bring useful domain context to our team.', 'applied', 5
  UNION ALL SELECT 'lana@designhub.jo', 'dina@petra.edu.jo', 'Digital Marketing Intern', 'We liked your content planning background and would be happy to review your application.', 'viewed', 2
  UNION ALL SELECT 'lana@designhub.jo', 'taylor@uj.edu.jo', 'Social Media Strategy Intern', 'This rejected posting invite remains for testing dismissed invitation states.', 'dismissed', 8
  UNION ALL SELECT 'kareem@buildright.jo', 'zaid@just.edu.jo', 'Civil Engineering Project Intern', 'Your engineering profile is relevant for our site coordination internship.', 'applied', 6
) seed
JOIN users eu ON eu.email = seed.employer_email
JOIN users su ON su.email = seed.student_email
JOIN internship i ON i.title = seed.internship_title AND i.employer_user_id = eu.user_id;

INSERT IGNORE INTO conversation (student_user_id, employer_user_id, internship_id, context_type, context_key, created_at)
SELECT su.user_id, eu.user_id, i.internship_id, 'internship', i.internship_id,
       DATE_SUB(NOW(), INTERVAL seed.days_ago DAY)
FROM (
  SELECT 'jordan@just.edu.jo' AS student_email, 'mahmoud@dataflow.jo' AS employer_email, 'Machine Learning Engineer Intern' AS internship_title, 5 AS days_ago
  UNION ALL SELECT 'morgan@gju.edu.jo', 'sarah@techcorp.jo', 'Backend Engineering Intern', 6
  UNION ALL SELECT 'leen@hu.edu.jo', 'omar@carebridge.jo', 'Health Informatics Intern', 3
  UNION ALL SELECT 'dina@petra.edu.jo', 'lana@designhub.jo', 'Digital Marketing Intern', 2
  UNION ALL SELECT 'zaid@just.edu.jo', 'kareem@buildright.jo', 'Civil Engineering Project Intern', 2
) seed
JOIN users su ON su.email = seed.student_email
JOIN users eu ON eu.email = seed.employer_email
JOIN internship i ON i.title = seed.internship_title AND i.employer_user_id = eu.user_id;

INSERT INTO message (conversation_id, sender_user_id, content, is_read, created_at)
SELECT c.conversation_id, sender.user_id, seed.content, seed.is_read,
       DATE_SUB(NOW(), INTERVAL seed.minutes_ago MINUTE)
FROM (
  SELECT 'jordan@just.edu.jo' AS student_email, 'mahmoud@dataflow.jo' AS employer_email, 'Machine Learning Engineer Intern' AS internship_title, 'mahmoud@dataflow.jo' AS sender_email, 'Thanks for applying. Are you available for a technical interview this week?' AS content, 1 AS is_read, 420 AS minutes_ago
  UNION ALL SELECT 'jordan@just.edu.jo', 'mahmoud@dataflow.jo', 'Machine Learning Engineer Intern', 'jordan@just.edu.jo', 'Yes, I am available on Wednesday or Thursday afternoon.', 0, 360
  UNION ALL SELECT 'morgan@gju.edu.jo', 'sarah@techcorp.jo', 'Backend Engineering Intern', 'sarah@techcorp.jo', 'Congratulations, we would like to move forward with your application.', 1, 300
  UNION ALL SELECT 'leen@hu.edu.jo', 'omar@carebridge.jo', 'Health Informatics Intern', 'omar@carebridge.jo', 'Your healthcare background is exactly what this project needs.', 1, 240
  UNION ALL SELECT 'dina@petra.edu.jo', 'lana@designhub.jo', 'Digital Marketing Intern', 'dina@petra.edu.jo', 'I can send campaign writing samples if useful.', 0, 120
  UNION ALL SELECT 'zaid@just.edu.jo', 'kareem@buildright.jo', 'Civil Engineering Project Intern', 'kareem@buildright.jo', 'Please confirm whether you can attend an on-site interview next week.', 0, 90
) seed
JOIN users su ON su.email = seed.student_email
JOIN users eu ON eu.email = seed.employer_email
JOIN users sender ON sender.email = seed.sender_email
JOIN internship i ON i.title = seed.internship_title AND i.employer_user_id = eu.user_id
JOIN conversation c ON c.student_user_id = su.user_id
  AND c.employer_user_id = eu.user_id
  AND c.context_type = 'internship'
  AND c.context_key = i.internship_id
WHERE NOT EXISTS (
  SELECT 1 FROM message m
  WHERE m.conversation_id = c.conversation_id AND m.content = seed.content
);

INSERT INTO internship_view (internship_id, viewer_user_id, viewed_at)
SELECT i.internship_id, su.user_id, DATE_SUB(NOW(), INTERVAL seed.hours_ago HOUR)
FROM (
  SELECT 'sarah@techcorp.jo' AS employer_email, 'Full-Stack Developer Intern' AS internship_title, 'alex@psut.edu.jo' AS student_email, 4 AS hours_ago
  UNION ALL SELECT 'sarah@techcorp.jo', 'Full-Stack Developer Intern', 'omar@yarmouk.edu.jo', 6
  UNION ALL SELECT 'mahmoud@dataflow.jo', 'Data Science Intern', 'jordan@just.edu.jo', 8
  UNION ALL SELECT 'mahmoud@dataflow.jo', 'Business Intelligence Intern', 'samira@uj.edu.jo', 10
  UNION ALL SELECT 'lana@designhub.jo', 'UI/UX Design Intern', 'taylor@uj.edu.jo', 12
  UNION ALL SELECT 'lana@designhub.jo', 'Digital Marketing Intern', 'dina@petra.edu.jo', 5
  UNION ALL SELECT 'nour@brightbank.jo', 'Financial Analyst Intern', 'samira@uj.edu.jo', 3
  UNION ALL SELECT 'omar@carebridge.jo', 'Health Informatics Intern', 'leen@hu.edu.jo', 7
  UNION ALL SELECT 'kareem@buildright.jo', 'Civil Engineering Project Intern', 'zaid@just.edu.jo', 9
) seed
JOIN users eu ON eu.email = seed.employer_email
JOIN users su ON su.email = seed.student_email
JOIN internship i ON i.title = seed.internship_title AND i.employer_user_id = eu.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM internship_view v
  WHERE v.internship_id = i.internship_id AND v.viewer_user_id = su.user_id
);

INSERT INTO report (admin_user_id, report_type, report_description, filters_json, created_at)
SELECT admin_user.user_id, seed.report_type, seed.report_description, seed.filters_json,
       DATE_SUB(NOW(), INTERVAL seed.days_ago DAY)
FROM (
  SELECT 'platform_overview' AS report_type, 'Seeded platform overview report for admin export testing.' AS report_description, '{"range":"last_30_days"}' AS filters_json, 2 AS days_ago
  UNION ALL SELECT 'applications_by_status', 'Seeded application status report with pending, review, interview, accepted, rejected, and withdrawn examples.', '{"status":"all"}', 1
) seed
JOIN users admin_user ON admin_user.email = 'admin@internmatch.com'
WHERE NOT EXISTS (
  SELECT 1 FROM report r
  WHERE r.admin_user_id = admin_user.user_id AND r.report_type = seed.report_type
);

INSERT INTO system_log (user_id, action, details, ip_address, created_at)
SELECT u.user_id, seed.action, seed.details, '127.0.0.1',
       DATE_SUB(NOW(), INTERVAL seed.days_ago DAY)
FROM (
  SELECT 'admin@internmatch.com' AS email, 'seed_loaded' AS action, 'Seed data loaded for local testing.' AS details, 1 AS days_ago
  UNION ALL SELECT 'sarah@techcorp.jo', 'internship_created', 'Seeded employer internship activity.', 4
  UNION ALL SELECT 'alex@psut.edu.jo', 'application_submitted', 'Seeded student application activity.', 3
  UNION ALL SELECT 'morgan@gju.edu.jo', 'application_accepted', 'Seeded accepted application activity.', 2
) seed
JOIN users u ON u.email = seed.email
WHERE NOT EXISTS (
  SELECT 1 FROM system_log l
  WHERE l.user_id = u.user_id AND l.action = seed.action AND l.details = seed.details
);

-- =============================================================================
-- 9. Welcome + system notifications
-- =============================================================================

INSERT INTO notification (user_id, type, title, message, reference_type)
SELECT u.user_id, 'welcome', 'Welcome to InternMatch!',
       'Your account has been created. Complete your profile to start matching with opportunities.', 'user'
FROM users u
WHERE u.email IN (
    'alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo',
    'samira@uj.edu.jo', 'omar@yarmouk.edu.jo', 'leen@hu.edu.jo', 'dina@petra.edu.jo',
    'zaid@just.edu.jo'
  )
  AND NOT EXISTS (SELECT 1 FROM notification n WHERE n.user_id = u.user_id AND n.type = 'welcome');

INSERT INTO notification (user_id, type, title, message, reference_type)
SELECT u.user_id, 'welcome', 'Welcome to InternMatch!',
       'Your employer account is ready. Post your first internship to start receiving applications.', 'user'
FROM users u
WHERE u.email IN (
    'sarah@techcorp.jo', 'mahmoud@dataflow.jo', 'lana@designhub.jo',
    'nour@brightbank.jo', 'omar@carebridge.jo', 'rania@edubridge.jo', 'kareem@buildright.jo'
  )
  AND NOT EXISTS (SELECT 1 FROM notification n WHERE n.user_id = u.user_id AND n.type = 'welcome');

INSERT INTO notification (user_id, type, title, message, reference_id, reference_type)
SELECT i.employer_user_id, 'internship_approved',
       CONCAT('Internship Approved: ', i.title),
       CONCAT('Your internship "', i.title, '" has been approved and is now active.'),
       i.internship_id, 'internship'
FROM internship i
WHERE i.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM notification n
    WHERE n.user_id = i.employer_user_id
      AND n.type = 'internship_approved'
      AND n.reference_id = i.internship_id
  );

INSERT INTO notification (user_id, type, title, message, reference_type)
SELECT u.user_id, 'new_user_registered', 'New Users Registered',
       'Multiple new users have registered on the platform. Review their profiles in the admin panel.', 'user'
FROM users u
WHERE u.email = 'admin@internmatch.com'
  AND NOT EXISTS (SELECT 1 FROM notification n WHERE n.user_id = u.user_id AND n.type = 'new_user_registered');

SELECT 'InternMatch seed data loaded.' AS status;
