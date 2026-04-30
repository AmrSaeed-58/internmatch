// One-off PDF generator for sample CVs used in manual testing.
// Run from backend/: node database/sample-cvs/generate.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outDir = __dirname;

const cvs = [
  {
    file: 'alex-rivera-fullstack.pdf',
    name: 'Alex Rivera',
    title: 'Full-Stack Developer',
    contact: {
      email: 'alex@psut.edu.jo',
      phone: '+962 79 555 0101',
      location: 'Amman, Jordan',
      links: ['linkedin.com/in/alexrivera', 'github.com/alexrivera'],
    },
    summary:
      'Full-stack developer with three years of project experience building production-grade web applications using React, TypeScript, Node.js, and MySQL. Comfortable across the stack — from designing REST APIs to shipping accessible, performant UI. Looking for a summer internship where I can contribute to user-facing products.',
    education: [
      {
        school: 'Princess Sumaya University for Technology (PSUT)',
        degree: 'BSc Computer Science',
        date: 'Sept 2022 – Expected June 2026',
        gpa: 'GPA 3.85 / 4.00',
      },
    ],
    skills: [
      'Languages: JavaScript, TypeScript, Python, SQL, HTML, CSS',
      'Frameworks: React, Node.js, Express, Tailwind CSS, Next.js',
      'Tools: Git, Docker, MySQL, PostgreSQL, REST APIs, Jest',
      'Cloud: AWS (S3, EC2, Lambda — beginner)',
    ],
    experience: [
      {
        role: 'Software Engineering Intern',
        company: 'Aramex Digital — Amman',
        date: 'Jun 2025 – Aug 2025',
        bullets: [
          'Built a customer-facing tracking widget in React and TypeScript used by 12k daily active users.',
          'Implemented Node.js endpoints backed by MySQL; cut p95 response time from 480ms to 110ms via indexed queries.',
          'Wrote integration tests with Jest and Supertest, raising the coverage of the shipping module from 38% to 72%.',
        ],
      },
      {
        role: 'Web Development Tutor',
        company: 'PSUT Coding Club',
        date: 'Sept 2024 – Present',
        bullets: [
          'Lead weekly workshops on React, Git, and modern JavaScript for 25+ underclassmen.',
          'Authored a Tailwind CSS reference repository now used as required reading in the front-end course.',
        ],
      },
    ],
    projects: [
      {
        name: 'StudyHall — group study scheduler',
        date: '2024',
        bullets: [
          'React + Node.js + MySQL app with real-time presence via Socket.IO; deployed on Vercel and Railway.',
          'Implemented JWT auth with refresh-token rotation; passed manual security review by faculty advisor.',
        ],
      },
    ],
  },
  {
    file: 'jordan-lee-data-science.pdf',
    name: 'Jordan Lee',
    title: 'Data Science & Machine Learning',
    contact: {
      email: 'jordan@just.edu.jo',
      phone: '+962 79 555 0102',
      location: 'Irbid, Jordan',
      links: ['linkedin.com/in/jordanlee', 'kaggle.com/jordanlee'],
    },
    summary:
      'Final-year Data Science student with hands-on experience training ML models on real-world datasets. Strong Python, TensorFlow, and SQL fundamentals. Comfortable owning a problem end-to-end: from data cleaning, through model selection and evaluation, to a clear written write-up of results.',
    education: [
      {
        school: 'Jordan University of Science and Technology (JUST)',
        degree: 'BSc Data Science',
        date: 'Sept 2021 – Expected June 2025',
        gpa: 'GPA 3.72 / 4.00',
      },
    ],
    skills: [
      'Programming: Python (advanced), SQL (intermediate), R (basic)',
      'Machine Learning: scikit-learn, TensorFlow, Keras, PyTorch (basic), XGBoost',
      'Data: Pandas, NumPy, Matplotlib, Seaborn, Plotly, Jupyter',
      'Other: Git, Docker (basic), Linux, Tableau',
    ],
    experience: [
      {
        role: 'Research Assistant — AI Lab',
        company: 'JUST Faculty of Computer & Information Technology',
        date: 'Feb 2024 – Present',
        bullets: [
          'Trained CNN models for Arabic handwritten digit classification, reaching 96.8% test accuracy on ADBase.',
          'Cleaned and labelled a 22k-image dataset; documented preprocessing pipeline so the lab can reproduce results.',
          'Co-author on a paper currently under review at an MENA regional AI conference.',
        ],
      },
      {
        role: 'Data Analytics Intern',
        company: 'Zain Jordan',
        date: 'Jul 2024 – Sept 2024',
        bullets: [
          'Built a customer-churn dashboard in Tableau pulling from a 5M-row PostgreSQL warehouse.',
          'Prototyped a logistic-regression churn model in Python (AUC 0.81) which is now being productionised by the analytics team.',
        ],
      },
    ],
    projects: [
      {
        name: 'Amman Air-Quality Forecasting',
        date: '2024',
        bullets: [
          'Time-series forecasting of PM2.5 using LSTM (TensorFlow) on 4 years of hourly data; MAE 6.4 µg/m³.',
          'Wrote up methodology and findings as a public Jupyter notebook with Plotly visualisations.',
        ],
      },
    ],
  },
  {
    file: 'taylor-smith-design.pdf',
    name: 'Taylor Smith',
    title: 'UI/UX & Visual Designer',
    contact: {
      email: 'taylor@uj.edu.jo',
      phone: '+962 79 555 0103',
      location: 'Amman, Jordan',
      links: ['behance.net/taylorsmith', 'github.com/taylorsmith'],
    },
    summary:
      'Designer focused on the intersection of UI craft and user research. Confident in Figma, Adobe Photoshop, and Illustrator; comfortable shipping production assets and prototyping interactions. Background in graphic design with growing front-end skills (HTML, CSS, basic JavaScript) so I can hand off cleanly to engineers.',
    education: [
      {
        school: 'University of Jordan',
        degree: 'BSc Graphic Design',
        date: 'Sept 2023 – Expected June 2027',
        gpa: 'GPA 3.50 / 4.00',
      },
    ],
    skills: [
      'Design: Figma, Adobe Photoshop, Adobe Illustrator, Adobe XD, Sketch',
      'UX: User research, wireframing, prototyping, usability testing',
      'Front-end: HTML, CSS, basic JavaScript, responsive design',
      'Other: Notion, Miro, basic motion design (After Effects)',
    ],
    experience: [
      {
        role: 'Freelance Designer',
        company: 'Independent — Amman',
        date: 'Jan 2024 – Present',
        bullets: [
          'Delivered brand identity systems and landing pages for 6 small businesses across F&B and education.',
          'Ran 30-minute remote usability sessions for two clients; iterated on flows that reduced sign-up drop-off by 18%.',
        ],
      },
      {
        role: 'Design Intern',
        company: 'DesignHub Creative — Irbid',
        date: 'Jun 2024 – Aug 2024',
        bullets: [
          'Designed marketing illustrations and Instagram templates that increased engagement by 24% over the trial period.',
          'Built a 60-component Figma library now used as the agency’s starting kit for new client projects.',
        ],
      },
    ],
    projects: [
      {
        name: 'Tasawwur — Arabic-first design system',
        date: '2025',
        bullets: [
          'A Figma design system built around right-to-left layouts, with documentation on type pairing for Arabic and Latin scripts.',
          'Open-sourced and presented at a UJ design society talk.',
        ],
      },
    ],
  },
];

