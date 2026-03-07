# Getting Started — Step by Step

## What You Need First
1. A Mac or PC
2. Node.js installed (https://nodejs.org — download the LTS version, install like any app)
3. Claude Code installed (you said you have an account)

## Step 1: Download This Project
Download the zip file and unzip it to your Desktop. You should see a folder called `nasa-hrvatska-v2`.

## Step 2: Open Terminal
- **Mac:** Press Cmd+Space, type "Terminal", press Enter
- **Windows:** Press Win key, type "Command Prompt", press Enter

## Step 3: Navigate to the Project
Type this and press Enter:
```
cd ~/Desktop/nasa-hrvatska-v2
```

## Step 4: Launch Claude Code
Type this and press Enter:
```
claude
```

## Step 5: Tell Claude Code What to Do
Once Claude Code starts, type this:

```
Read CLAUDE-CODE-INSTRUCTIONS.md. This is a Croatian language learning app that needs to be refactored from a monolith into a proper React project. 

Start with Phase 1: run npm install, then npm run dev, and verify the app loads in the browser. Fix any import/export errors between data.js and App.jsx. The app uses React.createElement (no JSX) — that's expected for now.

Once it's running locally, proceed through the phases in the instructions file.
```

## Step 6: Let Claude Code Work
Claude Code will:
- Install dependencies
- Start the dev server
- Open the app in your browser
- Fix any issues
- Ask you to approve each change

Just review and approve. If something looks wrong, tell it.

## Step 7: Deploy
When Claude Code has the app working, tell it:
```
Deploy this to Netlify site "nasahrvatska". The environment variables AZURE_TTS_KEY and AZURE_TTS_REGION are already set in Netlify.
```

## If Anything Goes Wrong
Just tell Claude Code: "That broke the app. Undo the last change and try a different approach."
