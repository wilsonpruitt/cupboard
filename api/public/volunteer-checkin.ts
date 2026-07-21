import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../../lib/supabase.js';
import { DEFAULT_TENANT_ID } from '../_lib/tenant.js';

interface VolunteerMatch {
  id: string;
  firstName: string;
  lastName: string;
}

interface CheckInBody {
  volunteerId?: string;
  firstName?: string;
  lastName?: string;
  date: string;
  dayOfWeek: string;
  website?: string; // honeypot
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabase = getSupabase();

  // ---- Search existing volunteers by name (typeahead) ----
  if (req.method === 'GET') {
    const raw = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 50) : '';
    // Strip PostgREST filter metacharacters (, ( ) . * %) so the search term
    // can't break out of the .or() clause and alter the query's logic.
    const q = raw.replace(/[,().*%\\]/g, '');
    if (q.length < 2) {
      return res.status(200).json({ ok: true, matches: [] });
    }

    const { data, error } = await supabase
      .from('volunteers')
      .select('id, first_name, last_name')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .order('last_name')
      .limit(8);

    if (error) {
      console.error('Volunteer check-in search error:', error);
      return res.status(500).json({ error: 'Search failed. Please try again.' });
    }

    const matches: VolunteerMatch[] = (data || []).map((v) => ({
      id: v.id as string,
      firstName: v.first_name as string,
      lastName: v.last_name as string,
    }));

    return res.status(200).json({ ok: true, matches });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as CheckInBody;

    // Honeypot — silently succeed
    if (body.website) {
      return res.status(200).json({ ok: true, alreadyCheckedIn: false });
    }

    if (!body.date || !body.dayOfWeek) {
      return res.status(400).json({ error: 'date and dayOfWeek are required' });
    }

    const now = new Date().toISOString();
    let volunteerId = body.volunteerId;

    if (!volunteerId) {
      const firstName = body.firstName?.trim();
      const lastName = body.lastName?.trim();
      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'firstName and lastName are required' });
      }

      volunteerId = crypto.randomUUID();
      const { error: volError } = await supabase.from('volunteers').insert({
        id: volunteerId,
        tenant_id: DEFAULT_TENANT_ID,
        first_name: firstName,
        last_name: lastName,
        recurring_days: [],
        recurring_slots: [],
        synced_at: now,
      });
      if (volError) {
        console.error('Volunteer check-in: volunteer insert failed:', volError);
        return res.status(500).json({ error: 'Could not save check-in. Please try again.' });
      }
    }

    // Dedup: already checked in today → treat as success, not an error
    const { data: existingShift } = await supabase
      .from('pantry_volunteer_shifts')
      .select('id')
      .eq('volunteer_id', volunteerId)
      .eq('date', body.date)
      .limit(1) as { data: Array<{ id: string }> | null };

    if (existingShift && existingShift.length > 0) {
      return res.status(200).json({ ok: true, alreadyCheckedIn: true });
    }

    const { error: shiftError } = await supabase.from('pantry_volunteer_shifts').insert({
      id: crypto.randomUUID(),
      tenant_id: DEFAULT_TENANT_ID,
      volunteer_id: volunteerId,
      date: body.date,
      day_of_week: body.dayOfWeek,
      updated_at: now,
    });

    if (shiftError) {
      console.error('Volunteer check-in: shift insert failed:', shiftError);
      return res.status(500).json({ error: 'Could not save check-in. Please try again.' });
    }

    return res.status(200).json({ ok: true, alreadyCheckedIn: false });
  } catch (err) {
    console.error('Volunteer check-in error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
