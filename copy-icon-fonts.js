const fs = require('fs');
const path = require('path');

/**
 * This script copies icon font files from node_modules to the dist directory
 * and adds the necessary font-face declarations to the index.html file.
 */
function copyIconFonts() {
  console.log('Starting to copy icon fonts...');
  
  // Paths
  const projectRoot = __dirname;
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  const distPath = path.join(projectRoot, 'dist');
  const distFontsPath = path.join(distPath, 'fonts');
  
  // Ensure the destination directory exists
  if (!fs.existsSync(distFontsPath)) {
    fs.mkdirSync(distFontsPath, { recursive: true });
    console.log(`Created directory: ${distFontsPath}`);
  }
  
  // Copy custom fonts
  const customFontsPath = path.join(projectRoot, 'assets', 'fonts');
  if (fs.existsSync(customFontsPath)) {
    const customFonts = fs.readdirSync(customFontsPath);
    customFonts.forEach(font => {
      if (font.endsWith('.ttf') || font.endsWith('.otf')) {
        const sourcePath = path.join(customFontsPath, font);
        const destPath = path.join(distFontsPath, font);
        copyFile(sourcePath, destPath);
      }
    });
  }
  
  // Copy Expo Vector Icons fonts
  const vectorIconsFontsPath = path.join(
    nodeModulesPath,
    '@expo',
    'vector-icons',
    'build',
    'vendor',
    'react-native-vector-icons',
    'Fonts'
  );
  
  if (fs.existsSync(vectorIconsFontsPath)) {
    const iconFonts = fs.readdirSync(vectorIconsFontsPath);
    iconFonts.forEach(font => {
      if (font.endsWith('.ttf') || font.endsWith('.otf')) {
        const sourcePath = path.join(vectorIconsFontsPath, font);
        const destPath = path.join(distFontsPath, font);
        copyFile(sourcePath, destPath);
      }
    });
  } else {
    console.warn('Vector icons fonts directory not found:', vectorIconsFontsPath);
    
    // Try alternative path for Expo vector icons
    const altVectorIconsPath = path.join(
      nodeModulesPath,
      'react-native-vector-icons',
      'Fonts'
    );
    
    if (fs.existsSync(altVectorIconsPath)) {
      const iconFonts = fs.readdirSync(altVectorIconsPath);
      iconFonts.forEach(font => {
        if (font.endsWith('.ttf') || font.endsWith('.otf')) {
          const sourcePath = path.join(altVectorIconsPath, font);
          const destPath = path.join(distFontsPath, font);
          copyFile(sourcePath, destPath);
        }
      });
    } else {
      console.warn('Alternative vector icons fonts directory not found:', altVectorIconsPath);
    }
  }
  
  // Create a CSS file with font-face declarations
  const cssContent = createFontFaceCss();
  const cssPath = path.join(distPath, 'icon-fonts.css');
  fs.writeFileSync(cssPath, cssContent);
  console.log(`Created CSS file: ${cssPath}`);
  
  // Add the CSS link to index.html
  addCssLinkToHtml(distPath);
  
  console.log('Icon fonts copy process completed!');
}

// Function to copy a file
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    console.log(`Copied: ${source} -> ${destination}`);
  } catch (error) {
    console.error(`Error copying ${source}: ${error.message}`);
  }
}

// Function to create CSS content with font-face declarations
function createFontFaceCss() {
  return `
/* Icon font definitions */
@font-face {
  font-family: 'Ionicons';
  src: url('./fonts/Ionicons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'FontAwesome';
  src: url('./fonts/FontAwesome.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'MaterialIcons';
  src: url('./fonts/MaterialIcons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'MaterialCommunityIcons';
  src: url('./fonts/MaterialCommunityIcons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'SpaceMono';
  src: url('./fonts/SpaceMono-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'AntDesign';
  src: url('./fonts/AntDesign.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Entypo';
  src: url('./fonts/Entypo.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'EvilIcons';
  src: url('./fonts/EvilIcons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Feather';
  src: url('./fonts/Feather.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'FontAwesome5_Brands';
  src: url('./fonts/FontAwesome5_Brands.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'FontAwesome5_Regular';
  src: url('./fonts/FontAwesome5_Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'FontAwesome5_Solid';
  src: url('./fonts/FontAwesome5_Solid.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Fontisto';
  src: url('./fonts/Fontisto.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Foundation';
  src: url('./fonts/Foundation.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Octicons';
  src: url('./fonts/Octicons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'SimpleLineIcons';
  src: url('./fonts/SimpleLineIcons.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Zocial';
  src: url('./fonts/Zocial.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
`;
}

// Function to add CSS link to index.html
function addCssLinkToHtml(distPath) {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if the CSS is already injected
    if (!indexContent.includes('icon-fonts.css')) {
      // Insert the link tag before the closing head tag
      indexContent = indexContent.replace(
        '</head>',
        '  <link rel="stylesheet" href="./icon-fonts.css">\n</head>'
      );
      
      fs.writeFileSync(indexPath, indexContent);
      console.log(`Updated index.html with icon fonts CSS link`);
    }
  }
}

// Run the function
copyIconFonts();
