import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
// material
import { alpha, styled } from '@mui/material/styles';
import { Box, Stack, AppBar, Toolbar, IconButton, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
// components
import Iconify from '../../components/Iconify';
import AccountPopover from './AccountPopover';
// import NotificationsPopover from './NotificationsPopover';

// Extend Window object for Google Translate
/**
 * @typedef {Window & {
 *   googleTranslateElementInit?: () => void,
 *   google?: {
 *     translate: {
 *       TranslateElement: {
 *         new(options: any, element: string): any,
 *         InlineLayout: {
 *           SIMPLE: number
 *         }
 *       }
 *     }
 *   }
 * }} CustomWindow
 */

/** @type {CustomWindow} */
const customWindow = window;

// ----------------------------------------------------------------------

const DRAWER_WIDTH = 280;
const APPBAR_MOBILE = 64;
const APPBAR_DESKTOP = 92;

const RootStyle = styled(AppBar)(({ theme }) => ({
  boxShadow: 'none',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)', // Fix on Mobile
  backgroundColor: alpha(theme.palette.background.default, 0.72),
  [theme.breakpoints.up('lg')]: {
    width: `calc(100% - ${DRAWER_WIDTH + 1}px)`,
  },
}));

const ToolbarStyle = styled(Toolbar)(({ theme }) => ({
  minHeight: APPBAR_MOBILE,
  [theme.breakpoints.up('lg')]: {
    minHeight: APPBAR_DESKTOP,
    padding: theme.spacing(0, 5),
  },
}));

const LanguageSelect = styled(Select)(({ theme }) => ({
  minWidth: 120,
  height: 40,
  '& .MuiSelect-select': {
    padding: theme.spacing(1, 2),
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
}));

// Language Switcher Component
function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  ];

  useEffect(() => {
    // Add CSS to hide Google Translate elements
    const style = document.createElement('style');
    style.textContent = `
      .goog-te-banner-frame {
        display: none !important;
      }
      .goog-te-menu-value:hover {
        text-decoration: none !important;
      }
      body {
        top: 0 !important;
      }
      .skiptranslate {
        display: none !important;
      }
      #google_translate_element {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Load Google Translate API script
    const addScript = () => {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
      
      // Create a hidden div for Google Translate
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.display = 'none';
      document.body.appendChild(translateDiv);
    };

    // Initialize function
    customWindow.googleTranslateElementInit = function() {
      if (customWindow.google && customWindow.google.translate) {
        const _ = new customWindow.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,ta,mr,gu',
            autoDisplay: false,
            layout: customWindow.google.translate.TranslateElement.InlineLayout.SIMPLE
          }, 
          'google_translate_element'
        );
      }
    };

    addScript();
    
    // Cleanup function
    return () => {
      if (customWindow.googleTranslateElementInit) {
        customWindow.googleTranslateElementInit = undefined;
      }
      document.head.removeChild(style);
    };
  }, []);

  // Check current language from cookies
  useEffect(() => {
    const checkCurrentLanguage = () => {
      const cookies = document.cookie;
      for (const lang of languages) {
        if (cookies.includes(`googtrans=/en/${lang.code}`)) {
          localStorage.setItem('preferredLanguage', lang.code);
          setCurrentLanguage(lang.code);
          
          return;
        }
      }
      setCurrentLanguage('en');
    };

    checkCurrentLanguage();
  }, [languages]);

  const markAsNonTranslatable = () => {
    // Add notranslate class to specific elements after page loads
    setTimeout(() => {
      // Find internships related elements
      const internshipElements = document.querySelectorAll(
        '[data-component="find-internships"], .internships-section, .internships-content'
      );
      
      internshipElements.forEach(element => {
        element.classList.add('notranslate');
        element.setAttribute('translate', 'no');
      });

      // You can also target by text content
      const elementsWithInternshipText = document.querySelectorAll('*');
      elementsWithInternshipText.forEach(element => {
        if (element.textContent && 
            (element.textContent.includes('internship') || 
             element.textContent.includes('Internship') ||
             element.textContent.includes('Find Internships'))) {
          element.classList.add('notranslate');
          element.setAttribute('translate', 'no');
        }
      });
    }, 1000);
  };

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    
    if (selectedLanguage === currentLanguage) return;

    setIsLoading(true);
    
    // Set cookie for Google Translate
    const cookieValue = selectedLanguage === 'en' 
      ? 'googtrans=/en/en' 
      : `googtrans=/en/${selectedLanguage}`;
    
    document.cookie = `${cookieValue}; path=/; domain=${window.location.hostname}`;
    
    // Force refresh to apply translation
    setTimeout(() => {
      window.location.reload();
    }, 800);
    
    // Mark non-translatable elements after reload
    setTimeout(() => {
      markAsNonTranslatable();
    }, 2000);
    
    setCurrentLanguage(selectedLanguage);
  };

  return (
    <FormControl size="small">
      <LanguageSelect
        value={currentLanguage}
        onChange={handleLanguageChange}
        displayEmpty
        variant="outlined"
        disabled={isLoading}
      >
        {languages.map((language) => (
          <MenuItem key={language.code} value={language.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isLoading && currentLanguage === language.code ? (
                <CircularProgress size={16} />
              ) : (
                <>
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </>
              )}
            </Box>
          </MenuItem>
        ))}
      </LanguageSelect>
    </FormControl>
  );
}

// ----------------------------------------------------------------------

DashboardNavbar.propTypes = {
  onOpenSidebar: PropTypes.func,
};

export default function DashboardNavbar({ onOpenSidebar }) {
  return (
    <RootStyle>
      <ToolbarStyle>
        <IconButton onClick={onOpenSidebar} sx={{ mr: 1, color: 'text.primary', display: { lg: 'none' } }}>
          <Iconify icon="eva:menu-2-fill" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
          <LanguageSwitcher />
          {/* <NotificationsPopover /> */}
          <AccountPopover />
        </Stack>
      </ToolbarStyle>
    </RootStyle>
  );
}