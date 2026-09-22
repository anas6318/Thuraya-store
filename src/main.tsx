import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {App} from './App';
import {applyDocumentLocale,localeFromPath} from './document-locale';
// THURAYA type system — each script has its own display and text face.
// Display: Newsreader (Latin), Amiri (Arabic), Frank Ruhl Libre (Hebrew).
// Text & utility: the IBM Plex Sans family, drawn for all three scripts.
import '@fontsource/newsreader/latin-300.css';
import '@fontsource/newsreader/latin-400.css';
import '@fontsource/newsreader/latin-300-italic.css';
import '@fontsource/amiri/arabic-400.css';
import '@fontsource/amiri/arabic-700.css';
import '@fontsource/frank-ruhl-libre/hebrew-300.css';
import '@fontsource/frank-ruhl-libre/hebrew-400.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-400.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-500.css';
import './styles/main.css';
import './styles/storefront.css';
// Direction and language are settled from the URL before anything is drawn.
applyDocumentLocale(localeFromPath(window.location.pathname));
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
