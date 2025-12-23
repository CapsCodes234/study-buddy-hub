# Study Tracker (Study Buddy Hub)

A personal, local-first study tracking application with AI-powered syllabus extraction, past paper logging, and exam countdown features.

## Features

- **AI-Powered Syllabus Extraction**: Upload PDF syllabi and extract structured topics automatically
- **Past Paper Logging**: Track raw marks with automatic percentage conversion
- **Exam Countdown**: Schedule exams and get reminders
- **Progress Tracking**: Visual progress for each subject and topic
- **Theme Support**: Light, dark, and system themes with accessibility features

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

## AI Extraction Setup

This app supports AI-powered syllabus extraction from PDF files. The AI features are **read-only and advisory** - no data is saved until you explicitly confirm.

### Environment Variables

Create a `.env.local` file in the project root:

```env
# AI Provider: 'openrouter' (default) or 'openai'
VITE_AI_PROVIDER=openrouter

# Your API key
VITE_AI_API_KEY=your_api_key_here
```

### Supported Providers

1. **OpenRouter (default)**: Recommended for cost-effective AI usage
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Uses `google/gemini-2.0-flash-001` model by default
   - Set a monthly credit limit to control costs

2. **OpenAI**: Higher-capacity models
   - Set `VITE_AI_PROVIDER=openai`
   - Uses `gpt-4o-mini` by default
   - Get API key from [platform.openai.com](https://platform.openai.com)

3. **Mock Provider**: For development without API keys
   - Set `VITE_AI_PROVIDER=mock`
   - Returns sample extraction data

### How to Use PDF Extraction Safely

1. **Upload**: Drag & drop or select a PDF syllabus file
2. **Review**: The extraction modal shows detected topics with confidence scores
3. **Edit**: Modify, merge, or split topics as needed
4. **Accept**: Only after clicking "Save" is data written to your app
5. **Changelog**: Original extractions are preserved for re-review

### Cost Safeguards

- **Set credit limits**: On OpenRouter, set a monthly limit (e.g., $5/month)
- **Mock mode**: Use `VITE_AI_PROVIDER=mock` for testing without API costs
- **Review before save**: AI results are always previewed before saving

## CSV Import

As a fallback to AI extraction, import syllabus data via CSV:

### Expected Format

```csv
Subject,MainTopic,Subtopic,Bullet,ComponentName,ComponentTotalMark,OrderNumber
Physics,Mechanics,Forces,Newton's laws,Paper 1,40,1
```

- **Required columns**: Subject, MainTopic, Subtopic, Bullet
- **Optional columns**: ComponentName, ComponentTotalMark, OrderNumber

See `sample/syllabus-sample.csv` for a complete example.

## Reminder System

### Default Settings

- **Remind Later Interval**: 3 days (configurable)
- **Main Exam Lead Days**: 7, 3, 1 days before
- **Mock Exam Lead Days**: 3, 1 days before

### Configuring Reminders

1. Go to Settings → Reminder Settings
2. Adjust default intervals
3. Set per-exam-type lead times
4. Enable/disable all reminders

## What technologies are used?

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Theme Customization

The app supports light, dark, and system themes with full accessibility features.

### Changing Theme Tokens

Theme colors are defined as HSL values in `src/index.css`. To add or modify a color:

1. Add the HSL values (without `hsl()` wrapper) to both `:root` (light) and `.dark` sections:
   ```css
   :root {
     --my-color: 220 80% 50%;
   }
   .dark {
     --my-color: 220 70% 60%;
   }
   ```

2. Add to `tailwind.config.ts` colors section:
   ```ts
   colors: {
     'my-color': 'hsl(var(--my-color))',
   }
   ```

3. Use in components: `className="bg-my-color text-my-color"`

### Accessibility Features

- **Reduced Motion**: Respects `prefers-reduced-motion` and can be toggled in Settings
- **High Contrast**: Enhanced contrast mode available in Settings
- **WCAG Compliance**: All colors meet AA contrast requirements (4.5:1 normal text, 3:1 large text)
- **Focus States**: Visible focus indicators on all interactive elements

### Storage Keys

- `study-tracker:theme` - light/dark/system
- `study-tracker:reduced-motion` - true/false  
- `study-tracker:high-contrast` - true/false

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
