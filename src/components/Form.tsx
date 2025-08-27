import { useForm } from "react-hook-form";
import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa";
import { RiTeamFill } from "react-icons/ri";
import axios from "axios";
import Success from "./Success";
import { useState } from "react";
import { IoMdFemale, IoMdMale } from "react-icons/io";
import { type FormData } from "../types";
import { executeRecaptcha } from "../utils/recaptcha";

const Form = () => {
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

    try {
      setIsSubmitting(true);

      // Get reCAPTCHA token
      const captchaToken = await executeRecaptcha("submit");

      // Add captcha token to form data
      const formDataWithCaptcha = {
        ...data,
        captchaToken,
      };

      await axios.post<string>(`${backendUrl}/submit`, formDataWithCaptcha);
      setIsSuccessful(true); // Show success component
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const backendMsg =
          (error.response.data as { message?: string; error?: string })
            .message ||
          (error.response.data as { message?: string; error?: string }).error ||
          error.message;
        console.error(new Error(backendMsg));
        alert(`Error submitting data: ${backendMsg}`);
      } else if (error instanceof Error) {
        console.error("Error submitting data:", error);
        alert(`Error submitting data: ${error.message}`);
      } else {
        console.error("Error submitting data:", error);
        alert("An unexpected error occurred while submitting the form");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccessful(false);
    reset();
  };

  // Show success component if submitted successfully
  if (isSuccessful) {
    return <Success onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen py-8 px-4 relative w-full h-full bg-gradient-to-b from-blue-350 to-black overflow-hidden">
      {/* Bubble an */}
      <ul className="absolute inset-0 list-none m-0 p-0 z-0">
        <li
          className="absolute bg-white/10 w-[120px] h-[120px] left-[20%] bottom-[-150px] float-shape rounded-full"
          style={{
            animationDelay: "2.8s",
            transform: "scale(5.5)",
          }}
        ></li>
        <li
          className="absolute bg-white/15 w-[80px] h-[80px] left-[8%] bottom-[-150px] float-shape rounded-full"
          style={{
            animationDelay: "4.2s",
            animationDuration: "8s",

            transform: "scale(3.8)",
          }}
        ></li>
        <li
          className="absolute bg-white/12 w-[200px] h-[200px] left-[78%] bottom-[-150px] float-shape rounded-full"
          style={{
            animationDelay: "1.8s",
            animationDuration: "9s",

            transform: "scale(8.2)",
          }}
        ></li>
        <li
          className="absolute bg-white/8 w-[60px] h-[60px] left-[15%] bottom-[-150px] float-shape rounded-full"
          style={{
            animationDelay: "0.5s",
            animationDuration: "7.5s",

            transform: "scale(2.8)",
          }}
        ></li>
        <li
          className="absolute bg-white/20 w-[150px] h-[150px] left-[92%] bottom-[-150px] float-shape rounded-full"
          style={{ animationDelay: "0s", animationDuration: "7s" }}
        ></li>
        <li
          className="absolute bg-white/20 w-[40px] h-[40px] left-[85%] bottom-[-150px] float-shape rounded-full"
          style={{ animationDelay: "3s" }}
        ></li>
        <li
          className="absolute bg-white/20 w-[110px] h-[110px] left-[2%] bottom-[-150px] float-shape rounded-full"
          style={{ animationDelay: "1.5s" }}
        ></li>
      </ul>

      {/* Form Container */}
      <div className="bg-white/10 backdrop-blur-md max-w-3xl mx-auto rounded-xl shadow-2xl border border-white/20 backdrop-saturate-120">
        <div className="rounded-t-xl p-6">
          <h1 className="text-3xl font-bold text-white text-center">
            Registration Form
          </h1>
          <p className="text-blue-100 text-center mt-2">
            Please fill in all required fields
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="grid md:grid-cols-2 gap-6 ">
            {/* Name Field */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-semibold mb-2 "
              >
                Full Name *
              </label>
              <input
                className={`form-input ${errors.name ? "error" : ""}`}
                id="name"
                type="text"
                placeholder="Enter your full name"
                {...register("name", {
                  required: "Name is required",
                  pattern: {
                    value: /^[a-zA-Z\s]*$/,
                    message: "Name must only contain letters and spaces",
                  },
                })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.name.message as string}
                </p>
              )}
            </div>

            {/* Roll Number Field */}
            <div>
              <label
                htmlFor="roll_number"
                className="block text-sm font-semibold mb-2"
              >
                Roll Number *
              </label>
              <input
                className={`form-input ${errors.roll_number ? "error" : ""}`}
                id="roll_number"
                type="text" // avoid browser scientific notation input
                inputMode="numeric" // mobile numeric keypad
                pattern="[0-9]*"
                placeholder="Enter your roll number"
                {...register("roll_number", {
                  required: "Roll Number is required",
                  setValueAs: (v) => {
                    const digits = String(v ?? "").replace(/\D/g, "");
                    return digits === "" ? undefined : parseInt(digits, 10);
                  },
                  validate: (v) => {
                    if (typeof v !== "number" || !Number.isInteger(v)) {
                      return "Roll Number must be an integer";
                    }
                    if (v <= 0) return "Roll Number must be greater than 0";
                    return true;
                  },
                })}
                onKeyDown={(e) => {
                  // allow only digits and editing/navigation keys
                  const allowed = [
                    "Backspace",
                    "Tab",
                    "ArrowLeft",
                    "ArrowRight",
                    "Delete",
                    "Home",
                    "End",
                  ];
                  if (!/^\d$/.test(e.key) && !allowed.includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onInput={(e) => {
                  // strip any non-digits if the browser injects them
                  const t = e.target as HTMLInputElement;
                  const cleaned = t.value.replace(/\D/g, "");
                  if (t.value !== cleaned) t.value = cleaned;
                }}
                onPaste={(e) => {
                  // sanitize pasted content to digits only
                  e.preventDefault();
                  const paste =
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (e.clipboardData || (window as any).clipboardData).getData(
                      "text"
                    );
                  const digits = paste.replace(/\D/g, "");
                  const target = e.target as HTMLInputElement;
                  const start = target.selectionStart ?? target.value.length;
                  const end = target.selectionEnd ?? target.value.length;
                  const newVal =
                    target.value.slice(0, start) +
                    digits +
                    target.value.slice(end);
                  target.value = newVal.replace(/\D/g, "");
                  target.dispatchEvent(new Event("input", { bubbles: true }));
                }}
              />
              {errors.roll_number && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.roll_number.message as string}
                </p>
              )}
            </div>

            {/* Gender Option */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                htmlFor="gender"
              >
                Gender *
              </label>
              <div className="flex gap-12 items-center mb-4">
                {/* Male */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="M"
                    {...register("gender", { required: "Gender is required" })}
                    className="hidden peer"
                    aria-label="Male"
                  />
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all
                      peer-checked:border-blue-500 peer-checked:bg-blue-100 peer-checked:text-blue-600 peer-checked:shadow-[0_0_12px_3px_rgba(59,130,246,0.6)]
                      border-gray-400 bg-white text-gray-500"
                  >
                    <span className="text-3xl font-bold">
                      <IoMdMale />
                    </span>
                  </div>
                </label>

                {/* Female */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="F"
                    {...register("gender", { required: "Gender is required" })}
                    className="hidden peer"
                    aria-label="Female"
                  />
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all
                      peer-checked:border-pink-500 peer-checked:bg-pink-100 peer-checked:text-pink-600 peer-checked:shadow-[0_0_12px_3px_rgba(236,72,153,0.6)]
                      border-gray-400 bg-white text-gray-500"
                  >
                    <span className="text-3xl font-bold">
                      <IoMdFemale />
                    </span>
                  </div>
                </label>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.gender.message as string}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
              >
                Email Address *
              </label>
              <input
                className={`form-input ${errors.email ? "error" : ""}`}
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid email format",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email.message as string}
                </p>
              )}
            </div>
          </div>

          {/* About Field */}
          <div className="mt-6">
            <label htmlFor="about" className="block text-sm font-semibold mb-2">
              About Yourself *
            </label>
            <textarea
              className={`form-input resize-vertical ${
                errors.about ? "error" : ""
              }`}
              id="about"
              rows={4}
              placeholder="Tell us about yourself, your interests, and skills..."
              {...register("about", {
                required: "About is required",
              })}
            />
            {errors.about && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.about.message as string}
              </p>
            )}
          </div>

          {/* Social Links Section */}
          <div className="mt-8 rounded-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <span className="mr-2">🔗</span>
              Social Links
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* GitHub Link */}
              <div>
                <label
                  htmlFor="github_link"
                  className="block text-sm font-semibold mb-2"
                >
                  <FaGithub className="inline mr-1 mb-1" />
                  GitHub Profile
                </label>
                <input
                  className={`form-input ${errors.github_link ? "error" : ""}`}
                  id="github_link"
                  type="url"
                  placeholder="https://github.com/username"
                  {...register("github_link", {
                    pattern: {
                      value:
                        /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
                      message: "Invalid GitHub URL format",
                    },
                  })}
                />
                {errors.github_link && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.github_link.message as string}
                  </p>
                )}
              </div>

              {/* LinkedIn Link */}
              <div>
                <label
                  htmlFor="linkedin_link"
                  className="block text-sm font-semibold mb-2"
                >
                  <FaLinkedin className="inline mr-1 mb-1" />
                  LinkedIn Profile
                </label>
                <input
                  className={`form-input ${
                    errors.linkedin_link ? "error" : ""
                  }`}
                  id="linkedin_link"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  {...register("linkedin_link", {
                    pattern: {
                      value:
                        /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
                      message: "Invalid LinkedIn URL format",
                    },
                  })}
                />
                {errors.linkedin_link && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.linkedin_link.message as string}
                  </p>
                )}
              </div>

              {/* Instagram Link */}
              <div className="md:col-span-2">
                <label
                  htmlFor="instagram_link"
                  className="block text-sm font-semibold mb-2"
                >
                  <FaInstagram className="inline mr-1 mb-1" />
                  Instagram Profile
                </label>
                <input
                  className={`form-input ${
                    errors.instagram_link ? "error" : ""
                  }`}
                  id="instagram_link"
                  type="url"
                  placeholder="https://instagram.com/username"
                  {...register("instagram_link", {
                    pattern: {
                      value:
                        /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.-]+\/?$/,
                      message: "Invalid Instagram URL format",
                    },
                  })}
                />
                {errors.instagram_link && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.instagram_link.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Team and Referrer Section */}
          <div className="mt-8 rounded-lg">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <span className="mr-2">👥</span>
              Additional Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Team Name */}
              <div>
                <label htmlFor="team_name" className="block text-sm mb-2">
                  <RiTeamFill className="inline mr-1 mb-1" />
                  Team Name
                </label>
                <input
                  className="form-input"
                  id="team_name"
                  type="text"
                  placeholder="Suggest a team name (optional)"
                  {...register("team_name")}
                />
              </div>

              {/* Referrer Name */}
              <div>
                <label
                  htmlFor="referrer_name"
                  className="block text-sm font-semibold mb-2"
                >
                  Refer a Teammate Name (optional)
                </label>
                <input
                  className="form-input"
                  id="referrer_name"
                  type="text"
                  placeholder="Anyone who you would refer? (optional)"
                  {...register("referrer_name", {
                    validate: (value, allValues) => {
                      if (
                        allValues.referrer_email &&
                        allValues.referrer_email.trim() !== "" &&
                        (!value || value.trim() === "")
                      ) {
                        return "Name is required when teammate email is provided";
                      }
                      return true;
                    },
                  })}
                />
                {errors.referrer_name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.referrer_name.message as string}
                  </p>
                )}
              </div>

              {/* Referrer Email */}
              <div className="md:col-span-2">
                <label
                  htmlFor="referrer_email"
                  className="block text-sm font-semibold mb-2"
                >
                  Refer a Teammate Email
                </label>
                <input
                  className={`form-input mb-3 ${
                    errors.referrer_email ? "error" : ""
                  }`}
                  id="referrer_email"
                  type="email"
                  placeholder="Email address of the person you are referring"
                  {...register("referrer_email", {
                    pattern: {
                      value: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Invalid email format",
                    },
                    validate: (value, allValues) => {
                      if (
                        allValues.referrer_name &&
                        allValues.referrer_name.trim() !== "" &&
                        (!value || value.trim() === "")
                      ) {
                        return "Email is required when teammate name is provided";
                      }
                      return true;
                    },
                  })}
                />
                {errors.referrer_email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.referrer_email.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`relative justify-self-center 
          items-start px-6 py-3 text-white text-base font-semibold tracking-wide rounded-xl overflow-hidden bg-transparent border-none cursor-pointer block group mt-4 ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          >
            <span
              className="absolute inset-0 bg-[#0f34ef] rounded-xl transition-all duration-400 ease-in-out 
            group-hover:backdrop-blur-2xl 
            group-hover:scale-110 group-hover:translate-x-[5%] group-hover:translate-y-[50%] z-[-2]"
            ></span>
            <span className="absolute bottom-0 right-0 w-9 h-9 bg-white/10 backdrop-blur-md rounded-full transition-all duration-400 ease-in-out group-hover:w-full group-hover:h-full group-hover:rounded-xl group-hover:translate-x-0 group-hover:translate-y-0 translate-x-[10px] translate-y-[10px] z-[-1]"></span>
            {isSubmitting ? "🔄 Submitting..." : "🚀 Submit Registration"}
          </button>

          {/* reCAPTCHA Notice */}
          <div className="text-center mt-4">
            <p className="text-xs text-blue-200/70">
              This site is protected by reCAPTCHA and the Google{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-100"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-100"
              >
                Terms of Service
              </a>{" "}
              apply.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;
