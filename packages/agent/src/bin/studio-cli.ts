#!/usr/bin/env node

import { OpusClipService } from "../video/opus-clip.service";
import { PostizScheduler } from "../../../integrations/postiz/postiz.scheduler";
import { type PostizPost } from "../../../integrations/postiz/postiz.types";

const opus = new OpusClipService();
const scheduler = new PostizScheduler();

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command) {
    printHelp();
    return;
  }

  try {
    switch (command) {
      case "upload":
        const videoUrl = args[1];
        if (!videoUrl) {
          console.error("Error: Please provide a raw video URL.");
          process.exit(1);
        }
        console.log(`🚀 Submitting video to Opus Clip Studio: ${videoUrl}...`);
        const task = await opus.submitVideoForClips(videoUrl);
        console.log(`\n✅ Upload successful! Task ID: \u001b[36m${task.id}\u001b[0m`);
        console.log(`Run 'pi-agency studio status ${task.id}' to monitor highlight generation.`);
        break;

      case "status":
        const taskId = args[1];
        if (!taskId) {
          console.error("Error: Please provide a task ID.");
          process.exit(1);
        }
        console.log(`🔍 Checking status for Task: ${taskId}...`);
        const result = await opus.queryTaskStatus(taskId);
        
        console.log(`\n========================================`);
        console.log(`🎬 TASK STATUS: \u001b[32m${result.status.toUpperCase()}\u001b[0m`);
        console.log(`🔥 VIRAL INDEX: \u001b[35m${result.viralScore}%\u001b[0m`);
        console.log(`========================================`);

        if (result.clips && result.clips.length > 0) {
          result.clips.forEach((clip, index) => {
            console.log(`\n[Clip #${index + 1}] \u001b[33m${clip.title}\u001b[0m`);
            console.log(`* Viral Score: ${clip.score}/100`);
            console.log(`* Description: ${clip.description}`);
            console.log(`* Download URL: \u001b[34m${clip.downloadUrl}\u001b[0m`);
          });
          console.log(`\nRun 'pi-agency studio publish ${taskId} <clip-number>' to schedule a clip on Postiz.`);
        } else {
          console.log("No clips available yet. Check back in a few minutes.");
        }
        break;

      case "publish":
        const targetId = args[1];
        const clipNum = parseInt(args[2]);

        if (!targetId || isNaN(clipNum)) {
          console.error("Error: Please provide a valid Task ID and clip number.");
          process.exit(1);
        }

        const taskResult = await opus.queryTaskStatus(targetId);
        if (!taskResult.clips || clipNum <= 0 || clipNum > taskResult.clips.length) {
          console.error(`Error: Clip number must be between 1 and ${taskResult.clips?.length ?? 0}`);
          process.exit(1);
        }

        const targetClip = taskResult.clips[clipNum - 1];
        console.log(`📡 Repurposing highlight clip to Postiz Campaign queue...`);
        
        const postPayload: PostizPost = {
          content: `🔥 NEW HIGHLIGHT RELEASE 🔥\n\nCheck out: ${targetClip.title} - ${targetClip.description}\n\n#AIStudio #OpusClip #Automation`,
          channels: ["twitter", "linkedin"],
          mediaUrls: [targetClip.downloadUrl],
          status: "draft"
        };

        const publishResult = await scheduler.queueApprovedPosts([postPayload]);
        console.log(`\n✅ Post successfully queued inside Postiz adapter!`);
        console.log(`Status: ${publishResult[0].status.toUpperCase()}`);
        console.log(`Channel Queue: ${publishResult[0].channels?.join(", ")}`);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        break;
    }
  } catch (e) {
    console.error("Studio command failed: ", e);
  }
}

function printHelp() {
  console.log(`
=========================================
🎥 IN-HOUSE VIDEO STUDIO & OPUS CLIP CLI 🎥
=========================================
Usage: pi-agency studio <command> [options]

Commands:
  upload <url>             Submit a video URL to Opus Clip highlights engine.
  status <task-id>         Monitor task progress and print cut scene viral index details.
  publish <task-id> <num>  Queue and push a highlights clip directly into the Postiz scheduler.
  `);
}

main();
