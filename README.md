# YeyoJournal

A dark-themed personal journal website with user authentication and analytics.

## Features
- Dark, modern theme with gradient backgrounds
- User authentication system
- Admin user management
- Interactive journal entries with mood tracking
- Chart visualization and statistics
- Responsive design

## Default Users
- Admin: Admin / @dm!n1376yeYo
- User: Yeyo / 1376Yahya

## Hosting on GitHub Pages

### Step 1: Create GitHub Repository
1. Go to GitHub.com and create a new repository named "yeyojournal"
2. Make it public (required for free GitHub Pages)

### Step 2: Upload Files
1. Create the folder structure as shown above
2. Upload all files to your repository
3. Make sure the main HTML files are in the root directory

### Step 3: Enable GitHub Pages
1. Go to your repository Settings
2. Scroll down to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Click "Save"

### Step 4: Access Your Site
Your site will be available at:
`https://[your-github-username].github.io/yeyojournal`

## Security Implementation

The passwords are stored encrypted in localStorage using base64 reversal encryption. For enhanced security:

1. **Never commit actual passwords** - The encrypted versions are stored
2. **Change default passwords** after first login
3. **Use environment variables** if adding a backend later

The current implementation is suitable for a small, private group of users.