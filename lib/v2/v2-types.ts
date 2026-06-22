export type V2SkillBar = {
  label: string;
  score: number;
  tier: "Strong" | "Solid" | "Gap";
};

export type V2JourneyPhase = {
  id: string;
  weeksLabel: string;
  title: string;
  bullets: string[];
  isFinal?: boolean;
};

export type V2PodMember = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  color: string;
  isUser?: boolean;
};

export type V2MentorSession = {
  number: number;
  title: string;
  description: string;
};

export type V2Analysis = {
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
  strengths: V2SkillBar[];
  gaps: V2SkillBar[];
  journey: V2JourneyPhase[];
  pod: {
    members: V2PodMember[];
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
    sessions: V2MentorSession[];
    firstSessionLabel: string;
  };
};

export type V2Inputs = {
  jobUrl: string;
  linkedInUrl: string;
};
