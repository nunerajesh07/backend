import { ArticleStatus } from '../types/article.types';

export interface MockArticleDefinition {
  title: string;
  body: string;
  category: string;
  campus: string;
  status: ArticleStatus;
}

/**
 * Realistic rows for `npm run seed` / `npm run seed:mock` (MongoDB only â€” not used by the React app).
 */
export const MOCK_ARTICLE_DEFINITIONS: MockArticleDefinition[] = [
  {
    title: 'Chennai campus orientation week',
    body: 'New batches can collect schedules from the front office. ID cards will be issued after document verification. Please arrive 15 minutes early for the auditorium session.',
    category: 'Announcements',
    campus: 'Chennai',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Hackathon registrations open',
    body: 'Form teams of up to four. Themes will be announced on Monday. Bring your laptops; power strips will be available in the lab wings.',
    category: 'Events',
    campus: 'Chennai',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Placement prep â€” mock interviews',
    body: 'Slots are limited. Sign up via the placement portal. Dress code is business casual for the panel round.',
    category: 'Placements',
    campus: 'Chennai',
    status: ArticleStatus.DRAFT
  },
  {
    title: 'Hyderabad â€” guest lecture on system design',
    body: 'We will cover caching, sharding, and trade-offs at scale. Q&A at the end; questions can be submitted via Slido.',
    category: 'Tech',
    campus: 'Hyderabad',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Sports day schedule',
    body: 'Track events start at 8 AM. Team games follow lunch. Hydration stations will be marked across the grounds.',
    category: 'Campus Life',
    campus: 'Hyderabad',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Career fair â€” spring edition',
    body: 'Employer booths will be in Hall B. Carry printed resumes; some recruiters will scan QR portfolios only.',
    category: 'Placements',
    campus: 'Hyderabad',
    status: ArticleStatus.SCHEDULED
  },
  {
    title: 'Pune â€” library digital resources',
    body: 'New e-journal bundles are live. Use campus VPN off-site. Report access issues to helpdesk with screenshots.',
    category: 'Campus Life',
    campus: 'Pune',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Industry visit â€” manufacturing unit',
    body: 'Bus leaves at 7:30 AM sharp. Safety shoes mandatory; PPE will be provided on site.',
    category: 'Events',
    campus: 'Pune',
    status: ArticleStatus.DRAFT
  },
  {
    title: 'Noida â€” winter timetable',
    body: 'Labs move to the afternoon block on Wednesdays. Theory sessions remain unchanged in the LMS calendar.',
    category: 'Announcements',
    campus: 'Noida',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Alumni mentoring circles',
    body: 'Monthly virtual meetups for final-year students. Mentors are matched by domain; feedback forms close Friday.',
    category: 'Placements',
    campus: 'Noida',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Open house for parents',
    body: 'Campus tours and faculty meet-and-greet. RSVP links were emailed to registered guardians.',
    category: 'Events',
    campus: 'Noida',
    status: ArticleStatus.SCHEDULED
  },
  {
    title: 'Chennai â€” Wi-Fi maintenance window',
    body: 'Connectivity may drop for up to 30 minutes in Block C during the maintenance window. Wired labs stay online.',
    category: 'Tech',
    campus: 'Chennai',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Bangalore â€” design systems workshop',
    body: 'Hands-on tokens, theming, and accessibility checks. Bring a laptop with Figma installed; sample files will be shared in the drive.',
    category: 'Tech',
    campus: 'Bangalore',
    status: ArticleStatus.PUBLISHED
  },
  {
    title: 'Bangalore campus â€” shuttle timings',
    body: 'Morning shuttles from the metro hub run every 20 minutes until 10 AM. Evening return starts at 5 PM from the main gate.',
    category: 'Announcements',
    campus: 'Bangalore',
    status: ArticleStatus.PUBLISHED
  }
];

