(() => {
  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const lessonIndex = Number(window.prompt("Lesson number?", "1") || "1");
  const moduleTitle = window.prompt("Module title?", "") || "";
  const courseTitle = window.prompt("Course title?", "AI Automation Circle") || "AI Automation Circle";
  const courseId = window.prompt("Course ID?", "the-ai-automation-circle") || "the-ai-automation-circle";
  const lessonTitle = normalize(document.querySelector("h1, h2, [data-testid*='title']")?.textContent) || document.title;
  const courseComplete = window.confirm("Is this the final lesson in the classroom?");

  const blockedSelectors = ["script", "style", "nav", "header", "footer", "button", "input", "textarea"];
  const clone = document.body.cloneNode(true);
  for (const selector of blockedSelectors) {
    clone.querySelectorAll(selector).forEach((node) => node.remove());
  }

  const text = normalize(clone.innerText || clone.textContent || "");
  const snapshot = {
    courseId,
    courseTitle,
    moduleTitle: moduleTitle || undefined,
    lessonIndex,
    lessonTitle,
    url: window.location.href,
    capturedAt: new Date().toISOString(),
    text,
    courseComplete,
  };

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lesson-${String(lessonIndex).padStart(3, "0")}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  console.log("Captured current lesson locally. Move the downloaded JSON into skool-study/input/.");
})();
