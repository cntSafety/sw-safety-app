# SW Safety Analysis Application

A React application for supporting software safety analysis in automotive contexts. This tool helps engineers import and analyze AUTOSAR XML (ARXML) files to understand software components and their safety-critical aspects.

## Development Setup

To set up the development environment:

```powershell
# Clone the repository
git clone https://github.com/cntSafety/sw-safety-app.git
cd sw-safety-app

# Install dependencies
npm install

# Start the development server
npm start
```

## Features

- Import and parse AUTOSAR XML files
- View structured component hierarchies
- Navigate through component relationships
- Responsive design for desktop and mobile use
- Modern UI with Ant Design components

## Live Demo

You can view the live application at [https://cntSafety.github.io/sw-safety-app](https://cntSafety.github.io/sw-safety-app)

## Contributing

If you'd like to contribute to this project, please follow these steps:

1. Fork the repository
2. Clone your fork to your local machine
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Commit and push your changes to your fork

```powershell
# After making changes
git add .
git commit -m "Description of changes"
git push origin main
```

### Deployment

The project is configured to deploy automatically via GitHub Actions when changes are pushed to the main branch.

For manual deployment to GitHub Pages:

```powershell
# Build and deploy the application to GitHub Pages
npm run deploy
```

This will run the build process and publish the contents of the build folder to the gh-pages branch, making your changes live on GitHub Pages.

### Project Structure

```
src/
  ├── components/              # Reusable UI components
  │   ├── ArxmlImporter/       # ARXML file import component
  │   ├── ArxmlViewer/         # ARXML structure viewer component
  │   ├── MainMenu/            # Navigation menu component
  │   └── Start/               # Welcome/start page component
  │
  ├── pages/                   # Page components
  │   ├── Home/                # Home page
  │   ├── ArxmlImport/         # ARXML import page
  │   └── ArxmlView/           # ARXML viewer page
  │
  ├── types/                   # Type definitions
  │   └── arxml.js             # ARXML data structure types
  │
  ├── App.js                   # Main application component
  └── index.js                 # Entry point
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.