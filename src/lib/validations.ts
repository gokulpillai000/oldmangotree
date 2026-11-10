import { z } from 'zod';

/**
 * Letter to Editor / Feedback input validation schema (Check 11)
 */
export const feedbackSchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters'),
  senderEmail: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  message: z
    .string()
    .trim()
    .min(5, 'Message must be at least 5 characters long')
    .max(5000, 'Message cannot exceed 5,000 characters'),
  location: z.string().trim().max(100, 'Location cannot exceed 100 characters').optional(),
  articleTitle: z.string().trim().max(200, 'Article title cannot exceed 200 characters').optional(),
  articleSlug: z.string().trim().max(200, 'Article slug cannot exceed 200 characters').optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

const authActions = ['login', 'pin_login', 'signup', 'logout'] as const;

/**
 * Editorial Authentication payload validation schema
 */
export const authSchema = z.object({
  action: z.enum(authActions),
  pin: z.string().trim().min(1, 'PIN cannot be empty').max(64, 'PIN is too long').optional(),
  email: z.string().trim().email('Invalid email address').max(255).optional(),
  password: z.string().min(1, 'Password cannot be empty').max(128, 'Password is too long').optional(),
  name: z.string().trim().max(100).optional(),
});

export type AuthInput = z.infer<typeof authSchema>;

/**
 * Issue packet input validation schema
 * Restricts ID to alphanumeric characters and dashes to prevent directory traversal
 */
export const issuePacketSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Packet ID cannot be empty')
    .max(64, 'Packet ID is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Packet ID can only contain letters, numbers, hyphens, and underscores'),
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  issueNumber: z.coerce.number().int().positive().max(9999).optional().default(1),
  theme: z.string().trim().max(200).optional(),
  publishedAt: z.string().trim().max(100).optional(),
  coverImage: z.string().trim().max(500).optional(),
  isPremium: z.boolean().optional().default(false),
  featuredArticleSlug: z.string().trim().max(200).optional(),
  articleSlugs: z.array(z.string().trim().max(200)).optional().default([]),
});

export type IssuePacketInput = z.infer<typeof issuePacketSchema>;

/**
 * Helper to escape HTML characters in user text before embedding into emails
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
