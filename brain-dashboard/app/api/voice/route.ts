import { NextRequest, NextResponse } from 'next/server'
import { resolveEnvValue, runMercuryChat } from '@/lib/mercury'

export async function POST(req: NextRequest) {
  try {
    const openAiKey = resolveEnvValue('OPENAI_API_KEY')
    if (!openAiKey) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY for transcription and speech generation' },
        { status: 503 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const pageTitle = String(formData.get('pageTitle') ?? 'Mercury Control Panel')
    const contextAnalogy = String(formData.get('contextAnalogy') ?? '')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'audio file required' }, { status: 400 })
    }

    const transcriptionForm = new FormData()
    transcriptionForm.append('file', file)
    transcriptionForm.append('model', 'whisper-1')

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openAiKey}` },
      body: transcriptionForm,
    })

    const transcription = await transcriptionResponse.json().catch(() => ({}))
    if (!transcriptionResponse.ok) {
      const detail = typeof transcription?.error?.message === 'string'
        ? transcription.error.message
        : transcriptionResponse.statusText
      return NextResponse.json({ error: `Transcription failed: ${detail}` }, { status: 502 })
    }

    const transcribedText = typeof transcription?.text === 'string' ? transcription.text.trim() : ''
    if (!transcribedText) {
      return NextResponse.json({ error: 'No speech detected' }, { status: 422 })
    }

    const response = await runMercuryChat(
      [
        {
          role: 'user',
          content: [
            `Current page: ${pageTitle}`,
            `Page context: ${contextAnalogy}`,
            `User said: ${transcribedText}`,
            'Reply conversationally in three short sentences or fewer.',
          ].join('\n'),
        },
      ],
      'mercury-voice',
      'You are Mercury, a concise voice agent for an operator control panel.'
    )

    const speechResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'shimmer',
        input: response.reply,
      }),
    })

    if (!speechResponse.ok) {
      const data = await speechResponse.json().catch(() => ({}))
      const detail = typeof data?.error?.message === 'string' ? data.error.message : speechResponse.statusText
      return NextResponse.json({ error: `Speech generation failed: ${detail}` }, { status: 502 })
    }

    const audio = await speechResponse.arrayBuffer()
    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audio.byteLength),
        'X-Transcript': encodeURIComponent(transcribedText.slice(0, 180)),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Voice route failure'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
