(() => {
  const courseId = prompt("Course ID", "the-ai-automation-circle");
  if (!courseId) throw new Error("Course ID is required");

  const courseTitle = prompt("Course title", document.title.replace(/\s*[-|].*$/, "").trim() || "Skool Course");
  if (!courseTitle) throw new Error("Course title is required");

  const currentUrl = new URL(location.href);
  const anchors = [...document.querySelectorAll("a[href]")];
  const seen = new Set();
  const lessons = [];

  for (const anchor of anchors) {
    const href = anchor.href;
    if (!href || !href.includes("/classroom/")) continue;
    if (href === currentUrl.href || seen.has(href)) continue;

    const lessonTitle = (anchor.textContent || "").replace(/\s+/g, " ").trim();
    if (!lessonTitle) continue;

    seen.add(href);
    lessons.push({
      lessonIndex: lessons.length + 1,
      lessonTitle,
      url: href,
    });
  }

  if (lessons.length === 0) {
    throw new Error("No lesson links were found in the current classroom DOM. Make sure the classroom lesson list is visible.");
  }

  const confirmed = confirm(
    `Found ${lessons.length} lesson links.\n\nReview the visible classroom list before continuing.\n\nCreate course-manifest.json?`,
  );
  if (!confirmed) return;

  const manifest = {
    schemaVersion: "1.0",
    courseId,
    courseTitle,
    classroomUrl: `${currentUrl.origin}${currentUrl.pathname}`,
    capturedAt: new Date().toISOString(),
    lessons,
  };

  const blob = new Blob([`${JSON.stringify(manifest, null, 2)}\n`], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "course-manifest.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
})();
