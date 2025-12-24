# Content Detail View - UI/UX Improvements

## Research Summary

Based on best practices for split-screen document viewers with AI assistants, here are the key improvements identified:

### Current State Analysis
- **Layout**: Fixed 50/50 split between document viewer and chat panel
- **Main Topic Card**: Appears as a prominent card in chat, taking significant vertical space
- **Tabs**: Chat, Summary, Flashcards, Quiz are all in right panel
- **Mobile**: Floating "Ask AI" button (good implementation)

### Identified Improvements

#### 1. **Resizable Panels** ⭐ High Impact
- Allow users to adjust the split ratio (drag handle)
- Default can remain 50/50, but users can focus on document or chat
- Improves user control and personalization

#### 2. **Collapsible Summary Preview** ⭐ High Impact
- Replace large "Main Topic" card with a compact, collapsible summary preview
- Show at top of chat tab when summary is available
- One-click expand to full summary, or link to Summary tab
- Reduces initial visual clutter

#### 3. **Better Visual Hierarchy**
- Improve spacing and typography in chat messages
- Better distinction between user and assistant messages
- Subtle animations for smooth interactions

#### 4. **Sticky Quick Actions**
- Keep quick action buttons visible at top of chat (when no messages)
- Better positioning and styling
- Context-aware suggestions based on content type

#### 5. **Smooth Tab Transitions**
- Add subtle slide animations when switching tabs
- Maintain scroll position per tab (already implemented ✓)

#### 6. **Enhanced Mobile Experience**
- Improve floating action button design
- Better bottom sheet animation for chat panel on mobile
- Swipe gestures for panel toggle

#### 7. **Focus Mode**
- Optional "focus mode" button to hide right panel entirely
- Full-screen document viewing when needed
- Easy toggle back to split view

#### 8. **Summary Integration**
- When summary exists, show compact preview in chat tab header
- Quick "View Full Summary" link to Summary tab
- Reduces need to switch tabs frequently

### Implementation Priority

**Phase 1 (Quick Wins)**
1. Collapsible summary preview in chat
2. Improved visual hierarchy and spacing
3. Better quick actions placement

**Phase 2 (Enhanced UX)**
1. Resizable panels
2. Focus mode toggle
3. Smooth animations

**Phase 3 (Polish)**
1. Advanced mobile gestures
2. Keyboard shortcuts
3. Customizable layouts

### Design Principles Applied
- **Progressive Disclosure**: Show summary preview, expand on demand
- **User Control**: Resizable panels give users flexibility
- **Visual Clarity**: Better hierarchy reduces cognitive load
- **Consistency**: Maintain app's design language (#EFA07F, clean modern UI)
- **Accessibility**: Maintain keyboard navigation, screen reader support

