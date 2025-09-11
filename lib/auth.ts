import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.username || data.email, {
  message: "Either username or email is required",
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  interests: z.array(z.string()).optional(),
});

export const authOptions: NextAuthOptions = {
  // Remove adapter for JWT strategy
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.password || (!credentials?.username && !credentials?.email)) {
          return null;
        }

        try {
          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            return null;
          }

          const { username, email, password } = validatedFields.data;

          // Find user by username or email
          const user = await db.user.findFirst({
            where: {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  name?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  interests?: string[];
}) {
  try {
    const validatedFields = registerSchema.safeParse(data);

    if (!validatedFields.success) {
      return {
        error: 'Invalid input data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { username, email, password, name, level, interests } = validatedFields.data;

    // Check if user already exists by email or username
    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return {
        error: 'User with this email already exists',
      };
    }

    const existingUserByUsername = await db.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return {
        error: 'Username is already taken',
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        username,
        name: name || username, // Use provided name or fall back to username
        email,
        passwordHash,
        level: level || 'BEGINNER',
        interests: JSON.stringify(interests || []),
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      error: 'An error occurred during registration',
    };
  }
}
