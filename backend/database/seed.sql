-- InternMatch Seed Data
-- Idempotent: safe to run multiple times (INSERT IGNORE prevents duplicates)

-- =============================================================================
-- 1. Default Admin Account
--    Password: Admin@123 (bcrypt hash with 12 salt rounds)
--    Change this password immediately in production.
-- =============================================================================
INSERT IGNORE INTO users (full_name, email, password, role, is_active, token_version)
VALUES (
  'System Admin',
  'admin@internmatch.com',
  '$2a$12$8wOPIaDrsw05MySEeF3BueuSr2f7mECBNvReQ6XWLf4SXMuaNqU7e',
  'admin',
  1,
  0
);

INSERT IGNORE INTO admin (user_id, access_level)
SELECT user_id, 'SuperAdmin'
FROM users
WHERE email = 'admin@internmatch.com'
  AND NOT EXISTS (
    SELECT 1 FROM admin WHERE admin.user_id = users.user_id
  );

INSERT IGNORE INTO notification_preference (user_id)
SELECT user_id FROM users WHERE email = 'admin@internmatch.com';

-- =============================================================================
-- 2. Seed Skills (150+)
--    Uses INSERT IGNORE on normalized_name UNIQUE constraint to prevent duplicates.
-- =============================================================================

-- Programming Languages (30)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('JavaScript', 'javascript', 'programming'),
('Python', 'python', 'programming'),
('Java', 'java', 'programming'),
('C++', 'cpp', 'programming'),
('C#', 'csharp', 'programming'),
('C', 'c', 'programming'),
('TypeScript', 'typescript', 'programming'),
('PHP', 'php', 'programming'),
('Ruby', 'ruby', 'programming'),
('Swift', 'swift', 'programming'),
('Kotlin', 'kotlin', 'programming'),
('Go', 'go', 'programming'),
('Rust', 'rust', 'programming'),
('R', 'r', 'programming'),
('MATLAB', 'matlab', 'programming'),
('Scala', 'scala', 'programming'),
('Perl', 'perl', 'programming'),
('Dart', 'dart', 'programming'),
('Lua', 'lua', 'programming'),
('Shell/Bash', 'shellbash', 'programming'),
('Assembly', 'assembly', 'programming'),
('Objective-C', 'objectivec', 'programming'),
('Haskell', 'haskell', 'programming'),
('Elixir', 'elixir', 'programming'),
('Clojure', 'clojure', 'programming'),
('F#', 'fsharp', 'programming'),
('COBOL', 'cobol', 'programming'),
('Fortran', 'fortran', 'programming'),
('SQL', 'sql', 'programming'),
('GraphQL', 'graphql', 'programming');

-- Web Development (25)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('React', 'react', 'web'),
('Angular', 'angular', 'web'),
('Vue.js', 'vuejs', 'web'),
('Next.js', 'nextjs', 'web'),
('Node.js', 'nodejs', 'web'),
('Express.js', 'expressjs', 'web'),
('Django', 'django', 'web'),
('Flask', 'flask', 'web'),
('Spring Boot', 'springboot', 'web'),
('ASP.NET', 'aspnet', 'web'),
('HTML', 'html', 'web'),
('CSS', 'css', 'web'),
('Tailwind CSS', 'tailwindcss', 'web'),
('Bootstrap', 'bootstrap', 'web'),
('SASS', 'sass', 'web'),
('jQuery', 'jquery', 'web'),
('WordPress', 'wordpress', 'web'),
('Laravel', 'laravel', 'web'),
('Ruby on Rails', 'rubyonrails', 'web'),
('Svelte', 'svelte', 'web'),
('Gatsby', 'gatsby', 'web'),
('REST API', 'restapi', 'web'),
('GraphQL API', 'graphqlapi', 'web'),
('WebSocket', 'websocket', 'web'),
('OAuth', 'oauth', 'web');

-- Data & Databases (20)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('MySQL', 'mysql', 'data'),
('PostgreSQL', 'postgresql', 'data'),
('MongoDB', 'mongodb', 'data'),
('Firebase', 'firebase', 'data'),
('Redis', 'redis', 'data'),
('SQLite', 'sqlite', 'data'),
('Oracle', 'oracle', 'data'),
('SQL Server', 'sqlserver', 'data'),
('Elasticsearch', 'elasticsearch', 'data'),
('DynamoDB', 'dynamodb', 'data'),
('Cassandra', 'cassandra', 'data'),
('Data Analysis', 'dataanalysis', 'data'),
('Data Visualization', 'datavisualization', 'data'),
('Pandas', 'pandas', 'data'),
('NumPy', 'numpy', 'data'),
('Tableau', 'tableau', 'data'),
('Power BI', 'powerbi', 'data'),
('ETL', 'etl', 'data'),
('Data Warehousing', 'datawarehousing', 'data'),
('Big Data', 'bigdata', 'data');