function drawCV(cv) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const outPath = path.join(outDir, cv.file);
  doc.pipe(fs.createWriteStream(outPath));

  doc.font('Helvetica-Bold').fontSize(22).fillColor('#111').text(cv.name);
  doc.font('Helvetica').fontSize(12).fillColor('#555').text(cv.title);
  doc.moveDown(0.3);

  const c = cv.contact;
  doc.fontSize(10).fillColor('#333').text(
    `${c.email}  |  ${c.phone}  |  ${c.location}`,
  );
  doc.text(c.links.join('  |  '));
  doc.moveDown(0.6);

  section(doc, 'Summary');
  doc.font('Helvetica').fontSize(10).fillColor('#222').text(cv.summary, { align: 'justify' });
  doc.moveDown(0.6);

  section(doc, 'Education');
  cv.education.forEach((e) => {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text(e.school);
    doc.font('Helvetica').fontSize(10).fillColor('#333').text(`${e.degree}  —  ${e.date}  —  ${e.gpa}`);
    doc.moveDown(0.3);
  });

  section(doc, 'Skills');
  cv.skills.forEach((s) => {
    doc.font('Helvetica').fontSize(10).fillColor('#222').text(`• ${s}`);
  });
  doc.moveDown(0.4);

  section(doc, 'Experience');
  cv.experience.forEach((x) => {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text(`${x.role}  —  ${x.company}`);
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#666').text(x.date);
    doc.font('Helvetica').fontSize(10).fillColor('#222');
    x.bullets.forEach((b) => doc.text(`• ${b}`, { indent: 12 }));
    doc.moveDown(0.4);
  });

  section(doc, 'Projects');
  cv.projects.forEach((p) => {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text(`${p.name}  —  ${p.date}`);
    doc.font('Helvetica').fontSize(10).fillColor('#222');
    p.bullets.forEach((b) => doc.text(`• ${b}`, { indent: 12 }));
    doc.moveDown(0.3);
  });

  doc.end();
  return outPath;
}

function section(doc, title) {
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#7c3aed').text(title.toUpperCase());
  doc
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .lineWidth(0.7)
    .strokeColor('#ddd')
    .stroke();
  doc.moveDown(0.3);
}

cvs.forEach((cv) => {
  const p = drawCV(cv);
  console.log('Wrote', p);
});
