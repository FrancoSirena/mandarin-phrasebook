import { NextResponse } from 'next/server';
import { VOICES } from '@/lib/audio-map';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json({
    voices: VOICES.map((v) => ({ id: v.id, label: v.label, gender: v.gender, description: v.description, default: !!v.default }))
  });
}