-- AI & Machine Learning (15)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('Machine Learning', 'machinelearning', 'ai_ml'),
('Deep Learning', 'deeplearning', 'ai_ml'),
('TensorFlow', 'tensorflow', 'ai_ml'),
('PyTorch', 'pytorch', 'ai_ml'),
('scikit-learn', 'scikitlearn', 'ai_ml'),
('NLP', 'nlp', 'ai_ml'),
('Computer Vision', 'computervision', 'ai_ml'),
('Neural Networks', 'neuralnetworks', 'ai_ml'),
('Reinforcement Learning', 'reinforcementlearning', 'ai_ml'),
('OpenCV', 'opencv', 'ai_ml'),
('Keras', 'keras', 'ai_ml'),
('Hugging Face', 'huggingface', 'ai_ml'),
('LLM', 'llm', 'ai_ml'),
('Prompt Engineering', 'promptengineering', 'ai_ml'),
('Data Science', 'datascience', 'ai_ml');

-- DevOps & Cloud (20)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('AWS', 'aws', 'devops'),
('Azure', 'azure', 'devops'),
('Google Cloud', 'googlecloud', 'devops'),
('Docker', 'docker', 'devops'),
('Kubernetes', 'kubernetes', 'devops'),
('CI/CD', 'cicd', 'devops'),
('Jenkins', 'jenkins', 'devops'),
('GitHub Actions', 'githubactions', 'devops'),
('Terraform', 'terraform', 'devops'),
('Ansible', 'ansible', 'devops'),
('Linux', 'linux', 'devops'),
('Nginx', 'nginx', 'devops'),
('Apache', 'apache', 'devops'),
('Git', 'git', 'devops'),
('GitHub', 'github', 'devops'),
('GitLab', 'gitlab', 'devops'),
('Heroku', 'heroku', 'devops'),
('Vercel', 'vercel', 'devops'),
('Netlify', 'netlify', 'devops'),
('Serverless', 'serverless', 'devops');

-- Mobile Development (10)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('React Native', 'reactnative', 'mobile'),
('Flutter', 'flutter', 'mobile'),
('Android', 'android', 'mobile'),
('iOS', 'ios', 'mobile'),
('Xamarin', 'xamarin', 'mobile'),
('Ionic', 'ionic', 'mobile'),
('Expo', 'expo', 'mobile'),
('Mobile UI', 'mobileui', 'mobile'),
('SwiftUI', 'swiftui', 'mobile'),
('Jetpack Compose', 'jetpackcompose', 'mobile');

-- Design & Tools (15)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('Figma', 'figma', 'design'),
('Adobe XD', 'adobexd', 'design'),
('Photoshop', 'photoshop', 'design'),
('Illustrator', 'illustrator', 'design'),
('Canva', 'canva', 'design'),
('UI Design', 'uidesign', 'design'),
('UX Design', 'uxdesign', 'design'),
('Wireframing', 'wireframing', 'design'),
('Prototyping', 'prototyping', 'design'),
('User Research', 'userresearch', 'design'),
('Accessibility', 'accessibility', 'design'),
('Responsive Design', 'responsivedesign', 'design'),
('Design Systems', 'designsystems', 'design'),
('Sketch', 'sketch', 'design'),
('InVision', 'invision', 'design');

-- Soft Skills (15)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('Communication', 'communication', 'soft_skill'),
('Teamwork', 'teamwork', 'soft_skill'),
('Leadership', 'leadership', 'soft_skill'),
('Problem Solving', 'problemsolving', 'soft_skill'),
('Critical Thinking', 'criticalthinking', 'soft_skill'),
('Project Management', 'projectmanagement', 'soft_skill'),
('Agile', 'agile', 'soft_skill'),
('Scrum', 'scrum', 'soft_skill'),
('Time Management', 'timemanagement', 'soft_skill'),
('Presentation', 'presentation', 'soft_skill'),
('Writing', 'writing', 'soft_skill'),
('Research', 'research', 'soft_skill'),
('Adaptability', 'adaptability', 'soft_skill'),
('Creativity', 'creativity', 'soft_skill'),
('Attention to Detail', 'attentiontodetail', 'soft_skill');

-- Other (5 bonus)
INSERT IGNORE INTO skill (display_name, normalized_name, category) VALUES
('Blockchain', 'blockchain', 'other'),
('Cybersecurity', 'cybersecurity', 'other'),
('IoT', 'iot', 'other'),
('Game Development', 'gamedevelopment', 'other'),
('AR/VR', 'arvr', 'other');
