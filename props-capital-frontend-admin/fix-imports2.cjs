const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, 'src');

// Files where import is "import React, { X } from 'react'" - strip React, keep named
// (covers both single and double quotes, with or without semicolon)
const stripReactFromMixed = [
  'components/trading/ModifyPositionDialog.jsx',
  'contexts/LanguageContext.jsx',
  'contexts/ThemeContext.jsx',
  'pages/AdminFundedAccounts.jsx',
  'pages/AdminRiskMonitor.jsx',
  'pages/AdminScaling.jsx',
  'pages/AdminUsers.jsx',
  'pages/AdminAccounts.jsx',
  'pages/AdminBrokerServers.jsx',
  'pages/AdminChallenges.jsx',
  'pages/AdminViolations.jsx',
];

// Replace "import React, { X, Y } from 'react';" → "import { X, Y } from 'react';"
const mixedPattern = /^import React, (\{[^}]+\}) from (['"])react\2;?\r?\n/m;

stripReactFromMixed.forEach(function(f) {
  const fp = path.join(base, f);
  const content = fs.readFileSync(fp, 'utf8');
  const fixed = content.replace(mixedPattern, function(match, named, quote) {
    return 'import ' + named + ' from ' + quote + 'react' + quote + ';\n';
  });
  if (fixed !== content) {
    fs.writeFileSync(fp, fixed, 'utf8');
    console.log('Fixed (mixed): ' + f);
  } else {
    console.log('No change: ' + f);
  }
});

// calendar.jsx: "import * as React from "react"" (no semicolon) - delete the line
const calendarFile = path.join(base, 'components/ui/calendar.jsx');
const calContent = fs.readFileSync(calendarFile, 'utf8');
const calFixed = calContent.replace(/^import \* as React from ['"]react['"];?\r?\n/m, '');
if (calFixed !== calContent) {
  fs.writeFileSync(calendarFile, calFixed, 'utf8');
  console.log('Fixed (calendar): components/ui/calendar.jsx');
}

console.log('Done.');
