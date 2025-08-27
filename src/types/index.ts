export interface FormData {
  name: string;
  roll_number: number;
  gender: "M" | "F";
  email: string;
  about: string;
  github_link: string | undefined;
  linkedin_link: string | undefined;
  instagram_link: string | undefined;
  team_name: string | undefined;
  referrer_name: string | undefined;
  referrer_email: string | undefined;
  captchaToken: string; // reCAPTCHA token for spam protection
}
