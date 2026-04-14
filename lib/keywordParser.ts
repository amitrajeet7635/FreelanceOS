import { Priority } from "@/lib/types";

export interface ParsedKeywords {
  priority?: Priority;
  benchFlag?: boolean;
  dmFlag?: boolean;
  followUpDate?: string;      // YYYY-MM-DD
  tags?: string[];
  cleanedNotes: string;       // notes with keywords removed
}

export function parseLeadNoteKeywords(notes: string): ParsedKeywords {
  let cleanedNotes = notes;
  let priority: Priority | undefined;
  let benchFlag: boolean | undefined;
  let dmFlag: boolean | undefined;
  let followUpDate: string | undefined;
  const tags: string[] = [];

  // Parse priority /p0 /p1 /p2 /p3
  const priorityMatch = cleanedNotes.match(/\/(p[0-3])\b/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toUpperCase() as Priority;
    cleanedNotes = cleanedNotes.replace(priorityMatch[0], '');
  } else {
    // Check for standalone p0-p3
    const rawPriorityMatch = cleanedNotes.match(/\b(p[0-3])\b/i);
    if (rawPriorityMatch) {
      priority = rawPriorityMatch[1].toUpperCase() as Priority;
      cleanedNotes = cleanedNotes.replace(/\b(p[0-3])\b/i, '');
    }
  }

  // Parse bench flag /bench
  const benchMatch = cleanedNotes.match(/\/bench\b/i);
  if (benchMatch) {
    benchFlag = true;
    cleanedNotes = cleanedNotes.replace(benchMatch[0], '');
  }

  // Parse dm flag /dm
  const dmMatch = cleanedNotes.match(/\/dm\b/i);
  if (dmMatch) {
    dmFlag = true;
    cleanedNotes = cleanedNotes.replace(dmMatch[0], '');
  }

  // Parse follow up date /follow YYYY-MM-DD
  const followMatch = cleanedNotes.match(/\/follow\s+(\d{4}-\d{2}-\d{2})\b/i);
  if (followMatch) {
    followUpDate = followMatch[1];
    cleanedNotes = cleanedNotes.replace(followMatch[0], '');
  } else {
    // Check for natural language dates
    const naturalDateMatch = cleanedNotes.match(/\b(tod(?:ay)?|tom(?:orrow)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i);
    if (naturalDateMatch) {
      const token = naturalDateMatch[1].toLowerCase();
      const today = new Date();
      let target = new Date();
      
      if (token.startsWith('tod')) {
        target = today;
      } else if (token.startsWith('tom')) {
        target.setDate(today.getDate() + 1);
      } else {
        const days = ['sun','mon','tue','wed','thu','fri','sat'];
        const targetDayIdx = days.findIndex(d => token.startsWith(d));
        if (targetDayIdx !== -1) {
          const currentDay = today.getDay();
          let diff = targetDayIdx - currentDay;
          if (diff <= 0) diff += 7; // get next occurrence of this weekday
          target.setDate(today.getDate() + diff);
        }
      }
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      followUpDate = `${yyyy}-${mm}-${dd}`;
      cleanedNotes = cleanedNotes.replace(naturalDateMatch[0], '');
    }
  }

  // Parse tags /tag name
  const tagRegex = /\/tag\s+([a-zA-Z0-9_-]+)\b/gi;
  let match;
  while ((match = tagRegex.exec(cleanedNotes)) !== null) {
    tags.push(match[1]);
  }
  cleanedNotes = cleanedNotes.replace(tagRegex, '');

  return {
    priority,
    benchFlag,
    dmFlag,
    followUpDate,
    tags: tags.length > 0 ? tags : undefined,
    cleanedNotes: cleanedNotes.replace(/\s+/g, ' ').trim()
  };
}
