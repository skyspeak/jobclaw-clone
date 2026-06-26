export type V3SkillBar = {
  label: string;
  score: number;
  tier: "Strong" | "Solid" | "Gap";
};

export type V3JourneyPhase = {
  id: string;
  weeksLabel: string;
  title: string;
  bullets: string[];
  isFinal?: boolean;
};

export type V3JourneyStat = {
  value: string;
  label: string;
  detail: string;
};

export type V3PodMember = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  color: string;
  isUser?: boolean;
};

export type V3MentorSession = {
  number: number;
  title: string;
  description: string;
};

export type V3Analysis = {
  job: {
    title: string;
    company: string;
    location: string;
    appliedDate?: string;
    initials: string;
    sourceLabel: string;
  };
  candidate: {
    name: string;
    summary: string;
    initials: string;
    sourceLabel: string;
  };
  strengths: V3SkillBar[];
  gaps: V3SkillBar[];
  journey: V3JourneyPhase[];
  journeyStats: V3JourneyStat[];
  pod: {
    members: V3PodMember[];
    meetingDay: string;
    meetingTime: string;
    stats: { value: string; label: string }[];
    mapPositions: { memberId: string; top: string; left: string }[];
  };
  mentor: {
    initials: string;
    name: string;
    title: string;
    tags: string[];
    quote: string;
    sessions: V3MentorSession[];
    firstSessionLabel: string;
  };
};

export type V3Inputs = {
  jobUrl: string;
  linkedInUrl: string;
};
