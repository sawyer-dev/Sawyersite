/**
 * Site-wide identity and links. Anything set to `null` is intentionally unpublished:
 * the UI hides the matching link until a real value is supplied (see README "Outstanding content").
 */
export const site = {
  name: 'Sawyer Knowles',
  shortName: 'Sawyer Knowles',
  role: 'Full-stack software engineer',
  title: 'Sawyer Knowles — Full-stack software engineer',
  description:
    'Portfolio of Sawyer Knowles, a full-stack software engineer working with Angular, TypeScript and .NET, with a background in XR prototyping and game development.',
  location: 'San Francisco, CA',
  email: 'sawyerdknowles@gmail.com',
  links: {
    linkedin: 'https://www.linkedin.com/in/sawyer-knowles/',
    /** Supply a profile URL, e.g. 'https://github.com/<username>'. */
    github: 'https://github.com/sawyer-dev' as string | null,
    /** Site-relative path to a PDF placed in public/, e.g. 'media/sawyer-knowles-resume.pdf'. */
    resume: 'public/Sawyer_Knowles_Resume_2026.pdf' as string | null,
    /** Repository for this website. */
    source: 'https://github.com/sawyer-dev/Sawyersite',
  },
} as const;

export const nav = [
  { label: 'Home', href: '', match: '' },
  { label: 'Experience', href: 'experience/', match: 'experience' },
  { label: 'Projects', href: 'projects/', match: 'projects' },
  { label: 'Education', href: 'education/', match: 'education' },
  { label: 'Hobbies', href: 'hobbies/', match: 'hobbies' },
  { label: 'Apps', href: 'apps/', match: 'apps' },
] as const;
