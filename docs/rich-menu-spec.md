# Rich Menu Design Specification

## Canvas
- **Size:** 2500 × 1686 px
- **Format:** PNG
- **Grid:** 3 columns × 2 rows

## Cell Dimensions
| | Col 0 (x=0) | Col 1 (x=833) | Col 2 (x=1667) |
|---|---|---|---|
| **Row 0** (y=0, h=843) | Leave Request | OT Request | History |
| **Row 1** (y=843, h=843) | Leave Balance | Contact HR | Announcement |

Cell widths: 833 / 834 / 833 px

## Design Tokens
| Token | Value | Usage |
|---|---|---|
| Background | `#1B4332` | Canvas background |
| Card | `#2D6A4F` | Button card fill |
| Accent | `#52B788` | Top bar strip, icon accent |
| Text | `#FFFFFF` | Labels, icons |
| Subtitle | `#B7E4C7` | Subtitle text |
| Border | `rgba(82,183,136,0.3)` | Card border (1px) |
| Badge | `#FF3B30` | Announcement badge pill |

## Decorative Elements
- Dot grid pattern: white 5% opacity, 60px spacing, 3px radius
- Corner circles: white 8% opacity, 120px radius at all 4 corners

## Per-Button Layout
1. Green accent strip at top (10px height, rounded top corners)
2. Lucide/Phosphor-style outline icon centered at 38% height
3. Bold English label at 68% height (bold, ~8–10% of cell height)
4. Subtitle text at 80% height (soft mint white, ~6–7% of cell height)

## Icon Descriptions
| Button | Icon Description |
|---|---|
| Leave Request | Calendar with plus symbol |
| OT Request | Clock with arrow symbol |
| History | Three lines (list) with checkmark |
| Leave Balance | Pie chart (3/4 filled arc) |
| Contact HR | Person with headset and mic arm |
| Announcement | Megaphone / trapezoid shape |

## Announcement Badge
- Shape: Rounded pill, red (#FF3B30)
- Text: "Updates" (white, bold, 30px)
- Position: Top-right corner of the Announcement button

## LINE Rich Menu Actions
| Button | Action |
|---|---|
| Leave Request | URI → `https://liff.line.me/{LIFF_ID_LEAVE}` |
| OT Request | URI → `https://liff.line.me/{LIFF_ID_OT}` |
| History | URI → `https://liff.line.me/{LIFF_ID_HISTORY}` |
| Leave Balance | Postback → `action=balance` |
| Contact HR | Message → `Contact HR` |
| Announcement | URI → `{FRONTEND_URL}/announcements` |

## Generating the PNG
```bash
cd docs
npm install canvas
node generate-rich-menu.js
```
On Windows, install build tools first (run as Administrator):
```
npm install --global windows-build-tools
```

## Registering with LINE
```bash
LINE_CHANNEL_ACCESS_TOKEN=xxx \
LIFF_ID_LEAVE=yyy \
LIFF_ID_OT=zzz \
LIFF_ID_HISTORY=aaa \
FRONTEND_URL=https://your-admin.vercel.app \
node register-rich-menu.js
```
