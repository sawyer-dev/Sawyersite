/** Verified professional content, sourced from the owner's 2026 résumé. */
export interface Role {
  id: string;
  employer: string;
  title: string;
  dates: string;
  current?: boolean;
  client?: string;
  summary: string;
  highlights: string[];
  technologies: string[];
}

export const roles: Role[] = [
  {
    id: 'ssc-advent',
    employer: 'SS&C Advent',
    title: 'Software Engineer, Full Stack — Advent Market Data',
    dates: '2024 – Present',
    current: true,
    summary:
      'Full-stack engineer on Advent Market Data, building client-facing features and the platform services behind them.',
    highlights: [
      'Developed client-facing features using Angular, TypeScript, and .NET REST APIs, expanding product capabilities and improving internal support workflows.',
      'Architected and implemented an extensible auditing framework capturing UI and API activity to optimize troubleshooting, compliance, and client support.',
      'Improved homepage load performance by 80% through redesigning MongoDB aggregation pipelines, query execution, and indexing strategy.',
      "Integrated Advent Market Data with SS&C's internal authentication and authorization platform, simplifying secure API access for enterprise clients.",
      'Drove feature development from technical design through deployment, collaborating with product managers and UX designers to translate requirements into production-ready solutions.',
      'Led a cross-functional hackathon team to prototype a generative AI feature that transformed natural language prompts into interactive market data dashboards and visualizations.',
    ],
    technologies: ['Angular', 'TypeScript', '.NET', 'REST APIs', 'MongoDB'],
  },
  {
    id: 'sigma-connectivity',
    employer: 'Sigma Connectivity, Inc.',
    title: 'Software Engineer, XR Prototyping — Meta Reality Labs',
    dates: '2022 – 2023',
    client: 'Meta Platforms, Inc. — Facebook Portal Display',
    summary:
      'R&D engineer prototyping immersive XR and glasses-free 3D display experiences for Meta Reality Labs.',
    highlights: [
      'Developed a multi-user XR prototype connecting VR headset users with glasses-free 3D display users in a shared virtual environment, featuring real-time face and hand tracking, avatar animation, and inverse kinematics using Unity, ARKit, and Oculus XR.',
      'Engineered virtual and physical multi-camera video systems to capture, align, and optimize autostereoscopic video using Python, OpenCV, and FFmpeg for 3D displays.',
      'Collaborated with software, electrical, and optical engineers on a small, fast-paced R&D team to rapidly develop and validate prototypes for emerging display technologies.',
    ],
    technologies: ['Unity', 'ARKit', 'Oculus XR', 'Python', 'OpenCV', 'FFmpeg'],
  },
  {
    id: 'id-tech',
    employer: 'iD Tech',
    title: 'Instructor, Game Development — Computer Science Academy',
    dates: '2021',
    summary: 'Taught advanced game development and computer science courses.',
    highlights: [
      'Taught advanced courses in C#, Unity, game development, and Agile software development.',
      'Mentored students in the design, implementation, debugging, code review, and presentation of software projects.',
    ],
    technologies: ['C#', 'Unity'],
  },
];

/** Short, résumé-backed highlights for the Home page snapshot. */
export const snapshot = [
  {
    figure: '80%',
    label: 'Homepage load performance improvement',
    detail:
      'From redesigned MongoDB aggregation pipelines, query execution, and indexing strategy.',
  },
  {
    figure: 'Auditing',
    label: 'Extensible framework',
    detail:
      'Captures UI and API activity to support troubleshooting, compliance, and client support.',
  },
  {
    figure: 'Auth',
    label: 'Enterprise integration',
    detail:
      "Connected Advent Market Data to SS&C's internal authentication and authorization platform.",
  },
] as const;

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  dates: string;
  gpa?: string;
}

export const education: EducationEntry[] = [
  {
    institution: 'Michigan Technological University',
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    dates: '2018 – 2022',
    gpa: '3.6',
  },
];

export interface SkillGroup {
  label: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    label: 'Languages',
    items: ['C#', 'TypeScript', 'Python', 'Kotlin', 'Java', 'SQL', 'C++', 'C'],
  },
  { label: 'Frontend', items: ['Angular', 'React', 'HTML', 'CSS'] },
  { label: 'Backend & databases', items: ['.NET', 'REST APIs', 'MongoDB'] },
  {
    label: 'Developer tools',
    items: [
      'Git',
      'Jenkins',
      'Postman',
      'Unity',
      'Unreal Engine',
      'FFmpeg',
      'Copilot',
      'Claude Code',
    ],
  },
];
