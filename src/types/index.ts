// Shared types for the application
export interface FormData {
  name: string;
  roll_number: number;
  gender: "M" | "F";
  email: string;
  about: string;
  github_link: string | undefined;
  instagram_link: string | undefined;
  linkedin_link: string | undefined;
  team_name: string;
  school_name: string;
  teacher_name: string;
  teacher_phone_number: number;
  teacher_email: string;
  problem_statement: string;
  tech_stack: string[];
  submission_link: string;
  referrer_name: string | undefined;
  referrer_email: string | undefined;
}
