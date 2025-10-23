# Talko Design Guidelines

## Design Approach: Discord-Inspired Modern Chat Interface

**Selected Approach:** Design System + Reference (Discord/Slack patterns)
**Justification:** Chat applications require proven, intuitive patterns for real-time communication. Users expect familiar chat UX with clear message threading, user identification, and minimal visual distraction from conversations.

**Key Principles:**
- Clarity over decoration - conversations are the focus
- Instant visual feedback for real-time interactions
- Clean information hierarchy
- Comfortable long-session usage (dark mode primary)

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: 220 15% 12% (deep slate)
- Surface: 220 15% 18% (message containers, cards)
- Border/Divider: 220 10% 25%
- Primary: 235 85% 65% (blue for CTAs, active states)
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 65%
- Success (online): 140 60% 50%
- User Bubbles: 235 85% 65% (sender), 220 15% 25% (received)

**Light Mode (Secondary):**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Border: 220 10% 88%
- Primary: 235 85% 55%
- Text Primary: 220 15% 15%

**Accent Colors:**
- Warning: 40 95% 60% (notifications)
- Error: 0 75% 60%

### B. Typography

**Font Families:**
- Primary: 'Inter' (Google Fonts) - messages, UI text
- Monospace: 'Fira Code' (Google Fonts) - timestamps, metadata

**Scale:**
- Hero/Auth Headers: text-3xl font-bold (30px)
- Chat Headers: text-lg font-semibold (18px)
- Messages: text-base (16px)
- Metadata/Timestamps: text-xs text-secondary (12px)
- Input Fields: text-base (16px)

### C. Layout System

**Spacing Units:** 2, 4, 8, 12, 16 (as in p-2, m-4, gap-8, p-12, py-16)

**Grid Structure:**
- Auth Pages: Single column, max-w-md centered
- Chat Layout: Two-column (sidebar + main), or single column mobile
- Sidebar: Fixed w-64 on desktop, hidden/drawer on mobile
- Message Container: max-w-4xl with py-4 px-6

**Responsive Breakpoints:**
- Mobile: < 768px (stack to single column)
- Desktop: ≥ 768px (sidebar + chat layout)

### D. Component Library

**Authentication Components:**
- Card Container: Rounded-xl, surface color, shadow-lg, p-8
- Form Inputs: Rounded-lg, border, bg-surface, focus:ring-2 ring-primary
- Submit Buttons: w-full, rounded-lg, bg-primary, py-3, font-semibold
- Logo/Branding: text-3xl font-bold with primary color gradient

**Chat Interface:**
- Sidebar: Fixed left panel with user list, room selector
  - User items: flex items-center gap-3, hover:bg-surface, rounded-lg p-3
  - Online indicators: Small green dot (h-2 w-2 rounded-full bg-success)
  
- Message Bubbles:
  - Sent: Self-aligned right, bg-primary, text-white, rounded-2xl rounded-tr-sm
  - Received: Left-aligned, bg-surface, text-primary, rounded-2xl rounded-tl-sm
  - Padding: px-4 py-2.5
  - Max-width: max-w-md to max-w-lg
  - Include: Username (text-xs font-semibold), timestamp (text-xs text-secondary)
  
- Message Input:
  - Sticky bottom bar: bg-surface, border-t, p-4
  - Input field: flex-1, rounded-full, bg-background, px-6 py-3
  - Send button: Rounded-full, bg-primary, p-3, with send icon (Heroicons)

**Navigation:**
- Top Bar: flex justify-between items-center, h-16, border-b, px-6
  - App name/logo left
  - User menu/settings right (dropdown)
- Icons: Heroicons via CDN (ChatBubbleLeftIcon, UserIcon, PaperAirplaneIcon)

**Loading States:**
- Skeleton loaders: Animated pulse, rounded shapes matching content
- Message sending: Subtle opacity animation

### E. Animations

**Minimal, purposeful only:**
- New message: Subtle slide-in from bottom (100ms)
- Online status: Gentle pulse on status dot
- Hover states: Simple opacity/background transitions (150ms)
- NO scroll-triggered or complex animations

## Images

**No large hero images** - This is a utility app focused on functionality.

**Avatar Placeholders:**
- User avatars: 40px circles with gradient backgrounds based on username hash
- Default: First letter of username in center, generated gradient (e.g., from username)
- Placement: Next to messages, in sidebar user list, top bar

## Chat-Specific UX Patterns

**Message Grouping:**
- Group consecutive messages from same user within 5 minutes
- Show timestamp only on first message in group
- Reduced spacing between grouped messages (gap-1 vs gap-4)

**Scroll Behavior:**
- Auto-scroll to bottom on new message (if already near bottom)
- "New messages" indicator if scrolled up
- Smooth scroll behavior

**Real-time Indicators:**
- Typing indicator: "Username is typing..." with animated dots
- Message delivery: Single checkmark → double checkmark pattern
- Connection status: Subtle top banner if disconnected

**Accessibility:**
- High contrast maintained in both modes
- Focus visible on all interactive elements
- Proper ARIA labels for icons
- Keyboard navigation for all features

This design creates a clean, familiar chat experience that prioritizes readability and real-time interaction while maintaining visual polish through consistent spacing, clear hierarchy, and purposeful use of color.