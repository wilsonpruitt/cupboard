import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../../lib/supabase.js';
import { getResend, FROM_EMAIL } from '../../lib/resend.js';
import { publicConfirmationEmail } from '../../lib/emails.js';
import { DEFAULT_TENANT_ID } from '../_lib/tenant.js';

interface SignupDate {
  date: string;
  dayOfWeek: string;
}

interface PublicSignupBody {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  dates: SignupDate[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight (headers set by vercel.json)
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as PublicSignupBody;
    const { firstName, lastName, email, phone, role, dates } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'At least one date is required' });
    }

    if (dates.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 dates per submission' });
    }

    // Honeypot check — if present in body, silently succeed
    if ((body as unknown as Record<string, unknown>).website) {
      return res.status(200).json({ ok: true, emailSent: false, volunteerId: null, signupCount: 0 });
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();

    // ---- Volunteer dedup by email (case-insensitive) ----
    const emailLower = email.toLowerCase();
    const { data: existing } = await supabase
      .from('volunteers')
      .select('id')
      .ilike('email', emailLower)
      .limit(1) as { data: Array<{ id: string }> | null };

    let volunteerId: string;

    if (existing && existing.length > 0) {
      // Update existing volunteer
      volunteerId = existing[0].id;
      await supabase.from('volunteers').update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        synced_at: now,
      }).eq('id', volunteerId);
    } else {
      // Create new volunteer
      volunteerId = crypto.randomUUID();
      const { error: volError } = await supabase.from('volunteers').insert({
        id: volunteerId,
        tenant_id: DEFAULT_TENANT_ID,
        first_name: firstName,
        last_name: lastName,
        email: emailLower,
        phone: phone || null,
        recurring_days: [],
        recurring_slots: [],
        synced_at: now,
      });
      // A dropped volunteer means every signup below would be orphaned, and the
      // confirmation email would lie. Fail loudly instead — the tenancy migration
      // once broke this path silently (missing tenant_id → 23502, ignored).
      if (volError) {
        console.error('Public signup: volunteer insert failed:', volError);
        return res.status(500).json({ error: 'Could not save signup. Please try again.' });
      }
    }

    // ---- Create signups (dedup by volunteer+date) ----
    let signupCount = 0;
    let signupFailed = 0;

    for (const d of dates) {
      // Check for existing signup
      const { data: existingSignup } = await supabase
        .from('signups')
        .select('id')
        .eq('volunteer_id', volunteerId)
        .eq('date', d.date)
        .limit(1) as { data: Array<{ id: string }> | null };

      if (existingSignup && existingSignup.length > 0) {
        continue; // Skip duplicate
      }

      const { error: signupError } = await supabase.from('signups').insert({
        id: crypto.randomUUID(),
        tenant_id: DEFAULT_TENANT_ID,
        volunteer_id: volunteerId,
        date: d.date,
        day_of_week: d.dayOfWeek,
        role: role || null,
        status: 'signed-up',
        created_at: now,
      });
      if (signupError) {
        console.error('Public signup: signup insert failed for', d.date, signupError);
        signupFailed++;
        continue;
      }
      signupCount++;
    }

    // If every date failed to persist, don't send a "you're confirmed" email —
    // that was the old silent-failure behavior. Surface it so the volunteer retries.
    if (signupCount === 0 && signupFailed > 0) {
      return res.status(500).json({ error: 'Could not save signup. Please try again.' });
    }

    // ---- Send single confirmation email ----
    let emailSent = false;
    const { subject, html } = publicConfirmationEmail(firstName, dates, role);

    try {
      const { error: emailError } = await getResend().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
      });
      if (!emailError) emailSent = true;
    } catch {
      // Email failure is non-fatal
    }

    return res.status(200).json({ ok: true, emailSent, volunteerId, signupCount });
  } catch (err) {
    console.error('Public signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
