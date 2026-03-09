const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'src');

// Pattern A: remove the entire React import line
const patternAFiles = [
  'main.jsx',
  'components/LanguageSwitcher.jsx',
  'components/charts/DailyPnLChart.jsx',
  'components/charts/ProfitChart.jsx',
  'components/crm/LeadsCardsView.jsx',
  'components/crm/LeadsListView.jsx',
  'components/shared/ProgressRing.jsx',
  'components/shared/StatsCard.jsx',
  'components/shared/StatusBadge.jsx',
  'components/shared/DataTable.jsx',
  'components/trading/ModifyPositionDialog.jsx',
  'components/trading/ViolationAlert.jsx',
  'components/trading/ViolationModal.jsx',
  'components/trading/ViolationPopup.jsx',
  'components/ui/badge.jsx',
  'components/ui/calendar.jsx',
  'contexts/LanguageContext.jsx',
  'contexts/ThemeContext.jsx',
  'pages/AdminFundedAccounts.jsx',
  'pages/AdminRiskMonitor.jsx',
  'pages/AdminScaling.jsx',
  'pages/AdminUsers.jsx',
];

// Regex: matches standalone React import line
const standaloneReact = /^import (?:React|\* as React) from ['"]react['"];\r?\n/m;

patternAFiles.forEach(function(f) {
  const fp = path.join(base, f);
  const content = fs.readFileSync(fp, 'utf8');
  const fixed = content.replace(standaloneReact, '');
  if (fixed !== content) {
    fs.writeFileSync(fp, fixed, 'utf8');
    console.log('Fixed (Pattern A): ' + f);
  } else {
    console.log('No change: ' + f);
  }
});

// Pattern B: strip React from "import React, { X, Y }" → "import { X, Y }"
const patternBFiles = [
  'components/ChatSupport.jsx',             // import React, { useState, useRef, useEffect }
  'pages/AdminPayments.jsx',                // import React, { useState }
  'pages/AdminPayouts.jsx',                 // import React, { useState }
  'pages/AdminAccounts.jsx',               // import React from 'react' (standalone)
  'pages/AdminBrokerServers.jsx',          // import React from 'react' (standalone)
  'pages/AdminChallenges.jsx',             // import React from 'react' (standalone)
  'pages/AdminViolations.jsx',             // import React from 'react' (standalone)
  'pages/AdminScaling.jsx',               // already done above
];

// For React, { ... } pattern → { ... }
const reactWithNamed = /^import React, (\{[^}]+\}) from ['"]react['"];\r?\n/m;
// For standalone React (in case the standalone pattern didn't catch it)
const standaloneReact2 = /^import React from ['"]react['"];\r?\n/m;

const patternBSpecific = [
  { file: 'components/ChatSupport.jsx', pattern: reactWithNamed },
  { file: 'pages/AdminPayments.jsx', pattern: reactWithNamed },
  { file: 'pages/AdminPayouts.jsx', pattern: reactWithNamed },
  { file: 'pages/AdminAccounts.jsx', pattern: standaloneReact2 },
  { file: 'pages/AdminBrokerServers.jsx', pattern: standaloneReact2 },
  { file: 'pages/AdminChallenges.jsx', pattern: standaloneReact2 },
  { file: 'pages/AdminViolations.jsx', pattern: standaloneReact2 },
];

patternBSpecific.forEach(function(item) {
  const fp = path.join(base, item.file);
  const content = fs.readFileSync(fp, 'utf8');
  let fixed = content;
  if (item.pattern === reactWithNamed) {
    fixed = content.replace(reactWithNamed, function(match, named) {
      return 'import ' + named + ' from \'react\';\n';
    });
  } else {
    fixed = content.replace(standaloneReact2, '');
  }
  if (fixed !== content) {
    fs.writeFileSync(fp, fixed, 'utf8');
    console.log('Fixed (Pattern B): ' + item.file);
  } else {
    console.log('No change: ' + item.file);
  }
});

console.log('Done.');
