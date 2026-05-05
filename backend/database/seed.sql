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
--   admin@internmatch.com        Admin@123
--   all other seeded accounts    Test@1234

SET NAMES utf8mb4;

-- =============================================================================
-- 1. Default admin
-- =============================================================================

INSERT IGNORE INTO users (full_name, email, password, role, is_active, token_version)
VALUES (
  'System Admin',
  'admin@internmatch.com',
  '$2a$12$8wOPIaDrsw05MySEeF3BueuSr2f7mECBNvReQ6XWLf4SXMuaNqU7e',
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
('AR/VR',            'arvr',            'other');

-- =============================================================================
-- 3. Test employer accounts (industries restricted to authController whitelist)
-- =============================================================================

SET @test_pw = '$2a$12$so4aZC2Fgc7eYvRByIUr3.MBJskiPnv3p5VatBrm6WqGdM8ditMQy';

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

INSERT IGNORE INTO notification_preference (user_id)
SELECT user_id FROM users WHERE email IN ('sarah@techcorp.jo', 'mahmoud@dataflow.jo', 'lana@designhub.jo');

-- =============================================================================
-- 4. Test student accounts (universities + majors from frontend whitelists)
-- =============================================================================

INSERT IGNORE INTO users (full_name, email, password, role, is_active, token_version)
VALUES
  ('Alex Rivera',  'alex@psut.edu.jo',   @test_pw, 'student', 1, 0),
  ('Jordan Lee',   'jordan@just.edu.jo', @test_pw, 'student', 1, 0),
  ('Taylor Smith', 'taylor@uj.edu.jo',   @test_pw, 'student', 1, 0),
  ('Morgan Davis', 'morgan@gju.edu.jo',  @test_pw, 'student', 1, 0);

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

INSERT IGNORE INTO notification_preference (user_id)
SELECT user_id FROM users
WHERE email IN ('alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo');

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

-- =============================================================================
-- 6. Test internships (active, approved). Salaries in JOD.
-- =============================================================================

INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Full-Stack Developer Intern',
       'Join our engineering team to build and maintain web applications using React and Node.js. You will work on real customer-facing features, participate in code reviews, and collaborate with senior engineers.\n\nResponsibilities:\n- Develop frontend components with React and TypeScript\n- Build RESTful APIs with Node.js and Express\n- Write unit and integration tests\n- Participate in agile ceremonies and sprint planning',
       'Amman, Jordan', 'hybrid', 3, 400, 700,
       DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Full-Stack Developer Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Backend Engineering Intern',
       'Work on our backend microservices architecture. You will help design and implement APIs, optimize database queries, and improve system reliability.\n\nRequirements:\n- Strong foundation in Java or Python\n- Understanding of relational databases\n- Familiarity with cloud services (AWS preferred)\n- Good communication skills',
       'Amman, Jordan', 'on-site', 6, 500, 800,
       DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active'
FROM users WHERE email = 'sarah@techcorp.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Backend Engineering Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Data Science Intern',
       'Help our data team build predictive models and analyze large datasets. You will work with Python, TensorFlow, and SQL to derive insights that drive product decisions.\n\nWhat you will do:\n- Clean and preprocess datasets\n- Build and evaluate ML models\n- Create data visualizations and dashboards\n- Present findings to stakeholders',
       'Remote', 'remote', 3, 350, 600,
       DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'active'
FROM users WHERE email = 'mahmoud@dataflow.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Data Science Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Machine Learning Engineer Intern',
       'Join our AI research team to develop and deploy machine learning models. You will work on NLP and computer vision projects using PyTorch and TensorFlow.\n\nIdeal candidate:\n- Strong Python programming skills\n- Experience with deep learning frameworks\n- Understanding of linear algebra and statistics\n- Interest in production ML systems',
       'Amman, Jordan', 'hybrid', 6, 600, 900,
       DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'active'
FROM users WHERE email = 'mahmoud@dataflow.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Machine Learning Engineer Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'UI/UX Design Intern',
       'Create beautiful and intuitive user interfaces for our clients. You will conduct user research, create wireframes, and deliver high-fidelity designs in Figma.\n\nYour responsibilities:\n- Conduct user interviews and usability testing\n- Create wireframes and interactive prototypes\n- Design responsive layouts for web and mobile\n- Collaborate with developers on implementation',
       'Irbid, Jordan', 'remote', 3, 300, 500,
       DATE_ADD(CURDATE(), INTERVAL 50 DAY), 'active'
FROM users WHERE email = 'lana@designhub.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'UI/UX Design Intern' AND employer_user_id = users.user_id);

INSERT INTO internship (employer_user_id, title, description, location, work_type, duration_months, salary_min, salary_max, deadline, status)
SELECT user_id,
       'Frontend Developer Intern',
       'Build pixel-perfect web interfaces using modern frontend technologies. You will translate Figma designs into responsive React components with Tailwind CSS.\n\nWe are looking for:\n- Solid HTML/CSS fundamentals\n- Experience with React or similar framework\n- Eye for design and attention to detail\n- Portfolio of web projects',
       'Irbid, Jordan', 'hybrid', 4, 350, 600,
       DATE_ADD(CURDATE(), INTERVAL 35 DAY), 'active'
FROM users WHERE email = 'lana@designhub.jo'
  AND NOT EXISTS (SELECT 1 FROM internship WHERE title = 'Frontend Developer Intern' AND employer_user_id = users.user_id);

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

-- =============================================================================
-- 8. Welcome + system notifications
-- =============================================================================

INSERT INTO notification (user_id, type, title, message, reference_type)
SELECT u.user_id, 'welcome', 'Welcome to InternMatch!',
       'Your account has been created. Complete your profile to start matching with opportunities.', 'user'
FROM users u
WHERE u.email IN ('alex@psut.edu.jo', 'jordan@just.edu.jo', 'taylor@uj.edu.jo', 'morgan@gju.edu.jo')
  AND NOT EXISTS (SELECT 1 FROM notification n WHERE n.user_id = u.user_id AND n.type = 'welcome');

INSERT INTO notification (user_id, type, title, message, reference_type)
SELECT u.user_id, 'welcome', 'Welcome to InternMatch!',
       'Your employer account is ready. Post your first internship to start receiving applications.', 'user'
FROM users u
WHERE u.email IN ('sarah@techcorp.jo', 'mahmoud@dataflow.jo', 'lana@designhub.jo')
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
