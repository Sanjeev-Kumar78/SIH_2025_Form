# SIH 2025 Team Formation Form

A comprehensive web application for Smart India Hackathon (SIH) 2025 team formation and registration. This platform allows participants to register, showcase their skills, and form teams for the hackathon.

## Features

- **User Registration**: Complete form with personal details and skill information
- **Social Integration**: Links to GitHub, LinkedIn, and Instagram profiles
- **Team Formation**: Option to suggest team names and refer teammates
- **Real-time Validation**: Client-side form validation with user-friendly error messages
- **Email Notifications**: Automated email confirmations upon successful registration
- **Responsive Design**: Modern UI with glassmorphism effects and animations
- **Backend Integration**: Full-stack application with MongoDB database storage

## Tech Stack

### Frontend

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **React Icons** for UI icons
- **Axios** for API calls

### Backend

- **Node.js** with Express
- **MongoDB** for database
- **CORS** enabled for cross-origin requests
- **TypeScript** for type safety

## Form Fields

The registration form includes:

### Required Fields

- **Full Name**: User's complete name with validation
- **Roll Number**: Student roll number (numeric only)
- **Gender**: Male/Female selection with custom radio buttons
- **Email**: Valid email address with pattern validation
- **About**: Personal description and skills

### Optional Fields

- **GitHub Profile**: GitHub username validation
- **LinkedIn Profile**: LinkedIn profile URL validation
- **Instagram Profile**: Instagram username validation
- **Team Name**: Suggested team name for formation
- **Teammate Referral**: Name and email of referred teammate

## Getting Started

To get started with the SIH 2025 Team Formation Form, follow these steps:

### Prerequisites

Make sure you have Node.js and npm installed on your system.

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd SIH_2025_Form
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start both the frontend and backend servers concurrently:

```bash
npm run start
```

This command will:

- Start the Vite development server for the React frontend (accessible at `http://localhost:5173`)
- Start the backend server in development mode with hot reload

### Alternative Commands

- **Frontend only**: `npm run dev` - Starts only the Vite development server
- **Backend only**: `npm run backend:dev` - Starts only the backend server with hot reload
- **Build**: `npm run build` - Builds the application for production
- **Preview**: `npm run preview` - Preview the production build locally
- **Lint**: `npm run lint` - Run ESLint to check for code issues

## Environment Variables

Create a `.env` file in the root directory with the following variables:
[GOOGLE RECAPTCHA](https://www.google.com/recaptcha/admin)

```env
# Backend Configuration
VITE_BACKEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=your_database_name
MONGODB_COLLECTION_NAME=your_collection_name

# reCAPTCHA Configuration
VITE_SITE_KEY=your_recaptcha_site_key
GOOGLE_RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

```
SIH_2025_Form/
├── public/
│   └── favicon/
│       └── favicon-32.png
├── src/
│   ├── components/
│   │   ├── Form.tsx          # Main registration form
│   │   ├── Success.tsx       # Success confirmation page
│   │   ├── NavBar.tsx        # Navigation component
│   │   └── Footer.tsx        # Footer component
│   ├── services/
│   │   ├── server.ts         # Express backend server
│   │   └── data_handler.ts   # Database operations
│   ├── assets/
│   │   └── logo.webp
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # React entry point
│   └── index.css             # Global styles
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## API Endpoints

### POST /submit

Submits a new team formation registration.

**Request Body:**

```json
{
  "name": "string",
  "roll_number": "number",
  "gender": "M" | "F",
  "email": "string",
  "about": "string",
  "github_link": "string (optional)",
  "linkedin_link": "string (optional)",
  "instagram_link": "string (optional)",
  "team_name": "string (optional)",
  "referrer_name": "string (optional)",
  "referrer_email": "string (optional)"
}
```

**Response:**

- **200**: Registration successful
- **400**: Validation error
- **500**: Server error

## Features in Detail

### Form Validation

- Real-time client-side validation
- Pattern matching for URLs and email addresses
- Required field validation with custom error messages
- Cross-field validation for referrer information

### UI/UX Features

- Glassmorphism design with backdrop blur effects
- Animated floating bubbles background
- Custom radio buttons for gender selection
- Responsive grid layout
- Loading states and success feedback

### Database Integration

- MongoDB collection for storing registrations
- Automatic email sending upon successful submission
- Data validation and sanitization
- Error handling and logging

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact the development team or create an issue in the repository.

---

**Smart India Hackathon 2025** - Empowering innovation through collaborative team formation.
