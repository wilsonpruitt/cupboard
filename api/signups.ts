import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../lib/supabase.js';
import { getResend, FROM_EMAIL } from '../lib/resend.js';
import { confirmationEmail, cancellationEmail } from '../lib/emails.js';
import { requireAuth, isValidUUID } from './_lib/require-auth.js';
import { DEFAULT_TENANT_ID } from './_lib/tenant.js';

interface SignupBody {
  signupId: string;
  volunteerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  date: string;
  dayOfWeek: string;
  role?: string;
  recurringDays?: string[];
  recurringSlots?: string[];
}

interface CancelBody {
  cancel: true;
  signupId?: string;
  volunteerId: string;
  date: string;
  dayOfWeek: string;
}

// Merged with the former api/signups/cancel.ts to stay under the Hobby plan's
// 12-serverless-function cap — dispatch on body.cancel rather than a second file.
async function handleCancel(req: VercelRequest, res: VercelResponse) {
  const body = req.body as CancelBody;
  const { signupId, volunteerId, date, dayOfWeek } = body;

  if (!volunteerId || !date || !dayOfWeek) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isValidUUID(volunteerId) || (signupId && !isValidUUID(signupId))) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (signupId) {
    // Delete the one-off signup
    await getSupabase().from('signups').delete().eq('id', signupId);
  } else {
    // Recurring excuse — upsert a cancelled record
    await getSupabase().from('signups').upsert({
      id: crypto.randomUUID(),
      volunteer_id: volunteerId,
      date,
      day_of_week: dayOfWeek,
      status: 'cancelled',
      created_at: new Date().toISOString(),
    });
  }

  // Send cancellation email if volunteer has email
  let emailSent = false;
  const { data: volunteer } = await getSupabase()
    .from('volunteers')
    .select('first_name, email')
    .eq('id', volunteerId)
    .single();

  if (volunteer?.email) {
    const { subject, html } = cancellationEmail(volunteer.first_name, date, dayOfWeek);
    const { error: emailError } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: volunteer.email,
      subject,
      html,
    });
    emailSent = !emailError;
  }

  return res.status(200).json({ ok: true, emailSent });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAuth(req, res)) return;

  if ((req.body as { cancel?: boolean })?.cancel) {
    try {
      return await handleCancel(req, res);
    } catch (err) {
      console.error('Cancel API error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  try {
    const body = req.body as SignupBody;
    const { signupId, volunteerId, firstName, lastName, email, date, dayOfWeek, role, recurringDays, recurringSlots } = body;

    if (!volunteerId || !firstName || !date || !dayOfWeek) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidUUID(volunteerId) || (signupId && !isValidUUID(signupId))) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Upsert volunteer. tenant_id is NOT NULL post-migration; omitting it makes
    // the insert fail (23502) — check the error instead of swallowing it.
    const { error: volError } = await getSupabase().from('volunteers').upsert({
      id: volunteerId,
      tenant_id: DEFAULT_TENANT_ID,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      recurring_days: recurringDays || [],
      recurring_slots: recurringSlots || [],
      synced_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (volError) {
      console.error('Signup API: volunteer upsert failed:', volError);
      return res.status(500).json({ error: 'Could not save volunteer' });
    }

    // Upsert signup
    const { error: signupError } = await getSupabase().from('signups').upsert({
      id: signupId,
      tenant_id: DEFAULT_TENANT_ID,
      volunteer_id: volunteerId,
      date,
      day_of_week: dayOfWeek,
      role: role || null,
      status: 'signed-up',
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (signupError) {
      console.error('Signup API: signup upsert failed:', signupError);
      return res.status(500).json({ error: 'Could not save signup' });
    }

    // Send confirmation email if volunteer has email
    let emailSent = false;
    if (email) {
      const { subject, html } = confirmationEmail(firstName, date, dayOfWeek, role);
      const { error: emailError } = await getResend().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
      });

      if (!emailError) {
        emailSent = true;
        // Record notification for dedup
        await getSupabase().from('notifications').insert({
          volunteer_id: volunteerId,
          session_date: date,
          type: 'confirmation',
        });
      }
    }

    return res.status(200).json({ ok: true, emailSent });
  } catch (err) {
    console.error('Signup API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
