# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

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
