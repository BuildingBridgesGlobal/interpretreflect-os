import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Community Profile API Tests
 *
 * Tests cover:
 * - GET: Fetching own profile, viewing another user's profile, connection status
 * - POST: Creating new profiles with all new enhanced fields
 * - PUT: Updating profiles with field synchronization
 * - Legacy field backward compatibility
 * - Edge cases and error handling
 */

// Mock modules
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/apiAuth', () => ({
  validateAuth: vi.fn(),
}));

import { GET, POST, PUT } from './route';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validateAuth } from '@/lib/apiAuth';

// Helper to create mock NextRequest
const createMockRequest = (options: {
  method?: string;
  url?: string;
  body?: object;
} = {}) => {
  const { method = 'GET', url = 'http://localhost:3000/api/community/profile', body } = options;

  return {
    method,
    url,
    json: vi.fn().mockResolvedValue(body || {}),
  } as unknown as NextRequest;
};

// Mock Supabase chain builder
const createMockSupabaseChain = (returnData: any, error: any = null) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error }),
  };
  return chain;
};

describe('Community Profile API', () => {
  const mockUserId = 'user-123-abc';
  const mockViewUserId = 'user-456-def';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    vi.mocked(validateAuth).mockResolvedValue({
      user: { id: mockUserId },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // GET TESTS
  // ============================================
  describe('GET - Fetch Profile', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(validateAuth).mockResolvedValue({
        user: null,
        error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as any,
      });

      const req = createMockRequest();
      const response = await GET(req);

      expect(response.status).toBe(401);
    });

    it('should return own profile with needs_setup when no profile exists', async () => {
      const profileChain = createMockSupabaseChain(null, { code: 'PGRST116' });
      const userProfileChain = createMockSupabaseChain({ full_name: 'John Smith', email: 'john@test.com' });

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'community_profiles') return profileChain;
        if (table === 'profiles') return userProfileChain;
        return createMockSupabaseChain(null);
      });

      const req = createMockRequest({ url: 'http://localhost:3000/api/community/profile' });
      const response = await GET(req);
      const data = await response.json();

      expect(data.needs_setup).toBe(true);
      expect(data.profile).toBeNull();
      expect(data.suggested_display_name).toBe('John Smith');
    });

    it('should extract name from email when full_name is not available', async () => {
      const profileChain = createMockSupabaseChain(null, { code: 'PGRST116' });
      const userProfileChain = createMockSupabaseChain({ full_name: null, email: 'jane.doe@example.com' });

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'community_profiles') return profileChain;
        if (table === 'profiles') return userProfileChain;
        return createMockSupabaseChain(null);
      });

      const req = createMockRequest();
      const response = await GET(req);
      const data = await response.json();

      expect(data.suggested_display_name).toBe('Jane Doe');
    });

    it('should handle email with underscores for name extraction', async () => {
      const profileChain = createMockSupabaseChain(null, { code: 'PGRST116' });
      const userProfileChain = createMockSupabaseChain({ full_name: null, email: 'mary_jane_watson@example.com' });

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'community_profiles') return profileChain;
        if (table === 'profiles') return userProfileChain;
        return createMockSupabaseChain(null);
      });

      const req = createMockRequest();
      const response = await GET(req);
      const data = await response.json();

      expect(data.suggested_display_name).toBe('Mary Jane Watson');
    });

    it('should return 404 when viewing non-existent other user profile', async () => {
      const profileChain = createMockSupabaseChain(null, { code: 'PGRST116' });

      vi.mocked(supabaseAdmin.from).mockReturnValue(profileChain);

      const req = createMockRequest({ url: `http://localhost:3000/api/community/profile?view_user_id=${mockViewUserId}` });
      const response = await GET(req);

      expect(response.status).toBe(404);
    });

    it('should return profile with connection status when viewing another user', async () => {
      const mockProfile = {
        user_id: mockViewUserId,
        display_name: 'Jane Doe',
        bio: 'Test bio',
      };

      const mockConnection = {
        id: 'conn-123',
        status: 'accepted',
        requester_id: mockUserId,
      };

      const profileChain = createMockSupabaseChain(mockProfile);
      const connectionsChain = {
        ...createMockSupabaseChain(mockConnection),
        select: vi.fn().mockReturnThis(),
      };
      const postsChain = createMockSupabaseChain(null);

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'community_profiles') return profileChain;
        if (table === 'connections') return connectionsChain;
        if (table === 'community_posts') return postsChain;
        return createMockSupabaseChain(null);
      });

      const req = createMockRequest({ url: `http://localhost:3000/api/community/profile?view_user_id=${mockViewUserId}` });
      const response = await GET(req);
      const data = await response.json();

      expect(data.connection_status).toBe('accepted');
      expect(data.connection_id).toBe('conn-123');
      expect(data.is_own_profile).toBe(false);
    });
  });

  // ============================================
  // POST TESTS - CREATE PROFILE
  // ============================================
  describe('POST - Create Profile', () => {
    it('should return 400 when display_name is missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { bio: 'Test bio' },
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('display_name is required');
    });

    it('should return 400 when profile already exists', async () => {
      const existingProfileChain = createMockSupabaseChain({ id: 'existing-123' });

      vi.mocked(supabaseAdmin.from).mockReturnValue(existingProfileChain);

      const req = createMockRequest({
        method: 'POST',
        body: { display_name: 'Test User' },
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Profile already exists. Use PUT to update.');
    });

    it('should create profile with all new enhanced fields', async () => {
      let insertedData: any = null;
      let callCount = 0;

      const existingCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      const insertChain = {
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data;
          return insertChain;
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-profile', ...insertedData }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        // First call is for checking existing, second is for insert
        return callCount === 1 ? existingCheck : insertChain;
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          display_name: 'Test Interpreter',
          bio: 'Professional ASL interpreter',
          is_deaf_interpreter: true,
          years_experience: '4-7 years',
          settings_work_in: ['Medical', 'Legal'],
          offer_support_in: ['Medical terminology', 'Legal procedures'],
          seeking_guidance_in: ['Conference interpreting'],
          open_to_mentoring: true,
          looking_for_mentor: false,
          interpreter_certifications: ['RID CI', 'NIC'],
          work_settings: ['Hospital', 'Courtroom'],
          location_city: 'Seattle',
          location_state: 'Washington',
          location_country: 'United States',
          availability_status: 'available',
          timezone: 'America/Los_Angeles',
          languages_worked: ['ASL', 'English', 'Spanish'],
          headline: 'Certified Medical & Legal Interpreter',
          professional_background: '10 years of experience',
          education: 'BA in ASL Studies',
          itp_program: 'Gallaudet University',
          graduation_year: 2015,
          current_employer: 'Seattle Medical Center',
          website_url: 'https://mysite.com',
          linkedin_url: 'https://linkedin.com/in/test',
          show_location: true,
          show_employer: false,
        },
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
    });

    it('should use legacy fields as fallback when new fields not provided', async () => {
      let insertedData: any = null;

      const existingCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      const insertChain = {
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data;
          return insertChain;
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-profile', ...insertedData }, error: null }),
      };

      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? existingCheck : insertChain;
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          display_name: 'Legacy User',
          specialties: ['VRS', 'Educational'],
          strong_domains: ['Technology'],
          weak_domains: ['Legal'],
          certifications: ['BEI'],
          seeking_mentor: true,
        },
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
      // Verify legacy fields are mapped to new fields
      expect(insertedData.settings_work_in).toEqual(['VRS', 'Educational']);
      expect(insertedData.offer_support_in).toEqual(['Technology']);
      expect(insertedData.seeking_guidance_in).toEqual(['Legal']);
      expect(insertedData.interpreter_certifications).toEqual(['BEI']);
      expect(insertedData.looking_for_mentor).toBe(true);
    });

    it('should set correct defaults for optional fields', async () => {
      let insertedData: any = null;

      const existingCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      const insertChain = {
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data;
          return insertChain;
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-profile', ...insertedData }, error: null }),
      };

      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? existingCheck : insertChain;
      });

      const req = createMockRequest({
        method: 'POST',
        body: { display_name: 'Minimal User' },
      });

      const response = await POST(req);

      expect(response.status).toBe(200);

      // Verify defaults
      expect(insertedData.is_deaf_interpreter).toBe(false);
      expect(insertedData.open_to_mentoring).toBe(false);
      expect(insertedData.looking_for_mentor).toBe(false);
      expect(insertedData.location_country).toBe('United States');
      expect(insertedData.availability_status).toBe('available');
      expect(insertedData.languages_worked).toEqual(['ASL', 'English']);
      expect(insertedData.show_location).toBe(true);
      expect(insertedData.show_employer).toBe(false);
      expect(insertedData.is_searchable).toBe(true);
      expect(insertedData.settings_work_in).toEqual([]);
      expect(insertedData.work_settings).toEqual([]);
    });

    it('should respect explicit false values for boolean fields', async () => {
      let insertedData: any = null;

      const existingCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      const insertChain = {
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data;
          return insertChain;
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-profile', ...insertedData }, error: null }),
      };

      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? existingCheck : insertChain;
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          display_name: 'Test User',
          show_location: false,
          show_employer: false,
        },
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
      expect(insertedData.show_location).toBe(false);
      expect(insertedData.show_employer).toBe(false);
    });
  });

  // ============================================
  // PUT TESTS - UPDATE PROFILE
  // ============================================
  describe('PUT - Update Profile', () => {
    it('should update only provided fields', async () => {
      let updatedData: any = null;

      const updateChain = {
        update: vi.fn().mockImplementation((data) => {
          updatedData = data;
          return updateChain;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'profile-123', ...updatedData }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          bio: 'Updated bio only',
        },
      });

      const response = await PUT(req);

      expect(response.status).toBe(200);
      expect(updatedData).toEqual({ bio: 'Updated bio only' });
    });

    it('should sync new fields to legacy fields when updated', async () => {
      let updatedData: any = null;

      const updateChain = {
        update: vi.fn().mockImplementation((data) => {
          updatedData = data;
          return updateChain;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'profile-123', ...updatedData }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          settings_work_in: ['Medical', 'Legal', 'VRS'],
          offer_support_in: ['Deaf culture', 'ASL linguistics'],
          seeking_guidance_in: ['Conference interpreting'],
          looking_for_mentor: true,
          interpreter_certifications: ['RID CI', 'RID CT'],
        },
      });

      const response = await PUT(req);

      expect(response.status).toBe(200);

      // Verify new fields sync to legacy fields
      expect(updatedData.settings_work_in).toEqual(['Medical', 'Legal', 'VRS']);
      expect(updatedData.specialties).toEqual(['Medical', 'Legal', 'VRS']);
      expect(updatedData.offer_support_in).toEqual(['Deaf culture', 'ASL linguistics']);
      expect(updatedData.strong_domains).toEqual(['Deaf culture', 'ASL linguistics']);
      expect(updatedData.seeking_guidance_in).toEqual(['Conference interpreting']);
      expect(updatedData.weak_domains).toEqual(['Conference interpreting']);
      expect(updatedData.looking_for_mentor).toBe(true);
      expect(updatedData.seeking_mentor).toBe(true);
      expect(updatedData.interpreter_certifications).toEqual(['RID CI', 'RID CT']);
      expect(updatedData.certifications).toEqual(['RID CI', 'RID CT']);
    });

    it('should sync legacy fields to new fields when legacy is used', async () => {
      let updatedData: any = null;

      const updateChain = {
        update: vi.fn().mockImplementation((data) => {
          updatedData = data;
          return updateChain;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'profile-123', ...updatedData }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          specialties: ['Educational', 'Community'],
          strong_domains: ['K-12', 'Higher Ed'],
          weak_domains: ['Medical'],
          seeking_mentor: false,
        },
      });

      const response = await PUT(req);

      expect(response.status).toBe(200);

      // Verify legacy fields sync to new fields
      expect(updatedData.specialties).toEqual(['Educational', 'Community']);
      expect(updatedData.settings_work_in).toEqual(['Educational', 'Community']);
      expect(updatedData.strong_domains).toEqual(['K-12', 'Higher Ed']);
      expect(updatedData.offer_support_in).toEqual(['K-12', 'Higher Ed']);
      expect(updatedData.weak_domains).toEqual(['Medical']);
      expect(updatedData.seeking_guidance_in).toEqual(['Medical']);
      expect(updatedData.seeking_mentor).toBe(false);
      expect(updatedData.looking_for_mentor).toBe(false);
    });

    it('should prefer new fields over legacy when both are provided', async () => {
      let updatedData: any = null;

      const updateChain = {
        update: vi.fn().mockImplementation((data) => {
          updatedData = data;
          return updateChain;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'profile-123', ...updatedData }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          settings_work_in: ['Medical'], // New field
          specialties: ['VRS', 'Educational'], // Legacy field - should be ignored
        },
      });

      const response = await PUT(req);

      expect(response.status).toBe(200);

      // New field should win, legacy should be synced from new
      expect(updatedData.settings_work_in).toEqual(['Medical']);
      expect(updatedData.specialties).toEqual(['Medical']);
    });

    it('should update all enhanced professional fields', async () => {
      let updatedData: any = null;

      const updateChain = {
        update: vi.fn().mockImplementation((data) => {
          updatedData = data;
          return updateChain;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'profile-123', ...updatedData }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

      const req = createMockRequest({
        method: 'PUT',
        body: {
          location_city: 'Portland',
          location_state: 'Oregon',
          location_country: 'United States',
          availability_status: 'limited',
          timezone: 'America/Los_Angeles',
          languages_worked: ['ASL', 'English', 'French'],
          headline: 'Updated headline',
          professional_background: 'Updated background',
          education: 'MA in Interpreting',
          itp_program: 'Updated ITP',
          graduation_year: 2020,
          current_employer: 'New Employer',
          website_url: 'https://newsite.com',
          linkedin_url: 'https://linkedin.com/in/new',
          show_location: false,
          show_employer: true,
        },
      });

      const response = await PUT(req);

      expect(response.status).toBe(200);

      // Verify all fields are updated
      expect(updatedData.location_city).toBe('Portland');
      expect(updatedData.location_state).toBe('Oregon');
      expect(updatedData.availability_status).toBe('limited');
      expect(updatedData.graduation_year).toBe(2020);
      expect(updatedData.show_location).toBe(false);
      expect(updatedData.show_employer).toBe(true);
    });

    it('should allow updating is_searchable', async () => {
      let updatedData: any = null;

      const updateChain = {
        update: vi.fn().mockImplementation((data) => {
          updatedData = data;
          return updateChain;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'profile-123', ...updatedData }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

      const req = createMockRequest({
        method: 'PUT',
        body: { is_searchable: false },
      });

      const response = await PUT(req);

      expect(response.status).toBe(200);
      expect(updatedData.is_searchable).toBe(false);
    });

    it('should handle empty update gracefully', async () => {
      let updatedData: any = null;

      const updateChain = {
        update: vi.fn().mockImplementation((data) => {
          updatedData = data;
          return updateChain;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'profile-123' }, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

      const req = createMockRequest({
        method: 'PUT',
        body: {},
      });

      const response = await PUT(req);

      expect(response.status).toBe(200);
      expect(updatedData).toEqual({});
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('should return 500 on database error for GET', async () => {
      const errorChain = createMockSupabaseChain(null, { message: 'Database error', code: 'DB_ERR' });
      vi.mocked(supabaseAdmin.from).mockReturnValue(errorChain);

      const req = createMockRequest();
      const response = await GET(req);

      expect(response.status).toBe(500);
    });

    it('should return 500 on database error for POST', async () => {
      const existingCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };

      let callCount = 0;
      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? existingCheck : insertChain;
      });

      const req = createMockRequest({
        method: 'POST',
        body: { display_name: 'Test' },
      });

      const response = await POST(req);

      expect(response.status).toBe(500);
    });

    it('should return 500 on database error for PUT', async () => {
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

      const req = createMockRequest({
        method: 'PUT',
        body: { bio: 'Test' },
      });

      const response = await PUT(req);

      expect(response.status).toBe(500);
    });
  });
});

// ============================================
// EDGE CASES & MISSING COVERAGE DOCUMENTATION
// ============================================
/**
 * EDGE CASES NOT FULLY COVERED (Potential issues):
 *
 * 1. POST - Missing validation for:
 *    - availability_status not in enum ('available', 'limited', 'not_available', 'freelance_only', 'staff_only')
 *    - graduation_year should be a valid year (e.g., between 1900 and current year)
 *    - website_url and linkedin_url should be valid URLs
 *    - display_name length limits (empty string would pass current validation)
 *    - XSS in text fields (bio, headline, professional_background, etc.)
 *
 * 2. PUT - Missing validation:
 *    - Same as POST - no validation on updated values
 *    - Could allow invalid enum values for availability_status
 *    - No check if profile exists before updating (will silently fail with empty result)
 *
 * 3. GET - Potential issues:
 *    - SQL injection possibility in the .or() query for connections (uses string interpolation)
 *    - No pagination for connections/posts counts (minor)
 *
 * 4. Legacy field sync edge cases:
 *    - What if settings_work_in is [] but specialties has values? Current: new field wins
 *    - What if both are explicitly set to different values? Current: new field wins
 *    - certifications in PUT doesn't sync to interpreter_certifications (only reverse)
 *
 * 5. Type safety:
 *    - No runtime validation of array types (could pass string instead of string[])
 *    - graduation_year could be a string instead of number
 *
 * 6. Business logic gaps:
 *    - No maximum length on arrays (could have 1000 certifications)
 *    - No duplicate check in arrays
 *    - timezone not validated against known timezones
 *
 * RECOMMENDATIONS:
 * 1. Add Zod schema validation for all inputs
 * 2. Sanitize text inputs for XSS
 * 3. Use parameterized queries instead of string interpolation
 * 4. Add check for profile existence in PUT before updating
 * 5. Add rate limiting for profile updates
 */
