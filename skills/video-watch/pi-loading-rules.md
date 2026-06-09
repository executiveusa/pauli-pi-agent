# PI Loading Rules

## Skill Identity

```yaml
skill_name: video-watch
display_name: Video Watch Skill
slash_command: /video-watch
owner_agent: PI
status: active
mode: lazy_load
branch: claude/video-watch-skill-mh0v6q
canonical_folder: skills/video-watch/
future_subagent_name: VideoWatchAgent
```

## When PI Should Load This Skill

Load this skill when:

1. User provides a YouTube, Vimeo, Loom, Wistia, or direct video URL
2. User says "watch", "analyze", "summarize", or "review" in reference to a video
3. User asks about a video's hook, structure, virality, or storytelling
4. User asks PI to extract notes, takeaways, or a transcript from a video
5. User wants to analyze a competitor's video, ad, demo, or pitch
6. User wants to review a tutorial, course, or technical walkthrough
7. User shares a video to support a business, research, or content task
8. User asks "what is this video about" with a URL

## When PI Should NOT Load This Skill

Do not load this skill for:

- Tasks that mention video production or video generation (use video generation tools instead)
- General text or document summarization without a video URL
- Audio-only files without a video component
- Questions about video editing software unrelated to content analysis
- Generic chat without a video URL or clear reference to video content

## PI Execution Pattern

1. User provides a video URL (and optionally a question, time range, or analysis mode).
2. PI detects the video URL and loads this skill.
3. PI runs the workflow from `workflow.md`.
4. PI selects the appropriate analysis mode based on user intent.
5. PI retrieves transcript or captions; falls back to audio transcription or frame analysis.
6. PI answers the user's question using the retrieved content.
7. PI returns the structured output in the default format (or a format the user specified).
8. PI optionally saves the output to `factory/video-watch/` or the relevant client folder.

## Skill Output Contract

Every completed run should produce:

1. Video metadata (URL, title, creator, duration)
2. Summary
3. Key points
4. Notable timestamps (when available)
5. Direct answer to the user's question
6. Strategic notes or recommendations (when applicable)
7. Limitations (when transcript, audio, or frames were unavailable)
