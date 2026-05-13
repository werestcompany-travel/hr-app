/**
 * Rich Menu Registration Script
 *
 * Run AFTER:
 *   1. docs/generate-rich-menu.js has created rich-menu.png
 *   2. Backend + LIFF are deployed and you have real LIFF IDs
 *   3. LINE_CHANNEL_ACCESS_TOKEN and LIFF_ID_* are set in your environment
 *
 * Usage:
 *   LINE_CHANNEL_ACCESS_TOKEN=xxx LIFF_ID_LEAVE=yyy ... node docs/register-rich-menu.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOKEN               = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LIFF_LEAVE          = process.env.LIFF_ID_LEAVE;
const LIFF_OT             = process.env.LIFF_ID_OT;
const LIFF_HISTORY        = process.env.LIFF_ID_HISTORY;
const LIFF_ANNOUNCEMENTS  = process.env.LIFF_ID_ANNOUNCEMENTS || process.env.LIFF_ID_HISTORY;

if (!TOKEN) {
  console.error('ERROR: LINE_CHANNEL_ACCESS_TOKEN is not set');
  process.exit(1);
}

// Grid: 3 cols x 2 rows
// Col widths: 833 | 834 | 833
// Row heights: 843 | 843
const areas = [
  // Row 0
  {
    bounds: { x: 0,    y: 0,   width: 833,  height: 843 },
    action: { type: 'uri', uri: `https://liff.line.me/${LIFF_LEAVE}` },
  },
  {
    bounds: { x: 833,  y: 0,   width: 834,  height: 843 },
    action: { type: 'uri', uri: `https://liff.line.me/${LIFF_OT}` },
  },
  {
    bounds: { x: 1667, y: 0,   width: 833,  height: 843 },
    action: { type: 'uri', uri: `https://liff.line.me/${LIFF_HISTORY}` },
  },
  // Row 1
  {
    bounds: { x: 0,    y: 843, width: 833,  height: 843 },
    action: { type: 'postback', data: 'action=balance', displayText: 'Leave Balance' },
  },
  {
    bounds: { x: 833,  y: 843, width: 834,  height: 843 },
    action: { type: 'uri', uri: process.env.FRONTEND_URL || 'https://hr-app-admin-nine.vercel.app' },
  },
  {
    bounds: { x: 1667, y: 843, width: 833,  height: 843 },
    action: { type: 'uri', uri: `https://liff.line.me/${LIFF_ANNOUNCEMENTS}` },
  },
];

const richMenuBody = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: 'HR System Menu',
  chatBarText: 'HR Menu',
  areas,
};

async function register() {
  console.log('Step 1/3: Creating rich menu...');
  const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(richMenuBody),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create rich menu: ${err}`);
  }

  const { richMenuId } = await createRes.json();
  console.log(`  Created rich menu ID: ${richMenuId}`);

  console.log('Step 2/3: Uploading PNG...');
  const imgPath = path.join(__dirname, 'rich-menu.png');
  if (!fs.existsSync(imgPath)) {
    throw new Error('rich-menu.png not found. Run generate-rich-menu.js first.');
  }

  const img = fs.readFileSync(imgPath);
  const uploadRes = await fetch(
    `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'image/png',
      },
      body: img,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Failed to upload image: ${err}`);
  }

  console.log('  PNG uploaded successfully');

  console.log('Step 3/3: Setting as default for all users...');
  const defaultRes = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );

  if (!defaultRes.ok) {
    const err = await defaultRes.text();
    throw new Error(`Failed to set default: ${err}`);
  }

  console.log(`\n✅ Rich menu registered and set as default!`);
  console.log(`   Rich Menu ID: ${richMenuId}`);
}

register().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
