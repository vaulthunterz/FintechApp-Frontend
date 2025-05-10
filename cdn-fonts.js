const fs = require('fs');
const path = require('path');

/**
 * This script adds CDN links for icon fonts to the index.html file.
 * It solves the font loading issues in Firebase hosting by using reliable CDN sources
 * instead of trying to bundle and serve the fonts locally.
 */
function addCdnLinks() {
  console.log('Adding CDN links to index.html...');

  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error(`Index file not found: ${indexPath}`);
    return;
  }

  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // CDN links for icon fonts
  const cdnLinks = `
  <!-- CDN links for icon fonts -->
  <link href="https://cdn.jsdelivr.net/npm/ionicons@4.6.3/dist/css/ionicons.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@mdi/font@6.5.95/css/materialdesignicons.min.css" rel="stylesheet">

  <!-- Custom font styles -->
  <style>
    @font-face {
      font-family: 'SpaceMono';
      src: url('./assets/fonts/SpaceMono-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    /* Fallback classes for icon fonts */
    .ionicons {
      font-family: 'Ionicons', sans-serif;
    }

    .material-icons {
      font-family: 'Material Icons', sans-serif;
    }

    .fa, .fas, .far, .fab {
      font-family: 'Font Awesome 5 Free', sans-serif;
    }

    .mdi {
      font-family: 'Material Design Icons', sans-serif;
    }
  </style>
`;

  // Insert the CDN links before the closing head tag
  if (!indexContent.includes('cdn.jsdelivr.net/npm/ionicons')) {
    indexContent = indexContent.replace('</head>', `${cdnLinks}</head>`);
    fs.writeFileSync(indexPath, indexContent);
    console.log('CDN links added to index.html');
  } else {
    console.log('CDN links already present in index.html');
  }
}

// Run the function
addCdnLinks();
